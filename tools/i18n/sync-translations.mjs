/**
 * i18n Translation Sync Script
 *
 * Ensures all locale files have every key from the English base file.
 * Adds missing keys with the English value as a placeholder.
 * Preserves existing translations and key ordering.
 */
import fs from 'node:fs';
import path from 'node:path';

const LOCALES_DIR = 'locales';
const BASE_LOCALE = 'en';
const TRANSLATION_FILE = 'translations.json';

function main() {
  const enPath = path.join(LOCALES_DIR, BASE_LOCALE, TRANSLATION_FILE);
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const enKeys = Object.keys(en);

  console.log(`English base: ${enKeys.length} keys`);

  const locales = fs
    .readdirSync(LOCALES_DIR)
    .filter((d) => d !== BASE_LOCALE && fs.statSync(path.join(LOCALES_DIR, d)).isDirectory());

  let totalAdded = 0;
  let totalRemoved = 0;

  for (const locale of locales) {
    const locPath = path.join(LOCALES_DIR, locale, TRANSLATION_FILE);
    const loc = JSON.parse(fs.readFileSync(locPath, 'utf8'));
    const locKeys = new Set(Object.keys(loc));

    // Find missing and extra keys
    const missing = enKeys.filter((k) => !locKeys.has(k));
    const extra = [...locKeys].filter((k) => !(k in en));

    if (missing.length === 0 && extra.length === 0) continue;

    // Build new object with English key ordering, keeping existing translations
    const newLoc = {};
    for (const key of enKeys) {
      if (key in loc) {
        newLoc[key] = loc[key];
      } else {
        // Add missing key with English value as placeholder
        newLoc[key] = en[key];
      }
    }
    // Extra keys not in English are dropped (they're stale)

    fs.writeFileSync(locPath, JSON.stringify(newLoc, null, 2) + '\n', 'utf8');

    if (missing.length > 0 || extra.length > 0) {
      console.log(`${locale}: +${missing.length} added, -${extra.length} removed`);
      totalAdded += missing.length;
      totalRemoved += extra.length;
    }
  }

  console.log(
    `\nTotal: ${totalAdded} keys added, ${totalRemoved} keys removed across ${locales.length} locales`,
  );
}

main();
