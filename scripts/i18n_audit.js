const fs = require('fs');
const path = require('path');
const en = require('./locales/en/translations.json');
const locales = fs.readdirSync('./locales');
const suspiciousRx = /TODO|TRANSLATE|TRANSLATE_ME|TBD/i;
console.log('Locale\tTotal\tMissing\tExtra\tEmpty\tSuspicious');
locales.forEach((l) => {
  const file = path.join('./locales', l, 'translations.json');
  if (!fs.existsSync(file)) return;
  const obj = require(file);
  const keys = Object.keys(obj);
  const missing = Object.keys(en).filter((k) => !Object.prototype.hasOwnProperty.call(obj, k));
  const extra = keys.filter((k) => !Object.prototype.hasOwnProperty.call(en, k));
  const empty = keys.filter((k) => obj[k] === '');
  const suspicious = keys.filter((k) => suspiciousRx.test(obj[k]));
  console.log(`${l}\t${keys.length}\t${missing.length}\t${extra.length}\t${empty.length}\t${suspicious.length}`);
});
