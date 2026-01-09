# /secverify — Security Verification

> Run comprehensive security checks and produce structured findings.

## Usage

```
/secverify
/secverify --focus auth
/secverify --severity high
```

## Execution Flow

### Step 1: Dependency Vulnerability Scan

```bash
# Run npm audit for known vulnerabilities
npm audit --json

# If osv-scanner MCP is available, use it
osv-scanner --format json --recursive .
```

**Output Format:**

```
## Dependency Vulnerabilities

| Package | Severity | CVE | Fix Available |
|---------|----------|-----|---------------|
| lodash  | HIGH     | CVE-2021-23337 | Yes (4.17.21) |
| ...     | ...      | ... | ... |

Total: X high, Y medium, Z low
```

### Step 2: Static Analysis (Semgrep)

```bash
# If Semgrep MCP is available
semgrep --config p/typescript --config p/react --config p/nextjs --json .

# Manual patterns if MCP unavailable
grep -r "eval(" --include="*.ts" --include="*.tsx" .
grep -r "dangerouslySetInnerHTML" --include="*.tsx" .
grep -r "process.env" --include="*.ts" --include="*.tsx" app/
```

**Output Format:**

```
## Static Analysis Findings

| File | Line | Rule | Severity | Description |
|------|------|------|----------|-------------|
| app/api/auth/signin/route.ts | 45 | security/sql-injection | HIGH | Potential SQL injection |
| ... | ... | ... | ... | ... |

Total: X findings
```

### Step 3: Secrets Detection

```bash
# Check for hardcoded secrets
npm run check:secrets

# Manual patterns
grep -rE "(api[_-]?key|secret|password|token)\s*[:=]\s*['\"][^'\"]+['\"]" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir=node_modules .
```

**Output Format:**

```
## Secrets Detection

| File | Line | Pattern | Risk |
|------|------|---------|------|
| None found | - | - | - |

✓ No hardcoded secrets detected
```

### Step 4: Security Configuration Check

```
CHECK: CSP Headers
- Location: proxy.ts / next.config.ts
- Expected: script-src with nonce, no unsafe-inline

CHECK: Rate Limiting
- Auth endpoints: signin, signup, password reset
- Expected: Per-IP limits configured

CHECK: CORS Configuration
- Location: app/api/_lib/middleware.ts
- Expected: Explicit origin allowlist, no * with credentials

CHECK: Environment Variables
- Sensitive keys should NOT have NEXT_PUBLIC_ prefix
- API keys should be server-only
```

**Output Format:**

```
## Security Configuration

| Check | Status | Notes |
|-------|--------|-------|
| CSP Headers | ✓ | Nonce-based, no unsafe-inline |
| Rate Limiting | ✓ | Auth endpoints protected |
| CORS | ✓ | Explicit origins only |
| Env Vars | ✓ | No public secrets |
```

### Step 5: Summary Report

```
## Security Verification Summary

Overall Status: PASS / FAIL / WARN

### Critical (Must Fix)
- None

### High (Fix Soon)
- [List or None]

### Medium (Plan to Fix)
- [List or None]

### Recommendations
1. [Actionable recommendation]
2. [Actionable recommendation]

### Next Steps
- [ ] Address critical findings
- [ ] Schedule high-priority fixes
- [ ] Review medium findings in next sprint
```

## MCP Integration

When Semgrep MCP is available:

```json
{
  "mcp": {
    "semgrep": {
      "command": "uvx",
      "args": ["--from", "semgrep", "semgrep", "mcp"]
    }
  }
}
```

Benefits:

- Structured JSON output (vs. raw grep)
- Rule explanations included
- False positive filtering
- Severity scoring

## Why /secverify Over Manual Checks

| Manual                 | /secverify                |
| ---------------------- | ------------------------- |
| Inconsistent coverage  | Same checks every time    |
| Easy to forget steps   | Automated checklist       |
| Unstructured output    | Tabular summaries         |
| No baseline comparison | Tracks findings over time |

## Token Efficiency

- MCP tools return structured JSON (~200 tokens) vs. raw output (~2000+ tokens)
- Severity filtering reduces noise
- Actionable summaries prevent follow-up questions
