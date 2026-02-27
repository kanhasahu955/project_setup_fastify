# Deploying on Render.com

## "Failed to send verification email" (400)

Registration and OTP emails use **Resend** if `RESEND_API_KEY` is set, otherwise **SMTP**. Set env vars in Dashboard → your Web Service → Environment.

### Resend (recommended – same as local)

| Variable          | Description | Example |
|-------------------|-------------|---------|
| `RESEND_API_KEY`  | API key from [resend.com](https://resend.com) | `re_xxxx` |
| `RESEND_FROM`     | Sender email (testing: `onboarding@resend.dev`; production: verified domain) | `onboarding@resend.dev` or `noreply@yourdomain.com` |
| `MAIL_FROM_NAME`  | Sender display name | `Live Bhoomi` |

Use the **same** `RESEND_API_KEY` and `RESEND_FROM` as in your local `.env` so production matches local.

### SMTP fallback (if RESEND_API_KEY not set)

| Variable          | Description |
|-------------------|-------------|
| `SMTP_HOST`       | e.g. `smtp.gmail.com` |
| `SMTP_PORT`       | e.g. `587` |
| `SMTP_USER`       | SMTP login |
| `SMTP_PASS`       | SMTP password (Gmail: App Password) |
| `MAIL_FROM_EMAIL` | From address |

If mail is not configured, the API returns 400. Check **Render Logs** for the exact error.

### "Connection timeout" (ETIMEDOUT) on Render

If logs show **`Failed to send email: Error: Connection timeout`** with `code: 'ETIMEDOUT'`, Render’s network often **cannot reach Gmail SMTP** (smtp.gmail.com:587). Many cloud providers block or throttle outbound SMTP to Gmail.

**Options:**

1. **Use a transactional email provider for production** (recommended): Sign up for [Resend](https://resend.com), [SendGrid](https://sendgrid.com), or [Mailgun](https://mailgun.com). They give you SMTP host/port and API keys that work from Render. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `MAIL_FROM_EMAIL` (verified sender) in Render from their dashboard. Keep Gmail in local `.env` if you like.
2. **Longer timeouts**: The app now uses 20s connection/greeting timeouts; redeploy and retry. If the network still blocks Gmail, timeouts won’t fix it.

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
