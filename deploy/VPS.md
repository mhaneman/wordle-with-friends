# VPS deployment (Docker + Caddy)

One server, one domain, HTTPS, Postgres not exposed to the internet.

## What you need

- A VPS (e.g. Hetzner, DigitalOcean, Linode) with Ubuntu 24.04
- A domain name with an **A record** → your VPS public IP
- SSH access to the server

## 1. Initial server setup

SSH in as root or your user, then:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2 git ufw
sudo usermod -aG docker "$USER"
# log out and back in so docker group applies
```

### Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Do **not** open port 5432 (Postgres) or 8080 (API).

## 2. Clone the app

```bash
git clone git@github.com:YOUR_USER/wordle-with-friends.git
cd wordle-with-friends
```

## 3. Configure production env

```bash
cp .env.production.example .env.production
nano .env.production
```

Set:

| Variable | Example |
|----------|---------|
| `DOMAIN` | `wordle.yourdomain.com` |
| `ACME_EMAIL` | your email (for Let's Encrypt) |
| `POSTGRES_PASSWORD` | `openssl rand -base64 24` |
| `JWT_SECRET` | `openssl rand -base64 32` |
| `ADMIN_PASSWORD` | long unique passphrase |
| `CORS_ORIGIN` | `https://wordle.yourdomain.com` |
| `FRONTEND_URL` | same as `CORS_ORIGIN` |

## 4. Start the stack

Docker Compose only auto-loads `.env`, not `.env.production`. Always pass `--env-file` (or use `make prod-up`):

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

First boot runs DB migrations automatically, then starts the API.

Check logs:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f
```

## 5. Verify

- `https://YOUR_DOMAIN` — game UI
- `https://YOUR_DOMAIN/health` — should return `ok`
- `https://YOUR_DOMAIN/admin/login` — admin dashboard
- Register a test user → approve in admin → log in

## 6. Updates

```bash
cd wordle-with-friends
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

## Security notes (built into this stack)

- Postgres and API are on an internal Docker network only
- Caddy terminates HTTPS and proxies `/api` to the API
- Cookies use `Secure` + `HttpOnly` when `APP_ENV=production`
- Admin login is rate-limited
- Request bodies capped at 1 MiB
- Use strong values in `.env.production`; never commit that file

## Troubleshooting

**Certificate errors** — DNS must point to this server before Caddy can issue a cert. Wait for propagation, then restart Caddy:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production restart caddy
```

**502 on login or `/api/*`** — Caddy is up but the API is not reachable (crashed, still starting, or wrong `DATABASE_URL`).

1. Check the API directly (should print `ok`):

   ```bash
   curl -sS https://YOUR_DOMAIN/health
   ```

2. Inspect containers and API logs:

   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.production ps
   docker compose -f docker-compose.prod.yml --env-file .env.production logs api --tail 80
   ```

   If `api` is **Restarting** or logs show `password authentication failed` / `DATABASE_URL and JWT_SECRET are required`, recreate the API with the env file loaded:

   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build api
   ```

   `DATABASE_URL` is built from `POSTGRES_PASSWORD` at compose time. Running `up` without `--env-file` leaves an empty DB password in the URL while Postgres still has the real password → API never stays up → 502.

**Login works locally but not on VPS** — `CORS_ORIGIN` must exactly match `https://YOUR_DOMAIN` (scheme + host, no trailing slash). Wrong CORS shows in the browser console as a CORS error, not 502.
