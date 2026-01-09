# /docfind — Documentation Finder

> Retrieve relevant internal documentation for any topic.

## Usage

```
/docfind <topic>
/docfind rate limiting
/docfind authentication flow
/docfind component patterns
```

## Execution Flow

### Step 1: Identify Documentation Sources

```
DOCUMENTATION LOCATIONS:

Primary:
├── Team_Plan/AGENT.md      # Project conventions, work logs
├── Team_Plan/CHANGELOG.md  # Version history, changes
├── Team_Plan/TEAM_ROADMAP.md # Future plans
├── README.md               # Project overview
└── docs/api.md             # API documentation

Secondary:
├── Code comments           # Inline documentation
├── JSDoc/TSDoc             # Type documentation
└── *.test.ts               # Tests as documentation
```

### Step 2: Search Strategy

**Keyword Expansion:**

```
Topic: "rate limiting"
→ Search terms: rate limit, ratelimit, throttle, limiter, requests per minute, rpm

Topic: "authentication"
→ Search terms: auth, signin, signup, login, session, token, jwt, supabase auth
```

**Search Locations by Priority:**

1. CHANGELOG.md — Recent implementations
2. AGENT.md — Conventions and patterns
3. Source files — Actual implementation
4. Test files — Usage examples

### Step 3: Gather Relevant Sections

```bash
# Search documentation files
grep -n -i "rate limit" Team_Plan/*.md docs/*.md README.md

# Search source for implementation
grep -rn "rateLim" --include="*.ts" lib/ app/

# Search tests for usage examples
grep -rn "rateLim" --include="*.test.ts" tests/
```

### Step 4: Present Findings

````
## Documentation for: Rate Limiting

### Recent Changes (CHANGELOG.md)
> v0.8.5 — Distributed Rate Limiting Migration
> - Replaced in-memory Map() with distributed rateLimitService.ts
> - Updated routes: signin (10 attempts/15min), password (3 attempts/hour)

### Implementation Location
- `lib/services/rateLimitService.ts` — Core service
- `app/api/auth/signin/route.ts:23-45` — Usage example

### Configuration
```typescript
// From rateLimitService.ts
const loginLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts
  failClosed: true           // Deny on Redis failure
};
````

### Related Tests

- `tests/stores.test.ts` — Rate limit store tests

### See Also

- CHANGELOG v0.8.5 — Full implementation details
- AGENT.md — Security guidelines section

````

## MCP Integration

When Docs Indexer MCP is available:
```json
{
  "mcp": {
    "docs-indexer": {
      "command": "npx",
      "args": ["-y", "docs-indexer-mcp"],
      "config": {
        "indexPaths": ["docs/", "Team_Plan/", "README.md"],
        "embedModel": "local"
      }
    }
  }
}
````

Benefits:

- Semantic search (not just keyword matching)
- Relevance ranking
- Cross-reference discovery
- Faster retrieval for large repos

## Common Queries

| Query                     | Best Source                      |
| ------------------------- | -------------------------------- |
| "how does auth work"      | AGENT.md → Architecture section  |
| "recent security changes" | CHANGELOG.md → Security sections |
| "component patterns"      | AGENT.md → Coding Standards      |
| "API endpoints"           | docs/api.md                      |
| "test patterns"           | tests/\*.test.ts examples        |
| "deployment"              | AGENT.md → CI/CD section         |

## Why /docfind Over Manual Search

| Manual                 | /docfind                  |
| ---------------------- | ------------------------- |
| Multiple grep commands | Single query              |
| Miss relevant files    | Searches all doc sources  |
| Raw grep output        | Formatted, contextualized |
| No keyword expansion   | Understands synonyms      |

## Token Efficiency

- Returns only relevant excerpts (~300 tokens) vs. full files (~5000+ tokens)
- Pre-filters to documentation files
- Includes line numbers for quick navigation
