# Deploying on Render.com

## "Failed to send verification email" (400)

Registration and resend-OTP send emails. You can use **either Resend or Gmail SMTP**. Set the env vars in Dashboard → your Web Service → Environment.

### Option A: Resend (recommended on Render)

| Variable        | Description | Example |
|----------------|-------------|---------|
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) | `re_...` |
| `RESEND_FROM`  | Sender email (default: `onboarding@resend.dev` for testing) | `onboarding@resend.dev` or your verified domain |
| `MAIL_FROM_NAME` | Sender display name (optional) | `Live Bhoomi` |

Get an API key at [resend.com](https://resend.com). For production you can verify your domain and set `RESEND_FROM` to e.g. `noreply@yourdomain.com`.

### Option B: Gmail SMTP

| Variable        | Description | Example |
|----------------|-------------|---------|
| `SMTP_USER`    | Gmail address used to send mail | `yourapp@gmail.com` |
| `SMTP_PASS`    | Gmail **App Password** (not your normal password) | 16-char app password |
| `MAIL_FROM_NAME` | Sender display name (optional) | `Live Bhoomi` |

1. Enable 2-Step Verification: [myaccount.google.com/security](https://myaccount.google.com/security).
2. Create an **App Password**: Google Account → Security → 2-Step Verification → App passwords → generate for "Mail".
3. Set `SMTP_USER` and `SMTP_PASS` on Render.

If **neither** Resend nor SMTP is configured, the API returns 400 with "Failed to send verification email." Check **Render Logs** for the exact error (e.g. "Mail not configured" or Resend/SMTP error).

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
