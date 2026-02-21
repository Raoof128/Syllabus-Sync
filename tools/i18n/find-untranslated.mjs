import fs from 'node:fs/promises';
import path from 'node:path';

const LOCALES_DIR = 'locales';
const BASE_LOCALE = 'en';
const TRANSLATION_FILE = 'translations.json';

async function main() {
  const baseContent = await fs.readFile(
    path.join(LOCALES_DIR, BASE_LOCALE, TRANSLATION_FILE),
    'utf8',
  );
  const baseJson = JSON.parse(baseContent);

  const localeEntries = await fs.readdir(LOCALES_DIR, { withFileTypes: true });
  const locales = localeEntries
    .filter((entry) => entry.isDirectory() && entry.name !== BASE_LOCALE)
    .map((entry) => entry.name);

  for (const locale of locales) {
    const content = await fs.readFile(path.join(LOCALES_DIR, locale, TRANSLATION_FILE), 'utf8');
    const json = JSON.parse(content);

    const untranslated = [];
    for (const [key, value] of Object.entries(baseJson)) {
      if (json[key] === value && value.length > 3) {
        // Use length threshold to avoid small common strings like "OK"
        untranslated.push(key);
      }
    }

    if (untranslated.length > 0) {
      console.log(`
Locale: ${locale}`);
      console.log(`  Likely untranslated (${untranslated.length}):`);
      untranslated.slice(0, 10).forEach((k) => console.log(`    - ${k}: "${baseJson[k]}"`));
      if (untranslated.length > 10) console.log(`    ... and ${untranslated.length - 10} more`);
    }
  }
}

main();
