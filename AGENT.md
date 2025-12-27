# AGENT.md

This repo contains The Syllabus Sync MVP - a campus navigation and schedule management app for Macquarie University.

## Implemented so far
- Namespaced localStorage adapter with versioned records and guarded parsing.
- Settings store with defaults, validation, migration hook, and change log.
- Units store with CRUD, stable IDs, and safe normalization.
- Map data transforms for markers and heatmap-ready points.
- Shared domain types for Units, Settings, and map payloads.
- Sidebar navigation with 5 links (Home, Map+Live, Calendar, Feed, Settings)

## Scope
- Persistence layer using localStorage (namespaced, versioned)
- Settings backend logic (defaults, validation, migrations)
- Map data transforms (Units -> markers/heatmap-ready data)

## Notes
- No UI components or redesigns here.
- Keep storage access centralized in stores.
- Ensure migrations and validation remain lightweight and safe.

---

## Update Log

### Raouf:
**Date:** 2025-12-27  
**Task:** Sidebar cleanup & project configuration

- Removed duplicate "Map" tab from `Sidebar.tsx` (kept "Map + Live" only)
- Added development workflow at `.agent/workflows/development.md`
- Updated `.gitignore` with IDE folders and swap files
- Cleaned up unused `Map` icon import from lucide-react

---

*Last Updated: 2025-12-27*
