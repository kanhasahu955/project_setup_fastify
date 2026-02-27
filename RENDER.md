# Deploying on Render.com

## "Failed to send verification email" (400)

Registration and resend-OTP send emails via **SMTP**. Set these env vars in Dashboard → your Web Service → Environment.

| Variable          | Description | Example |
|-------------------|-------------|---------|
| `SMTP_HOST`       | SMTP host (optional; default Gmail) | `smtp.gmail.com` |
| `SMTP_PORT`       | SMTP port (optional; default 587) | `587` |
| `SMTP_USER`       | SMTP login (e.g. Gmail address) | `yourapp@gmail.com` |
| `SMTP_PASS`       | SMTP password (Gmail: use **App Password**) | 16-char app password |
| `MAIL_FROM_NAME`  | Sender display name | `Live Bhoomi` |
| `MAIL_FROM_EMAIL` | From address (optional; defaults to SMTP_USER) | `yourapp@gmail.com` |

**Gmail:** Enable 2-Step Verification, then create an **App Password** (Google Account → Security → App passwords). Set `SMTP_USER` to your Gmail and `SMTP_PASS` to that app password. Omit `SMTP_HOST`/`SMTP_PORT` to use Gmail defaults.

**To match local:** Set the same values as in your local `.env`: `SMTP_USER` (Gmail), `SMTP_PASS` (Gmail App Password), and optionally `MAIL_FROM_EMAIL` (same as SMTP_USER). `SMTP_HOST`/`SMTP_PORT` in the blueprint default to Gmail.

If SMTP vars are missing or wrong, the API returns 400 with "Failed to send verification email." Check **Render Logs** for the exact nodemailer error.

---

## Timeout / "Nothing happens" on first request

On the **free tier**, Render spins down your service after ~15 minutes of no traffic. The **first request after spin-down** (cold start) can take **30–60+ seconds** while the server starts. During that time:

- **Frontend**: Requests may time out (e.g. after 15s). The UI now uses a **60s timeout in production** so the first request can complete. You can set `VITE_API_TIMEOUT_MS=60000` (or higher) in your frontend env if needed.
- **Swagger (Try it out)**: The same cold start applies. If you click "Execute" and nothing seems to happen:
  1. Wait **up to 60–90 seconds** for the first request.
  2. Check the browser Network tab: the request may be "pending" until the server is up.
  3. Try again once the service has woken; later requests are fast.

## Reducing timeouts

1. **Frontend**: In production build, API timeout is 60s by default. Override with `VITE_API_TIMEOUT_MS` (milliseconds) in your hosting env if you need more (e.g. `90000` for 90s).
2. **Keep the service warm**: Use a cron job (e.g. [cron-job.org](https://cron-job.org)) to hit `https://live-bhoomi.onrender.com/api/v1/health` every 10–14 minutes so the service doesn’t spin down.
3. **Upgrade**: Paid Render plans avoid spin-down and give faster, more reliable cold starts.

## Health check

- **URL**: `GET https://your-app.onrender.com/api/v1/health`
- Use this for Render’s health check path and for your keep-alive cron.
