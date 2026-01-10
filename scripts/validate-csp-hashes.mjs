#!/usr/bin/env node

/**
 * CSP Hash Validation Script
 *
 * SECURITY: Validates that the CSP hashes in lib/security/csp.ts match
 * the actual content of the inline scripts.
 *
 * This should be run in CI to ensure CSP hashes stay in sync with script content.
 *
 * Usage: node scripts/validate-csp-hashes.mjs
 */

import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const CSP_FILE = resolve(__dirname, '../lib/security/csp.ts');

// ============================================================================
// EXTRACTION HELPERS
// ============================================================================

/**
 * Extract script content from CSP file using regex
 */
function extractScriptContent(content, varName) {
  // Match: export const THEME_SCRIPT = `...`;
  // or: export const RTL_SCRIPT = `...`;
  const regex = new RegExp(
    `export\\s+const\\s+${varName}\\s*=\\s*\`([^\\\\](?:\\\\.|[^\`])*)\`;`,
    's',
  );

  const match = content.match(regex);
  if (!match) {
    // Try single quotes
    const singleQuoteRegex = new RegExp(
      `export\\s+const\\s+${varName}\\s*=\\s*'([^'\\\\]*(?:\\\\.[^'\\\\]*)*)';`,
      's',
    );
    const singleMatch = content.match(singleQuoteRegex);
    if (!singleMatch) {
      throw new Error(`Could not extract ${varName} from CSP file`);
    }
    return singleMatch[1].replace(/\\'/g, "'");
  }

  return match[1].replace(/\\`/g, '`');
}

/**
 * Extract declared hash from CSP file
 */
function extractDeclaredHash(content, hashName) {
  // Match: theme: 'sha256-...',
  const regex = new RegExp(`${hashName}:\\s*'(sha256-[^']+)'`);
  const match = content.match(regex);
  if (!match) {
    throw new Error(`Could not extract ${hashName} hash from CSP file`);
  }
  return match[1];
}

/**
 * Compute SHA-256 hash of script content
 */
function computeHash(scriptContent) {
  const hash = createHash('sha256').update(scriptContent, 'utf8').digest('base64');
  return `sha256-${hash}`;
}

// ============================================================================
// MAIN VALIDATION
// ============================================================================

function main() {
  console.log('CSP Hash Validation');
  console.log('===================\n');

  let hasErrors = false;

  try {
    // Read CSP file
    const content = readFileSync(CSP_FILE, 'utf8');

    // Define scripts to validate
    const scripts = [
      { name: 'THEME_SCRIPT', hashKey: 'theme' },
      { name: 'RTL_SCRIPT', hashKey: 'rtl' },
    ];

    for (const { name, hashKey } of scripts) {
      console.log(`Validating ${name}...`);

      try {
        // Extract script content
        const scriptContent = extractScriptContent(content, name);

        // Extract declared hash
        const declaredHash = extractDeclaredHash(content, hashKey);

        // Compute actual hash
        const computedHash = computeHash(scriptContent);

        // Compare
        if (declaredHash === computedHash) {
          console.log(`  ✅ Hash matches: ${computedHash}`);
        } else {
          console.log(`  ❌ Hash MISMATCH!`);
          console.log(`     Declared: ${declaredHash}`);
          console.log(`     Computed: ${computedHash}`);
          console.log(`     `);
          console.log(`     To fix, update CSP_SCRIPT_HASHES.${hashKey} to:`);
          console.log(`     '${computedHash}'`);
          hasErrors = true;
        }
      } catch (e) {
        console.log(`  ❌ Error: ${e.message}`);
        hasErrors = true;
      }

      console.log('');
    }

    // Summary
    console.log('-------------------');
    if (hasErrors) {
      console.log('❌ VALIDATION FAILED');
      console.log('');
      console.log('CSP hashes are out of sync with script content.');
      console.log('This is a SECURITY issue - scripts will be blocked by CSP.');
      console.log('');
      console.log('Update the hashes in lib/security/csp.ts to match the computed values above.');
      process.exit(1);
    } else {
      console.log('✅ All CSP hashes validated successfully!');
      process.exit(0);
    }
  } catch (e) {
    console.error(`Fatal error: ${e.message}`);
    process.exit(1);
  }
}

// ============================================================================
// HELPER: Generate hashes for new scripts
// ============================================================================

if (process.argv.includes('--generate')) {
  // Mode: Generate hash for stdin
  console.log('Generating CSP hash from stdin...');
  console.log('(Paste script content, then press Ctrl+D)');

  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    input += chunk;
  });
  process.stdin.on('end', () => {
    const hash = computeHash(input.trim());
    console.log('');
    console.log('Generated hash:');
    console.log(hash);
  });
} else {
  main();
}
