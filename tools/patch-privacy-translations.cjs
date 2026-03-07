#!/usr/bin/env node
/**
 * Patch Privacy Policy translations for the 16 remaining locales.
 *
 * Reads per-locale JSON patch files from tools/privacy-patches/<locale>.json
 * and merges them into the corresponding locales/<locale>/translations.json.
 *
 * Usage: node tools/patch-privacy-translations.cjs
 */
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'locales');
const PATCHES_DIR = path.join(__dirname, 'privacy-patches');
const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en', 'translations.json'), 'utf-8'));

if (!fs.existsSync(PATCHES_DIR)) {
  console.error('No patches directory found at ' + PATCHES_DIR);
  process.exit(1);
}

const patchFiles = fs.readdirSync(PATCHES_DIR).filter(f => f.endsWith('.json')).sort();
let totalPatched = 0;

for (const file of patchFiles) {
  const locale = path.basename(file, '.json');
  const localePath = path.join(LOCALES_DIR, locale, 'translations.json');

  if (!fs.existsSync(localePath)) {
    console.warn(`  SKIP ${locale}: locale file not found`);
    continue;
  }

  const patches = JSON.parse(fs.readFileSync(path.join(PATCHES_DIR, file), 'utf-8'));
  const data = JSON.parse(fs.readFileSync(localePath, 'utf-8'));

  let n = 0;
  for (const [k, v] of Object.entries(patches)) {
    if (!data[k] || data[k] === '' || data[k] === en[k]) {
      data[k] = v;
      n++;
    }
  }

  if (n > 0) {
    fs.writeFileSync(localePath, JSON.stringify(data, null, 2) + '\n');
    console.log(`  ✅ ${locale}: patched ${n} keys`);
    totalPatched += n;
  } else {
    console.log(`  ⏭  ${locale}: already up to date`);
  }
}

console.log(`\nDone. Patched ${totalPatched} keys total across ${patchFiles.length} locales.`);
console.log('Run: node tools/validate-legal-translations.cjs');

