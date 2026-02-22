import fs from "node:fs/promises";
import path from "node:path";

const LOCALES_DIR = "locales";
const BASE_LOCALE = "en";
const TRANSLATION_FILE = "translations.json";

async function main() {
  const baseFilePath = path.join(LOCALES_DIR, BASE_LOCALE, TRANSLATION_FILE);
  const baseContent = await fs.readFile(baseFilePath, "utf8");

  // Check for duplicate keys in raw content
  const lines = baseContent.split(/\r?\n/);
  const keys = [];
  const keyRegex = /"([^"]+)":/g;
  for (let i = 0; i < lines.length; i++) {
    let match;
    while ((match = keyRegex.exec(lines[i])) !== null) {
      keys.push({ key: match[1], line: i + 1 });
    }
  }

  const keyCounts = {};
  const duplicates = [];
  for (const { key, line } of keys) {
    if (keyCounts[key]) {
      duplicates.push({ key, firstLine: keyCounts[key], secondLine: line });
    } else {
      keyCounts[key] = line;
    }
  }

  if (duplicates.length > 0) {
    console.log("Duplicate keys found in en/translations.json:");
    duplicates.forEach((d) =>
      console.log(`- ${d.key}: lines ${d.firstLine} and ${d.secondLine}`),
    );
  } else {
    console.log("No duplicate keys found in en/translations.json.");
  }

  const baseJson = JSON.parse(baseContent);
  const baseKeySet = new Set(Object.keys(baseJson));

  const localeEntries = await fs.readdir(LOCALES_DIR, { withFileTypes: true });
  const locales = localeEntries
    .filter((entry) => entry.isDirectory() && entry.name !== BASE_LOCALE)
    .map((entry) => entry.name);

  console.log(`Checking ${locales.length} locales for parity...`);

  for (const locale of locales) {
    const localeFilePath = path.join(LOCALES_DIR, locale, TRANSLATION_FILE);
    const content = await fs.readFile(localeFilePath, "utf8");
    const json = JSON.parse(content);
    const localeKeySet = new Set(Object.keys(json));

    const missing = [...baseKeySet].filter((k) => !localeKeySet.has(k));
    const extra = [...localeKeySet].filter((k) => !baseKeySet.has(k));

    if (missing.length > 0 || extra.length > 0) {
      console.log(`\nLocale: ${locale}`);
      if (missing.length > 0) {
        console.log(`  Missing keys (${missing.length}):`);
        // Limit to 10 for brevity in console
        missing.slice(0, 10).forEach((k) => console.log(`    - ${k}`));
        if (missing.length > 10)
          console.log(`    ... and ${missing.length - 10} more`);
      }
      if (extra.length > 0) {
        console.log(`  Extra keys (${extra.length}):`);
        extra.slice(0, 10).forEach((k) => console.log(`    - ${k}`));
        if (extra.length > 10)
          console.log(`    ... and ${extra.length - 10} more`);
      }
    }
  }
}

main().catch(console.error);
