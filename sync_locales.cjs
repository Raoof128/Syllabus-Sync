const fs = require('fs');
const path = require('path');

const localesDir = './locales';
const enPath = path.join(localesDir, 'en', 'translations.json');
const enContent = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const enKeys = Object.keys(enContent);

const locales = fs
  .readdirSync(localesDir)
  .filter((d) => d !== 'en' && fs.statSync(path.join(localesDir, d)).isDirectory());

locales.forEach((locale) => {
  const localePath = path.join(localesDir, locale, 'translations.json');
  let localeContent = {};

  if (fs.existsSync(localePath)) {
    localeContent = JSON.parse(fs.readFileSync(localePath, 'utf8'));
  }

  let addedCount = 0;
  const newContent = { ...localeContent };

  // Preserve order of keys as per English file if possible, or just append
  // Actually, re-creating the object with English key order is nicer for diffs
  const orderedContent = {};

  enKeys.forEach((key) => {
    if (newContent[key]) {
      orderedContent[key] = newContent[key];
    } else {
      orderedContent[key] = enContent[key]; // Copy English value
      addedCount++;
    }
  });

  fs.writeFileSync(localePath, JSON.stringify(orderedContent, null, 2) + '\n');
  console.log(`Updated ${locale}: Added ${addedCount} keys.`);
});
