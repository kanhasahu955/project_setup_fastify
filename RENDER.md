# Deploy on Render

## Environment variables

Names match your **.env**. Set values in Render **Environment** tab (never commit .env). Blueprint sets some; the rest you set in the dashboard.

| Variable | In blueprint? | Set in dashboard |
|----------|----------------|------------------|
| `NODE_ENV` | ✅ production | — |
| `HOST` | ✅ 0.0.0.0 | — |
| `PORT` | — | **Do not set** (Render sets it) |
| `LOG_LEVEL` | ✅ info | — |
| `DATABASE_TYPE` | ✅ postgresql | Override if using mysql/mongodb |
| `DATABASE_URL` | sync: false | **Yes** – DB connection string |
| `DATABASE_URL_POSTGRES` | sync: false | **Yes** – for Prisma when DATABASE_TYPE=postgresql |
| `JWT_SECRET` | generate | Or set your own |
| `COOKIE_SECRET` | generate | Or set your own |
| `JWT_EXPIRES_IN` | ✅ 1d | — |
| `FRONTEND_URL` | sync: false | **Yes** – CORS origins, comma-separated |
| `USE_HTTPS` | ✅ false | — |
| `SMTP_USER` | sync: false | If using mail |
| `SMTP_PASS` | sync: false | If using mail |
| `MAIL_FROM_NAME` | ✅ Live Bhoomi | — |
| `IMAGEKIT_PUBLIC_KEY` | sync: false | If using ImageKit |
| `IMAGEKIT_PRIVATE_KEY` | sync: false | If using ImageKit |
| `IMAGEKIT_URL_ENDPOINT` | sync: false | If using ImageKit (app uses this key name) |

`API_URL` is optional; app falls back to `RENDER_EXTERNAL_URL` if unset.

## Monorepo (backend in this folder)

Render runs from **repo root** by default. The built file is `dist/main.js` **inside this folder** (`fastify_backend`), so you must set **Root Directory** so build and start run from here.

### Manual setup (recommended)

Render often runs commands from **repo root** (`/opt/render/project/src`). Use these so the backend runs from `fastify_backend`:

In Render **Settings** → **Build & Deploy**:

| Setting | Value |
|--------|--------|
| **Root Directory** | *(leave empty)* |
| **Build Command** | `cd fastify_backend && npm ci && npm run build` |
| **Start Command** | `bash fastify_backend/render-start.sh` |

If you prefer to set **Root Directory** to `fastify_backend`, then use:

| **Build Command** | `npm ci && npm run build` |
| **Start Command** | `node dist/main.js` |

### Blueprint

`render.yaml` is in this folder. To use it: **New > Blueprint**, connect your repo, and set **Blueprint path** to `fastify_backend/render.yaml`. It configures `rootDir: fastify_backend` and the same build/start commands.

## Deploy checklist (if local works but Render fails)

1. **Root Directory** – Must be `fastify_backend` (or use the alternate Build/Start commands above).
2. **Build log** – In Render, open the **Build** log and confirm you see `✅ Build completed successfully!` and that the build ran inside `fastify_backend` (paths should contain `fastify_backend`).
3. **Runtime log** – If build succeeds but the service crashes, open **Logs** and copy the exact error (e.g. missing module, env var, database connection).
4. **Environment** – In **Environment**, set at least: `DATABASE_URL` (or `DATABASE_URL_POSTGRES`), `DATABASE_TYPE=postgresql`, `FRONTEND_URL`, `JWT_SECRET`, `COOKIE_SECRET`. Do **not** set `PORT` (Render sets it).

## Common deploy failures

| Failure | Fix |
|--------|-----|
| **"Cannot find module ... src/dist/main.js"** | Render is running from repo root. Set **Root Directory** to `fastify_backend`, or use Start Command `bash fastify_backend/render-start.sh` and Build `cd fastify_backend && npm ci && npm run build`. |
| **"Cannot find module ... dist/main.js"** | Start Command must run from `fastify_backend`. Use Root Directory `fastify_backend` + `node dist/main.js`, or `bash fastify_backend/render-start.sh` from repo root. |
| **Build: "Cannot find module" / no package.json** | Set **Root Directory** to `fastify_backend` or use Build Command `cd fastify_backend && npm ci && npm run build`. |
| **Build: Prisma / tsup fails** | Use Build Command `npm ci && npm run build` from `fastify_backend`. Node 18+ (Render default is fine). |
| **Runtime: "Missing required environment variable"** | Set **DATABASE_URL**, **FRONTEND_URL**, **JWT_SECRET**, **COOKIE_SECRET** in Render **Environment**. |
| **Runtime: App not listening / 503** | Render sets **PORT**; app reads `env.PORT`. Do not set PORT in the dashboard. Ensure **HOST** is `0.0.0.0` (Blueprint sets this). |
| **Health check fails** | Set **Health Check Path** to `/api/v1/health`. |

## Build and start

- **Build:** `npm ci && npm run build`
- **Start:** `node dist/main.js`

(Both run from `fastify_backend` when Root Directory is set.)

After a successful deploy, the API is available at the URL Render shows (e.g. `https://livebhoomi-api.onrender.com`).
