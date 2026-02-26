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

## Monorepo (backend in a subfolder)

**render.yaml** uses `startCommand: cd fastify_backend && node dist/main.js` so the app runs from the backend folder. No separate start script.

If the deploy still fails, set **Root Directory** in Render to `fastify_backend`: **Settings** → **Root Directory** → `fastify_backend` → Save and redeploy.

## Common deploy failures

| Failure | Fix |
|--------|-----|
| **Deploy: "Cannot find module ... dist/main.js"** | **render.yaml** has `startCommand: cd fastify_backend && node dist/main.js`. Or set **Root Directory** to `fastify_backend` in Render. |
| **Build: "Cannot find module" / no package.json** | Set **Root Directory** to the backend folder (e.g. `fastify_backend`) if you use a monorepo. |
| **Build: Prisma / tsup fails** | Ensure **Build Command** is `npm ci && npm run build`. Node 18+ (Render default is fine). |
| **Runtime: "Missing required environment variable"** | Set **DATABASE_URL**, **FRONTEND_URL**, and ensure **JWT_SECRET** and **COOKIE_SECRET** exist (Render can generate them). |
| **Runtime: App not listening / 503** | Render sets **PORT** automatically; the app uses `env.PORT`. Do not override PORT in the dashboard. |
| **Health check fails** | Health path is `/api/v1/health`. If your API is under a different base path, set **Health Check Path** in Render to match. |

## Build and start

- **Build:** `npm ci && npm run build` (install deps, run Prisma generate + tsup).
- **Start:** `cd fastify_backend && node dist/main.js` (from **render.yaml**).

After a successful deploy, the API is available at the URL Render shows (e.g. `https://livebhoomi-api.onrender.com`).
