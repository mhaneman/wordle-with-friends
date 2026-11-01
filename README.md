# Word War

Daily Wordle with login, server-authoritative scoring, and a leaderboard ranked by fewest guesses.

## Stack

- **API:** Go (chi), PostgreSQL, JWT cookies, username/password auth
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

Registration is **invite-only**. New users pick a username at http://localhost:5173/register; the site generates a password to save, then they wait for admin approval.

**Admin dashboard:** http://localhost:5173/admin/login — approve or reject pending signups.

Set in `.env`:

```env
ADMIN_PASSWORD=your-secure-admin-password
```

## Game rules

- One puzzle per calendar day in **US Pacific** (`America/Los_Angeles`), shared by all players
- Six guesses maximum; answer is only revealed after win or loss
- **Daily** leaderboard: today’s puzzle; **weekly** leaderboard: sum of Mon–Sun (Pacific) points
- Leaderboard ranks everyone who finished by points; losses score **0**
- Peeking at the leaderboard before finishing costs **1** point on that day's score (a peeked loss scores **−1**). The warning appears once; after you peek, the board stays open
- Normal win: `8 − guesses` (1 guess = 7, 6 guesses = 2) · **Berserk** (before first guess, 4 guesses max) adds 2

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

## Production (VPS)

Deploy everything on one server with HTTPS and hardened defaults:

```bash
cp .env.production.example .env.production
# edit .env.production — set DOMAIN, secrets, CORS_ORIGIN
make prod-up
```

Step-by-step VPS guide (firewall, DNS, verify): **[deploy/VPS.md](deploy/VPS.md)**

Production uses `docker-compose.prod.yml` (Caddy + API + static web + Postgres). The API runs migrations on startup, sets secure cookies, rate-limits admin login, and does not publish the database port.
