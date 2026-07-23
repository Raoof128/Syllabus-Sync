// `.open-next/worker.js` is generated during `opennextjs-cloudflare build`.
// @ts-expect-error generated module is unavailable before the first build
import handler from './.open-next/worker.js';
import { runScheduledJob } from '@/lib/cloudflare/scheduled';

export default {
  fetch: handler.fetch,

  async scheduled(event, env, ctx) {
    await runScheduledJob(event.cron, env.CRON_SECRET, (request) =>
      handler.fetch(request, env, ctx),
    );
  },
} satisfies ExportedHandler<CloudflareEnv>;
