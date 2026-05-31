package profile

import (
	"encoding/json"
	"net/http"

	"github.com/spaceclone/wordle-with-friends/backend/internal/auth"
	"github.com/spaceclone/wordle-with-friends/backend/internal/store"
)

type Handler struct {
	store *store.Store
}

func NewHandler(st *store.Store) *Handler {
	return &Handler{store: st}
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	best, err := h.store.GetBestWeeklyPoints(r.Context(), user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "profile error")
		return
	}

	resp := map[string]interface{}{
		"username": user.Username,
	}
	if best != nil {
		resp["bestWeek"] = map[string]interface{}{
			"totalPoints": best.TotalPoints,
			"weekStart":   best.WeekStart.Format("2006-01-02"),
			"weekEnd":     best.WeekEnd.Format("2006-01-02"),
		}
	}

	writeJSON(w, http.StatusOK, resp)
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
