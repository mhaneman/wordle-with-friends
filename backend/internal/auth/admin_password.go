package auth

import (
	"crypto/subtle"
)

func adminPasswordMatches(expected, provided string) bool {
	if len(expected) != len(provided) {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(expected), []byte(provided)) == 1
}
