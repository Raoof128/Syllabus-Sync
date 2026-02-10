import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { SETTINGS_SECTION_PATHS } from '@/app/settings/layout';
import { quickActionLinks } from '@/features/settings/components/QuickActions';

function routeHasPageFile(route: string): boolean {
  const trimmedRoute = route.startsWith('/') ? route.slice(1) : route;
  const pageFile = path.join(process.cwd(), 'app', trimmedRoute, 'page.tsx');
  return fs.existsSync(pageFile);
}

describe('Settings route integrity', () => {
  it('all settings section routes map to app page files', () => {
    for (const route of SETTINGS_SECTION_PATHS) {
      expect(routeHasPageFile(route)).toBe(true);
    }
  });

  it('all quick action routes map to app page files', () => {
    for (const { href } of quickActionLinks) {
      expect(routeHasPageFile(href)).toBe(true);
    }
  });
});
