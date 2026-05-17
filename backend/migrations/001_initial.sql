-- +goose Up
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT,
    oauth_provider TEXT,
    oauth_subject TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_oauth_unique UNIQUE (oauth_provider, oauth_subject)
);

CREATE TABLE daily_puzzles (
    puzzle_date DATE PRIMARY KEY,
    word TEXT NOT NULL CHECK (char_length(word) = 5)
);

CREATE TABLE game_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    puzzle_date DATE NOT NULL REFERENCES daily_puzzles(puzzle_date) ON DELETE CASCADE,
    guess_count INT CHECK (guess_count IS NULL OR (guess_count >= 1 AND guess_count <= 6)),
    won BOOLEAN NOT NULL DEFAULT FALSE,
    guesses JSONB NOT NULL DEFAULT '[]'::jsonb,
    in_progress BOOLEAN NOT NULL DEFAULT TRUE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, puzzle_date)
);

CREATE INDEX idx_game_results_leaderboard
    ON game_results (puzzle_date, guess_count, completed_at)
    WHERE won = TRUE AND guess_count IS NOT NULL;

-- +goose Down
DROP TABLE IF EXISTS game_results;
DROP TABLE IF EXISTS daily_puzzles;
DROP TABLE IF EXISTS users;
