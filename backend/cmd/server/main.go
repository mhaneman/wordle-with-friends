package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/spaceclone/wordle-with-friends/backend/internal/auth"
	"github.com/spaceclone/wordle-with-friends/backend/internal/config"
	"github.com/spaceclone/wordle-with-friends/backend/internal/game"
	"github.com/spaceclone/wordle-with-friends/backend/internal/leaderboard"
	appmw "github.com/spaceclone/wordle-with-friends/backend/internal/middleware"
	"github.com/spaceclone/wordle-with-friends/backend/internal/store"
)

const maxRequestBody = 1 << 20 // 1 MiB

func main() {
	cfg := config.Load()
	if cfg.DatabaseURL == "" || cfg.JWTSecret == "" {
		log.Fatal("DATABASE_URL and JWT_SECRET are required")
	}

	ctx := context.Background()
	st, err := store.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer st.Close()

	dataDir := os.Getenv("DATA_DIR")
	if dataDir == "" {
		dataDir = "data"
	}
	dict, err := game.LoadDictionary(
		filepath.Join(dataDir, "answers.txt"),
		filepath.Join(dataDir, "guesses.txt"),
	)
	if err != nil {
		log.Fatalf("dictionary: %v", err)
	}

	tokens := auth.NewTokenService(cfg.JWTSecret, cfg.CookieSecure)
	authHandler := auth.NewHandler(st, tokens, cfg)
	if cfg.AdminPassword == "" {
		log.Println("warning: ADMIN_PASSWORD not set — invite-only registration disabled")
	}
	gameHandler := game.NewHandler(st, dict)
	lbHandler := leaderboard.NewHandler(st)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	if cfg.TrustProxy {
		r.Use(middleware.RealIP)
	}
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(appmw.SecurityHeaders)
	r.Use(appmw.MaxBodyBytes(maxRequestBody))

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.CORSOrigin},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	r.Route("/api/v1", func(api chi.Router) {
		api.Route("/auth", func(ar chi.Router) {
			// Brute-force protection on credential endpoints only (GET /me is uncapped).
			ar.With(appmw.RateLimit(30, time.Minute, cfg.TrustProxy)).Post("/register", authHandler.Register)
			ar.With(appmw.RateLimit(30, time.Minute, cfg.TrustProxy)).Post("/login", authHandler.Login)
			ar.Post("/logout", authHandler.Logout)
			ar.With(appmw.RequireAuth(tokens, st)).Get("/me", authHandler.Me)
		})

		api.Route("/game", func(gr chi.Router) {
			gr.Use(appmw.RequireAuth(tokens, st))
			gr.Use(appmw.RateLimit(120, time.Minute, cfg.TrustProxy))
			gr.Get("/today", gameHandler.Today)
			gr.Post("/berserk", gameHandler.Berserk)
			gr.Post("/guess", gameHandler.Guess)
		})

		api.Route("/leaderboard", func(lr chi.Router) {
			lr.Use(appmw.RequireAuth(tokens, st))
			lr.Get("/today", lbHandler.Today)
			lr.Get("/week", lbHandler.Week)
		})

		api.Route("/admin", func(ar chi.Router) {
			ar.With(appmw.RateLimit(15, time.Minute, cfg.TrustProxy)).Post("/login", authHandler.AdminLogin)
			ar.Post("/logout", authHandler.AdminLogout)
			ar.Get("/me", authHandler.AdminMe)
			ar.Get("/requests", authHandler.ListPendingRequests)
			ar.With(appmw.RateLimit(60, time.Minute, cfg.TrustProxy)).Post("/requests/{id}/approve", authHandler.ApproveRequest)
			ar.With(appmw.RateLimit(60, time.Minute, cfg.TrustProxy)).Post("/requests/{id}/reject", authHandler.RejectRequest)
		})
	})

	addr := ":" + cfg.Port
	srv := &http.Server{Addr: addr, Handler: r}

	go func() {
		log.Printf("listening on %s", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)
}
