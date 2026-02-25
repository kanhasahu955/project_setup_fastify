# Deploy on Render

## Required: Set in Render dashboard

In your service **Environment** tab, set these (they are not in `render.yaml` so you control them):

| Variable        | Description |
|----------------|-------------|
| `DATABASE_URL` | Connection string for your database (MongoDB, MySQL, or PostgreSQL). |
| `FRONTEND_URL` | Comma-separated frontend origins allowed for CORS (e.g. `https://yourapp.vercel.app`). |

Optional overrides: `DATABASE_TYPE` (default `mongodb`), `API_URL` (defaults to Render’s URL), `JWT_EXPIRES_IN`, `LOG_LEVEL`.

## Monorepo (backend in a subfolder)

**"Cannot find module ... dist/main.js"** usually means the start command ran from the repo root instead of the backend folder.

1. **render.yaml** already has `rootDir: fastify_backend` so build and start run from that folder. Commit and push so Render picks it up.
2. **If it still fails**, set **Root Directory** in the Render dashboard: **Settings** → **Root Directory** → `fastify_backend` (no leading slash). Save and redeploy.

Build and start then both run from `fastify_backend/`, so `dist/main.js` is found.

## Common deploy failures

| Failure | Fix |
|--------|-----|
| **Deploy: "Cannot find module ... dist/main.js"** | Set **Root Directory** in Render to `fastify_backend` so the start command runs from that folder. Ensure `rootDir: fastify_backend` is set in render.yaml. |
| **Build: "Cannot find module" / no package.json** | Set **Root Directory** to the backend folder (e.g. `fastify_backend`) if you use a monorepo. |
| **Build: Prisma / tsup fails** | Ensure **Build Command** is `npm ci && npm run build`. Node 18+ (Render default is fine). |
| **Runtime: "Missing required environment variable"** | Set **DATABASE_URL**, **FRONTEND_URL**, and ensure **JWT_SECRET** and **COOKIE_SECRET** exist (Render can generate them). |
| **Runtime: App not listening / 503** | Render sets **PORT** automatically; the app uses `env.PORT`. Do not override PORT in the dashboard. |
| **Health check fails** | Health path is `/api/v1/health`. If your API is under a different base path, set **Health Check Path** in Render to match. |

## Build and start

- **Build:** `npm ci && npm run build` (install deps, run Prisma generate + tsup).
- **Start:** `node dist/main.js` (or `npm start`).

After a successful deploy, the API is available at the URL Render shows (e.g. `https://livebhoomi-api.onrender.com`).
