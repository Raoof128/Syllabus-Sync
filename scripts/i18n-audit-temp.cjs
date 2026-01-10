const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'locales');
const locales = fs
  .readdirSync(localesDir)
  .filter((f) => fs.statSync(path.join(localesDir, f)).isDirectory());

// Load English as base
const en = require('../locales/en/translations.json');
const enKeys = Object.keys(en);
console.log(`\n=== i18n Audit Report ===`);
console.log(`English (reference): ${enKeys.length} keys\n`);

const results = [];

for (const locale of locales) {
  if (locale === 'en') continue;
  const localePath = path.join(localesDir, locale, 'translations.json');
  const translations = require(localePath);
  const localeKeys = Object.keys(translations);

  const missing = enKeys.filter((k) => !localeKeys.includes(k));
  const extra = localeKeys.filter((k) => !enKeys.includes(k));
  const empty = localeKeys.filter((k) => translations[k] === '' || translations[k] === null);

  results.push({
    locale,
    total: localeKeys.length,
    missing: missing.length,
    extra: extra.length,
    empty: empty.length,
    missingKeys: missing,
  });
}

// Print summary table
console.log('| Locale | Keys | Missing | Extra | Empty |');
console.log('|--------|------|---------|-------|-------|');
for (const r of results) {
  console.log(
    `| ${r.locale.padEnd(6)} | ${r.total.toString().padEnd(4)} | ${r.missing.toString().padEnd(7)} | ${r.extra.toString().padEnd(5)} | ${r.empty.toString().padEnd(5)} |`,
  );
}

// Show missing keys
console.log('\n=== Missing Keys (first 50 from Arabic as sample) ===');
const arResult = results.find((r) => r.locale === 'ar');
if (arResult) {
  arResult.missingKeys.slice(0, 50).forEach((k) => console.log(`  - ${k}`));
  if (arResult.missingKeys.length > 50) {
    console.log(`  ... and ${arResult.missingKeys.length - 50} more`);
  }
}

// Output JSON for processing
const outputPath = path.join(__dirname, 'i18n-audit-results.json');
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`\nFull results saved to: ${outputPath}`);
