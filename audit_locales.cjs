const fs = require('fs');
const path = require('path');

const localesDir = './locales';
const enPath = path.join(localesDir, 'en', 'translations.json');
const enContent = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const enKeys = Object.keys(enContent);

const locales = fs
  .readdirSync(localesDir)
  .filter((d) => d !== 'en' && fs.statSync(path.join(localesDir, d)).isDirectory());

const summary = {};

locales.forEach((locale) => {
  const localePath = path.join(localesDir, locale, 'translations.json');
  if (!fs.existsSync(localePath)) {
    summary[locale] = { missingCount: enKeys.length, missingKeys: enKeys };
    return;
  }

  const localeContent = JSON.parse(fs.readFileSync(localePath, 'utf8'));
  const localeKeys = Object.keys(localeContent);
  const missingKeys = enKeys.filter((k) => !localeKeys.includes(k));

  summary[locale] = {
    missingCount: missingKeys.length,
    missingKeys: missingKeys,
  };
});

console.log('Locale | Missing Keys');
console.log('---|---');
Object.entries(summary).forEach(([locale, data]) => {
  console.log(`${locale} | ${data.missingCount}`);
});

// Also print the list of missing keys for 'es' as a sample
console.log('\nMissing keys for es:', summary['es'].missingKeys);
