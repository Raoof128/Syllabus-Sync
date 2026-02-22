/**
 * Subresource Integrity (SRI) Utilities
 *
 * SECURITY: SRI ensures that resources loaded from external sources (CDNs)
 * haven't been tampered with. Each resource has a cryptographic hash that
 * the browser verifies before execution.
 *
 * Usage:
 * 1. Add external resources with their SRI hashes
 * 2. Use generateSRI() to create script/link tags with integrity attributes
 * 3. Update hashes when resources change
 *
 * Generating SRI hashes:
 * curl -s <url> | openssl dgst -sha384 -binary | openssl base64 -A
 */

// ============================================================================
// SRI HASH REGISTRY
// ============================================================================

/**
 * Known external resources with their SRI hashes
 * Only add resources that are loaded from external CDNs
 * Self-hosted resources (via next/font, etc.) don't need SRI
 */
export const EXTERNAL_RESOURCES = {
  // Example: If loading Google Analytics or other external scripts
  // 'google-analytics': {
  //   url: 'https://www.google-analytics.com/analytics.js',
  //   hash: 'sha384-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  // },
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface SRIResource {
  url: string;
  hash: string;
  crossOrigin?: "anonymous" | "use-credentials";
}

export interface SRIScriptOptions extends SRIResource {
  async?: boolean;
  defer?: boolean;
  type?: string;
}

export interface SRIStyleOptions extends SRIResource {
  media?: string;
}

// ============================================================================
// SRI GENERATION
// ============================================================================

/**
 * Generate an SRI hash from file content
 * Use this during build time to generate hashes for your resources
 *
 * @param content - The file content to hash
 * @returns The SRI hash string (sha384-...)
 */
export function generateSRIHash(_content: string | Buffer): string {
  // In a real implementation, this would use crypto module
  // For now, this is a placeholder that shows the expected format
  // Usage: node -e "console.log(require('./lib/security/sri').generateSRIHash(require('fs').readFileSync('file.js')))"

  // Note: This is a build-time utility
  // In production, hashes should be pre-computed and stored
  return "sha384-PLACEHOLDER_USE_BUILD_SCRIPT";
}

/**
 * Build-time script to generate SRI hashes:
 *
 * #!/bin/bash
 * # scripts/generate-sri.sh
 *
 * URL="$1"
 * if [ -z "$URL" ]; then
 *   echo "Usage: $0 <url>"
 *   exit 1
 * fi
 *
 * HASH=$(curl -s "$URL" | openssl dgst -sha384 -binary | openssl base64 -A)
 * echo "sha384-$HASH"
 */

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
    crossOrigin = "anonymous",
    async = false,
    defer = false,
    type,
  } = options;

  const attributes: string[] = [
    `src="${escapeHtml(url)}"`,
    `integrity="${escapeHtml(hash)}"`,
    `crossorigin="${crossOrigin}"`,
  ];

  if (async) attributes.push("async");
  if (defer) attributes.push("defer");
  if (type) attributes.push(`type="${escapeHtml(type)}"`);

  return `<script ${attributes.join(" ")}></script>`;
}

/**
 * Generate a link tag with SRI integrity attribute
 *
 * @param options - Style options including URL and SRI hash
 * @returns HTML link tag string
 */
export function generateSRIStyle(options: SRIStyleOptions): string {
  const { url, hash, crossOrigin = "anonymous", media } = options;

  const attributes: string[] = [
    `rel="stylesheet"`,
    `href="${escapeHtml(url)}"`,
    `integrity="${escapeHtml(hash)}"`,
    `crossorigin="${crossOrigin}"`,
  ];

  if (media) attributes.push(`media="${escapeHtml(media)}"`);

  return `<link ${attributes.join(" ")} />`;
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
  const validPrefixes = ["sha256-", "sha384-", "sha512-"];
  const hasValidPrefix = validPrefixes.some((prefix) =>
    hash.startsWith(prefix),
  );

  if (!hasValidPrefix) return false;

  // Base64url encoded hash should be reasonable length
  const hashPart = hash.split("-")[1];
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
    const typedResource = resource as SRIResource;
    if (!isValidSRIHash(typedResource.hash)) {
      errors.push(
        `Invalid SRI hash for resource "${name}": ${typedResource.hash}`,
      );
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
  const div =
    typeof document !== "undefined" ? document.createElement("div") : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }

  // Server-side fallback
  return text
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/'/g, "&#039;");
}

// ============================================================================
// NEXT.JS INTEGRATION
// ============================================================================

/**
 * Generate Next.js metadata with SRI-enabled external scripts
 * Use this in your layout.tsx or page.tsx metadata exports
 */
export function generateSRIMetadata(
  scripts: SRIScriptOptions[],
  styles: SRIStyleOptions[],
): {
  other: {
    "script:ld+json"?: string;
  };
} {
  scripts.map(generateSRIScript).join("\n");
  styles.map(generateSRIStyle).join("\n");

  return {
    other: {
      // Note: Next.js doesn't directly support SRI in metadata
      // For external scripts, use the Script component with integrity prop
      // or inject via custom _document.tsx
    },
  };
}

/**
 * React component for loading external scripts with SRI
 * Use this in your components when loading external resources
 */
export function getSRIScriptProps(options: SRIScriptOptions) {
  return {
    src: options.url,
    integrity: options.hash,
    crossOrigin: options.crossOrigin || "anonymous",
    async: options.async,
    defer: options.defer,
  };
}
