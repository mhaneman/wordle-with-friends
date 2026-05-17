package middleware

import (
	"encoding/json"
	"net/http"

	"github.com/spaceclone/wordle-with-friends/backend/internal/auth"
	"github.com/spaceclone/wordle-with-friends/backend/internal/store"
)

func RequireAuth(tokens *auth.TokenService, st *store.Store) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := auth.TokenFromRequest(r)
			if token == "" {
				writeUnauthorized(w)
				return
			}
			claims, err := tokens.Parse(token)
			if err != nil {
				writeUnauthorized(w)
				return
			}
			user, err := st.FindUserByID(r.Context(), claims.UserID)
			if err != nil {
				writeUnauthorized(w)
				return
			}
			next.ServeHTTP(w, r.WithContext(auth.WithUser(r.Context(), user)))
		})
	}
}

func OptionalAuth(tokens *auth.TokenService, st *store.Store) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := auth.TokenFromRequest(r)
			if token != "" {
				if claims, err := tokens.Parse(token); err == nil {
					if user, err := st.FindUserByID(r.Context(), claims.UserID); err == nil {
						r = r.WithContext(auth.WithUser(r.Context(), user))
					}
				}
			}
			next.ServeHTTP(w, r)
		})
	}
}

func writeUnauthorized(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": "not authenticated"})
}
