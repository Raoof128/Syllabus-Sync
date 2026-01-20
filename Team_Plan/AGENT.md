# Agent Progress Summary

## Current Session (Jan 20, 2026)

### Fixed Hybrid Navigation Visual Gap
- **Issue:** The blue dotted navigation line was stopping short of the red destination pin. This occurred because the route path (from ORS/OpenStreetMap) snaps to the nearest walkable path, while the building marker is placed at the building's centroid (which might be off-path).
- **Fix:** Updated `retryRoute` and the routing `useEffect` in `app/map/CampusMap.tsx`.
  - Added logic to manually append the `selectedBuilding`'s exact `CRS.Simple` pixel coordinates to the end of the `routeCoords` array.
  - This forces the polyline to draw a final segment connecting the last known path node directly to the destination marker, creating a seamless visual connection.

### Live Direction Indicator "Flash"
- **Task:** Update the user location indicator from a simple circle to a directional "flash" (beam) to show facing direction.
- **Implementation:**
  - Modified `lib/map/mapUtils.ts` to create a composite marker structure (`.user-heading-flash` + `.user-location-dot`).
  - Updated `app/styles/leaflet.css` to style the flash as a semi-transparent conical gradient beam (Google Maps style).
  - Updated `app/map/CampusMap.tsx` to capture `heading` from the Geolocation API and apply CSS rotation to the flash element.
- **Outcome:** The user's location now shows both position (dot) and orientation (beam), improving wayfinding.

### Live Direction Indicator "Dot to Arrow" Transition
- **Task:** Implement the visual transition of the user location indicator from a pulsing dot (when still) to a blue arrow (when walking).
- **Implementation:**
  - Modified `app/map/CampusMap.tsx` to detect user movement based on `pos.coords.speed` (threshold > 0.2 m/s).
  - Implemented logic to toggle the `.is-moving` class on the user marker element.
  - Added dynamic rotation for the `.user-motion-arrow` element (`heading - 45deg`) to ensure correct orientation.
  - Ensured the "Flash" beam is hidden during movement (handled via existing CSS) and the Arrow is shown.
  - Added manual speed calculation fallback for devices reporting null/0 speed (using consecutive positions).
- **Outcome:** The user location marker now dynamically adapts to the user's movement state, providing a clearer "navigation" mode when walking.

### Map Navigation Stability
- **Issue:** Random 500 errors on `POST /api/navigate` due to timeouts or upstream ORS failures.
- **Fix:**
  - Added specific error handling for timeouts in `app/api/navigate/route.ts`.
  - Added explicit 10s timeout signal to `fetch` calls to prevent hanging.
  - Improved error logging to capture upstream status codes and body text.
- **Outcome:** More robust navigation API with clear feedback on timeouts.

### Verified Navigation Handoff & UI
- **Handoff:** `openBestNavApp` uses verified GPS coordinates (`getBuildingGps`) to ensure external maps (Google/Apple) direct users to the correct real-world location.
- **UI:** The route line now uses "Google Blue" (`#4285F4`) with a dotted style (`dashArray="1, 12"`, `lineCap="round"`), matching modern map aesthetics.

### Code Quality
- Maintained strict TypeScript typing for coordinate arrays.
- Added explanatory comments documenting the "visual gap" fix for future maintainers.
- Updated `AGENT.md` and `CHANGELOG.md` with the latest changes.

## Next Steps
1.  **Verify:** Manually test the map on the live site to confirm the line snaps perfectly to the red pin.
2.  **Performance:** Monitor the "On Photo" map performance. If zooming is sluggish, consider tiling the large campus raster image in a future update.
3.  **Search:** Implement fuzzy search for buildings.
