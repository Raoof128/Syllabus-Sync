import fs from 'node:fs';
import path from 'node:path';

const localesDir = 'locales';
const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en', 'translations.json'), 'utf8'));
const enKeys = Object.keys(en);
console.log('English key count:', enKeys.length);

// Check for empty values in English
const emptyEn = enKeys.filter((k) => en[k] === '' || en[k] === null || en[k] === undefined);
if (emptyEn.length) console.log('Empty English keys:', emptyEn);
else console.log('No empty English keys.');

// Extract placeholders from English
const placeholderRe = /\{\{?\w+\}?\}/g;
const enPlaceholders = {};
for (const k of enKeys) {
  const matches = String(en[k]).match(placeholderRe);
  if (matches) enPlaceholders[k] = matches.sort().join(',');
}
console.log('Keys with placeholders:', Object.keys(enPlaceholders).length);

// Check each locale
const locales = fs
  .readdirSync(localesDir)
  .filter((d) => d !== 'en' && fs.statSync(path.join(localesDir, d)).isDirectory());

const results = [];

for (const locale of locales) {
  const loc = JSON.parse(
    fs.readFileSync(path.join(localesDir, locale, 'translations.json'), 'utf8'),
  );
  const locKeys = new Set(Object.keys(loc));
  const missing = enKeys.filter((k) => !locKeys.has(k));
  const extra = [...locKeys].filter((k) => !(k in en));
  const empty = enKeys.filter(
    (k) => locKeys.has(k) && (loc[k] === '' || loc[k] === null || loc[k] === undefined),
  );

  // Untranslated = identical to English (skip short strings like "OK", "GPS", etc.)
  const untranslated = enKeys.filter((k) => locKeys.has(k) && loc[k] === en[k] && en[k].length > 3);

  // Check placeholder mismatches
  const phMismatch = [];
  for (const [k, enPh] of Object.entries(enPlaceholders)) {
    if (locKeys.has(k) && loc[k] !== en[k]) {
      // only check if actually translated
      const locMatches = String(loc[k]).match(placeholderRe);
      const locPh = locMatches ? locMatches.sort().join(',') : '';
      if (locPh !== enPh) phMismatch.push({ key: k, expected: enPh, got: locPh });
    }
  }

  results.push({ locale, missing, extra, empty, untranslated, phMismatch });

  if (missing.length)
    console.log(
      `\n${locale} MISSING (${missing.length}):`,
      missing.slice(0, 20).join(', '),
      missing.length > 20 ? `... +${missing.length - 20} more` : '',
    );
  if (empty.length)
    console.log(`${locale} EMPTY (${empty.length}):`, empty.slice(0, 10).join(', '));
  if (phMismatch.length)
    console.log(
      `${locale} PH_MISMATCH (${phMismatch.length}):`,
      phMismatch
        .slice(0, 5)
        .map((p) => `${p.key}: expected [${p.expected}] got [${p.got}]`)
        .join('; '),
    );
}

console.log('\n========== SUMMARY TABLE ==========');
console.log(
  'Locale | Keys | Missing | Extra | Empty | PH Mismatch | Untranslated (>3 chars identical to EN)',
);
console.log('-------|------|---------|-------|-------|-------------|-------');
for (const r of results) {
  const locFile = JSON.parse(
    fs.readFileSync(path.join(localesDir, r.locale, 'translations.json'), 'utf8'),
  );
  console.log(
    `${r.locale.padEnd(6)} | ${Object.keys(locFile).length.toString().padStart(4)} | ${r.missing.length.toString().padStart(7)} | ${r.extra.length.toString().padStart(5)} | ${r.empty.length.toString().padStart(5)} | ${r.phMismatch.length.toString().padStart(11)} | ${r.untranslated.length}`,
  );
}

// Check for locales with issues that need fixing
const needsFix = results.filter(
  (r) => r.missing.length > 0 || r.empty.length > 0 || r.phMismatch.length > 0,
);
console.log(`\nLocales needing fixes: ${needsFix.length}/${results.length}`);
if (needsFix.length === 0)
  console.log('All locales have full key coverage with no empty values or placeholder mismatches!');
