package leaderboard

import (
	"encoding/json"
	"net/http"

	"github.com/spaceclone/wordle-with-friends/backend/internal/auth"
	"github.com/spaceclone/wordle-with-friends/backend/internal/game"
	"github.com/spaceclone/wordle-with-friends/backend/internal/store"
)

type Handler struct {
	store *store.Store
}

func NewHandler(st *store.Store) *Handler {
	return &Handler{store: st}
}

func (h *Handler) Today(w http.ResponseWriter, r *http.Request) {
	date := game.TodayUTC()
	entries, err := h.store.GetLeaderboard(r.Context(), date, 50)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "leaderboard error")
		return
	}
	if entries == nil {
		entries = []store.LeaderboardEntry{}
	}
	resp := map[string]interface{}{
		"puzzleDate": date.Format("2006-01-02"),
		"entries":    entries,
	}
	if user := auth.UserFromContext(r.Context()); user != nil {
		for _, e := range entries {
			if e.UserID == user.ID {
				resp["myRank"] = e.Rank
				break
			}
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
