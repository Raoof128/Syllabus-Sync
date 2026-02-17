# Supabase OAuth Setup (Google)

This project uses **Supabase Auth OAuth** (PKCE flow) and completes the auth code exchange in:

- `GET /auth/callback` (`app/auth/callback/route.ts`)

## 1. Set Supabase Auth Site URL and Redirect URLs

In Supabase Dashboard:

1. Go to **Authentication -> URL Configuration**
2. Set **Site URL** to your primary production domain:
   - `https://syllabus-sync-ashy.vercel.app`
3. Add **Additional Redirect URLs** for every domain users may access:
   - `https://syllabus-sync-ashy.vercel.app/auth/callback`
   - `https://syllabus-sync-ashy.vercel.app/auth/callback/**`
   - `https://syllabus-sync-ashy.vercel.app/auth/confirm`
   - `https://syllabus-sync-ashy.vercel.app/reset-password`
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/callback/**`
   - `http://localhost:3000/auth/confirm`
   - `http://localhost:3000/reset-password`

Notes:

- The login UI sends users to Supabase OAuth with `redirectTo=<your-origin>/auth/callback?redirectTo=<safe-path>`.
- `/auth/callback` validates `redirectTo` to prevent open redirects.
- The callback URL origin is determined by `window.location.origin` in the browser, so **every domain that serves the app must be listed**.

## 2. Configure Google Provider

1. In Supabase Dashboard: **Authentication -> Providers -> Google** (enable it)
2. In Google Cloud Console OAuth settings:
   - Add the Supabase callback URL as an authorized redirect URI:
     - `https://<your-project-ref>.supabase.co/auth/v1/callback`

## 3. Local Verification

1. Ensure `.env.local` has:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL=http://localhost:3000` (recommended)
2. Start dev server and click:
   - Login -> Continue with Google
