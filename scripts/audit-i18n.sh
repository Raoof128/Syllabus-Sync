#!/bin/bash
echo "============================================================"
echo "I18N COVERAGE AUDIT REPORT"
echo "============================================================"

echo ""
echo "📊 ENGLISH BASELINE"
echo "------------------------------------------------------------"

# Count total English keys (excluding comments)
EN_KEYS=$(grep -E "^\s+[a-zA-Z0-9_]+:\s" lib/i18n/translations.ts | grep -v "^[[:space:]]*//" | wc -l)
echo "Total keys in English (en): $EN_KEYS"

echo ""
echo "Top-level namespaces (by prefix):"
grep -E "^\s+[a-zA-Z0-9_]+:\s" lib/i18n/translations.ts | grep -v "^[[:space:]]*//" | awk -F: '{print $1}' | awk '{print $NF}' | sed 's/[':\''].*//' | sort | uniq -c | sort -rn | head -10

echo ""
echo "🌍 LANGUAGE COMPARISON"
echo "------------------------------------------------------------"
echo "Locale    | Total | Missing | Extra | Empty | Status"
echo "------------------------------------------------------------"

for LOCALE in es fa zh ar hi ko ja ur th vi ru ta bn id ms; do
    TOTAL=$(grep -c "^\s$LOCALE:" lib/i18n/translations.ts || echo 0)
    # Count missing keys (keys in en but not in locale)
    MISSING=$(comm -23 <(grep -E "^\s+[a-zA-Z0-9_]+:\s" lib/i18n/translations.ts | grep -v "^[[:space:]]*//" | awk -F: '{print $1}' | awk '{print $NF}' | sed 's/[':\''].*//' | sort -u) <(grep -E "^\s$LOCALE:[\s]*\{$" lib/i18n/translations.ts -A 500 | grep -E "^\s+[a-zA-Z0-9_]+:\s" | awk -F: '{print $1}' | awk '{print $NF}' | sed 's/[':\''].*//' | sort -u) | wc -l)
    
    # Count extra keys (keys in locale but not in en)
    EXTRA=$(comm -13 <(grep -E "^\s+[a-zA-Z0-9_]+:\s" lib/i18n/translations.ts | grep -v "^[[:space:]]*//" | awk -F: '{print $1}' | awk '{print $NF}' | sed 's/[':\''].*//' | sort -u) <(grep -E "^\s$LOCALE:[\s]*\{$" lib/i18n/translations.ts -A 500 | grep -E "^\s+[a-zA-Z0-9_]+:\s" | awk -F: '{print $1}' | awk '{print $NF}' | sed 's/[':\''].*//' | sort -u) | wc -l)
    
    # Count empty values
    EMPTY=$(grep -E "^\s$LOCALE:[\s]*\{$" lib/i18n/translations.ts -A 500 | grep -E "^\s+[a-zA-Z0-9_]+:\s['\''][ '\'']*['\'']," | wc -l)
    
    if [ "$MISSING" -eq 0 ] && [ "$EMPTY" -eq 0 ]; then
        STATUS="✅ Complete"
    elif [ "$MISSING" -gt 10 ]; then
        STATUS="❌ Critical"
    else
        STATUS="⚠️ Partial"
    fi
    
    printf "%-10s | %-5s | %-7s | %-5s | %-5s | %s\n" "$LOCALE" "$TOTAL" "$MISSING" "$EXTRA" "$EMPTY" "$STATUS"
done

echo ""
echo "============================================================"
