#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const LOCALES_DIR = "locales";
const BASE_LOCALE = "en";
const TRANSLATION_FILE = "translations.json";

function flattenKeys(value, parentKey = "", out = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    out[parentKey] = value;
    return out;
  }
  for (const [key, nestedValue] of Object.entries(value)) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;
    if (
      typeof nestedValue === "object" &&
      nestedValue !== null &&
      !Array.isArray(nestedValue)
    ) {
      flattenKeys(nestedValue, fullKey, out);
    } else {
      out[fullKey] = nestedValue;
    }
  }
  return out;
}

async function main() {
  const en = JSON.parse(
    await fs.readFile(
      path.join(LOCALES_DIR, BASE_LOCALE, TRANSLATION_FILE),
      "utf8",
    ),
  );
  const ar = JSON.parse(
    await fs.readFile(path.join(LOCALES_DIR, "ar", TRANSLATION_FILE), "utf8"),
  );

  const enFlat = flattenKeys(en);
  const arFlat = flattenKeys(ar);
  const enKeys = new Set(Object.keys(enFlat));
  const arKeys = new Set(Object.keys(arFlat));

  const missing = [...enKeys].filter((k) => !arKeys.has(k));
  console.log(`Missing keys (${missing.length}):`);
  for (const k of missing) {
    console.log(JSON.stringify({ key: k, en: enFlat[k] }));
  }

  // Also check if ar has extra keys not in en
  const extra = [...arKeys].filter((k) => !enKeys.has(k));
  if (extra.length > 0) {
    console.log(`\nExtra keys in ar not in en (${extra.length}):`);
    for (const k of extra) {
      console.log(JSON.stringify({ key: k, value: arFlat[k] }));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
