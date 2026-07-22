import { describe, expect, it } from 'vitest';
import { config } from '@/middleware';
import { isKnownStaticPath } from '@/lib/middleware';

function rootMatcherMatches(pathname: string): boolean {
  const matcher = config.matcher[0];
  return new RegExp(`^${matcher}$`).test(pathname);
}

describe('Edge middleware matcher and static bypass policy', () => {
  it.each([
    '/api/export.json',
    '/api/foo.txt',
    '/api/items/photo.png',
    '/auth/callback/result.json',
    '/home.rsc',
    '/_next/image',
    '/_next/image?url=%2Fsyllabus-sync-logo.png&w=640&q=75',
    '/favicon.ico/extension-shaped-dynamic-path',
  ])('runs root matching and middleware policy for dynamic path %s', (path) => {
    const url = new URL(path, 'http://localhost:3000');
    expect(rootMatcherMatches(url.pathname)).toBe(true);
    expect(isKnownStaticPath(url.pathname)).toBe(false);
  });

  it.each([
    '/_next/static/chunks/app.js',
    '/icons/icon-192.png',
    '/images/login-bg.png',
    '/tiles/tilemapresource.xml',
    '/favicon.ico',
    '/apple-touch-icon.png',
    '/manifest.webmanifest',
    '/security.txt',
    '/sw.js',
    '/syllabus-sync-logo.png',
  ])('bypasses policy only for known static path %s', (path) => {
    expect(rootMatcherMatches(path)).toBe(false);
    expect(isKnownStaticPath(path)).toBe(true);
  });
});
