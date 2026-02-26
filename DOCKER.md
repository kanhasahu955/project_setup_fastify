# Docker – dev / qa / prod (same as UI)

Same deployment structure as **live_bhoomi_ui**: profiles for dev, qa, and prod.

## Quick start

```bash
# Development (tsx watch, HMR) – http://localhost:8000
docker compose --profile dev up --build

# QA (production build, QA env) – http://localhost:8080
docker compose --profile qa up --build

# Production (production build) – http://localhost:8000
docker compose --profile prod up --build
```

## Stages

| Profile | Service  | Build target | Port | Use case        |
|---------|----------|--------------|------|-----------------|
| `dev`   | api-dev  | deps         | 8000 | Local dev, HMR  |
| `qa`    | api-qa   | runner       | 8080 | QA / staging    |
| `prod`  | api-prod | runner       | 8000 | Production      |

## Env files

Compose uses **.env** for all profiles by default. Optionally use **.env.qa** or **.env.production** by editing `docker-compose.yml` to point `env_file` at those files.

Required in `.env`: `DATABASE_TYPE`, `DATABASE_URL` (or `DATABASE_URL_POSTGRES` / `_MYSQL` / `_MONGODB`), `JWT_SECRET`, `COOKIE_SECRET`, `FRONTEND_URL`. Optional: `REDIS_URL`. See [.env.example](.env.example).

## Build only (no compose)

```bash
# Production image
docker build -t live-bhoomi-backend:prod --target runner .

# Run (pass env or use env file)
docker run -p 8000:8000 \
  -e PORT=8000 \
  -e DATABASE_TYPE=postgresql \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e JWT_SECRET=your-secret \
  -e COOKIE_SECRET=your-cookie-secret \
  -e FRONTEND_URL=https://your-frontend.com \
  live-bhoomi-backend:prod
```

For **MongoDB** or **MySQL**, set `DATABASE_TYPE` and the matching `DATABASE_URL_*` (see [DATABASE_SETUP.md](DATABASE_SETUP.md)).

## Dockerfile stages

| Stage    | Purpose                              |
|----------|--------------------------------------|
| `deps`   | Install deps only (for dev container)|
| `builder`| Prisma generate + tsup build         |
| `runner` | Production: dist + node_modules + generated Prisma + prisma schema |

## Monorepo

If the backend is in a subfolder (e.g. `fastify_backend/`), run Docker from that directory:

```bash
cd fastify_backend
docker compose --profile prod up --build
# or
docker build -t live-bhoomi-backend --target runner .
```
