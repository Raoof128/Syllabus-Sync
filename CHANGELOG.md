### Raouf: Home Page Refactor — 2026-02-11

**Scope:** Refactor `HomeClient.tsx` into smaller composable hooks.
**Type:** Refactoring / Code Quality

#### Changes Applied

1.  Identified `HomeClient.tsx` as a high-priority refactor target due to multiple responsibilities (Auth, Data, UI, Events).
2.  Extracted logic into 5 new custom hooks in `features/home/hooks/`:
    - `useHomeUser`: Auth state and profile logic.
    - `useSampleSeeding`: Local storage and sample data seeding.
    - `useHomeData`: Store selectors and initial data loading.
    - `useHomeEventListeners`: Window event listeners (FAB actions).
    - `useHomeErrorBoundary`: Error boundary state and recovery logic.
3.  Refactored `HomeClient.tsx` to use these hooks, reducing file size and complexity.

#### Files Changed

- `app/home/HomeClient.tsx` (simplified)
- `features/home/hooks/index.ts` (new)
- `features/home/hooks/useHomeUser.ts` (new)
- `features/home/hooks/useSampleSeeding.ts` (new)
- `features/home/hooks/useHomeData.ts` (new)
- `features/home/hooks/useHomeEventListeners.ts` (new)
- `features/home/hooks/useHomeErrorBoundary.ts` (new)
- `features/home/types.ts` (new)

#### Verification

- `npm run check` ✅ (lint, typecheck, 425/425 tests, build)
