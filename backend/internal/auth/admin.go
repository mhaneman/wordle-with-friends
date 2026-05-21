package auth

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/spaceclone/wordle-with-friends/backend/internal/store"
)

type adminLoginRequest struct {
	Password string `json:"password"`
}

func (h *Handler) AdminLogin(w http.ResponseWriter, r *http.Request) {
	if h.cfg.AdminPassword == "" {
		writeError(w, http.StatusServiceUnavailable, "admin not configured")
		return
	}
	var req adminLoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if !adminPasswordMatches(h.cfg.AdminPassword, req.Password) {
		writeError(w, http.StatusUnauthorized, "invalid password")
		return
	}
	token, err := h.tokens.IssueAdmin()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "session error")
		return
	}
	h.tokens.SetAdminCookie(w, token)
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h *Handler) AdminLogout(w http.ResponseWriter, r *http.Request) {
	h.tokens.ClearAdminCookie(w)
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) AdminMe(w http.ResponseWriter, r *http.Request) {
	if !h.isAdmin(r) {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"admin": true})
}

func (h *Handler) ListPendingRequests(w http.ResponseWriter, r *http.Request) {
	if !h.isAdmin(r) {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	list, err := h.store.ListPendingRegistrations(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load requests")
		return
	}
	if list == nil {
		list = []store.RegistrationRequestPublic{}
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"requests": list})
}

func (h *Handler) ApproveRequest(w http.ResponseWriter, r *http.Request) {
	if !h.isAdmin(r) {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	rr, err := h.store.FindRegistrationByID(r.Context(), id)
	if errors.Is(err, store.ErrRequestNotFound) {
		writeError(w, http.StatusNotFound, "request not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not approve")
		return
	}
	if rr.Status != "pending" {
		writeError(w, http.StatusConflict, "request already reviewed")
		return
	}
	user, err := h.store.ApproveRegistration(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not approve")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"ok":   true,
		"user": userResponse(user),
	})
}

func (h *Handler) RejectRequest(w http.ResponseWriter, r *http.Request) {
	if !h.isAdmin(r) {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	if err := h.store.RejectRegistration(r.Context(), id); err != nil {
		if errors.Is(err, store.ErrRequestNotFound) {
			writeError(w, http.StatusNotFound, "request not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "could not reject")
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h *Handler) ListPlayers(w http.ResponseWriter, r *http.Request) {
	if !h.isAdmin(r) {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	users, err := h.store.ListUsers(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load players")
		return
	}
	if users == nil {
		users = []store.User{}
	}
	list := make([]map[string]interface{}, 0, len(users))
	for _, u := range users {
		list = append(list, userResponse(&u))
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"players": list})
}

func (h *Handler) DeletePlayer(w http.ResponseWriter, r *http.Request) {
	if !h.isAdmin(r) {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	if err := h.store.DeleteUser(r.Context(), id); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "player not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "could not delete player")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) isAdmin(r *http.Request) bool {
	token := AdminTokenFromRequest(r)
	if token == "" {
		return false
	}
	_, err := h.tokens.ParseAdmin(token)
	return err == nil
}
