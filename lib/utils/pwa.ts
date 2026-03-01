/**
 * PWA Detection Utilities
 * Detects if the app is running as an installed PWA (standalone mode)
 */

/**
 * Check if the app is running in standalone mode (installed as PWA)
 * This works for:
 * - iOS Safari (navigator.standalone)
 * - Android Chrome / other browsers (display-mode: standalone)
 * - Desktop PWA installations
 */
export function isRunningAsPWA(): boolean {
  if (typeof window === 'undefined') return false;

  // iOS Safari standalone mode
  const isIOSStandalone =
    'standalone' in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  // Check for display-mode: standalone (works for most browsers)
  const isStandaloneDisplayMode =
    window.matchMedia?.('(display-mode: standalone)')?.matches ?? false;

  // Check for display-mode: fullscreen (some PWAs use this)
  const isFullscreenDisplayMode =
    window.matchMedia?.('(display-mode: fullscreen)')?.matches ?? false;

  // Check for display-mode: minimal-ui (another PWA display mode)
  const isMinimalUIDisplayMode =
    window.matchMedia?.('(display-mode: minimal-ui)')?.matches ?? false;

  return isIOSStandalone || isStandaloneDisplayMode || isFullscreenDisplayMode || isMinimalUIDisplayMode;
}

