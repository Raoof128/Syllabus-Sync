# /rfp — Repo First Pipeline

> Execute the complete Plan → Patch → Verify workflow for any task.

## Usage

```
/rfp <task description>
```

## Examples

```
/rfp add rate limiting to the signup endpoint
/rfp fix the dark mode header background issue
/rfp implement user preferences storage
```

## Execution Flow

### Step 1: Capture Repo State

```bash
# Gather context automatically
git status --short
git log --oneline -5
```

**Output:**

- Current branch
- Uncommitted changes (if any)
- Recent commit history

### Step 2: Map Repository

```
READ in order:
1. Team_Plan/AGENT.md    — Project conventions, work logs
2. Team_Plan/CHANGELOG.md — Version history, patterns
3. README.md              — Project overview
4. package.json           — Dependencies, scripts
```

**Output:**

- Tech stack summary
- Available npm scripts
- Recent work patterns

### Step 3: Show File Map

```
PROJECT STRUCTURE (relevant to task):

app/
├── api/           # API routes
│   ├── auth/      # Authentication endpoints
│   └── ...
├── calendar/      # Calendar page
├── home/          # Home dashboard
└── ...

components/
├── ui/            # UI components
└── ...

lib/
├── hooks/         # Custom React hooks
├── store/         # Zustand stores
├── services/      # API services
└── utils/         # Utility functions
```

### Step 4: Invoke Repo-First Agent

Transfer control to `repo-first` agent with:

- Task description
- Gathered context
- File map

The agent will:

1. **PLAN** — Propose numbered changes, wait for approval
2. **PATCH** — Implement approved changes incrementally
3. **VERIFY** — Run lint, typecheck, test, build
4. **SUMMARISE** — Report diffs and verification results

### Step 5: Update Documentation

If changes were made:

1. Add entry to `Team_Plan/AGENT.md` (Raouf: template)
2. Add version entry to `Team_Plan/CHANGELOG.md`

## Why /rfp Reduces Errors

| Without /rfp                | With /rfp                        |
| --------------------------- | -------------------------------- |
| Agent guesses at structure  | Agent reads actual files         |
| May miss conventions        | Reads AGENT.md first             |
| Large unreviewed changes    | Numbered plan with approval gate |
| "Done" without verification | Full test suite required         |
| No documentation            | Auto-updates AGENT.md            |

## Token Efficiency

- **Front-loaded context** (~500 tokens) prevents repeated exploration (~2000+ tokens)
- **Approval gate** prevents wasted implementation of wrong approach
- **Structured output** eliminates follow-up questions

## Failure Handling

If any verification step fails:

1. Stop immediately
2. Report the failure
3. Propose fix
4. Re-run verification

Never report success with failing tests.
