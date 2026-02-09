# Map Overlays

## Overview

The campus map supports transparent image overlays (parking, drinking water, accessibility, special permits) rendered on top of the base map. Each overlay is a PNG aligned to the same pixel bounds as the base campus raster.

## How overlays are generated

Source PDFs live in `maps/source/`. A build script converts them to transparent PNGs:

```bash
npm run build:overlays
```

This runs `scripts/build-overlays.sh` which uses **Poppler** (`pdftoppm`) for high-quality PDF rasterisation at 300 DPI, then **ImageMagick** (`magick`) to remove the white background.

### Requirements

- ImageMagick 7+ (`magick`)
- Poppler (`pdftoppm`)

Install on macOS: `brew install imagemagick poppler`

## Where overlay PNGs live

```
public/maps/overlays/
├── parking_overlay.png
├── drinking_water_overlay.png
├── accessibility_overlay.png
└── special_permits_overlay.png
```

These are **not** committed to git by default (they are generated assets). Re-run `npm run build:overlays` to regenerate.

## How to add a new overlay

1. **Add the source PDF** to `maps/source/`.
2. **Add a conversion entry** in `scripts/build-overlays.sh`:
   ```bash
   convert_overlay "My-New-Overlay.pdf" "my_new_overlay.png"
   ```
3. **Run** `npm run build:overlays`.
4. **Add a registry entry** in `lib/map/mapOverlays.ts`:
   - Add the ID to `MAP_OVERLAY_IDS`
   - Add a `MapOverlayConfig` object to the `mapOverlays` array
   - The `bounds` must be `PIXEL_BOUNDS` (same as the base map)
5. **Add i18n keys** to all locale files:
   - `overlay_<id>_name` — display name
   - `overlay_<id>_desc` — short description
6. **Add an icon** to `OVERLAY_ICONS` in `app/map/MapClient.tsx`.

## Architecture

| File                                 | Purpose                                                         |
| ------------------------------------ | --------------------------------------------------------------- |
| `lib/map/mapOverlays.ts`             | Overlay registry (single source of truth)                       |
| `lib/store/mapStore.ts`              | Zustand store with normalised overlay state                     |
| `app/map/components/MapOverlays.tsx` | Declarative rendering via react-leaflet `Pane` + `ImageOverlay` |
| `app/map/MapClient.tsx`              | URL sync (`?layers=`) + HUD toggle UI                           |

### URL sync

- Query param: `?layers=parking,accessibility`
- Overlays are always serialised in **registry order** (stable URLs)
- Back/forward navigation updates overlay state via `searchParams`
- Loop guard prevents infinite URL↔store oscillation

### Rendering

Overlays are rendered inside a Leaflet `<Pane>` with `pointer-events: none` so they never steal map clicks or drag events.

## Gotchas

- **Bounds must match the base map.** All overlays use `PIXEL_BOUNDS` from `lib/map/constants.ts`. If a source PDF has a different aspect ratio, the overlay will appear stretched.
- **Do not auto-crop/trim** the overlay PNGs. The transparent background is needed for correct alignment.
- **Cache busting**: Overlay URLs include `?v=MAP_ASSET_VERSION`. Bump the version in `lib/map/constants.ts` when updating overlay images.

## QA Checklist

- [ ] Rapid toggle spam doesn't cause ghost layers
- [ ] Copy/paste URL with `?layers=parking,accessibility` retains selected layers on load
- [ ] Browser back/forward updates layer state correctly
- [ ] Mobile map drag works — overlays don't steal touches
- [ ] All overlays align correctly with the base campus map
- [ ] `npm run check` passes
