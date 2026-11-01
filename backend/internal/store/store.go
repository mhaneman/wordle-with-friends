package store

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound       = errors.New("not found")
	ErrUsernameExists = errors.New("username already exists")
	ErrGameFinished   = errors.New("game already finished")
)

type User struct {
	ID           uuid.UUID `json:"id"`
	Username     string    `json:"username"`
	PasswordHash *string   `json:"-"`
	CreatedAt    time.Time `json:"createdAt"`
}

type GuessRow struct {
	Word   string   `json:"word"`
	States []string `json:"states"`
}

type GameResult struct {
	ID              uuid.UUID  `json:"id"`
	UserID          uuid.UUID  `json:"userId"`
	PuzzleDate      time.Time  `json:"puzzleDate"`
	GuessCount      *int       `json:"guessCount"`
	Won             bool       `json:"won"`
	Berserk         bool       `json:"berserk"`
	BerserkDeclined bool       `json:"berserkDeclined"`
	Guesses         []GuessRow `json:"guesses"`
	InProgress      bool       `json:"inProgress"`
	Peeked          bool       `json:"peeked"`
	CompletedAt     *time.Time `json:"completedAt"`
}

type LeaderboardEntry struct {
	Rank        int       `json:"rank"`
	UserID      uuid.UUID `json:"userId"`
	Username    string    `json:"username"`
	GuessCount  int       `json:"guessCount"`
	Points      int       `json:"points"`
	Berserk     bool      `json:"berserk"`
	CompletedAt time.Time `json:"completedAt"`
}

type WeeklyLeaderboardEntry struct {
	Rank        int       `json:"rank"`
	UserID      uuid.UUID `json:"userId"`
	Username    string    `json:"username"`
	TotalPoints int       `json:"totalPoints"`
	GamesPlayed int       `json:"gamesPlayed"`
}

// gamePointsSQL must match game.AwardedPoints.
const gamePointsSQL = `
	(CASE
		WHEN gr.won AND gr.guess_count IS NOT NULL AND gr.berserk THEN
			10 - gr.guess_count
		WHEN gr.won AND gr.guess_count IS NOT NULL THEN
			8 - gr.guess_count
		ELSE 0
	END) - CASE WHEN gr.peeked THEN 1 ELSE 0 END`

type Store struct {
	pool *pgxpool.Pool
}

func New(ctx context.Context, databaseURL string) (*Store, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(ctx); err != nil {
		return nil, err
	}
	return &Store{pool: pool}, nil
}

func (s *Store) Close() {
	s.pool.Close()
}

func (s *Store) CreateUser(ctx context.Context, username string, passwordHash *string) (*User, error) {
	var u User
	err := s.pool.QueryRow(ctx, `
		INSERT INTO users (username, password_hash)
		VALUES ($1, $2)
		RETURNING id, username, password_hash, created_at
	`, username, passwordHash).Scan(
		&u.ID, &u.Username, &u.PasswordHash, &u.CreatedAt,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return nil, ErrUsernameExists
		}
		return nil, err
	}
	return &u, nil
}

func (s *Store) FindUserByUsername(ctx context.Context, username string) (*User, error) {
	var u User
	err := s.pool.QueryRow(ctx, `
		SELECT id, username, password_hash, created_at
		FROM users WHERE username = $1
	`, username).Scan(
		&u.ID, &u.Username, &u.PasswordHash, &u.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return &u, err
}

func (s *Store) FindUserByID(ctx context.Context, id uuid.UUID) (*User, error) {
	var u User
	err := s.pool.QueryRow(ctx, `
		SELECT id, username, password_hash, created_at
		FROM users WHERE id = $1
	`, id).Scan(
		&u.ID, &u.Username, &u.PasswordHash, &u.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return &u, err
}

func (s *Store) ListUsers(ctx context.Context) ([]User, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, username, password_hash, created_at
		FROM users
		ORDER BY username ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Username, &u.PasswordHash, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

func (s *Store) DeleteUser(ctx context.Context, id uuid.UUID) error {
	tag, err := s.pool.Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) EnsureDailyPuzzle(ctx context.Context, date time.Time, word string) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO daily_puzzles (puzzle_date, word)
		VALUES ($1::date, $2)
		ON CONFLICT (puzzle_date) DO NOTHING
	`, date.Format("2006-01-02"), word)
	return err
}

func (s *Store) GetDailyPuzzleWord(ctx context.Context, date time.Time) (string, error) {
	var word string
	err := s.pool.QueryRow(ctx, `
		SELECT word FROM daily_puzzles WHERE puzzle_date = $1::date
	`, date.Format("2006-01-02")).Scan(&word)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	return word, err
}

const gameSelectCols = `id, user_id, puzzle_date, guess_count, won, berserk, berserk_declined, peeked, guesses, in_progress, completed_at`

func scanGame(row pgx.Row) (*GameResult, error) {
	var gr GameResult
	var guessesJSON []byte
	var puzzleDate time.Time
	err := row.Scan(
		&gr.ID, &gr.UserID, &puzzleDate, &gr.GuessCount, &gr.Won, &gr.Berserk, &gr.BerserkDeclined, &gr.Peeked, &guessesJSON, &gr.InProgress, &gr.CompletedAt,
	)
	if err != nil {
		return nil, err
	}
	gr.PuzzleDate = puzzleDate
	if err := json.Unmarshal(guessesJSON, &gr.Guesses); err != nil || gr.Guesses == nil {
		gr.Guesses = []GuessRow{}
	}
	return &gr, nil
}

func (s *Store) GetGame(ctx context.Context, userID uuid.UUID, date time.Time) (*GameResult, error) {
	gr, err := scanGame(s.pool.QueryRow(ctx, `
		SELECT `+gameSelectCols+`
		FROM game_results
		WHERE user_id = $1 AND puzzle_date = $2::date
	`, userID, date.Format("2006-01-02")))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return gr, nil
}

func (s *Store) GetOrCreateGame(ctx context.Context, userID uuid.UUID, date time.Time) (*GameResult, error) {
	gr, err := s.GetGame(ctx, userID, date)
	if err == nil {
		return gr, nil
	}
	if !errors.Is(err, ErrNotFound) {
		return nil, err
	}
	gr, err = scanGame(s.pool.QueryRow(ctx, `
		INSERT INTO game_results (user_id, puzzle_date, guesses, in_progress)
		VALUES ($1, $2::date, '[]'::jsonb, true)
		RETURNING `+gameSelectCols+`
	`, userID, date.Format("2006-01-02")))
	if err != nil {
		return nil, err
	}
	return gr, nil
}

func (s *Store) UpdateGame(ctx context.Context, gr *GameResult) error {
	guessesJSON, err := json.Marshal(gr.Guesses)
	if err != nil {
		return err
	}
	_, err = s.pool.Exec(ctx, `
		UPDATE game_results
		SET guess_count = $2, won = $3, berserk = $4, berserk_declined = $5, peeked = $6, guesses = $7, in_progress = $8, completed_at = $9
		WHERE id = $1
	`, gr.ID, gr.GuessCount, gr.Won, gr.Berserk, gr.BerserkDeclined, gr.Peeked, guessesJSON, gr.InProgress, gr.CompletedAt)
	return err
}

func (s *Store) SetGamePeeked(ctx context.Context, userID uuid.UUID, date time.Time) (*GameResult, error) {
	gr, err := s.GetOrCreateGame(ctx, userID, date)
	if err != nil {
		return nil, err
	}
	if !gr.InProgress || gr.Peeked {
		return gr, nil
	}
	gr.Peeked = true
	if err := s.UpdateGame(ctx, gr); err != nil {
		return nil, err
	}
	return gr, nil
}

func (s *Store) SetGameBerserk(ctx context.Context, userID uuid.UUID, date time.Time) (*GameResult, error) {
	gr, err := s.GetOrCreateGame(ctx, userID, date)
	if err != nil {
		return nil, err
	}
	if !gr.InProgress {
		return nil, ErrGameFinished
	}
	if len(gr.Guesses) > 0 {
		return nil, errors.New("cannot berserk after guessing")
	}
	if gr.BerserkDeclined {
		return nil, errors.New("already playing regular")
	}
	if gr.Berserk {
		return nil, errors.New("already berserk")
	}
	gr.Berserk = true
	gr.BerserkDeclined = false
	if err := s.UpdateGame(ctx, gr); err != nil {
		return nil, err
	}
	return gr, nil
}

func (s *Store) SetGameRegular(ctx context.Context, userID uuid.UUID, date time.Time) (*GameResult, error) {
	gr, err := s.GetOrCreateGame(ctx, userID, date)
	if err != nil {
		return nil, err
	}
	if !gr.InProgress {
		return nil, ErrGameFinished
	}
	if gr.Berserk {
		return nil, errors.New("already berserk")
	}
	if gr.BerserkDeclined {
		return gr, nil
	}
	gr.BerserkDeclined = true
	if err := s.UpdateGame(ctx, gr); err != nil {
		return nil, err
	}
	return gr, nil
}

func (s *Store) GetLeaderboard(ctx context.Context, date time.Time, limit int) ([]LeaderboardEntry, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT
			u.id,
			u.username,
			gr.berserk,
			COALESCE(gr.guess_count, jsonb_array_length(gr.guesses)::int) AS guess_count,
			`+gamePointsSQL+` AS points,
			gr.completed_at
		FROM game_results gr
		JOIN users u ON u.id = gr.user_id
		WHERE gr.puzzle_date = $1::date
		  AND gr.in_progress = FALSE
		  AND gr.completed_at IS NOT NULL
		ORDER BY points DESC, gr.completed_at ASC
		LIMIT $2
	`, date.Format("2006-01-02"), limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []LeaderboardEntry
	rank := 1
	for rows.Next() {
		var e LeaderboardEntry
		if err := rows.Scan(&e.UserID, &e.Username, &e.Berserk, &e.GuessCount, &e.Points, &e.CompletedAt); err != nil {
			return nil, err
		}
		e.Rank = rank
		rank++
		entries = append(entries, e)
	}
	return entries, rows.Err()
}

func (s *Store) GetWeeklyLeaderboard(ctx context.Context, weekStart, weekEnd time.Time, limit int) ([]WeeklyLeaderboardEntry, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT
			u.id,
			u.username,
			SUM(`+gamePointsSQL+`)::int AS total_points,
			COUNT(*)::int AS games_played
		FROM game_results gr
		JOIN users u ON u.id = gr.user_id
		WHERE gr.puzzle_date >= $1::date
		  AND gr.puzzle_date <= $2::date
		  AND gr.in_progress = FALSE
		  AND gr.completed_at IS NOT NULL
		GROUP BY u.id, u.username
		ORDER BY total_points DESC, MIN(gr.completed_at) ASC
		LIMIT $3
	`, weekStart.Format("2006-01-02"), weekEnd.Format("2006-01-02"), limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []WeeklyLeaderboardEntry
	rank := 1
	for rows.Next() {
		var e WeeklyLeaderboardEntry
		if err := rows.Scan(&e.UserID, &e.Username, &e.TotalPoints, &e.GamesPlayed); err != nil {
			return nil, err
		}
		e.Rank = rank
		rank++
		entries = append(entries, e)
	}
	return entries, rows.Err()
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
