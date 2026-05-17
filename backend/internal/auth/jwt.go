package auth

import (
	"errors"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const (
	userCookieName  = "wwf_token"
	adminCookieName = "wwf_admin"
)

type Claims struct {
	UserID uuid.UUID `json:"uid"`
	jwt.RegisteredClaims
}

type AdminClaims struct {
	Admin bool `json:"admin"`
	jwt.RegisteredClaims
}

type TokenService struct {
	secret []byte
}

func NewTokenService(secret string) *TokenService {
	return &TokenService{secret: []byte(secret)}
}

func (t *TokenService) Issue(userID uuid.UUID) (string, error) {
	claims := Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(t.secret)
}

func (t *TokenService) IssueAdmin() (string, error) {
	claims := AdminClaims{
		Admin: true,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(t.secret)
}

func (t *TokenService) Parse(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return t.secret, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

func (t *TokenService) ParseAdmin(tokenStr string) (*AdminClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &AdminClaims{}, func(token *jwt.Token) (interface{}, error) {
		return t.secret, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*AdminClaims)
	if !ok || !token.Valid || !claims.Admin {
		return nil, errors.New("invalid admin token")
	}
	return claims, nil
}

func (t *TokenService) SetUserCookie(w http.ResponseWriter, token string) {
	setCookie(w, userCookieName, token, 7*24*3600)
}

func (t *TokenService) ClearUserCookie(w http.ResponseWriter) {
	clearCookie(w, userCookieName)
}

func (t *TokenService) SetAdminCookie(w http.ResponseWriter, token string) {
	setCookie(w, adminCookieName, token, 24*3600)
}

func (t *TokenService) ClearAdminCookie(w http.ResponseWriter) {
	clearCookie(w, adminCookieName)
}

func setCookie(w http.ResponseWriter, name, value string, maxAge int) {
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   maxAge,
	})
}

func clearCookie(w http.ResponseWriter, name string) {
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})
}

func UserTokenFromRequest(r *http.Request) string {
	if c, err := r.Cookie(userCookieName); err == nil {
		return c.Value
	}
	return ""
}

func AdminTokenFromRequest(r *http.Request) string {
	if c, err := r.Cookie(adminCookieName); err == nil {
		return c.Value
	}
	return ""
}
