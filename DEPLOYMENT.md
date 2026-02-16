# Deployment Guide - BondDesk Online

To get your application online (e.g., on Vercel), follow these steps:

## 1. Environment Variables
You will need to set the following environment variables in your deployment dashboard (e.g., Vercel Project Settings):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | For online production, use a Postgres URL (e.g., from Neon.tech or Supabase). Change `provider = "sqlite"` to `provider = "postgresql"` in `schema.prisma` before deploying if you swap. |
| `NEXTAUTH_SECRET` | A long random string (e.g., `openssl rand -base64 32`). |
| `NEXTAUTH_URL` | Your production URL (e.g., `https://your-app.vercel.app`). |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console. |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console. |
| `ADMIN_EMAIL` | The Gmail address that will be the initial admin (default: `manthan.varghese@turtlemint.com`). |

## 2. Google OAuth Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project.
3. Configure "OAuth consent screen" (External).
4. Create "OAuth 2.0 Client IDs" (WEB application).
5. Add Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for local dev)
   - `https://your-app.vercel.app/api/auth/callback/google` (for production)

## 3. Database Migration
In production (if using Postgres), run:
```bash
npx prisma migrate deploy
```
Vercel usually handles this if you add it to the build command: `npx prisma generate && npx prisma migrate deploy && next build`.

## 4. Admin Approval
- Log in with your `ADMIN_EMAIL`. Since it matches the env var, you will be auto-approved.
- New users will see a "Pending Approval" screen.
- Go to `/admin/approvals` to approve them.
