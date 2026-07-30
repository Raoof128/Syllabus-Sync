import { readFile, readdir } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { CRON_ROUTE_BY_EXPRESSION } from '@/lib/cloudflare/scheduled';

/**
 * Two invariants that nothing else in the suite covered, both surfaced by the
 * 2026-07-30 runtime audit.
 *
 * 1. `tests/cloudflare/scheduled.test.ts` cross-checks
 *    `CRON_ROUTE_BY_EXPRESSION` against `vercel.json` — the RETAINED ROLLBACK
 *    TARGET. Nothing checked it against `wrangler.jsonc`, the platform actually
 *    running production since the 2026-07-29 cutover. A cron expression present
 *    in wrangler.jsonc but absent from the dispatcher makes `runScheduledJob`
 *    throw "Unsupported cron expression": correct fail-closed behaviour, but the
 *    cleanup it was supposed to own then silently never runs.
 *
 * 2. Nothing asserted that every `CRON_SECRET`-authenticated route actually HAS
 *    a scheduler. BA-0016 removed the GitHub Actions schedule trigger that was
 *    the only caller of `/api/cron/push-reminders` — correctly, it was an
 *    unreconciled fourth scheduler — but the route was never adopted into the
 *    Cloudflare triggers, so it went from "duplicated" to "orphaned" and
 *    deadline reminders stopped having any way to fire at all.
 *
 * Enabling a scheduler sends real push notifications to real users and is an
 * owner decision, so this test does NOT assert that push-reminders is
 * scheduled. It pins the gap as a known, deliberate state with a reason, so
 * that the situation is visible in the suite and any NEW cron-authenticated
 * route added without an owner fails here instead of silently never running.
 */

/**
 * Cron-authenticated routes that intentionally have no scheduler right now.
 * Removing an entry from here requires giving the route a real owner.
 */
const KNOWN_UNSCHEDULED: Record<string, string> = {
  '/api/cron/push-reminders':
    'BA-0016 removed the GitHub Actions schedule (an unreconciled fourth scheduler) and the ' +
    'route was never adopted into the Cloudflare triggers. Deadline reminders therefore do not ' +
    'fire. Re-enabling is an owner decision: it resumes real push delivery on a 10-minute ' +
    'cadence, which the route’s own batch cap (DEFAULT_MAX_USERS_PER_RUN) assumes for ' +
    'catch-up after truncation.',
};

async function routeHandlerFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const found: string[] = [];

  for (const entry of entries) {
    const full = `${directory}/${entry.name}`;
    if (entry.isDirectory()) found.push(...(await routeHandlerFiles(full)));
    else if (entry.name === 'route.ts') found.push(full);
  }

  return found;
}

async function cronAuthenticatedRoutes(): Promise<string[]> {
  const files = await routeHandlerFiles('app/api');
  const routes: string[] = [];

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    if (source.includes('CRON_SECRET')) {
      routes.push(`/${file.replace(/^app\//, '').replace(/\/route\.ts$/, '')}`);
    }
  }

  return routes.sort();
}

/** Production is the only environment carrying cron triggers. */
async function wranglerProductionCrons(): Promise<string[]> {
  const raw = await readFile('wrangler.jsonc', 'utf8');
  // Strip // comments and trailing commas so JSONC parses as JSON.
  const json = raw.replace(/^\s*\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1');
  const config = JSON.parse(json) as {
    env?: { production?: { triggers?: { crons?: string[] } } };
  };
  return [...(config.env?.production?.triggers?.crons ?? [])].sort();
}

describe('Cloudflare cron ownership', () => {
  it('dispatcher expressions match the production wrangler triggers exactly', async () => {
    const declared = await wranglerProductionCrons();
    const dispatched = Object.keys(CRON_ROUTE_BY_EXPRESSION).sort();

    // Any drift either orphans a cleanup (declared but undispatched -> throws
    // "Unsupported cron expression") or leaves a route with no trigger
    // (dispatched but undeclared -> never invoked).
    expect(declared).toEqual(dispatched);
  });

  it('every cron-authenticated route is either scheduled or a recorded exception', async () => {
    const scheduled = new Set<string>(Object.values(CRON_ROUTE_BY_EXPRESSION));
    const orphaned = (await cronAuthenticatedRoutes()).filter(
      (route) => !scheduled.has(route) && !(route in KNOWN_UNSCHEDULED),
    );

    expect(orphaned).toEqual([]);
  });

  it('records why push-reminders currently has no scheduler', () => {
    // Guards the finding itself: if someone gives the route an owner, this
    // fails and the stale exception has to be removed rather than lingering as
    // misleading documentation.
    const scheduled = new Set<string>(Object.values(CRON_ROUTE_BY_EXPRESSION));

    expect(scheduled.has('/api/cron/push-reminders')).toBe(false);
    expect(KNOWN_UNSCHEDULED['/api/cron/push-reminders']).toMatch(/owner decision/i);
  });

  it('every dispatched route exists on disk', async () => {
    const present = new Set(await cronAuthenticatedRoutes());

    for (const route of Object.values(CRON_ROUTE_BY_EXPRESSION)) {
      expect(present, `${route} is dispatched but has no CRON_SECRET-guarded handler`).toContain(
        route,
      );
    }
  });
});
