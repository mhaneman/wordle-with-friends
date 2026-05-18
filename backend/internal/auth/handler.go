package auth

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/spaceclone/wordle-with-friends/backend/internal/config"
	"github.com/spaceclone/wordle-with-friends/backend/internal/store"
)

type Handler struct {
	store  *store.Store
	tokens *TokenService
	cfg    config.Config
}

func NewHandler(st *store.Store, tokens *TokenService, cfg config.Config) *Handler {
	return &Handler{store: st, tokens: tokens, cfg: cfg}
}

type registerRequest struct {
	Username string `json:"username"`
}

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	if !h.cfg.InviteOnlyEnabled() {
		writeError(w, http.StatusServiceUnavailable, "registration is not configured")
		return
	}

	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.Username = strings.TrimSpace(strings.ToLower(req.Username))
	if err := ValidateUsername(req.Username); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if _, err := h.store.FindUserByUsername(r.Context(), req.Username); err == nil {
		writeError(w, http.StatusConflict, "this username is already taken — try another")
		return
	} else if !errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusInternalServerError, "could not create account")
		return
	}

	if _, err := h.store.FindPendingRegistrationByUsername(r.Context(), req.Username); err == nil {
		writeError(w, http.StatusConflict, "this username already has a pending request — try another")
		return
	} else if !errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusInternalServerError, "could not create account")
		return
	}

	plainPassword, err := GeneratePassword()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not create account")
		return
	}

	hash, err := HashPassword(plainPassword)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not create account")
		return
	}

	token, err := newApproveToken()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not create account")
		return
	}

	_, err = h.store.CreateRegistrationRequest(r.Context(), req.Username, hash, token)
	if err != nil {
		if errors.Is(err, store.ErrUsernameExists) {
			writeError(w, http.StatusConflict, "this username already has a pending request — try another")
			return
		}
		writeError(w, http.StatusInternalServerError, "could not create account")
		return
	}

	writeJSON(w, http.StatusAccepted, map[string]string{
		"status":   "pending",
		"message":  "Your registration was submitted. Save your password below — it won't be shown again. You can log in after an admin approves your request.",
		"username": req.Username,
		"password": plainPassword,
	})
}

func newApproveToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func (h *Handler) issueSession(w http.ResponseWriter, userID uuid.UUID) {
	token, err := h.tokens.Issue(userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "session error")
		return
	}
	h.tokens.SetUserCookie(w, token)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.Username = strings.TrimSpace(strings.ToLower(req.Username))

	if pending, err := h.store.FindPendingRegistrationByUsername(r.Context(), req.Username); err == nil && pending != nil {
		writeError(w, http.StatusForbidden, "your account is pending approval")
		return
	}

	user, err := h.store.FindUserByUsername(r.Context(), req.Username)
	if errors.Is(err, store.ErrNotFound) || user.PasswordHash == nil || !CheckPassword(*user.PasswordHash, req.Password) {
		writeError(w, http.StatusUnauthorized, "invalid username or password")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "login failed")
		return
	}
	h.issueSession(w, user.ID)
	writeJSON(w, http.StatusOK, userResponse(user))
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	h.tokens.ClearUserCookie(w)
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	user := UserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	writeJSON(w, http.StatusOK, userResponse(user))
}

func userResponse(u *store.User) map[string]interface{} {
	return map[string]interface{}{
		"id":       u.ID,
		"username": u.Username,
	}
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
