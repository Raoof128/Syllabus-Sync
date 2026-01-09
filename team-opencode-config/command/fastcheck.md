# /fastcheck — Fast Verification Based on Changed Files

> Run the minimal relevant test/lint set based on what files changed.

## Usage

```
/fastcheck
/fastcheck --staged
/fastcheck --since HEAD~3
```

## Execution Flow

### Step 1: Detect Changed Files

```bash
# Unstaged changes
git diff --name-only

# Staged changes
git diff --cached --name-only

# Since specific commit
git diff --name-only HEAD~3
```

**Output:**

```
Changed files detected:
- app/api/auth/signin/route.ts
- lib/services/rateLimitService.ts
- tests/settings/SettingsPage.test.tsx
```

### Step 2: Categorize Changes

```
Categories:
├── SOURCE: .ts/.tsx in app/, components/, lib/
├── TESTS: .test.ts/.spec.ts in tests/
├── CONFIG: *.config.*, tsconfig.json, package.json
└── DOCS: *.md files
```

**Mapping:**

```
app/api/auth/signin/route.ts      → SOURCE (auth module)
lib/services/rateLimitService.ts  → SOURCE (services)
tests/settings/SettingsPage.test.tsx → TESTS (settings)
```

### Step 3: Determine Minimal Check Set

```
RULES:

IF only DOCS changed:
  → Skip all checks (docs only)

IF CONFIG changed:
  → Run FULL suite (config affects everything)

IF SOURCE changed:
  → Run lint on changed files
  → Run typecheck
  → Run related tests

IF only TESTS changed:
  → Run only the changed tests
```

### Step 4: Execute Minimal Checks

**Example for auth changes:**

```bash
# Lint only changed source files
npx eslint app/api/auth/signin/route.ts lib/services/rateLimitService.ts

# TypeScript (always full, it's fast)
npm run typecheck

# Run only related tests
npx vitest run tests/settings/SettingsPage.test.tsx --reporter=verbose
```

### Step 5: Report Results

```
## Fast Check Results

Files changed: 3
Check strategy: MINIMAL (source + tests changed)

| Check | Scope | Status | Time |
|-------|-------|--------|------|
| Lint | 2 files | ✓ PASS | 1.2s |
| TypeCheck | full | ✓ PASS | 3.4s |
| Tests | 1 file | ✓ PASS | 0.8s |

Total time: 5.4s (vs ~45s full suite)

### Skipped (not affected):
- 142 other tests
- Build (no structural changes)
```

## File-to-Test Mapping

```javascript
// Heuristic mapping for Syllabus Sync

const testMap = {
  // Direct mappings
  'app/calendar/': ['tests/CalendarPage.test.tsx'],
  'app/home/': ['tests/TodaySchedule.test.tsx', 'tests/EventsFeed.spec.tsx'],
  'app/settings/': ['tests/settings/*.test.tsx'],
  'app/api/auth/': ['tests/stores.test.ts'],

  // Component mappings
  'components/deadlines/': ['tests/DeadlineForm.test.tsx', 'tests/NextDeadline.test.tsx'],
  'components/units/': ['tests/UnitCard.test.tsx', 'tests/UnitForm.test.tsx'],
  'components/home/': ['tests/EventsFeed.spec.tsx', 'tests/TodaySchedule.test.tsx'],

  // Library mappings
  'lib/store/': ['tests/stores.test.ts'],
  'lib/utils/': ['tests/maskToken.test.ts'],
  'lib/map/': ['tests/map/*.test.ts'],
};
```

## When to Run Full Suite

Always run full suite when:

- `package.json` changed (dependencies)
- `tsconfig.json` changed (compilation)
- `next.config.ts` changed (build config)
- `eslint.config.mjs` changed (lint rules)
- `vitest.config.ts` changed (test config)
- Before committing to main
- Before creating PR

```
/fastcheck detects config changes and auto-escalates to full suite
```

## MCP Integration

When Test Orchestrator MCP is available:

```json
{
  "mcp": {
    "test-orchestrator": {
      "command": "npx",
      "args": ["-y", "test-orchestrator-mcp"],
      "config": {
        "testRunner": "vitest",
        "coverageThreshold": 80
      }
    }
  }
}
```

Benefits:

- Intelligent test selection based on code coverage data
- Dependency graph analysis
- Flaky test detection
- Parallel test execution hints

## Token & Time Efficiency

| Approach   | Time | Tokens        |
| ---------- | ---- | ------------- |
| Full suite | ~45s | ~500 (output) |
| /fastcheck | ~5s  | ~200 (output) |
| Savings    | 40s  | 300 tokens    |

Over 20 iterations/day: **13 minutes** and **6,000 tokens** saved.

## Why This Matters

1. **Faster feedback** — Know if your change broke something in seconds
2. **Less context switching** — Don't wait for unrelated tests
3. **Lower CI costs** — Smaller test runs = less compute
4. **More iterations** — Fast checks encourage more verification
