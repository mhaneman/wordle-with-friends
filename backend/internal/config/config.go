package config

import (
	"os"
	"strconv"
)

type Config struct {
	DatabaseURL        string
	JWTSecret          string
	Port               string
	CORSOrigin         string
	FrontendURL        string
	OAuthRedirectBase  string
	GoogleClientID     string
	GoogleClientSecret string
	GitHubClientID     string
	GitHubClientSecret string
}

func Load() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	return Config{
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		JWTSecret:          os.Getenv("JWT_SECRET"),
		Port:               port,
		CORSOrigin:         getenv("CORS_ORIGIN", "http://localhost:5173"),
		FrontendURL:        getenv("FRONTEND_URL", "http://localhost:5173"),
		OAuthRedirectBase:  getenv("OAUTH_REDIRECT_BASE", "http://localhost:8080"),
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		GitHubClientID:     os.Getenv("GITHUB_CLIENT_ID"),
		GitHubClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func (c Config) GoogleEnabled() bool {
	return c.GoogleClientID != "" && c.GoogleClientSecret != ""
}

func (c Config) GitHubEnabled() bool {
	return c.GitHubClientID != "" && c.GitHubClientSecret != ""
}

func PortInt(port string) int {
	p, err := strconv.Atoi(port)
	if err != nil {
		return 8080
	}
	return p
}
