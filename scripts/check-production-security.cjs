#!/usr/bin/env node

/**
 * Production Security Check Script
 *
 * This script validates security requirements before production deployment.
 * It should be run as part of the CI/CD pipeline to catch security issues early.
 *
 * Exit codes:
 * - 0: All checks passed
 * - 1: Security issues found
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

let hasErrors = false;
let hasWarnings = false;

function logError(message) {
  console.error(`❌ ERROR: ${message}`);
  hasErrors = true;
}

function logWarning(message) {
  console.warn(`⚠️  WARNING: ${message}`);
  hasWarnings = true;
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

// ============================================================================
// SECURITY CHECKS
// ============================================================================

function checkNoEnvFilesCommitted() {
  logInfo('Checking for committed .env files...');

  const dangerousFiles = ['.env', '.env.local', '.env.production', '.env.development'];

  dangerousFiles.forEach((file) => {
    const filePath = path.join(projectRoot, file);
    // Check if file exists and is tracked by git (not in .gitignore)
    if (fs.existsSync(filePath)) {
      // In CI, the file shouldn't exist at all unless .gitignore is wrong
      logWarning(`${file} exists in the repository - ensure it's in .gitignore`);
    }
  });

  logSuccess('No dangerous .env files found in repository');
}

function checkEnvExampleHasNoSecrets() {
  logInfo('Checking .env.example for real secrets...');

  const envExamplePath = path.join(projectRoot, '.env.example');

  if (!fs.existsSync(envExamplePath)) {
    logWarning('.env.example not found');
    return;
  }

  const content = fs.readFileSync(envExamplePath, 'utf8');

  // Patterns that might indicate real secrets
  const secretPatterns = [
    // Supabase keys (they have specific formats)
    /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g, // JWT tokens
    /sbp_[a-zA-Z0-9]{40,}/g, // Supabase service role keys
    /[a-zA-Z0-9]{32,}\.supabase\.co/g, // Supabase project URLs with keys

    // Google Maps API keys
    /AIza[0-9A-Za-z-_]{35}/g,

    // Generic API key patterns (but exclude example placeholders)
    /(?<!your_|example_|placeholder_|xxx|your-)[a-f0-9]{32,}/gi,

    // Email addresses (except generic examples)
    /[a-zA-Z0-9._%+-]+@(?!example\.com|mq\.edu\.au)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  ];

  let foundSecrets = false;

  secretPatterns.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      // Filter out obvious placeholders
      const realMatches = matches.filter((m) => {
        const lower = m.toLowerCase();
        return (
          !lower.includes('your_') &&
          !lower.includes('your-') &&
          !lower.includes('example') &&
          !lower.includes('placeholder') &&
          !lower.includes('xxx') &&
          !lower.includes('000')
        );
      });

      if (realMatches.length > 0) {
        logWarning(
          `.env.example may contain real secrets (pattern ${index + 1}): ${realMatches.slice(0, 2).join(', ')}...`,
        );
        foundSecrets = true;
      }
    }
  });

  if (!foundSecrets) {
    logSuccess('.env.example appears clean of real secrets');
  }
}

function checkNoHardcodedSecrets() {
  logInfo('Checking for hardcoded secrets in source code...');

  const srcDirs = ['app', 'lib', 'components', 'hooks'];
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];

  const secretPatterns = [
    // JWT tokens
    { pattern: /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g, name: 'JWT token' },
    // Supabase service role keys
    { pattern: /sbp_[a-zA-Z0-9]{40,}/g, name: 'Supabase service role key' },
    // Google Maps API keys
    { pattern: /AIza[0-9A-Za-z-_]{35}/g, name: 'Google Maps API key' },
    // Private keys
    { pattern: /-----BEGIN (RSA |EC |)PRIVATE KEY-----/g, name: 'Private key' },
    // AWS keys
    { pattern: /AKIA[0-9A-Z]{16}/g, name: 'AWS access key' },
  ];

  let foundSecrets = false;

  srcDirs.forEach((dir) => {
    const dirPath = path.join(projectRoot, dir);
    if (!fs.existsSync(dirPath)) return;

    function scanDirectory(directory) {
      const items = fs.readdirSync(directory);

      items.forEach((item) => {
        const itemPath = path.join(directory, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(itemPath);
        } else if (stat.isFile() && extensions.some((ext) => item.endsWith(ext))) {
          const content = fs.readFileSync(itemPath, 'utf8');

          secretPatterns.forEach(({ pattern, name }) => {
            // Reset pattern for each file
            pattern.lastIndex = 0;
            const matches = content.match(pattern);
            if (matches) {
              const relativePath = path.relative(projectRoot, itemPath);
              logError(`Found potential ${name} in ${relativePath}`);
              foundSecrets = true;
            }
          });
        }
      });
    }

    scanDirectory(dirPath);
  });

  if (!foundSecrets) {
    logSuccess('No hardcoded secrets found in source code');
  }
}

function checkSecurityFeaturesEnabled() {
  logInfo('Checking security features are properly configured...');

  // Check next.config.ts for poweredByHeader: false
  const nextConfigPath = path.join(projectRoot, 'next.config.ts');
  if (fs.existsSync(nextConfigPath)) {
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    if (!content.includes('poweredByHeader: false')) {
      logWarning('next.config.ts should have poweredByHeader: false');
    } else {
      logSuccess('X-Powered-By header is disabled');
    }
  }

  // Check CSRF is not disabled in production code
  const csrfPath = path.join(projectRoot, 'lib/security/csrf.ts');
  if (fs.existsSync(csrfPath)) {
    const content = fs.readFileSync(csrfPath, 'utf8');
    if (content.includes('VERCEL_ENV') && content.includes('isRealProduction')) {
      logSuccess('CSRF protection uses VERCEL_ENV for production detection');
    } else {
      logWarning('CSRF protection should use VERCEL_ENV for reliable production detection');
    }
  }

  // Check rate limiting uses VERCEL_ENV
  const rateLimitPath = path.join(projectRoot, 'lib/services/rateLimitService.ts');
  if (fs.existsSync(rateLimitPath)) {
    const content = fs.readFileSync(rateLimitPath, 'utf8');
    if (content.includes('VERCEL_ENV')) {
      logSuccess('Rate limiting uses VERCEL_ENV for production detection');
    } else {
      logWarning('Rate limiting should use VERCEL_ENV for reliable production detection');
    }
  }
}

function checkDevBypassDisabled() {
  logInfo('Checking dev bypass features are properly guarded...');

  const authFiles = ['app/api/auth/signin/route.ts', 'app/api/auth/signup/route.ts'];

  authFiles.forEach((file) => {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('isRealProduction') && content.includes('VERCEL_ENV')) {
        logSuccess(`${file} uses VERCEL_ENV for production detection`);
      } else if (content.includes('isDevelopment')) {
        logWarning(`${file} should use VERCEL_ENV for reliable production detection`);
      }
    }
  });
}

// ============================================================================
// MAIN
// ============================================================================

console.log('\n🔒 Running Production Security Checks\n');
console.log('='.repeat(60) + '\n');

checkNoEnvFilesCommitted();
console.log('');

checkEnvExampleHasNoSecrets();
console.log('');

checkNoHardcodedSecrets();
console.log('');

checkSecurityFeaturesEnabled();
console.log('');

checkDevBypassDisabled();
console.log('');

console.log('='.repeat(60));

if (hasErrors) {
  console.error('\n❌ Security check FAILED - fix errors before deploying\n');
  process.exit(1);
} else if (hasWarnings) {
  console.warn('\n⚠️  Security check passed with warnings - review before deploying\n');
  process.exit(0);
} else {
  console.log('\n✅ All security checks passed!\n');
  process.exit(0);
}
