package config

import (
	"os"
	"strconv"
)

type Config struct {
	DatabaseURL string
	JWTSecret   string
	Port        string
	CORSOrigin  string
	FrontendURL string
}

func Load() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	return Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
		Port:        port,
		CORSOrigin:  getenv("CORS_ORIGIN", "http://localhost:5173"),
		FrontendURL: getenv("FRONTEND_URL", "http://localhost:5173"),
	}
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
