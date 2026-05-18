package game

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/spaceclone/wordle-with-friends/backend/internal/auth"
	"github.com/spaceclone/wordle-with-friends/backend/internal/store"
)

type Handler struct {
	store *store.Store
	dict  *Dictionary
}

func NewHandler(st *store.Store, dict *Dictionary) *Handler {
	return &Handler{store: st, dict: dict}
}

func TodayUTC() time.Time {
	now := time.Now().UTC()
	return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
}

func (h *Handler) Today(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	date := TodayUTC()
	if err := h.ensurePuzzle(r, date); err != nil {
		writeError(w, http.StatusInternalServerError, "puzzle error")
		return
	}
	gr, err := h.store.GetOrCreateGame(r.Context(), user.ID, date)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "game error")
		return
	}
	writeJSON(w, http.StatusOK, gameStateResponse(date, gr))
}

func (h *Handler) Berserk(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	date := TodayUTC()
	if err := h.ensurePuzzle(r, date); err != nil {
		writeError(w, http.StatusInternalServerError, "puzzle error")
		return
	}
	gr, err := h.store.SetGameBerserk(r.Context(), user.ID, date)
	if errors.Is(err, store.ErrGameFinished) {
		writeError(w, http.StatusConflict, "game already finished")
		return
	}
	if err != nil {
		msg := "could not enable berserk"
		if err.Error() == "cannot berserk after guessing" || err.Error() == "already berserk" {
			msg = err.Error()
		}
		writeError(w, http.StatusConflict, msg)
		return
	}
	writeJSON(w, http.StatusOK, gameStateResponse(date, gr))
}

type guessRequest struct {
	Word string `json:"word"`
}

func (h *Handler) Guess(w http.ResponseWriter, r *http.Request) {
	user := auth.UserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	var req guessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	word := strings.ToLower(strings.TrimSpace(req.Word))
	if len(word) != 5 || !isAlpha(word) {
		writeError(w, http.StatusBadRequest, "word must be 5 letters")
		return
	}
	if !h.dict.IsValidGuess(word) {
		writeError(w, http.StatusBadRequest, "not in word list")
		return
	}

	date := TodayUTC()
	if err := h.ensurePuzzle(r, date); err != nil {
		writeError(w, http.StatusInternalServerError, "puzzle error")
		return
	}
	answer, err := h.store.GetDailyPuzzleWord(r.Context(), date)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "puzzle error")
		return
	}

	gr, err := h.store.GetOrCreateGame(r.Context(), user.ID, date)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "game error")
		return
	}
	if !gr.InProgress {
		writeError(w, http.StatusConflict, "game already finished")
		return
	}
	limit := MaxGuessesForGame(gr.Berserk)
	if len(gr.Guesses) >= limit {
		writeError(w, http.StatusConflict, "no guesses remaining")
		return
	}

	states := ScoreGuess(word, answer)
	stateStrs := make([]string, len(states))
	for i, s := range states {
		stateStrs[i] = string(s)
	}
	gr.Guesses = append(gr.Guesses, store.GuessRow{Word: word, States: stateStrs})

	won := word == answer
	lost := !won && len(gr.Guesses) >= limit
	if won || lost {
		gr.InProgress = false
		now := time.Now().UTC()
		gr.CompletedAt = &now
		gr.Won = won
		if won {
			count := len(gr.Guesses)
			gr.GuessCount = &count
		}
	}
	if err := h.store.UpdateGame(r.Context(), gr); err != nil {
		writeError(w, http.StatusInternalServerError, "save error")
		return
	}

	resp := gameStateResponse(date, gr)
	resp["word"] = word
	resp["states"] = stateStrs
	resp["guessNum"] = len(gr.Guesses)
	if gameStatus(gr) == "won" || gameStatus(gr) == "lost" {
		resp["answer"] = answer
	}
	writeJSON(w, http.StatusOK, resp)
}

func gameStateResponse(date time.Time, gr *store.GameResult) map[string]interface{} {
	resp := map[string]interface{}{
		"puzzleDate": date.Format("2006-01-02"),
		"maxGuesses": MaxGuessesForGame(gr.Berserk),
		"berserk":    gr.Berserk,
		"guesses":    gr.Guesses,
		"status":     gameStatus(gr),
	}
	if !gr.InProgress && gr.Won && gr.GuessCount != nil {
		resp["guessCount"] = *gr.GuessCount
		resp["points"] = PointsFromGuessCount(*gr.GuessCount, gr.Berserk)
	}
	return resp
}

func (h *Handler) ensurePuzzle(r *http.Request, date time.Time) error {
	word := h.dict.WordForDate(date)
	if err := h.store.EnsureDailyPuzzle(r.Context(), date, word); err != nil {
		return err
	}
	return nil
}

func gameStatus(gr *store.GameResult) string {
	if gr.InProgress {
		return "in_progress"
	}
	if gr.Won {
		return "won"
	}
	return "lost"
}

func isAlpha(s string) bool {
	for i := 0; i < len(s); i++ {
		if s[i] < 'a' || s[i] > 'z' {
			return false
		}
	}
	return true
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
