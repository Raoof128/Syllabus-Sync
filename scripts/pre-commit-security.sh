#!/bin/bash
# Pre-commit hook for security checks
# Install: cp scripts/pre-commit-security.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running security pre-commit checks...${NC}"

# 1. Block .env files (except .env.example)
BLOCKED_FILES=$(git diff --cached --name-only | grep -E '^\.env(\..+)?$' | grep -v '\.env\.example$' || true)
if [ -n "$BLOCKED_FILES" ]; then
    echo -e "${RED}ERROR: Attempting to commit sensitive environment files:${NC}"
    echo "$BLOCKED_FILES"
    echo -e "${RED}These files contain secrets and must NEVER be committed.${NC}"
    echo -e "Remove them from staging: git reset HEAD <file>"
    exit 1
fi

# 2. Check for hardcoded secrets patterns in staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx|json|yml|yaml|md)$' || true)

if [ -n "$STAGED_FILES" ]; then
    # Patterns that indicate secrets
    SECRET_PATTERNS=(
        'SUPABASE_SERVICE_ROLE_KEY\s*[=:]\s*["\x27]eyJ'
        'password\s*[=:]\s*["\x27][^"\x27]{8,}'
        'api[_-]?key\s*[=:]\s*["\x27][A-Za-z0-9]{20,}'
        'secret\s*[=:]\s*["\x27][A-Za-z0-9]{16,}'
        'AIzaSy[A-Za-z0-9_-]{33}'  # Google API key pattern
        'sk-[A-Za-z0-9]{48}'  # OpenAI key pattern
        'ghp_[A-Za-z0-9]{36}'  # GitHub personal access token
    )

    for file in $STAGED_FILES; do
        if [ -f "$file" ]; then
            for pattern in "${SECRET_PATTERNS[@]}"; do
                MATCHES=$(git diff --cached -- "$file" | grep -iE "$pattern" || true)
                if [ -n "$MATCHES" ]; then
                    echo -e "${RED}ERROR: Potential secret detected in $file${NC}"
                    echo -e "Pattern: $pattern"
                    echo -e "${YELLOW}Review and remove the secret before committing.${NC}"
                    exit 1
                fi
            done
        fi
    done
fi

# 3. Check for NODE_ENV=development in production config files
PROD_CONFIG_FILES=$(git diff --cached --name-only | grep -E '(vercel\.json|\.github/workflows/)' || true)
if [ -n "$PROD_CONFIG_FILES" ]; then
    for file in $PROD_CONFIG_FILES; do
        if [ -f "$file" ]; then
            if grep -q 'NODE_ENV.*development' "$file" 2>/dev/null; then
                echo -e "${RED}ERROR: NODE_ENV=development found in production config: $file${NC}"
                exit 1
            fi
        fi
    done
fi

# 4. Check for CSRF_VALIDATION_ENABLED=false in any committed file
if [ -n "$STAGED_FILES" ]; then
    for file in $STAGED_FILES; do
        if [ -f "$file" ]; then
            if git diff --cached -- "$file" | grep -q 'CSRF_VALIDATION_ENABLED.*false'; then
                echo -e "${RED}ERROR: CSRF_VALIDATION_ENABLED=false found in $file${NC}"
                echo -e "CSRF must remain enabled in production code."
                exit 1
            fi
        fi
    done
fi

echo -e "${GREEN}Security checks passed!${NC}"
exit 0
