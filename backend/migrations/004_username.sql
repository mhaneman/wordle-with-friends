-- +goose Up
ALTER TABLE users RENAME COLUMN email TO username;
ALTER TABLE registration_requests RENAME COLUMN email TO username;

DROP INDEX IF EXISTS idx_registration_requests_pending_email;
CREATE UNIQUE INDEX idx_registration_requests_pending_username
    ON registration_requests (username)
    WHERE status = 'pending';

-- +goose Down
DROP INDEX IF EXISTS idx_registration_requests_pending_username;

ALTER TABLE registration_requests RENAME COLUMN username TO email;
ALTER TABLE users RENAME COLUMN username TO email;

CREATE UNIQUE INDEX idx_registration_requests_pending_email
    ON registration_requests (email)
    WHERE status = 'pending';
