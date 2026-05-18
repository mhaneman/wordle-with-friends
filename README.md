# Wordle With Friends

Daily Wordle with login, server-authoritative scoring, and a leaderboard ranked by fewest guesses.

## Stack

- **API:** Go (chi), PostgreSQL, JWT cookies, email/password auth
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

## Accounts (invite-only)

Registration is **invite-only**. New users submit http://localhost:5173/register and wait for approval.

**Admin dashboard:** http://localhost:5173/admin/login — approve or reject pending signups.

Set in `.env`:

```env
ADMIN_PASSWORD=your-secure-admin-password
```

## Game rules

- One puzzle per UTC calendar day, shared by all players
- Six guesses maximum; answer is only revealed after win or loss
- **Daily** leaderboard: today’s puzzle; **weekly** leaderboard: sum of Mon–Sun (UTC) points
- Leaderboard ranks everyone who finished by points; losses score **0**
- Normal win: `7 − guesses` · **Berserk** (before first guess, 4 guesses max): `9 − guesses`

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

Set production `JWT_SECRET`, `DATABASE_URL`, `CORS_ORIGIN`, and `FRONTEND_URL` to your deployed domains.
