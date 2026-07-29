import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuthWithRateLimit } from '@/app/api/_lib/middleware';
import { jsonSuccess, jsonError, handleDatabaseError, ERROR_CODES } from '@/app/api/_lib/response';
import { logger } from '@/lib/logger';

const PushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  userAgent: z.string().max(512).optional(),
});

const DeleteSubscriptionSchema = z.object({
  endpoint: z.string().url(),
});

// SECURITY (BA-0012): this used to be `createAdminClient() ?? (await
// createServerClient())`. push_subscriptions.endpoint is globally unique and
// the upsert below resolves conflicts with `onConflict: 'endpoint'`. The
// table's RLS policies (supabase/migrations/20260313093000_...) intentionally
// scope INSERT/UPDATE to `auth.uid() = user_id`, so a legitimate
// re-subscription can update your own row but an upsert that collides with
// someone else's endpoint should be rejected by RLS. Routing the mutation
// through the service-role admin client silently bypassed that RLS check -
// any authenticated user could upsert an endpoint they observed or guessed
// and reassign (hijack) another user's existing push subscription, since the
// admin client has no ownership concept at all. Always use the RLS-scoped,
// user-session client so Postgres enforces the ownership check the schema
// already declares.
async function getWritableClient() {
  return createServerClient();
}

export async function POST(request: Request) {
  return requireAuthWithRateLimit(
    request,
    async (userId) => {
      try {
        const body = await request.json();
        const parsed = PushSubscriptionSchema.safeParse(body);

        if (!parsed.success) {
          return jsonError('Invalid push subscription payload', 400, ERROR_CODES.VALIDATION_ERROR, {
            errors: parsed.error.flatten().fieldErrors,
          });
        }

        const client = await getWritableClient();
        const now = new Date().toISOString();

        const { data, error } = await client
          .from('push_subscriptions')
          .upsert(
            {
              user_id: userId,
              endpoint: parsed.data.endpoint,
              p256dh_key: parsed.data.keys.p256dh,
              auth_key: parsed.data.keys.auth,
              expiration_time:
                typeof parsed.data.expirationTime === 'number'
                  ? new Date(parsed.data.expirationTime).toISOString()
                  : null,
              user_agent: parsed.data.userAgent ?? null,
              updated_at: now,
            },
            {
              onConflict: 'endpoint',
            },
          )
          .select('id, endpoint')
          .single();

        if (error) {
          return handleDatabaseError(error);
        }

        return jsonSuccess(data, 201);
      } catch (error) {
        logger.error('Push subscription POST error', error);
        return jsonError('Failed to save push subscription', 500);
      }
    },
    'push-subscription',
  );
}

export async function DELETE(request: Request) {
  return requireAuthWithRateLimit(
    request,
    async (userId) => {
      try {
        const body = await request.json();
        const parsed = DeleteSubscriptionSchema.safeParse(body);

        if (!parsed.success) {
          return jsonError('Invalid push subscription payload', 400, ERROR_CODES.VALIDATION_ERROR, {
            errors: parsed.error.flatten().fieldErrors,
          });
        }

        const client = await getWritableClient();
        const { error } = await client
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId)
          .eq('endpoint', parsed.data.endpoint);

        if (error) {
          return handleDatabaseError(error);
        }

        return jsonSuccess({ endpoint: parsed.data.endpoint, deleted: true });
      } catch (error) {
        logger.error('Push subscription DELETE error', error);
        return jsonError('Failed to delete push subscription', 500);
      }
    },
    'push-subscription',
  );
}
