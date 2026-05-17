package auth

import (
	"context"

	"github.com/google/uuid"
	"github.com/spaceclone/wordle-with-friends/backend/internal/store"
)

type contextKey string

const userKey contextKey = "user"

func WithUser(ctx context.Context, user *store.User) context.Context {
	return context.WithValue(ctx, userKey, user)
}

func UserFromContext(ctx context.Context) *store.User {
	u, _ := ctx.Value(userKey).(*store.User)
	return u
}

func UserIDFromContext(ctx context.Context) (uuid.UUID, bool) {
	u := UserFromContext(ctx)
	if u == nil {
		return uuid.Nil, false
	}
	return u.ID, true
}
