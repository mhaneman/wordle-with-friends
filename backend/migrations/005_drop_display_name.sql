-- +goose Up
ALTER TABLE users DROP COLUMN display_name;
ALTER TABLE registration_requests DROP COLUMN display_name;

-- +goose Down
ALTER TABLE users ADD COLUMN display_name TEXT NOT NULL DEFAULT '';
ALTER TABLE registration_requests ADD COLUMN display_name TEXT NOT NULL DEFAULT '';
UPDATE users SET display_name = username WHERE display_name = '';
UPDATE registration_requests SET display_name = username WHERE display_name = '';
ALTER TABLE users ALTER COLUMN display_name DROP DEFAULT;
ALTER TABLE registration_requests ALTER COLUMN display_name DROP DEFAULT;
