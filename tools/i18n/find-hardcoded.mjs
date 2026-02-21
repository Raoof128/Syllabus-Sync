import fs from 'node:fs/promises';
import path from 'node:path';

const dirs = ['app', 'features', 'components'];

async function walk(dir) {
  let files = await fs.readdir(dir, { withFileTypes: true });
  files = await Promise.all(files.map(async (file) => {
    const res = path.join(dir, file.name);
    if (file.isDirectory()) {
      if (file.name === 'node_modules' || file.name === '.next') return [];
      return walk(res);
    }
    return res.endsWith('.tsx') ? res : [];
  }));
  return files.flat();
}

async function main() {
  const files = (await Promise.all(dirs.map(walk))).flat();
  const hardcoded = [];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    
    // Simple regex for JSX text content: >Some Text<
    const jsxTextRegex = />([^<>{}\n]+)</g;
    let match;
    while ((match = jsxTextRegex.exec(content)) !== null) {
      const text = match[1].trim();
      // Filter out things that are likely code or too short
      if (text.length > 2 && /[A-Z]/.test(text[0]) && !text.includes('className') && !text.includes('style=')) {
        hardcoded.push({ file, text, type: 'JSX' });
      }
    }

    // Attributes
    const attrs = ['aria-label', 'placeholder', 'title'];
    for (const attr of attrs) {
      const attrRegex = new RegExp(`${attr}="([^"{}]+)"`, 'g');
      while ((match = attrRegex.exec(content)) !== null) {
        const text = match[1].trim();
        if (text.length > 1 && !text.startsWith('/') && !text.includes('t(')) {
          hardcoded.push({ file, text, type: attr });
        }
      }
    }
  }

  // Dedup by text
  const uniqueMap = new Map();
  for (const h of hardcoded) {
    if (!uniqueMap.has(h.text)) {
      uniqueMap.set(h.text, h);
    }
  }
  
  const unique = Array.from(uniqueMap.values());
  console.log(JSON.stringify(unique, null, 2));
}

main().catch(console.error);
