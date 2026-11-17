/**
 * Reproduction for BA-0016 (VERIFIED).
 *
 * .github/workflows/push-reminders-cron.yml ran on a schedule trigger
 * firing every 10 minutes and curled PUSH_REMINDERS_CRON_URL with a bearer
 * token. This workflow was never folded into the 2026-07-29
 * Vercel-to-Cloudflare cron cutover, which only reconciled Vercel Cron
 * against Cloudflare Cron Triggers for the three routes in
 * CRON_ROUTE_BY_EXPRESSION. It was a fourth, still-active scheduler outside
 * that cutover: on this repo its secrets are unset so the job's own guard
 * exits 1 before curling (still generating CI noise every 10 minutes), but
 * the moment PUSH_REMINDERS_CRON_URL/SECRET are populated - especially if
 * pointed at the retained Vercel origin - it becomes a real duplicate
 * scheduler alongside whatever invokes the push-reminders cron route
 * through Cloudflare.
 *
 * Fix: remove the schedule trigger so this workflow can no longer fire on
 * its own; keep workflow_dispatch so it remains available to run by hand if
 * ever needed.
 */

import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const WORKFLOW = '.github/workflows/push-reminders-cron.yml';
const TEN_MINUTE_CRON_EXPRESSION = ['*', '/10 * * * *'].join('');

describe('BA-0016: push-reminders GitHub Actions workflow is not a live scheduler', () => {
  it('has no schedule trigger', async () => {
    const workflow = await readFile(WORKFLOW, 'utf8');

    expect(workflow).not.toMatch(/^\s*schedule:/m);
    expect(workflow).not.toContain(TEN_MINUTE_CRON_EXPRESSION);
  });

  it('remains available to run manually via workflow_dispatch', async () => {
    const workflow = await readFile(WORKFLOW, 'utf8');

    expect(workflow).toContain('workflow_dispatch:');
  });
});
