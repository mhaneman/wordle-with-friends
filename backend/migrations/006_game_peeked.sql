-- +goose Up
ALTER TABLE game_results
    ADD COLUMN peeked BOOLEAN NOT NULL DEFAULT FALSE;

-- +goose Down
ALTER TABLE game_results DROP COLUMN IF EXISTS peeked;
