/**
 * CSP (Content Security Policy) Configuration
 *
 * SECURITY: This module defines the CSP configuration with hash-based script validation.
 *
 * The inline scripts for theme and RTL are static and pre-computed hashes are used
 * instead of 'unsafe-inline' to maintain XSS protection.
 */

// ============================================================================
// SCRIPT DEFINITIONS (keep in sync with app/layout.tsx)
// ============================================================================

/**
 * Theme initialization script - prevents flash of wrong theme
 * IMPORTANT: If you modify this script, you must regenerate the hash!
 *
 * To regenerate: Run the script content through SHA-256 and base64 encode:
 * echo -n '<script content>' | openssl dgst -sha256 -binary | base64
 */
export const THEME_SCRIPT = `(function(){try{var stored=localStorage.getItem('theme-storage');var theme='system';if(stored){var parsed=JSON.parse(stored);theme=parsed.state?.theme||'system'}var resolved=theme;if(theme==='system'){resolved=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.classList.add(resolved);document.documentElement.style.colorScheme=resolved}catch(e){}})();`;

/**
 * RTL direction script - sets correct text direction based on language
 * IMPORTANT: If you modify this script, you must regenerate the hash!
 */
export const RTL_SCRIPT = `(function(){try{var stored=localStorage.getItem('language-storage');if(stored){var parsed=JSON.parse(stored);var lang=parsed.state?.language||'en';var rtlLanguages=['fa','ar','ur','he'];if(rtlLanguages.includes(lang)){document.documentElement.dir='rtl';document.documentElement.lang=lang}else{document.documentElement.dir='ltr';document.documentElement.lang=lang}}}catch(e){}})();`;

// ============================================================================
// CSP HASHES
// ============================================================================

/**
 * Pre-computed SHA-256 hashes for inline scripts
 * These MUST be updated if the scripts above are modified!
 *
 * Generate with: echo -n '<script>' | openssl dgst -sha256 -binary | base64
 */
export const CSP_SCRIPT_HASHES = {
  theme: 'sha256-euA/nX7OMJt6hghOJ/qTKFU59who5Fhoj7IWVSgwBss=',
  rtl: 'sha256-7IUh1B8MYhdIeSKtKih/ERxZm0rfT5jNWzQqe73/yeY=',
};

// ============================================================================
// CSP BUILDER
// ============================================================================

export interface CSPOptions {
  /** Include upgrade-insecure-requests directive */
  upgradeInsecure?: boolean;
  /** Additional script sources to allow */
  additionalScriptSrc?: string[];
  /** Additional connect sources to allow */
  additionalConnectSrc?: string[];
  /** Report URI for CSP violations */
  reportUri?: string;
}

/**
 * Build a Content Security Policy header value
 */
export function buildCSP(options: CSPOptions = {}): string {
  const {
    upgradeInsecure = process.env.NODE_ENV === 'production',
    additionalScriptSrc = [],
    additionalConnectSrc = [],
    reportUri,
  } = options;

  // Build script-src with hashes
  const scriptHashes = Object.values(CSP_SCRIPT_HASHES).map((h) => `'${h}'`);
  const scriptSrc = ["'self'", ...scriptHashes, ...additionalScriptSrc].join(' ');

  const directives = [
    // Default fallback
    "default-src 'self'",

    // Scripts: self + hash-validated inline scripts (NO unsafe-inline!)
    `script-src ${scriptSrc}`,

    // Styles: self + unsafe-inline (required for Tailwind/CSS-in-JS)
    // Note: Styles are less dangerous than scripts for XSS
    "style-src 'self' 'unsafe-inline'",

    // Images: Allow self, data URIs, blobs, and HTTPS
    "img-src 'self' data: blob: https:",

    // Fonts: self and data URIs
    "font-src 'self' data:",

    // Connect: API endpoints, Supabase, routing services
    `connect-src 'self' https://*.supabase.co https://*.openrouteservice.org wss://*.supabase.co ${additionalConnectSrc.join(' ')}`.trim(),

    // Frame ancestors: Prevent clickjacking
    "frame-ancestors 'self'",

    // Base URI: Restrict base tag
    "base-uri 'self'",

    // Form actions: Where forms can submit
    "form-action 'self'",

    // Object sources: Disable plugins
    "object-src 'none'",

    // Upgrade insecure in production
    ...(upgradeInsecure ? ['upgrade-insecure-requests'] : []),

    // Report URI if configured
    ...(reportUri ? [`report-uri ${reportUri}`] : []),
  ];

  return directives.join('; ');
}

/**
 * Build CSP header for development (more permissive)
 * NOTE: Next.js injects many inline scripts for hydration and routing that
 * cannot be pre-hashed. In development, we use unsafe-inline WITHOUT hashes
 * because browsers ignore unsafe-inline when hashes are present.
 */
export function buildDevCSP(): string {
  // In development, skip hash-based validation entirely
  // because unsafe-inline is ignored when hashes are present
  const directives = [
    "default-src 'self'",
    // Scripts: Allow inline and eval for HMR, hydration, Turbopack
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    // Styles: Allow inline for Tailwind/CSS-in-JS
    "style-src 'self' 'unsafe-inline'",
    // Images
    "img-src 'self' data: blob: https:",
    // Fonts
    "font-src 'self' data:",
    // Connect: API endpoints, Supabase, HMR websockets
    "connect-src 'self' https://*.supabase.co https://*.openrouteservice.org wss://*.supabase.co ws://localhost:* ws://127.0.0.1:*",
    // Frame ancestors
    "frame-ancestors 'self'",
    // Base URI
    "base-uri 'self'",
    // Form actions
    "form-action 'self'",
    // Object sources
    "object-src 'none'",
  ];

  return directives.join('; ');
}

/**
 * Build CSP header for production (strict)
 */
export function buildProdCSP(): string {
  return buildCSP({
    upgradeInsecure: true,
  });
}

/**
 * Get appropriate CSP based on environment
 */
export function getCSP(): string {
  return process.env.NODE_ENV === 'production' ? buildProdCSP() : buildDevCSP();
}
