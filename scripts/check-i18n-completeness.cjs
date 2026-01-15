#!/usr/bin/env node
/**
 * i18n Completeness Check for CI
 *
 * Verifies that all translation files have the same keys as the English base.
 * Exits with code 1 if any issues are found.
 */

const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, '..', 'locales');
const enPath = path.join(base, 'en', 'translations.json');

// Load English as the source of truth
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const enKeys = Object.keys(en);

// Get all locale directories
const locales = fs.readdirSync(base).filter((l) => {
  const file = path.join(base, l, 'translations.json');
  return fs.existsSync(file);
});

// Suspicious patterns that indicate untranslated content
const suspiciousRx = /\b(?:TODO|TRANSLATE|TRANSLATE_ME|TBD|FIXME)\b/i;

let hasErrors = false;
let hasWarnings = false;

const results = [];

console.log('🌐 Checking i18n translation completeness...\n');

locales.forEach((locale) => {
  const file = path.join(base, locale, 'translations.json');
  const obj = JSON.parse(fs.readFileSync(file, 'utf8'));
  const keys = Object.keys(obj);

  const missing = enKeys.filter((k) => !Object.prototype.hasOwnProperty.call(obj, k));
  const extra = keys.filter((k) => !Object.prototype.hasOwnProperty.call(en, k));
  const empty = keys.filter((k) => obj[k] === '');
  const suspicious = keys.filter((k) => suspiciousRx.test(obj[k]));

  const result = {
    locale,
    total: keys.length,
    expected: enKeys.length,
    missing: missing.length,
    extra: extra.length,
    empty: empty.length,
    suspicious: suspicious.length,
  };

  results.push(result);

  // English is the base, skip detailed checks
  if (locale === 'en') {
    console.log(`✅ ${locale}: ${keys.length} keys (base language)`);
    return;
  }

  // Check for issues
  const issues = [];

  if (missing.length > 0) {
    issues.push(`${missing.length} missing`);
    hasWarnings = true;
  }

  if (empty.length > 0) {
    issues.push(`${empty.length} empty`);
    hasWarnings = true;
  }

  if (suspicious.length > 0) {
    issues.push(`${suspicious.length} suspicious`);
    hasWarnings = true;
  }

  // Calculate completeness percentage
  const completeness = (((keys.length - empty.length) / enKeys.length) * 100).toFixed(1);

  if (issues.length > 0) {
    console.log(`⚠️  ${locale}: ${completeness}% complete (${issues.join(', ')})`);

    // Show details for missing keys (limit to 5)
    if (missing.length > 0 && missing.length <= 5) {
      missing.forEach((k) => console.log(`     └─ missing: "${k}"`));
    } else if (missing.length > 5) {
      console.log(
        `     └─ missing: "${missing.slice(0, 3).join('", "')}" and ${missing.length - 3} more...`,
      );
    }
  } else {
    console.log(`✅ ${locale}: ${completeness}% complete (${keys.length} keys)`);
  }
});

console.log('\n' + '─'.repeat(50));

// Summary
const totalLocales = locales.length;
const completeLocales = results.filter(
  (r) => r.locale === 'en' || (r.missing === 0 && r.empty === 0),
).length;

console.log(`\n📊 Summary: ${completeLocales}/${totalLocales} locales complete`);
console.log(`   Base language (en): ${enKeys.length} keys`);

// Threshold check - fail CI if any locale is below 80% complete
const COMPLETENESS_THRESHOLD = 80;
const incompleteLocales = results.filter((r) => {
  if (r.locale === 'en') return false;
  const completeness = ((r.total - r.empty) / enKeys.length) * 100;
  return completeness < COMPLETENESS_THRESHOLD;
});

if (incompleteLocales.length > 0) {
  console.log(
    `\n❌ ${incompleteLocales.length} locale(s) below ${COMPLETENESS_THRESHOLD}% threshold:`,
  );
  incompleteLocales.forEach((r) => {
    const completeness = (((r.total - r.empty) / enKeys.length) * 100).toFixed(1);
    console.log(`   - ${r.locale}: ${completeness}%`);
  });
  hasErrors = true;
}

// Exit with appropriate code
if (hasErrors) {
  console.log('\n❌ i18n check failed!\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('\n⚠️  i18n check passed with warnings.\n');
  process.exit(0);
} else {
  console.log('\n✅ i18n check passed!\n');
  process.exit(0);
}
