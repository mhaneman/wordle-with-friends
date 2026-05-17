package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/google"

)

const oauthStateCookie = "wwf_oauth_state"

type oauthProfile struct {
	Email       string
	DisplayName string
	Subject     string
}

func (h *Handler) OAuthStart(w http.ResponseWriter, r *http.Request) {
	provider := chi.URLParam(r, "provider")
	cfg, err := h.oauthConfig(provider)
	if err != nil {
		writeError(w, http.StatusBadRequest, "unknown provider")
		return
	}
	state, err := randomState()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "oauth error")
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:     oauthStateCookie,
		Value:    state,
		Path:     "/",
		HttpOnly: true,
		MaxAge:   600,
		SameSite: http.SameSiteLaxMode,
	})
	http.Redirect(w, r, cfg.AuthCodeURL(state), http.StatusTemporaryRedirect)
}

func (h *Handler) OAuthCallback(w http.ResponseWriter, r *http.Request) {
	provider := chi.URLParam(r, "provider")
	stateCookie, err := r.Cookie(oauthStateCookie)
	if err != nil || r.URL.Query().Get("state") == "" || stateCookie.Value != r.URL.Query().Get("state") {
		http.Redirect(w, r, h.cfg.FrontendURL+"/login?error=oauth_state", http.StatusTemporaryRedirect)
		return
	}
	http.SetCookie(w, &http.Cookie{Name: oauthStateCookie, Value: "", Path: "/", MaxAge: -1})

	cfg, err := h.oauthConfig(provider)
	if err != nil {
		http.Redirect(w, r, h.cfg.FrontendURL+"/login?error=oauth_provider", http.StatusTemporaryRedirect)
		return
	}
	token, err := cfg.Exchange(r.Context(), r.URL.Query().Get("code"))
	if err != nil {
		http.Redirect(w, r, h.cfg.FrontendURL+"/login?error=oauth_exchange", http.StatusTemporaryRedirect)
		return
	}
	profile, err := fetchOAuthProfile(r.Context(), provider, token, cfg)
	if err != nil {
		http.Redirect(w, r, h.cfg.FrontendURL+"/login?error=oauth_profile", http.StatusTemporaryRedirect)
		return
	}
	user, err := h.store.UpsertOAuthUser(r.Context(), profile.Email, profile.DisplayName, provider, profile.Subject)
	if err != nil {
		http.Redirect(w, r, h.cfg.FrontendURL+"/login?error=oauth_save", http.StatusTemporaryRedirect)
		return
	}
	session, err := h.tokens.Issue(user.ID)
	if err != nil {
		http.Redirect(w, r, h.cfg.FrontendURL+"/login?error=oauth_session", http.StatusTemporaryRedirect)
		return
	}
	h.tokens.SetCookie(w, session)
	http.Redirect(w, r, h.cfg.FrontendURL+"/", http.StatusTemporaryRedirect)
}

func (h *Handler) oauthConfig(provider string) (*oauth2.Config, error) {
	redirect := fmt.Sprintf("%s/api/v1/auth/oauth/%s/callback", strings.TrimRight(h.cfg.OAuthRedirectBase, "/"), provider)
	switch provider {
	case "google":
		if !h.cfg.GoogleEnabled() {
			return nil, fmt.Errorf("google oauth disabled")
		}
		return &oauth2.Config{
			ClientID:     h.cfg.GoogleClientID,
			ClientSecret: h.cfg.GoogleClientSecret,
			RedirectURL:  redirect,
			Scopes:       []string{"email", "profile"},
			Endpoint:     google.Endpoint,
		}, nil
	case "github":
		if !h.cfg.GitHubEnabled() {
			return nil, fmt.Errorf("github oauth disabled")
		}
		return &oauth2.Config{
			ClientID:     h.cfg.GitHubClientID,
			ClientSecret: h.cfg.GitHubClientSecret,
			RedirectURL:  redirect,
			Scopes:       []string{"user:email", "read:user"},
			Endpoint:     github.Endpoint,
		}, nil
	default:
		return nil, fmt.Errorf("unknown provider")
	}
}

func fetchOAuthProfile(ctx context.Context, provider string, token *oauth2.Token, cfg *oauth2.Config) (*oauthProfile, error) {
	client := cfg.Client(ctx, token)
	switch provider {
	case "google":
		resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()
		var data struct {
			ID    string `json:"id"`
			Email string `json:"email"`
			Name  string `json:"name"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
			return nil, err
		}
		name := data.Name
		if name == "" {
			name = strings.Split(data.Email, "@")[0]
		}
		return &oauthProfile{Email: strings.ToLower(data.Email), DisplayName: name, Subject: data.ID}, nil
	case "github":
		resp, err := client.Get("https://api.github.com/user")
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()
		var data struct {
			ID    int64  `json:"id"`
			Login string `json:"login"`
			Name  string `json:"name"`
			Email string `json:"email"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
			return nil, err
		}
		email := data.Email
		if email == "" {
			email, err = fetchGitHubPrimaryEmail(client)
			if err != nil {
				return nil, err
			}
		}
		name := data.Name
		if name == "" {
			name = data.Login
		}
		return &oauthProfile{
			Email:       strings.ToLower(email),
			DisplayName: name,
			Subject:     fmt.Sprintf("%d", data.ID),
		}, nil
	default:
		return nil, fmt.Errorf("unknown provider")
	}
}

func fetchGitHubPrimaryEmail(client *http.Client) (string, error) {
	resp, err := client.Get("https://api.github.com/user/emails")
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	var emails []struct {
		Email   string `json:"email"`
		Primary bool   `json:"primary"`
	}
	if err := json.Unmarshal(body, &emails); err != nil {
		return "", err
	}
	for _, e := range emails {
		if e.Primary {
			return e.Email, nil
		}
	}
	if len(emails) > 0 {
		return emails[0].Email, nil
	}
	return "", fmt.Errorf("no github email")
}

func randomState() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}
