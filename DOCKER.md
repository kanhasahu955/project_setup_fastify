# Docker – Backend API

## Build and run

```bash
# Build
docker build -t live-bhoomi-backend .

# Run (set DATABASE_TYPE and DB URL for your environment)
docker run -p 8000:8000 \
  -e PORT=8000 \
  -e DATABASE_TYPE=mysql \
  -e DATABASE_URL="mysql://user:pass@host:3306/dbname" \
  live-bhoomi-backend
```

For **MongoDB** or **PostgreSQL**, set `DATABASE_TYPE` and the corresponding connection env vars (see [DATABASE_SETUP.md](./DATABASE_SETUP.md)).

## Port

The app reads `PORT` from the environment (default in code is often `3000`). The Dockerfile exposes **8000** to match the frontend’s API base URL. Override with `-e PORT=8000` when running the container.

## Docker Compose (example)

Example `docker-compose.yml` for local runs:

```yaml
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      NODE_ENV: production
      PORT: 8000
      DATABASE_TYPE: mysql
      DATABASE_URL: mysql://user:pass@db:3306/live_bhoomi
    depends_on:
      - db

  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: live_bhoomi
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

Run: `docker compose up -d`.

## Monorepo

If the backend lives in a subfolder (e.g. `fastify_backend/`), run Docker from that directory:

```bash
cd fastify_backend
docker build -t live-bhoomi-backend .
```
