package middleware

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"
)

type visitor struct {
	count    int
	lastSeen time.Time
}

// RateLimit is a simple per-IP in-memory limiter.
func RateLimit(max int, window time.Duration, trustProxy bool) func(http.Handler) http.Handler {
	var mu sync.Mutex
	visitors := make(map[string]*visitor)

	go func() {
		for {
			time.Sleep(window)
			mu.Lock()
			for ip, v := range visitors {
				if time.Since(v.lastSeen) > window {
					delete(visitors, ip)
				}
			}
			mu.Unlock()
		}
	}()

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := ClientIP(r, trustProxy)
			mu.Lock()
			v, exists := visitors[ip]
			if !exists {
				visitors[ip] = &visitor{count: 1, lastSeen: time.Now()}
				mu.Unlock()
				next.ServeHTTP(w, r)
				return
			}
			if time.Since(v.lastSeen) > window {
				v.count = 1
				v.lastSeen = time.Now()
				mu.Unlock()
				next.ServeHTTP(w, r)
				return
			}
			v.count++
			v.lastSeen = time.Now()
			if v.count > max {
				mu.Unlock()
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusTooManyRequests)
				_ = json.NewEncoder(w).Encode(map[string]string{"error": "rate limit exceeded"})
				return
			}
			mu.Unlock()
			next.ServeHTTP(w, r)
		})
	}
}
