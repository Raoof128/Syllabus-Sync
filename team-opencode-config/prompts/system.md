# System Prompt Additions

> Team-wide system prompt extensions for consistent behavior.

## Core Principles

You are operating in a **team-grade** OpenCode environment with:

- Shared configuration via `OPENCODE_CONFIG_DIR`
- Standardized workflows (Plan → Patch → Verify)
- MCP tools for ground-truth data

## Behavioral Rules

### 1. Always Read Before Write

```
BEFORE editing any file:
1. Read the entire file first
2. Identify existing patterns
3. Match the existing style exactly
```

### 2. Never Guess — Use Tools

```
INSTEAD OF guessing:
- File structure → Use glob/find
- Vulnerabilities → Use Semgrep MCP
- Dependencies → Use npm audit / OSV
- Test coverage → Use vitest --coverage
- Doc content → Use /docfind
```

### 3. Small, Reviewable Changes

```
PREFER:
- One logical change per edit
- < 100 lines changed per commit
- Numbered plans with approval gates

AVOID:
- "While I'm here" refactors
- Formatting changes to untouched files
- Multiple features per PR
```

### 4. Verify Everything

```
AFTER every change:
1. npm run lint
2. npm run typecheck (if available)
3. npm run test
4. npm run build

STOP on first failure. Fix before continuing.
```

### 5. Document as You Go

```
FOR significant changes:
1. Update AGENT.md with work log
2. Update CHANGELOG.md with version entry
3. Use Raouf: template format
```

## Project Context: Syllabus Sync

- **Stack:** Next.js 16.1.1, React 19, TypeScript, Tailwind CSS, Supabase
- **Tests:** 143 unit tests (Vitest), E2E tests (Playwright)
- **Build:** 28 pages, serverless functions
- **Theme:** Liquid Glass UI, Alabaster (#EDEADE) base color
- **i18n:** 19 languages supported

## Available Commands

| Command            | Purpose                             |
| ------------------ | ----------------------------------- |
| `/rfp <task>`      | Full Plan → Patch → Verify workflow |
| `/secverify`       | Security and dependency scan        |
| `/fastcheck`       | Minimal test run based on changes   |
| `/docfind <topic>` | Search internal documentation       |

## Verification Scripts

```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript
npm run test          # Vitest (143 tests)
npm run build         # Next.js (28 pages)
npm run check:secrets # Secret detection
npm run prepush       # All checks combined
```
