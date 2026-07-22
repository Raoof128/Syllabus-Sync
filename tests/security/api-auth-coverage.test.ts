import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ApiAuthAnalyzer,
  createFilesystemLoader,
  extractPublicApiPrefixes,
  formatUncoveredMethods,
} from './api-auth-analyzer';

const REPOSITORY_ROOT = process.cwd();
const API_ROOT = resolve(REPOSITORY_ROOT, 'app/api');
const MIDDLEWARE_POLICY = resolve(REPOSITORY_ROOT, 'lib/middleware.ts');

const PUBLIC_API_PREFIXES = [
  '/api/auth/',
  '/api/health',
  '/api/maps/',
  '/api/weather',
  '/api/cron/',
  '/api/security/rate-limit/cleanup',
  '/api/csp-report',
  '/api/webauthn/authenticate/',
] as const;

function enumerateRouteFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? enumerateRouteFiles(path) : [path];
    })
    .filter((path) => path.endsWith('/route.ts'))
    .sort();
}

function toRoutePath(routeFile: string): string {
  return routeFile
    .slice(REPOSITORY_ROOT.length)
    .replace(/^\/app/, '')
    .replace(/\/route\.ts$/, '');
}

describe('API authentication coverage inventory', () => {
  const loader = createFilesystemLoader(REPOSITORY_ROOT);

  it('parses the complete middleware public policy and matches the independent allowlist', () => {
    expect(extractPublicApiPrefixes(MIDDLEWARE_POLICY, loader)).toEqual([...PUBLIC_API_PREFIXES]);
  });

  it('requires reachable fail-closed auth evidence for every protected HTTP method', () => {
    const analyzer = new ApiAuthAnalyzer(loader);
    const protectedRoutes = enumerateRouteFiles(API_ROOT).filter(
      (routeFile) =>
        !PUBLIC_API_PREFIXES.some((prefix) => toRoutePath(routeFile).startsWith(prefix)),
    );
    const failures: string[] = [];

    for (const routeFile of protectedRoutes) {
      const routePath = toRoutePath(routeFile);
      const coverage = analyzer.analyzeRoute(routeFile);
      const relativeFile = routeFile.slice(REPOSITORY_ROOT.length + 1);
      if (coverage.length === 0) {
        failures.push(
          `- NO_HANDLER ${routePath} (${relativeFile}): export an explicit supported HTTP method`,
        );
        continue;
      }
      failures.push(...formatUncoveredMethods(routePath, relativeFile, coverage));
    }

    if (failures.length > 0) {
      throw new Error(
        `Protected API methods without reachable auth evidence:\n${failures.join('\n')}`,
      );
    }

    expect(protectedRoutes.length).toBeGreaterThan(0);
  });
});
