#!/usr/bin/env node
// Simple guard to prevent accidental printing of secrets in logs
// Searches for console.log occurrences that reference environment vars or common secret names

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const IGNORED_DIRS = ['node_modules', '.git', 'dist', '.next', 'public', 'test-results'];
const SECRET_PATTERNS = [
  /process\.env\.[A-Z0-9_]+/i,
  /Auth Token:/i,
  /\b(AUTH_TOKEN|access_token|ACCESS_TOKEN|SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY|PASSWORD|SECRET|PRIVATE_KEY)\b/i,
];

function walk(dir) {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    if (IGNORED_DIRS.includes(name)) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) files.push(...walk(full));
    else if (/\.(js|ts|mjs|cjs)$/i.test(name)) files.push(full);
  }
  return files;
}

const files = walk(ROOT);
let failures = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/console\.log\(/.test(line)) {
      // Allow masked token prints (maskToken helper) and summary logs that don't reference secrets
      if (line.includes('maskToken(')) continue;

      for (const pat of SECRET_PATTERNS) {
        if (pat.test(line)) {
          failures.push({ file, line: i + 1, text: line.trim() });
          break;
        }
      }
    }
  }
}

if (failures.length) {
  console.error('Potential secret/credential prints found:');
  for (const f of failures) {
    console.error(`${f.file}:${f.line} -> ${f.text}`);
  }
  console.error('\nPlease remove or mask secret output (use maskToken or redact before logging).');
  process.exit(1);
} else {
  console.log('No obvious sensitive prints detected by check.');
  process.exit(0);
}
