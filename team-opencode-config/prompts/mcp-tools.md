# MCP Power Tools Reference

> Model Context Protocol (MCP) servers extend OpenCode with specialized, high-signal capabilities.

## Why MCP Over Raw LLM Reasoning

| Raw LLM                          | MCP Tool                          |
| -------------------------------- | --------------------------------- |
| Guesses at vulnerabilities       | Structured CVE database lookup    |
| Hallucinates dependency versions | Real-time package registry query  |
| Imagines file relationships      | Actual AST-based dependency graph |
| Estimates test coverage          | Real coverage data from runner    |
| Searches docs inefficiently      | Indexed, semantic retrieval       |

**Key Insight:** MCP tools provide **ground truth** that prevents hallucination.

---

## Tool 1: Semgrep SAST

### Problem Solved

Static Application Security Testing — find vulnerabilities, anti-patterns, and security issues in code without running it.

### Where It Fits

| Phase  | Usage                                               |
| ------ | --------------------------------------------------- |
| PLAN   | Scan proposed change areas for existing issues      |
| VERIFY | Confirm changes don't introduce new vulnerabilities |

### Configuration

```jsonc
// In opencode.jsonc
"mcp": {
  "semgrep": {
    "command": "uvx",
    "args": ["--from", "semgrep", "semgrep", "mcp"],
    "env": {
      "SEMGREP_RULES": "p/typescript,p/react,p/nextjs,p/security-audit,p/secrets"
    }
  }
}
```

### Example Output

```json
{
  "findings": [
    {
      "rule_id": "typescript.react.security.audit.react-dangerouslysetinnerhtml",
      "path": "components/RichText.tsx",
      "line": 42,
      "severity": "WARNING",
      "message": "Detected dangerouslySetInnerHTML. This can lead to XSS."
    }
  ],
  "stats": {
    "files_scanned": 156,
    "findings_count": 1
  }
}
```

### Token Efficiency

- Structured JSON (~200 tokens) vs. manual grep analysis (~2000 tokens)
- Severity filtering reduces noise
- Rule IDs enable lookup of fix guidance

---

## Tool 2: OSV Dependency Scanner

### Problem Solved

Supply chain security — identify known vulnerabilities in dependencies before they become exploits.

### Where It Fits

| Phase  | Usage                                                |
| ------ | ---------------------------------------------------- |
| PLAN   | Check if proposed dependencies have known CVEs       |
| VERIFY | Confirm no new vulnerabilities after package updates |

### Configuration

```jsonc
"mcp": {
  "osv-scanner": {
    "command": "osv-scanner",
    "args": ["--format", "json", "--recursive", "."],
    "env": {}
  }
}
```

### Alternative: npm audit

```jsonc
"mcp": {
  "npm-audit": {
    "command": "npm",
    "args": ["audit", "--json"],
    "env": {}
  }
}
```

### Example Output

```json
{
  "vulnerabilities": [
    {
      "package": "lodash",
      "version": "4.17.15",
      "severity": "HIGH",
      "cve": "CVE-2021-23337",
      "title": "Command Injection",
      "fix_available": "4.17.21"
    }
  ],
  "summary": {
    "high": 1,
    "medium": 0,
    "low": 0
  }
}
```

### Token Efficiency

- Direct CVE lookup (~100 tokens) vs. researching each package (~1000+ tokens)
- Fix versions included — no additional lookup needed
- Severity pre-filtered

---

## Tool 3: Repo Graph / Dependency Graph

### Problem Solved

Architecture visibility — understand how files relate, identify blast radius of changes, detect circular dependencies.

### Where It Fits

| Phase  | Usage                                          |
| ------ | ---------------------------------------------- |
| PLAN   | Identify all files affected by proposed change |
| VERIFY | Confirm no unintended coupling introduced      |

### Configuration

```jsonc
"mcp": {
  "repo-graph": {
    "command": "npx",
    "args": ["-y", "madge", "--json", "."],
    "env": {}
  }
}
```

### Example Usage

```bash
# Generate dependency graph
npx madge --json app/api/auth/signin/route.ts

# Detect circular dependencies
npx madge --circular --json .
```

### Example Output

```json
{
  "app/api/auth/signin/route.ts": [
    "lib/services/rateLimitService.ts",
    "lib/utils/api.ts",
    "@supabase/supabase-js"
  ],
  "lib/services/rateLimitService.ts": ["lib/config.ts"]
}
```

### Blast Radius Analysis

```
CHANGE: lib/services/rateLimitService.ts

DIRECT DEPENDENTS (will break if signature changes):
├── app/api/auth/signin/route.ts
├── app/api/auth/signup/route.ts
├── app/api/auth/password/route.ts
└── app/api/navigate/route.ts

INDIRECT DEPENDENTS: None

RECOMMENDED TESTS:
- tests/stores.test.ts (uses rate limit store)
```

### Token Efficiency

- Graph structure (~300 tokens) vs. manual exploration (~3000+ tokens)
- Enables targeted testing
- Prevents missed impacts

---

## Tool 4: Test Orchestrator

### Problem Solved

Smart test selection — run only tests affected by changes, not the entire suite.

### Where It Fits

| Phase  | Usage                                      |
| ------ | ------------------------------------------ |
| PATCH  | Run relevant tests after each small change |
| VERIFY | Full targeted test run before commit       |

### Configuration

```jsonc
"mcp": {
  "test-orchestrator": {
    "command": "npx",
    "args": ["-y", "vitest", "--reporter=json", "--changed"],
    "env": {}
  }
}
```

### Example Usage

```bash
# Run only tests for changed files
npx vitest run --changed --reporter=json

# Run tests related to specific file
npx vitest run --related app/api/auth/signin/route.ts
```

### Example Output

```json
{
  "numTotalTests": 143,
  "numPassedTests": 5,
  "numSkippedTests": 138,
  "testResults": [
    {
      "name": "tests/stores.test.ts",
      "status": "passed",
      "duration": 234
    }
  ],
  "coverageMap": {
    "lib/services/rateLimitService.ts": {
      "lines": { "pct": 87 }
    }
  }
}
```

### Token Efficiency

- Targeted results (~150 tokens) vs. full suite output (~1000 tokens)
- Coverage data included
- Failure details for relevant tests only

---

## Tool 5: Docs Indexer

### Problem Solved

Documentation retrieval — find relevant internal docs without searching manually.

### Where It Fits

| Phase     | Usage                                       |
| --------- | ------------------------------------------- |
| PLAN      | Find existing patterns and conventions      |
| SUMMARISE | Reference relevant documentation in reports |

### Configuration

```jsonc
"mcp": {
  "docs-indexer": {
    "command": "npx",
    "args": ["-y", "docs-indexer-mcp"],
    "config": {
      "indexPaths": [
        "Team_Plan/AGENT.md",
        "Team_Plan/CHANGELOG.md",
        "docs/",
        "README.md"
      ],
      "embedModel": "local"
    }
  }
}
```

### Example Usage

```
Query: "how is rate limiting implemented"

Response:
{
  "matches": [
    {
      "file": "Team_Plan/CHANGELOG.md",
      "section": "v0.8.5 - Distributed Rate Limiting",
      "relevance": 0.95,
      "excerpt": "Replaced in-memory Map() with distributed rateLimitService.ts..."
    },
    {
      "file": "Team_Plan/AGENT.md",
      "section": "Security Guidelines",
      "relevance": 0.78,
      "excerpt": "All auth endpoints must have rate limiting..."
    }
  ]
}
```

### Token Efficiency

- Relevant excerpts (~200 tokens) vs. reading full docs (~5000+ tokens)
- Semantic search finds related content
- Cross-references discovered automatically

---

## MCP Output Guidelines

### Keep Outputs Concise

```jsonc
// In opencode.jsonc
"output": {
  "max_output_tokens": 4000,
  "truncate_large_outputs": true,
  "diff_context_lines": 3
}
```

### Filter by Relevance

- Only show HIGH/MEDIUM severity security findings
- Only show tests that failed or were affected
- Only show top 5 most relevant doc matches

### Structured Over Raw

Always prefer:

- JSON over plain text
- Tables over paragraphs
- Lists over prose
- Numbers over qualitative descriptions

---

## Installation Commands

```bash
# Semgrep (via uvx/pipx)
pipx install semgrep

# OSV Scanner
brew install osv-scanner  # macOS
# or: go install github.com/google/osv-scanner/cmd/osv-scanner@latest

# Madge (dependency graph)
npm install -g madge

# All MCP servers auto-install via npx on first use
```

---

## Complete MCP Section for opencode.jsonc

```jsonc
"mcp": {
  // Security
  "semgrep": {
    "command": "uvx",
    "args": ["--from", "semgrep", "semgrep", "mcp"],
    "env": {
      "SEMGREP_RULES": "p/typescript,p/react,p/nextjs,p/security-audit"
    }
  },

  // Dependencies
  "osv-scanner": {
    "command": "osv-scanner",
    "args": ["--format", "json", "--recursive", "."]
  },

  // Architecture
  "madge": {
    "command": "npx",
    "args": ["-y", "madge", "--json", "."]
  },

  // Testing
  "vitest": {
    "command": "npx",
    "args": ["vitest", "run", "--reporter=json"]
  },

  // Core MCP servers
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@anthropic/mcp-filesystem"]
  },
  "git": {
    "command": "npx",
    "args": ["-y", "@anthropic/mcp-git"]
  },
  "memory": {
    "command": "npx",
    "args": ["-y", "@anthropic/mcp-memory"]
  },
  "sequential-thinking": {
    "command": "npx",
    "args": ["-y", "@anthropic/mcp-sequential-thinking"]
  }
}
```
