#!/usr/bin/env node

import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.yml',
  '.yaml',
  '.md',
  '.sql',
  '.txt',
  '.toml',
  '.sh',
  '.css',
  '.html',
  '.webmanifest',
]);

const EXCLUDED_PREFIXES = ['.next/', 'node_modules/', 'test-results/', 'coverage/'];
const EXCLUDED_FILES = new Set(['package-lock.json']);

const SECRET_PATTERNS = [
  { name: 'openai_key', regex: /\bsk-[A-Za-z0-9]{20,}\b/g },
  { name: 'github_token', regex: /\bghp_[A-Za-z0-9]{36}\b/g },
  { name: 'slack_token', regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { name: 'aws_access_key', regex: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g },
  {
    name: 'hardcoded_secret_env',
    regex:
      /\b(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_DB_PASSWORD|RESEND_API_KEY|OPENWEATHER_API_KEY|OPENAI_API_KEY|UPSTASH_REDIS_REST_TOKEN)\s*[:=]\s*['\"][^'\"\n]{16,}['\"]/g,
  },
  { name: 'private_key_block', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
];

const ALLOWLIST_MARKERS = ['example', 'placeholder', 'dummy', 'test', 'sample', 'your-'];

function shouldScan(filePath) {
  if (EXCLUDED_FILES.has(filePath)) return false;
  if (EXCLUDED_PREFIXES.some((prefix) => filePath.startsWith(prefix))) return false;
  if (filePath.startsWith('.env')) return false;

  const ext = path.extname(filePath);
  if (TEXT_EXTENSIONS.has(ext)) return true;

  return filePath === '.env.example' || filePath.endsWith('.env.example');
}

function lineHasAllowlistMarker(line) {
  const lower = line.toLowerCase();
  return ALLOWLIST_MARKERS.some((marker) => lower.includes(marker));
}

function findSecrets(content, filePath) {
  const findings = [];
  const lines = content.split('\n');

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (lineHasAllowlistMarker(line)) {
      continue;
    }

    for (const pattern of SECRET_PATTERNS) {
      pattern.regex.lastIndex = 0;
      if (pattern.regex.test(line)) {
        findings.push({
          filePath,
          line: index + 1,
          pattern: pattern.name,
          snippet: line.trim().slice(0, 140),
        });
      }
    }
  }

  return findings;
}

async function main() {
  const tracked = execSync('git ls-files -z', { encoding: 'utf8' })
    .split('\u0000')
    .filter(Boolean)
    .filter(shouldScan);

  const findings = [];

  for (const filePath of tracked) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      if (content.includes('\u0000')) {
        continue;
      }
      findings.push(...findSecrets(content, filePath));
    } catch {
      // Ignore unreadable files; they are not part of the security gate.
    }
  }

  if (findings.length > 0) {
    console.error('Potential secrets detected:');
    for (const finding of findings) {
      console.error(
        `${finding.filePath}:${finding.line} [${finding.pattern}] ${finding.snippet}`,
      );
    }
    process.exit(1);
  }

  console.log(`Secrets check passed (${tracked.length} files scanned).`);
}

main().catch((error) => {
  console.error('Secrets check failed unexpectedly:', error);
  process.exit(1);
});
