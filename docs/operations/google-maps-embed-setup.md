# Google Maps Embed API Setup

This runbook configures Google Maps embed mode for `/map?view=google` in local and deployed environments.

## 1) Create/Select a Google Cloud Project

1. Open https://console.cloud.google.com/
2. Create a project (or select an existing one used by this app).
3. Ensure billing is enabled for the project (required by Google Maps Platform).

## 2) Enable Required API

1. Open APIs & Services -> Library.
2. Enable **Maps Embed API**.

## 3) Create an API Key

1. Open APIs & Services -> Credentials.
2. Click **Create credentials** -> **API key**.
3. Copy the key value.

## 4) Restrict the API Key (Required)

Apply both restrictions before production use:

1. Application restrictions -> **HTTP referrers (web sites)**.
2. Add allowed referrers (examples):
   - `http://localhost:3000/*`
   - `https://your-production-domain/*`
3. API restrictions -> **Restrict key** -> select **Maps Embed API** only.

## 5) Configure the App

### Local development

Add to `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY=your-google-maps-embed-api-key
```

Restart the dev server after updating env vars:

```bash
npm run dev
```

### Vercel deployment

Add the key to each required environment:

```bash
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY development
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY preview
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY production
```

Optionally validate required deployment env keys:

```bash
VERCEL_ENVIRONMENT=production npm run vercel:env:check
```

## 6) Verify

1. Open `/map?view=google`.
2. Confirm map iframe renders.
3. Select a building and start navigation; confirm directions iframe renders.

## 7) Troubleshooting

- `RefererNotAllowedMapError`:
  - Your current host is not in API key HTTP referrer allowlist.
- Blank/failed iframe in deployed env:
  - Confirm `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` is set in that environment.
  - Confirm **Maps Embed API** is enabled in the same GCP project as the key.
- Local works, production fails:
  - Re-check production domain referrer pattern and wildcard usage.

## Notes

- The app has a keyless fallback iframe URL path for degraded mode, but production should always set `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` for consistent behavior and controlled quota usage.
- API key creation and restriction must be done in your Google Cloud account. If you share a key value, it can be added to local or deployment envs directly.
