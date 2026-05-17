# Wordle With Friends

Daily Wordle with login, server-authoritative scoring, and a leaderboard ranked by fewest guesses.

## Stack

- **API:** Go (chi), PostgreSQL, JWT cookies, OAuth (Google/GitHub) + email/password
- **Web:** React, Vite, Tailwind CSS, **pnpm**
- **Dev:** Docker Compose (no local `npm`/`pnpm` install required)

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

- App: http://localhost:5173  
- API: http://localhost:8080  
- Health: http://localhost:8080/health  

The `web` service runs `pnpm install` inside the container and keeps `node_modules` in a named volume, so you do not need Node or pnpm on your host.

## OAuth setup (optional)

1. **Google:** [Google Cloud Console](https://console.cloud.google.com/) → OAuth client → redirect URI:  
   `http://localhost:8080/api/v1/auth/oauth/google/callback`
2. **GitHub:** Settings → Developer settings → OAuth App → callback:  
   `http://localhost:8080/api/v1/auth/oauth/github/callback`

Add credentials to `.env`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

Restart: `docker compose up --build`

## Email accounts

Register at http://localhost:5173/register (password minimum 8 characters).

OAuth and email accounts are separate in v1 (same email on both creates two accounts).

## Game rules

- One puzzle per UTC calendar day, shared by all players
- Six guesses maximum; answer is only revealed after win or loss
- Leaderboard shows today’s winners sorted by guess count (ties broken by earlier finish)

## Project layout

```
backend/     Go API + word lists in data/
frontend/    React SPA (pnpm)
docker-compose.yml
```

## Useful commands

```bash
make up          # build and start all services
make down        # stop containers
make logs        # follow logs
docker compose exec api goose -dir migrations postgres "$DATABASE_URL" up
```

## Production build

```bash
docker build -f backend/Dockerfile --target prod -t wordle-api ./backend
docker build -f frontend/Dockerfile --target prod -t wordle-web ./frontend
```

Set production `JWT_SECRET`, `DATABASE_URL`, `CORS_ORIGIN`, `FRONTEND_URL`, and OAuth redirect URLs to your deployed domains.
