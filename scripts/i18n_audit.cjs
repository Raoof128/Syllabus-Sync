const fs = require('fs');
const path = require('path');
const base = path.join(__dirname, '..', 'locales');
const en = JSON.parse(fs.readFileSync(path.join(base, 'en', 'translations.json'), 'utf8'));
const locales = fs.readdirSync(base);
const suspiciousRx = /TODO|TRANSLATE|TRANSLATE_ME|TBD/i;
console.log('Locale\tTotal\tMissing\tExtra\tEmpty\tSuspicious');
locales.forEach((l) => {
  const file = path.join(base, l, 'translations.json');
  if (!fs.existsSync(file)) return;
  const obj = JSON.parse(fs.readFileSync(file, 'utf8'));
  const keys = Object.keys(obj);
  const missing = Object.keys(en).filter((k) => !Object.prototype.hasOwnProperty.call(obj, k));
  const extra = keys.filter((k) => !Object.prototype.hasOwnProperty.call(en, k));
  const empty = keys.filter((k) => obj[k] === '');
  const suspicious = keys.filter((k) => suspiciousRx.test(obj[k]));
  console.log(`${l}\t${keys.length}\t${missing.length}\t${extra.length}\t${empty.length}\t${suspicious.length}`);
});
