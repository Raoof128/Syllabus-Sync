# Agent Rules

## Project Context

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS + shadcn/ui components
- Supabase for backend
- Leaflet for maps
- Zustand for state management

## Code Style

- Use TypeScript strict mode
- Follow existing component patterns
- Use `@/lib/` aliases for imports
- Prefer named exports over default exports
- Use translation keys from `@/lib/i18n/translations`

## File Organization

- Components: `components/` with subdirectories by feature
- Hooks: `lib/hooks/`
- Utilities: `lib/utils/`
- Map logic: `lib/map/`
- Security: `lib/security/`

## Testing

- Run `npm run check` before committing (tests + typecheck + lint)
- All changes must pass existing tests
- Add tests for new features in `tests/` directory

## Performance

- Use React.memo for expensive components
- Lazy load heavy modules (Leaflet, charts)
- Use `requestIdleCallback` for non-critical work
- Preload critical assets with `ReactDOM.preload`

## Security

- Follow CSP guidelines in `lib/security/csp.ts`
- Never expose secrets in client code
- Use hash-based inline script validation
- Update CSP hashes when modifying inline scripts

## Accessibility

- WCAG 2.1 AA compliance required
- Use proper ARIA attributes
- Support keyboard navigation
- Respect `prefers-reduced-motion`
- Test with screen readers

## Change Logging

- Use the Raouf change protocol
- Update CHANGELOG.md with every change
- Include: date (Australia/Sydney), scope, summary, files, verification

## Git Workflow

- Do NOT commit unless explicitly asked
- Check `git status` and `git diff` before committing
- Follow conventional commit messages
- Never use force push to main

## Map Module Specifics

- Use CRS.Simple for pixel-based campus map
- Building positions are in image pixels [x, y] where y=0 is TOP
- Convert to CRS.Simple using `pixelToCrsSimple(x, y)` which inverts Y
- Keep coordinate transformations in `lib/map/buildings.ts`
- Map constants in `lib/map/constants.ts` must stay in sync with image dimensions

Raouf: 2026-02-02 (Australia/Sydney)
Scope: Map - Audit Fixes (Navigation, UX, Cleanup)
Summary: Fixed navigation instructions and ORS coordinate handling, aligned geofence bounds, improved overlay panel accessibility, enabled export, adjusted search behavior and hint text, reduced debug noise, and removed unused map controller variants.
Files: `lib/services/ors.ts`, `app/map/hooks/useMapNavigation.ts`, `app/api/navigate/route.ts`, `app/map/MapClient.tsx`, `app/map/CampusMapHUD.tsx`, `app/map/CampusMap.tsx`, `app/map/hooks/index.ts`, deleted `app/map/components/MapCore.tsx`, `app/map/components/MapController.tsx`, `app/map/hooks/useMapController.ts`.
Verification: Not run (not requested).
Follow-ups: None.

Raouf: 2026-02-02 (Australia/Sydney)
Scope: Map - Campus Image Load Reliability
Summary: Reworked campus image overlay to use React-Leaflet `ImageOverlay` for more reliable loading and built-in lifecycle handling.
Files: `app/map/CampusMap.tsx`.
Verification: Not run (not requested).
Follow-ups: None.

Raouf: 2026-02-02 (Australia/Sydney)
Scope: Map - Image Load Diagnostics
Summary: Added readiness fallback and image-load failure overlay to help diagnose blank map screens.
Files: `app/map/CampusMap.tsx`, `app/map/MapClient.tsx`.
Verification: Not run (not requested).
Follow-ups: Confirm whether image overlay now renders in affected environment.

Raouf: 2026-02-02 (Australia/Sydney)
Scope: Map - Cache Busting for Campus Image
Summary: Versioned campus map image URL to bypass stale caches and aligned position editor with shared map constant.
Files: `lib/map/constants.ts`, `app/map/position-editor/PositionEditorClient.tsx`, `public/sw.js`.
Verification: Not run (not requested).
Follow-ups: Validate image loads in affected environment.

Raouf: 2026-02-02 (Australia/Sydney)
Scope: Map - Image Load Timeout Diagnostics
Summary: Added a timeout fallback to surface when the base map image never fires a load/error event.
Files: `app/map/CampusMap.tsx`.
Verification: Not run (not requested).
Follow-ups: Confirm if timeout overlay appears in affected environment.

Raouf: 2026-02-02 (Australia/Sydney)
Scope: Map - Image Fetch Diagnostic + Blob Fallback
Summary: Added a no-store fetch for campus image and fallback to blob URL when load failures occur; surfaced HTTP status in diagnostics.
Files: `app/map/CampusMap.tsx`.
Verification: Not run (not requested).
Follow-ups: Check diagnostic for HTTP status to pinpoint root cause.

Raouf: 2026-02-02 (Australia/Sydney)
Scope: Map - Image Diagnostics (Content-Type + Preview)
Summary: Added content-type/size diagnostics and an inline image preview to determine if Leaflet or the asset pipeline is failing.
Files: `app/map/CampusMap.tsx`.
Verification: Not run (not requested).
Follow-ups: Verify whether the debug preview renders.

Raouf: 2026-02-02 (Australia/Sydney)
Scope: Map - Image Overlay Mount Fix
Summary: Ensured Leaflet `ImageOverlay` only renders after blob URL is ready and remounts on URL change.
Files: `app/map/CampusMap.tsx`.
Verification: Not run (not requested).
Follow-ups: Confirm campus image renders on map.
