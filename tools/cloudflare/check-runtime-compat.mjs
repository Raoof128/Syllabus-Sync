#!/usr/bin/env node

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCE_ROOTS = ['app', 'components', 'config', 'features', 'lib', 'tools'];
const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);
const SELF_PATH = 'tools/cloudflare/check-runtime-compat.mjs';

const rules = [
  {
    name: 'next-node-proxy-entry',
    test: (relativePath, content) =>
      relativePath === 'proxy.ts' ||
      (relativePath.endsWith('/proxy.ts') && content.includes("from '@/lib/proxy'")),
  },
  {
    name: 'next-edge-route-runtime',
    test: (_relativePath, content) => /export\s+const\s+runtime\s*=\s*['"]edge['"]/.test(content),
  },
  {
    name: 'unsupported-dns-lookup',
    test: (_relativePath, content) =>
      /\bdns\.lookup\s*\(/.test(content) ||
      (/\blookup\s*\(/.test(content) && /node:dns(?:\/promises)?/.test(content)),
  },
  {
    name: 'cloudflare-middleware-node-crypto',
    test: (relativePath, content) =>
      [
        'middleware.ts',
        'lib/middleware.ts',
        'lib/security/csp.ts',
        'lib/security/csrf.ts',
      ].includes(relativePath) &&
      /from\s+['"](?:node:)?crypto['"]|require\(['"](?:node:)?crypto['"]\)/.test(content),
  },
];

async function walk(relativeDirectory) {
  const absoluteDirectory = path.join(ROOT, relativeDirectory);
  let entries;
  try {
    entries = await readdir(absoluteDirectory, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.open-next') {
      continue;
    }

    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(relativePath)));
    } else if (TEXT_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(relativePath);
    }
  }
  return files;
}

const candidates = [
  'proxy.ts',
  'middleware.ts',
  ...(await Promise.all(SOURCE_ROOTS.map(walk))).flat(),
].filter((value, index, values) => values.indexOf(value) === index);

const violations = [];
for (const relativePath of candidates) {
  if (relativePath === SELF_PATH) continue;

  let content;
  try {
    content = await readFile(path.join(ROOT, relativePath), 'utf8');
  } catch {
    continue;
  }

  for (const rule of rules) {
    if (rule.test(relativePath, content)) {
      violations.push({ path: relativePath, rule: rule.name });
    }
  }
}

const result = { ok: violations.length === 0, violations };

if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify(result)}\n`);
} else if (result.ok) {
  console.log('Cloudflare runtime compatibility audit passed.');
} else {
  console.error('Cloudflare runtime compatibility audit failed:');
  for (const violation of violations) {
    console.error(`- ${violation.path}: ${violation.rule}`);
  }
}

process.exitCode = result.ok ? 0 : 1;
