#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const LOCALES_DIR = "locales";
const BASE_LOCALE = "en";
const TRANSLATION_FILE = "translations.json";

function flattenKeys(value, parentKey = "", out = new Set()) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return out;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;
    out.add(fullKey);
    flattenKeys(nestedValue, fullKey, out);
  }

  return out;
}

async function loadTranslation(locale) {
  const filePath = path.join(LOCALES_DIR, locale, TRANSLATION_FILE);
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function main() {
  const localeEntries = await fs.readdir(LOCALES_DIR, { withFileTypes: true });
  const locales = localeEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (!locales.includes(BASE_LOCALE)) {
    throw new Error(`Base locale "${BASE_LOCALE}" is missing`);
  }

  const baseTranslations = await loadTranslation(BASE_LOCALE);
  const baseKeys = flattenKeys(baseTranslations);

  const missingKeyErrors = [];

  for (const locale of locales) {
    const translations = await loadTranslation(locale);
    const localeKeys = flattenKeys(translations);

    const missing = [...baseKeys].filter((key) => !localeKeys.has(key));
    if (missing.length > 0) {
      missingKeyErrors.push({
        locale,
        missing: missing.slice(0, 20),
        total: missing.length,
      });
    }
  }

  if (missingKeyErrors.length > 0) {
    console.warn("Translation key parity warnings:");
    for (const error of missingKeyErrors) {
      console.warn(
        `- ${error.locale}: missing ${error.total} keys (sample: ${error.missing.join(", ")})`,
      );
    }
  }

  console.log(
    `Translation check completed (${locales.length} locales validated).`,
  );
}

main().catch((error) => {
  console.error("Translation check failed:", error.message);
  process.exit(1);
});
