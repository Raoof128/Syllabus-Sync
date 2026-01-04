const fs = require('fs');
const content = fs.readFileSync('lib/i18n/translations.ts', 'utf8');

// Extract keys for each language using simple regex
const languages = ['en', 'es', 'fa', 'zh', 'ar', 'hi', 'ko', 'ja', 'ur', 'th', 'vi', 'ru'];
const keysByLang = {};

languages.forEach(lang => {
    // Find the language block
    const startPattern = new RegExp(`\\b${lang}:\\s*\\{`);
    const startMatch = content.match(startPattern);

    if (startMatch) {
        const startIdx = content.indexOf(startMatch[0]);
        let braceCount = 0;
        let inBlock = false;
        let endIdx = startIdx;

        for (let i = startIdx; i < content.length; i++) {
            if (content[i] === '{') {
                braceCount++;
                inBlock = true;
            } else if (content[i] === '}') {
                braceCount--;
                if (inBlock && braceCount === 0) {
                    endIdx = i;
                    break;
                }
            }
        }

        const langBlock = content.substring(startIdx, endIdx + 1);
        // Extract keys (lines that start with spaces and have a colon)
        const keys = langBlock.match(/^\s{4}(\w+):/gm);
        keysByLang[lang] = keys ? keys.map(k => k.trim().replace(':', '')) : [];
    }
});

const enKeys = new Set(keysByLang['en'] || []);
console.log('='.repeat(60));
console.log('TRANSLATION KEY AUDIT');
console.log('='.repeat(60));
console.log(`English (reference): ${enKeys.size} keys\n`);

let totalMissing = 0;

languages.slice(1).forEach(lang => {
    const langKeys = new Set(keysByLang[lang] || []);
    const missing = [...enKeys].filter(k => !langKeys.has(k));

    console.log('-'.repeat(60));
    console.log(`${lang.toUpperCase()} - ${langKeys.size} keys (missing: ${missing.length})`);

    if (missing.length > 0) {
        totalMissing += missing.length;
        console.log(`Missing keys: ${missing.join(', ')}`);
    } else {
        console.log('✓ All keys present!');
    }
});

console.log('\n' + '='.repeat(60));
console.log(`TOTAL MISSING: ${totalMissing} keys across all languages`);
console.log('='.repeat(60));
