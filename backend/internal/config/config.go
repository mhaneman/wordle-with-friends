package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	DatabaseURL   string
	JWTSecret     string
	Port          string
	CORSOrigin    string
	FrontendURL   string
	AdminPassword string
	CookieSecure            bool
	TrustProxy              bool
	MaxPendingRegistrations int
}

func Load() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	return Config{
		DatabaseURL:   os.Getenv("DATABASE_URL"),
		JWTSecret:     os.Getenv("JWT_SECRET"),
		Port:          port,
		CORSOrigin:    getenv("CORS_ORIGIN", "http://localhost:5173"),
		FrontendURL:   getenv("FRONTEND_URL", "http://localhost:5173"),
		AdminPassword: os.Getenv("ADMIN_PASSWORD"),
		CookieSecure:  envBool("COOKIE_SECURE") || os.Getenv("APP_ENV") == "production",
		TrustProxy:              envBool("TRUST_PROXY"),
		MaxPendingRegistrations: envInt("MAX_PENDING_REGISTRATIONS", 100),
	}
}

func envInt(key string, fallback int) int {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil || n < 0 {
		return fallback
	}
	return n
}

func envBool(key string) bool {
	v := strings.ToLower(strings.TrimSpace(os.Getenv(key)))
	return v == "1" || v == "true" || v == "yes"
}

func (c Config) InviteOnlyEnabled() bool {
	return c.AdminPassword != ""
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func PortInt(port string) int {
	p, err := strconv.Atoi(port)
	if err != nil {
		return 8080
	}
	return p
}
