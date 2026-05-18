package auth

import (
	"crypto/rand"
	"errors"
)

const generatedPasswordLen = 14

const passwordAlphabet = "abcdefghijkmnopqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

func GeneratePassword() (string, error) {
	b := make([]byte, generatedPasswordLen)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	out := make([]byte, generatedPasswordLen)
	for i := range b {
		out[i] = passwordAlphabet[int(b[i])%len(passwordAlphabet)]
	}
	return string(out), nil
}

func ValidateUsername(username string) error {
	if len(username) < 3 || len(username) > 32 {
		return errors.New("username must be 3–32 characters")
	}
	for _, c := range username {
		if (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '_' {
			continue
		}
		return errors.New("username may only use letters, numbers, and underscores")
	}
	return nil
}
