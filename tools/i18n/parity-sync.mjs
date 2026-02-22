import fs from "node:fs/promises";
import path from "node:path";

const LOCALES_DIR = "locales";
const BASE_LOCALE = "en";
const TRANSLATION_FILE = "translations.json";

async function main() {
  const baseFilePath = path.join(LOCALES_DIR, BASE_LOCALE, TRANSLATION_FILE);
  const baseContent = await fs.readFile(baseFilePath, "utf8");
  const baseJson = JSON.parse(baseContent);

  const localeEntries = await fs.readdir(LOCALES_DIR, { withFileTypes: true });
  const locales = localeEntries
    .filter((entry) => entry.isDirectory() && entry.name !== BASE_LOCALE)
    .map((entry) => entry.name);

  for (const locale of locales) {
    const localeFilePath = path.join(LOCALES_DIR, locale, TRANSLATION_FILE);
    const content = await fs.readFile(localeFilePath, "utf8");
    const json = JSON.parse(content);

    let changed = false;
    const newJson = {};

    // Maintain key order of baseJson
    for (const key of Object.keys(baseJson)) {
      if (json[key] === undefined) {
        newJson[key] = baseJson[key];
        changed = true;
      } else {
        newJson[key] = json[key];
      }
    }

    // Also check for extra keys to remove
    for (const key of Object.keys(json)) {
      if (baseJson[key] === undefined) {
        changed = true;
        // Skip adding it to newJson effectively removes it
      }
    }

    if (changed) {
      await fs.writeFile(localeFilePath, JSON.stringify(newJson, null, 2));
      console.log(`Synced ${locale}`);
    }
  }
}

main();
