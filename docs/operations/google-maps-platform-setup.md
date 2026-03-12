# Google Maps Platform Setup

This runbook configures the production Google map mode for `/map?view=google`.

## 1) Create or select a Google Cloud project

1. Open https://console.cloud.google.com/.
2. Create a project or select the one used by this app.
3. Ensure billing is enabled.

## 2) Enable the required Google APIs

Enable:

1. **Maps JavaScript API**
2. **Routes API**

## 3) Create the browser key

This key is used by the Google Maps JavaScript loader.

1. Open **APIs & Services -> Credentials**.
2. Create an API key.
3. Restrict it to **HTTP referrers**.
4. Add allowed origins such as:
   - `http://localhost:3000/*`
   - `https://your-preview-domain/*`
   - `https://your-production-domain/*`
5. Restrict the key to **Maps JavaScript API**.

Set it as:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-browser-key
```

## 4) Create the server key

This key is used by the server-side Google map proxies:

- `/api/maps/routes`
- `/api/maps/place-search`
- `/api/maps/place-details`

1. Create a second API key.
2. Restrict it by API to **Routes API**.
3. Apply server/network restrictions that fit your deployment platform.

Set it as:

```bash
GOOGLE_ROUTES_API_KEY=your-server-key
```

## 5) Create a Google Map ID

Advanced markers and vector styling require a Map ID.

1. Open **Google Maps Platform -> Map Management**.
2. Create a new **JavaScript** map ID.
3. Apply cloud styling if desired.

Set it as:

```bash
NEXT_PUBLIC_GOOGLE_MAP_ID=your-map-id
```

## 6) Configure the app

### Local development

Add to `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-browser-key
NEXT_PUBLIC_GOOGLE_MAP_ID=your-map-id
GOOGLE_ROUTES_API_KEY=your-server-key
```

Restart the app:

```bash
npm run dev
```

### Vercel deployment

Add all three variables to `development`, `preview`, and `production`.

## 7) Verify

1. Open `/map?view=google`.
2. Confirm the JavaScript map loads instead of an iframe.
3. Search/select a campus building through the shared HUD.
4. Switch travel modes and start navigation.
5. Confirm the route polyline and route panel update in-app.

## 8) Troubleshooting

- `NEXT_PUBLIC_GOOGLE_MAP_ID` missing:
  - The map cannot initialize Advanced Markers correctly. Create a JavaScript Map ID.
- Map loads but routes or place lookup fail:
  - Confirm `GOOGLE_ROUTES_API_KEY` is present server-side and the Routes API is enabled.
- `RefererNotAllowedMapError`:
  - Your browser key referrer allowlist does not match the current domain.
- Map script blocked by CSP:
  - Confirm `lib/security/csp.ts` is deployed with the Google Maps script/connect allowlist.
