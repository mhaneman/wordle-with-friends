package store

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var ErrRequestNotFound = errors.New("registration request not found")

type RegistrationRequest struct {
	ID           uuid.UUID
	Username     string
	PasswordHash string
	ApproveToken string
	Status       string
	CreatedAt    time.Time
	ReviewedAt   *time.Time
}

type RegistrationRequestPublic struct {
	ID        uuid.UUID `json:"id"`
	Username  string    `json:"username"`
	CreatedAt time.Time `json:"createdAt"`
}

func (s *Store) CreateRegistrationRequest(ctx context.Context, username, passwordHash, token string) (*RegistrationRequest, error) {
	var rr RegistrationRequest
	err := s.pool.QueryRow(ctx, `
		INSERT INTO registration_requests (username, password_hash, approve_token)
		VALUES ($1, $2, $3)
		RETURNING id, username, password_hash, approve_token, status, created_at, reviewed_at
	`, username, passwordHash, token).Scan(
		&rr.ID, &rr.Username, &rr.PasswordHash, &rr.ApproveToken,
		&rr.Status, &rr.CreatedAt, &rr.ReviewedAt,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return nil, ErrUsernameExists
		}
		return nil, err
	}
	return &rr, nil
}

func (s *Store) FindPendingRegistrationByUsername(ctx context.Context, username string) (*RegistrationRequest, error) {
	var rr RegistrationRequest
	err := s.pool.QueryRow(ctx, `
		SELECT id, username, password_hash, approve_token, status, created_at, reviewed_at
		FROM registration_requests
		WHERE username = $1 AND status = 'pending'
	`, username).Scan(
		&rr.ID, &rr.Username, &rr.PasswordHash, &rr.ApproveToken,
		&rr.Status, &rr.CreatedAt, &rr.ReviewedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return &rr, err
}

func (s *Store) FindRegistrationByID(ctx context.Context, id uuid.UUID) (*RegistrationRequest, error) {
	var rr RegistrationRequest
	err := s.pool.QueryRow(ctx, `
		SELECT id, username, password_hash, approve_token, status, created_at, reviewed_at
		FROM registration_requests
		WHERE id = $1
	`, id).Scan(
		&rr.ID, &rr.Username, &rr.PasswordHash, &rr.ApproveToken,
		&rr.Status, &rr.CreatedAt, &rr.ReviewedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrRequestNotFound
	}
	return &rr, err
}

func (s *Store) ListPendingRegistrations(ctx context.Context) ([]RegistrationRequestPublic, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, username, created_at
		FROM registration_requests
		WHERE status = 'pending'
		ORDER BY created_at ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []RegistrationRequestPublic
	for rows.Next() {
		var item RegistrationRequestPublic
		if err := rows.Scan(&item.ID, &item.Username, &item.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, item)
	}
	return list, rows.Err()
}

func (s *Store) ApproveRegistration(ctx context.Context, requestID uuid.UUID) (*User, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var rr RegistrationRequest
	err = tx.QueryRow(ctx, `
		SELECT id, username, password_hash, approve_token, status, created_at, reviewed_at
		FROM registration_requests
		WHERE id = $1
		FOR UPDATE
	`, requestID).Scan(
		&rr.ID, &rr.Username, &rr.PasswordHash, &rr.ApproveToken,
		&rr.Status, &rr.CreatedAt, &rr.ReviewedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrRequestNotFound
	}
	if err != nil {
		return nil, err
	}
	if rr.Status != "pending" {
		return nil, errors.New("request already reviewed")
	}

	var u User
	err = tx.QueryRow(ctx, `
		INSERT INTO users (username, password_hash)
		VALUES ($1, $2)
		RETURNING id, username, password_hash, created_at
	`, rr.Username, rr.PasswordHash).Scan(
		&u.ID, &u.Username, &u.PasswordHash, &u.CreatedAt,
	)
	if err != nil {
		if isUniqueViolation(err) {
			_, _ = tx.Exec(ctx, `
				UPDATE registration_requests
				SET status = 'approved', reviewed_at = NOW()
				WHERE id = $1
			`, requestID)
			if commitErr := tx.Commit(ctx); commitErr != nil {
				return nil, commitErr
			}
			return s.FindUserByUsername(ctx, rr.Username)
		}
		return nil, err
	}

	_, err = tx.Exec(ctx, `
		UPDATE registration_requests
		SET status = 'approved', reviewed_at = NOW()
		WHERE id = $1
	`, requestID)
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &u, nil
}

func (s *Store) RejectRegistration(ctx context.Context, requestID uuid.UUID) error {
	tag, err := s.pool.Exec(ctx, `
		UPDATE registration_requests
		SET status = 'rejected', reviewed_at = NOW()
		WHERE id = $1 AND status = 'pending'
	`, requestID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrRequestNotFound
	}
	return nil
}
