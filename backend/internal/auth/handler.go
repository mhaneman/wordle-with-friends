package auth

import (
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
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"displayName"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.DisplayName = strings.TrimSpace(req.DisplayName)
	if req.Email == "" || req.DisplayName == "" || len(req.Password) < 8 {
		writeError(w, http.StatusBadRequest, "email, display name, and password (8+ chars) required")
		return
	}
	hash, err := HashPassword(req.Password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not create account")
		return
	}
	hashStr := hash
	user, err := h.store.CreateUser(r.Context(), req.Email, req.DisplayName, &hashStr)
	if errors.Is(err, store.ErrEmailExists) {
		writeError(w, http.StatusConflict, "email already registered")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not create account")
		return
	}
	h.issueSession(w, user.ID)
	writeJSON(w, http.StatusCreated, userResponse(user))
}

func (h *Handler) issueSession(w http.ResponseWriter, userID uuid.UUID) {
	token, err := h.tokens.Issue(userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "session error")
		return
	}
	h.tokens.SetCookie(w, token)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	user, err := h.store.FindUserByEmail(r.Context(), req.Email)
	if errors.Is(err, store.ErrNotFound) || user.PasswordHash == nil || !CheckPassword(*user.PasswordHash, req.Password) {
		writeError(w, http.StatusUnauthorized, "invalid email or password")
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
	h.tokens.ClearCookie(w)
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
		"id":          u.ID,
		"email":       u.Email,
		"displayName": u.DisplayName,
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
