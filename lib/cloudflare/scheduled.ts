/**
 * Cloudflare Cron Trigger dispatch.
 *
 * Replaces the three Vercel Cron schedules declared in `vercel.json`. Each cron
 * expression maps to the existing `CRON_SECRET`-protected cleanup route, which
 * is invoked internally through the OpenNext fetch handler rather than over the
 * public internet.
 *
 * The dispatcher is deliberately pure so cron ownership stays testable without
 * a Worker runtime, and fails closed when `CRON_SECRET` is missing.
 */
export const CRON_ROUTE_BY_EXPRESSION = {
  '0 3 * * *': '/api/auth/email/cleanup',
  '10 3 * * *': '/api/auth/password/cleanup',
  '20 3 * * *': '/api/security/rate-limit/cleanup',
} as const;

type SupportedCron = keyof typeof CRON_ROUTE_BY_EXPRESSION;

export type InternalFetch = (request: Request) => Promise<Response>;

function isSupportedCron(cron: string): cron is SupportedCron {
  return Object.prototype.hasOwnProperty.call(CRON_ROUTE_BY_EXPRESSION, cron);
}

/**
 * Invokes the cleanup route owned by `cron`.
 *
 * Throws — rather than resolving quietly — so a failed cleanup surfaces in
 * Cloudflare Cron Events and Worker logs instead of being recorded as success.
 * The upstream response body is never included in the thrown message because it
 * may echo request credentials back to the log stream.
 */
export async function runScheduledJob(
  cron: string,
  cronSecret: string | undefined,
  invoke: InternalFetch,
): Promise<void> {
  if (!cronSecret?.trim()) {
    throw new Error('CRON_SECRET is not configured');
  }

  if (!isSupportedCron(cron)) {
    throw new Error(`Unsupported cron expression: ${cron}`);
  }

  const route = CRON_ROUTE_BY_EXPRESSION[cron];
  const request = new Request(`https://syllabus-sync.internal${route}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      'X-Syllabus-Sync-Scheduler': 'cloudflare-cron',
    },
  });

  const response = await invoke(request);

  if (!response.ok) {
    throw new Error(
      `Scheduled cleanup failed: cron=${cron} route=${route} status=${response.status}`,
    );
  }
}
