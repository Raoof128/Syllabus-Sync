#!/usr/bin/env node

import { readFileSync } from 'fs';

const content = readFileSync('./lib/i18n/translations.ts', 'utf-8');

// Parse translations object
const enMatch = content.match(/en:\s*\{([\s\S]*?)\n\s{3}\},/);
if (!enMatch) {
  console.error('Could not find English translations');
  process.exit(1);
}

const englishBlock = enMatch[1];

// Extract all keys from English
const englishKeys = new Set();
const keyRegex = /^(\s+)([a-zA-Z0-9_]+):/gm;
let match;
while ((match = keyRegex.exec(englishBlock)) !== null) {
  if (!match[2].startsWith('//')) {
    englishKeys.add(match[2]);
  }
}

console.log('='.repeat(60));
console.log('I18N COVERAGE AUDIT REPORT');
console.log('='.repeat(60));
console.log('');
console.log('📊 ENGLISH BASELINE');
console.log('-'.repeat(40));
console.log(`Total keys in English (en): ${englishKeys.size}`);

// Get all locales
const localeRegex = /^\s*(\w+):\s*\{$/gm;
const locales = [];
let localeMatch;
while ((localeMatch = localeRegex.exec(content)) !== null) {
  if (
    localeMatch[1] !== 'translations' &&
    localeMatch[1] !== 'TranslationKey' &&
    localeMatch[1] !== 'Language'
  ) {
    locales.push(localeMatch[1]);
  }
}

console.log('');
console.log('🌍 LANGUAGE COMPARISON');
console.log('-'.repeat(60));
console.log('Locale    | Total Keys | Missing | Extra | Status');
console.log('-'.repeat(60));

const results = [];

for (const locale of locales) {
  if (locale === 'en') continue;

  // Find the locale block
  const localePattern = new RegExp(`^\\s*${locale}:\\s*\\{[\\s\\S]*?\\n\\s{3}\\},`, 'm');
  const localeBlockMatch = content.match(localePattern);

  if (!localeBlockMatch) {
    console.log(`${locale.padEnd(10)} | Not found`);
    continue;
  }

  const localeBlock = localeBlockMatch[0];
  const localeKeys = new Set();
  let keyMatch;
  while ((keyMatch = keyRegex.exec(localeBlock)) !== null) {
    if (!keyMatch[2].startsWith('//')) {
      localeKeys.add(keyMatch[2]);
    }
  }

  // Calculate missing and extra
  let missing = 0;
  let extra = 0;

  englishKeys.forEach((key) => {
    if (!localeKeys.has(key)) missing++;
  });

  localeKeys.forEach((key) => {
    if (!englishKeys.has(key)) extra++;
  });

  const status =
    missing === 0
      ? '✅ Complete'
      : missing > 50
        ? '❌ Critical'
        : missing > 0
          ? '⚠️ Partial'
          : '✅ Complete';

  results.push({ locale, total: localeKeys.size, missing, extra, status });

  console.log(
    `${locale.padEnd(10)} | ${String(localeKeys.size).padEnd(10)} | ${String(missing).padEnd(7)} | ${String(extra).padEnd(5)} | ${status}`,
  );
}

console.log('');
console.log('📈 RISK SORTED (Most Missing Keys First)');
console.log('-'.repeat(60));

const sorted = [...results].sort((a, b) => b.missing - a.missing);

sorted.forEach((r, i) => {
  console.log(`${i + 1}. ${r.locale}: ${r.missing} missing, ${r.extra} extra`);
});

console.log('');
console.log('🎯 HIGHEST RISK LOCALE');
console.log('-'.repeat(40));
if (sorted[0].missing > 0) {
  console.log(`Language: ${sorted[0].locale}`);
  console.log(`Missing keys: ${sorted[0].missing}`);
} else {
  console.log('All locales have full key parity with English! ✅');
}
