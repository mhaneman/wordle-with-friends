package middleware

import (
	"net"
	"net/http"
	"strings"
)

// ClientIP returns the client address for rate limiting.
// When trustProxy is true, uses chi RealIP-adjusted RemoteAddr (see middleware.RealIP),
// then X-Real-IP / X-Forwarded-For if the proxy did not update RemoteAddr.
func ClientIP(r *http.Request, trustProxy bool) string {
	if trustProxy {
		if host, _, err := net.SplitHostPort(r.RemoteAddr); err == nil && host != "" {
			return host
		}
		if ip := strings.TrimSpace(r.Header.Get("X-Real-IP")); ip != "" {
			return ip
		}
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			if i := strings.IndexByte(xff, ','); i >= 0 {
				xff = xff[:i]
			}
			return strings.TrimSpace(xff)
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
