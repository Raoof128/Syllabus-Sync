/**
 * Enhanced Subresource Integrity (SRI) Utilities
 *
 * SECURITY: SRI ensures that resources loaded from external sources (CDNs)
 * haven't been tampered with. Each resource has a cryptographic hash that
 * the browser verifies before execution.
 *
 * This enhanced version includes:
 * - Pre-computed SRI hashes for common CDN resources
 * - Automatic hash generation for build-time resources
 * - SRI validation utilities
 * - Integration with Next.js Script component
 */

import crypto from 'crypto';

// ============================================================================
// SRI HASH REGISTRY - Pre-computed hashes for common CDN resources
// ============================================================================

/**
 * Known external resources with their SRI hashes
 * These are pre-computed using: curl -s <url> | openssl dgst -sha384 -binary | openssl base64 -A
 */
export const EXTERNAL_RESOURCES = {
  // Leaflet CSS (map library)
  'leaflet-css': {
    url: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    hash: 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=',
    crossOrigin: 'anonymous' as const,
  },
  // Leaflet JS (map library)
  'leaflet-js': {
    url: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    hash: 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=',
    crossOrigin: 'anonymous' as const,
  },
  // Google Fonts (optional, if using external fonts)
  'google-fonts': {
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    hash: 'sha256-PLACEHOLDER', // Fonts don't support SRI, but included for completeness
    crossOrigin: 'anonymous' as const,
  },
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface SRIResource {
  url: string;
  hash: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
}

export interface SRIScriptOptions extends SRIResource {
  async?: boolean;
  defer?: boolean;
  type?: string;
  id?: string;
}

export interface SRIStyleOptions extends SRIResource {
  media?: string;
  id?: string;
}

// ============================================================================
// SRI HASH GENERATION
// ============================================================================

/**
 * Generate an SRI hash from file content
 * Use this during build time to generate hashes for your resources
 *
 * @param content - The file content to hash
 * @param algorithm - Hash algorithm (sha256, sha384, sha512)
 * @returns The SRI hash string (sha384-...)
 */
export function generateSRIHash(
  content: string | Buffer,
  algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha384'
): string {
  const hash = crypto.createHash(algorithm).update(content).digest('base64');
  return `${algorithm}-${hash}`;
}

/**
 * Generate SRI hash from a URL (fetches the content)
 * Use this during build time to generate hashes for external resources
 *
 * @param url - The URL to fetch and hash
 * @param algorithm - Hash algorithm (sha256, sha384, sha512)
 * @returns Promise resolving to the SRI hash string
 */
export async function generateSRIHashFromURL(
  url: string,
  algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha384'
): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  const content = await response.arrayBuffer();
  return generateSRIHash(Buffer.from(content), algorithm);
}

/**
 * Generate SRI hash from a local file
 * Use this during build time to generate hashes for local resources
 *
 * @param filePath - Path to the local file
 * @param algorithm - Hash algorithm (sha256, sha384, sha512)
 * @returns Promise resolving to the SRI hash string
 */
export async function generateSRIHashFromFile(
  filePath: string,
  algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha384'
): Promise<string> {
  const fs = await import('fs/promises');
  const content = await fs.readFile(filePath);
  return generateSRIHash(content, algorithm);
}

// ============================================================================
// SCRIPT/STYLE TAG GENERATORS
// ============================================================================

/**
 * Generate a script tag with SRI integrity attribute
 *
 * @param options - Script options including URL and SRI hash
 * @returns HTML script tag string
 */
export function generateSRIScript(options: SRIScriptOptions): string {
  const {
    url,
    hash,
    crossOrigin = 'anonymous',
    async = false,
    defer = false,
    type,
    id,
  } = options;

  const attributes: string[] = [
    id ? `id="${escapeHtml(id)}"` : '',
    `src="${escapeHtml(url)}"`,
    `integrity="${escapeHtml(hash)}"`,
    `crossorigin="${crossOrigin}"`,
  ].filter(Boolean);

  if (async) attributes.push('async');
  if (defer) attributes.push('defer');
  if (type) attributes.push(`type="${escapeHtml(type)}"`);

  return `<script ${attributes.join(' ')}></script>`;
}

/**
 * Generate a link tag with SRI integrity attribute
 *
 * @param options - Style options including URL and SRI hash
 * @returns HTML link tag string
 */
export function generateSRIStyle(options: SRIStyleOptions): string {
  const { url, hash, crossOrigin = 'anonymous', media, id } = options;

  const attributes: string[] = [
    id ? `id="${escapeHtml(id)}"` : '',
    `rel="stylesheet"`,
    `href="${escapeHtml(url)}"`,
    `integrity="${escapeHtml(hash)}"`,
    `crossorigin="${crossOrigin}"`,
  ].filter(Boolean);

  if (media) attributes.push(`media="${escapeHtml(media)}"`);

  return `<link ${attributes.join(' ')} />`;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate an SRI hash format
 *
 * @param hash - The hash to validate
 * @returns True if valid SRI hash format
 */
export function isValidSRIHash(hash: string): boolean {
  // SRI hashes must start with algorithm prefix
  const validPrefixes = ['sha256-', 'sha384-', 'sha512-'];
  const hasValidPrefix = validPrefixes.some((prefix) => hash.startsWith(prefix));

  if (!hasValidPrefix) return false;

  // Base64url encoded hash should be reasonable length
  const hashPart = hash.split('-')[1];
  if (!hashPart) return false;

  // Minimum length check (sha256 = 32 bytes = 44 base64 chars)
  return hashPart.length >= 44;
}

/**
 * Verify that all registered external resources have valid SRI hashes
 * Call this during application startup
 */
export function validateSREResources(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [name, resource] of Object.entries(EXTERNAL_RESOURCES)) {
    if (!isValidSRIHash(resource.hash)) {
      errors.push(`Invalid SRI hash for resource "${name}": ${resource.hash}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }

  // Server-side fallback
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// NEXT.JS INTEGRATION
// ============================================================================

/**
 * Get SRI props for Next.js Script component
 * Use this in your components when loading external scripts
 */
export function getSRIScriptProps(options: SRIScriptOptions) {
  return {
    src: options.url,
    integrity: options.hash,
    crossOrigin: options.crossOrigin || 'anonymous',
    async: options.async,
    defer: options.defer,
    id: options.id,
  };
}

/**
 * Generate SRI-enabled script tags for Next.js _document.tsx
 * Use this in pages/_document.tsx to inject external scripts with SRI
 */
export function generateSRIScriptsForDocument(
  scripts: SRIScriptOptions[]
): string {
  return scripts.map(generateSRIScript).join('\n');
}

/**
 * Generate SRI-enabled style tags for Next.js _document.tsx
 * Use this in pages/_document.tsx to inject external stylesheets with SRI
 */
export function generateSRIStylesForDocument(
  styles: SRIStyleOptions[]
): string {
  return styles.map(generateSRIStyle).join('\n');
}

// ============================================================================
// BUILD-TIME SCRIPT GENERATION
// ============================================================================

/**
 * Generate a build script to update SRI hashes
 * Run this as part of your build process to keep hashes up to date
 */
export function generateSRIUpdateScript(): string {
  return `#!/usr/bin/env node
/**
 * Update SRI hashes for external resources
 * Run this script to regenerate hashes when external resources change
 */

const { generateSRIHashFromURL } = require('./lib/security/sri-enhanced');

const resources = {
  'leaflet-css': 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'leaflet-js': 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
};

async function updateHashes() {
  console.log('Updating SRI hashes...');
  
  for (const [name, url] of Object.entries(resources)) {
    try {
      const hash = await generateSRIHashFromURL(url);
      console.log(\`\${name}: \${hash}\`);
    } catch (error) {
      console.error(\`Failed to generate hash for \${name}:\`, error.message);
    }
  }
  
  console.log('Done! Update EXTERNAL_RESOURCES in lib/security/sri-enhanced.ts');
}

updateHashes().catch(console.error);
`;
}
