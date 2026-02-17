# Supabase OAuth Setup (Google + Facebook)

This project uses **Supabase Auth OAuth** and completes the auth code exchange in:

- `GET /auth/callback` (`app/auth/callback/route.ts`)

## 1. Set Supabase Auth Site URL and Redirect URLs

In Supabase Dashboard:

1. Go to **Authentication -> URL Configuration**
2. Set **Site URL** to your primary domain (example):
   - `https://syllabus-sync.dev`
3. Add **Additional Redirect URLs**:
   - `https://syllabus-sync.dev/auth/callback`
   - `http://localhost:3000/auth/callback`

Notes:

- The login UI sends users to Supabase OAuth with `redirectTo=<your-origin>/auth/callback?redirectTo=<safe-path>`.
- `/auth/callback` validates `redirectTo` to prevent open redirects.

## 2. Configure Google Provider

1. In Supabase Dashboard: **Authentication -> Providers -> Google** (enable it)
2. In Google Cloud Console OAuth settings:
   - Add the Supabase callback URL as an authorized redirect URI:
     - `https://<your-project-ref>.supabase.co/auth/v1/callback`

## 3. Configure Facebook Provider

1. In Supabase Dashboard: **Authentication -> Providers -> Facebook** (enable it)
2. In Meta Developer settings:
   - Set the OAuth redirect/callback to Supabase:
     - `https://<your-project-ref>.supabase.co/auth/v1/callback`

## 4. Local Verification

1. Ensure `.env.local` has:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL=http://localhost:3000` (recommended)
2. Start dev server and click:
   - Login -> Continue with Google
   - Login -> Continue with Facebook
