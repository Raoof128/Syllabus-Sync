#!/usr/bin/env node

/**
 * Validate Privacy Policy + Terms of Service translations for ALL supported languages.
 *
 * Checks:
 *  1. Locale file exists and is valid JSON
 *  2. Every translation key used by the Privacy page exists in the locale
 *  3. Every translation key used by the Terms page exists in the locale
 *  4. Translation value is actually translated (not identical to English)
 *
 * Usage:  node tools/validate-legal-translations.cjs
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'locales');
const EN_PATH = path.join(LOCALES_DIR, 'en', 'translations.json');

// --- Keys used by the Privacy Policy page (app/privacy/page.tsx) ---
const PRIVACY_KEYS = [
  // Header / nav
  'privacy_back_to', 'privacy_title', 'privacy_last_updated',
  // Section titles (used via SECTION_KEYS array in the page)
  'privacy_s1_title','privacy_s2_title','privacy_s3_title','privacy_s4_title',
  'privacy_s5_title','privacy_s6_title','privacy_s7_title','privacy_s8_title',
  'privacy_s9_title','privacy_s10_title','privacy_s11_title','privacy_s12_title',
  'privacy_s13_title','privacy_s14_title',
  // Section 1
  'privacy_s1_p1','privacy_s1_p2',
  // Section 2
  'privacy_s2_a_title','privacy_s2_a_li1','privacy_s2_a_li2','privacy_s2_a_li3',
  'privacy_s2_a_li4','privacy_s2_a_li5','privacy_s2_a_li6',
  'privacy_s2_b_title','privacy_s2_b_li1','privacy_s2_b_li2',
  'privacy_s2_c_title','privacy_s2_c_li1','privacy_s2_c_li2','privacy_s2_c_li3','privacy_s2_c_li4',
  'privacy_s2_d_title','privacy_s2_d_li1','privacy_s2_d_li2',
  'privacy_s2_e_title','privacy_s2_e_li1','privacy_s2_e_li2','privacy_s2_e_li3',
  'privacy_s2_f_title','privacy_s2_f_li1','privacy_s2_f_li2','privacy_s2_f_li3',
  'privacy_s2_footer',
  // Section 3
  'privacy_s3_p1','privacy_s3_li1','privacy_s3_li2','privacy_s3_footer',
  // Section 4
  'privacy_s4_p1','privacy_s4_li1','privacy_s4_li2','privacy_s4_li3','privacy_s4_li4',
  'privacy_s4_li5','privacy_s4_li6','privacy_s4_footer',
  // Section 5
  'privacy_s5_p1','privacy_s5_li1','privacy_s5_li2','privacy_s5_li3','privacy_s5_footer',
  // Section 6
  'privacy_s6_p1','privacy_s6_table_h1','privacy_s6_table_h2','privacy_s6_table_h3',
  'privacy_s6_table_r1_c1','privacy_s6_table_r1_c2','privacy_s6_table_r1_c3',
  'privacy_s6_table_r2_c1','privacy_s6_table_r2_c2','privacy_s6_table_r2_c3',
  'privacy_s6_table_r3_c1','privacy_s6_table_r3_c2','privacy_s6_table_r3_c3',
  'privacy_s6_table_r4_c1','privacy_s6_table_r4_c2','privacy_s6_table_r4_c3',
  // Section 7
  'privacy_s7_p1','privacy_s7_li1','privacy_s7_li2','privacy_s7_li3','privacy_s7_li4',
  'privacy_s7_li5','privacy_s7_li6','privacy_s7_li7','privacy_s7_li8','privacy_s7_li9',
  'privacy_s7_footer',
  // Section 8
  'privacy_s8_p1','privacy_s8_li1','privacy_s8_li2','privacy_s8_li3','privacy_s8_li4',
  'privacy_s8_footer',
  // Section 9
  'privacy_s9_p1','privacy_s9_li1','privacy_s9_li2','privacy_s9_li3','privacy_s9_footer',
  // Section 10
  'privacy_s10_p1','privacy_s10_p2_part1','privacy_s10_p2_part2',
  'privacy_s10_p2_part3','privacy_s10_p2_part4',
  // Section 11
  'privacy_s11_p1_part1','privacy_s11_p1_part2',
  'privacy_s11_p2_part1','privacy_s11_p2_link',
  // Section 12
  'privacy_s12_p1_part1','privacy_s12_p1_link',
  // Section 13
  'privacy_s13_p1',
  // Section 14
  'privacy_s14_p1',
];

// --- Keys used by the Terms of Service page (app/terms/page.tsx) ---
const TERMS_KEYS = [
  'terms_back_to','terms_legal_doc','terms_title','terms_last_updated','terms_sections',
  'terms_s1_title','terms_s1_p1',
  'terms_s2_title','terms_s2_p1',
  'terms_s3_title','terms_s3_p1',
  'terms_s4_title','terms_s4_p1','terms_s4_li1','terms_s4_li2','terms_s4_li3','terms_s4_li4','terms_s4_li5',
  'terms_s5_title','terms_s5_p1',
  'terms_s6_title','terms_s6_p1',
  'terms_s7_title','terms_s7_p1',
  'terms_s8_title','terms_s8_p1',
  'terms_s9_title','terms_s9_p1',
  'terms_s10_title','terms_s10_p1',
];

// Keys that are acceptable to keep in English (proper nouns, loanwords, country codes, etc.)
const ENGLISH_OK = new Set([
  'privacy_s6_table_r1_c1', // "Supabase"
  'privacy_s6_table_r2_c1', // "Vercel"
  'privacy_s6_table_r3_c1', // "Sentry"
  'privacy_s6_table_r3_c3', // "US"
  'privacy_s6_table_r4_c1', // "OpenRouteService"
  'privacy_s6_table_h1',   // "Service" — same word in French, Spanish, etc.
  'privacy_s11_p2_link',   // "Office of the Australian Information Commissioner (OAIC)" — proper noun
  'privacy_s12_p1_link',   // "Notifiable Data Breaches (NDB) scheme" — proper noun / legal term
  'terms_sections',         // "Sections" — same word in many Romance languages (fr, es, it, pt)
  'terms_s6_title',         // "Privacy" — borrowed into Italian, German, etc.
]);

// ────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf-8'));

// Verify all expected keys actually exist in EN
const missingFromEn = [];
[...PRIVACY_KEYS, ...TERMS_KEYS].forEach(k => {
  if (!(k in en)) missingFromEn.push(k);
});

if (missingFromEn.length) {
  console.error('\n❌ Keys referenced by pages but MISSING from English locale:');
  missingFromEn.forEach(k => console.error('   ' + k));
  console.error('');
}

// Gather locales
const locales = fs.readdirSync(LOCALES_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort();

const results = [];

for (const locale of locales) {
  const filePath = path.join(LOCALES_DIR, locale, 'translations.json');
  const row = {
    locale,
    fileExists: false,
    validJson: false,
    privacyMissing: [],
    privacyUntranslated: [],
    termsMissing: [],
    termsUntranslated: [],
  };

  if (!fs.existsSync(filePath)) {
    results.push(row);
    continue;
  }
  row.fileExists = true;

  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    row.validJson = true;
  } catch {
    results.push(row);
    continue;
  }

  if (locale === 'en') {
    // English is the source — no "untranslated" check
    results.push(row);
    continue;
  }

  // Check privacy keys
  for (const key of PRIVACY_KEYS) {
    if (!(key in data) || data[key] === '') {
      row.privacyMissing.push(key);
    } else if (!ENGLISH_OK.has(key) && data[key] === en[key]) {
      row.privacyUntranslated.push(key);
    }
  }

  // Check terms keys
  for (const key of TERMS_KEYS) {
    if (!(key in data) || data[key] === '') {
      row.termsMissing.push(key);
    } else if (!ENGLISH_OK.has(key) && data[key] === en[key]) {
      row.termsUntranslated.push(key);
    }
  }

  results.push(row);
}

// ────────────────────────────────────────────────────
// Report
// ────────────────────────────────────────────────────

const PAD = 6;

console.log('\n╔══════════════════════════════════════════════════════════════════╗');
console.log('║  Privacy Policy & Terms of Service — Translation Audit Report  ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

console.log('Locale │ File │ JSON │ Privacy                       │ Terms');
console.log('───────┼──────┼──────┼───────────────────────────────┼─────────────────────────────');

let totalPrivacyIssues = 0;
let totalTermsIssues = 0;
const localesNeedingPrivacyFix = [];
const localesNeedingTermsFix = [];

for (const r of results) {
  const file = r.fileExists ? '  ✅ ' : '  ❌ ';
  const json = r.validJson ? '  ✅ ' : '  ❌ ';

  let privStatus;
  const privIssues = r.privacyMissing.length + r.privacyUntranslated.length;
  if (!r.fileExists || !r.validJson) {
    privStatus = '❌ FILE ERROR';
  } else if (r.locale === 'en') {
    privStatus = '✅ Source';
  } else if (privIssues === 0) {
    privStatus = '✅ OK';
  } else {
    const parts = [];
    if (r.privacyMissing.length) parts.push(r.privacyMissing.length + ' missing');
    if (r.privacyUntranslated.length) parts.push(r.privacyUntranslated.length + ' untranslated');
    privStatus = '⚠️  ' + parts.join(', ');
    totalPrivacyIssues += privIssues;
    localesNeedingPrivacyFix.push(r.locale);
  }

  let termsStatus;
  const termsIssues = r.termsMissing.length + r.termsUntranslated.length;
  if (!r.fileExists || !r.validJson) {
    termsStatus = '❌ FILE ERROR';
  } else if (r.locale === 'en') {
    termsStatus = '✅ Source';
  } else if (termsIssues === 0) {
    termsStatus = '✅ OK';
  } else {
    const parts = [];
    if (r.termsMissing.length) parts.push(r.termsMissing.length + ' missing');
    if (r.termsUntranslated.length) parts.push(r.termsUntranslated.length + ' untranslated');
    termsStatus = '⚠️  ' + parts.join(', ');
    totalTermsIssues += termsIssues;
    localesNeedingTermsFix.push(r.locale);
  }

  console.log(
    r.locale.padEnd(PAD) + ' │' + file + '│' + json + '│ ' +
    privStatus.padEnd(30) + '│ ' + termsStatus
  );
}

console.log('');

// Detailed breakdown for locales with issues
const issueLocales = results.filter(r =>
  r.privacyMissing.length || r.privacyUntranslated.length ||
  r.termsMissing.length || r.termsUntranslated.length
);

if (issueLocales.length) {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  Detailed Issue Breakdown                           ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  for (const r of issueLocales) {
    console.log(`── ${r.locale} ──`);
    if (r.privacyMissing.length) {
      console.log(`   Privacy MISSING keys (${r.privacyMissing.length}):`);
      r.privacyMissing.forEach(k => console.log('     • ' + k));
    }
    if (r.privacyUntranslated.length) {
      console.log(`   Privacy UNTRANSLATED keys (${r.privacyUntranslated.length}):`);
      r.privacyUntranslated.forEach(k => console.log('     • ' + k));
    }
    if (r.termsMissing.length) {
      console.log(`   Terms MISSING keys (${r.termsMissing.length}):`);
      r.termsMissing.forEach(k => console.log('     • ' + k));
    }
    if (r.termsUntranslated.length) {
      console.log(`   Terms UNTRANSLATED keys (${r.termsUntranslated.length}):`);
      r.termsUntranslated.forEach(k => console.log('     • ' + k));
    }
    console.log('');
  }
}

// Summary
console.log('═══════════════════════════════');
console.log('SUMMARY');
console.log('═══════════════════════════════');
console.log(`Total locales checked: ${results.length}`);
console.log(`Privacy issues: ${totalPrivacyIssues} across ${localesNeedingPrivacyFix.length} locale(s)`);
console.log(`Terms issues:   ${totalTermsIssues} across ${localesNeedingTermsFix.length} locale(s)`);
if (localesNeedingPrivacyFix.length) {
  console.log(`Privacy locales needing fix: ${localesNeedingPrivacyFix.join(', ')}`);
}
if (localesNeedingTermsFix.length) {
  console.log(`Terms locales needing fix:   ${localesNeedingTermsFix.join(', ')}`);
}

const allGood = totalPrivacyIssues === 0 && totalTermsIssues === 0 && missingFromEn.length === 0;
console.log('');
if (allGood) {
  console.log('🎉 All languages pass for both Privacy Policy and Terms of Service!');
} else {
  console.log('⚠️  Issues found — see details above.');
}

process.exit(allGood ? 0 : 1);

