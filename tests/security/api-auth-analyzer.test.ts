import { dirname, posix } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ApiAuthAnalyzer,
  extractPublicApiPrefixes,
  formatUncoveredMethods,
  type SourceLoader,
} from './api-auth-analyzer';

const ROOT = '/repo';
const ROUTE = `${ROOT}/app/api/example/route.ts`;
const AUTH_MIDDLEWARE = `${ROOT}/app/api/_lib/middleware.ts`;
const RESPONSE_HELPERS = `${ROOT}/app/api/_lib/response.ts`;
const SUPABASE_SERVER = `${ROOT}/lib/supabase/server.ts`;

function loaderFor(files: Record<string, string>): SourceLoader {
  const sources = new Map(Object.entries(files));
  return {
    read(filePath) {
      const source = sources.get(filePath);
      if (source === undefined) throw new Error(`Missing fixture source: ${filePath}`);
      return source;
    },
    resolve(importerPath, specifier) {
      const base = specifier.startsWith('@/')
        ? posix.join(ROOT, specifier.slice(2))
        : posix.resolve(dirname(importerPath), specifier);
      return (
        [`${base}.ts`, `${base}.tsx`, posix.join(base, 'index.ts')].find((candidate) =>
          sources.has(candidate),
        ) ?? null
      );
    },
  };
}

function analyze(routeSource: string, extras: Record<string, string> = {}) {
  const loader = loaderFor({
    [ROUTE]: routeSource,
    [AUTH_MIDDLEWARE]: `
      export async function requireAuth(request: Request, handler: (userId: string) => Promise<Response>) {
        return handler('fixture-user');
      }
      export const requireAuthWithRateLimit = requireAuth;
    `,
    [RESPONSE_HELPERS]: `
      export function jsonUnauthorized(message: string) {
        return Response.json({ message }, { status: 401 });
      }
      export function jsonError(message: string, status: number) {
        return Response.json({ message }, { status });
      }
    `,
    [SUPABASE_SERVER]: `
      export async function createServerClient() {
        return {} as never;
      }
    `,
    ...extras,
  });
  return new ApiAuthAnalyzer(loader).analyzeRoute(ROUTE);
}

describe('API auth AST analyzer adversarial coverage', () => {
  it.each([
    [
      'comment-only token',
      `// requireAuth(request, handler)\nexport async function POST() { return Response.json({ ok: true }); }`,
    ],
    [
      'string-only token',
      `export async function POST() { const note = 'auth.getUser('; return Response.json({ note }); }`,
    ],
    [
      'dead guarded helper',
      `
        import { requireAuth } from '@/app/api/_lib/middleware';
        function dead(request: Request) { return requireAuth(request, async () => Response.json({ ok: true })); }
        export async function POST() { return Response.json({ ok: true }); }
      `,
    ],
    [
      'unused guarded import',
      `
        import { guardedHandler } from './shared';
        export async function POST() { return Response.json({ ok: true }); }
      `,
    ],
    [
      'unrelated guard call',
      `
        import { requireAuth } from '@/app/api/_lib/middleware';
        export async function POST(request: Request) {
          requireAuth(request, async () => Response.json({ ignored: true }));
          return Response.json({ exposed: true });
        }
      `,
    ],
    [
      'secret identifier without enforcement',
      `
        export async function POST() {
          const secret = process.env.CRON_SECRET;
          return Response.json({ configured: Boolean(secret) });
        }
      `,
    ],
    [
      'getUser without fail-closed denial',
      `
        export async function POST() {
          const supabase = await getClient();
          const { data: { user } } = await supabase.auth.getUser();
          return Response.json({ user });
        }
      `,
    ],
    [
      'locally shadowed guard name',
      `
        function requireAuth(_request: Request, handler: () => Response) { return handler(); }
        export async function POST(request: Request) {
          return requireAuth(request, () => Response.json({ exposed: true }));
        }
      `,
    ],
    [
      'session guard after an early success path',
      `
        export async function POST(request: Request) {
          if (request.headers.get('x-bypass')) return Response.json({ exposed: true });
          const supabase = await getClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return jsonUnauthorized('Authentication required');
          return Response.json({ userId: user.id });
        }
      `,
    ],
    [
      'secret guard after an early success path',
      `
        export async function POST(request: Request) {
          if (request.headers.get('x-bypass')) return Response.json({ exposed: true });
          const secret = process.env.ADMIN_SECRET_TOKEN;
          const provided = request.headers.get('x-admin-token');
          if (!secret || provided !== secret) return jsonError('Unauthorized', 401);
          return Response.json({ protected: true });
        }
      `,
    ],
  ])('rejects %s evidence', (_label, routeSource) => {
    const extras: Record<string, string> = {};
    if (routeSource.includes("'./shared'")) {
      extras[`${ROOT}/app/api/example/shared.ts`] = `
            import { requireAuth } from '@/app/api/_lib/middleware';
            export function guardedHandler(request: Request) {
              return requireAuth(request, async () => Response.json({ ok: true }));
            }
          `;
    }
    expect(analyze(routeSource, extras)).toEqual([
      expect.objectContaining({ method: 'POST', covered: false }),
    ]);
  });

  it('does not let one guarded method certify an unguarded sibling', () => {
    const coverage = analyze(`
      import { requireAuth } from '@/app/api/_lib/middleware';
      export async function GET(request: Request) {
        return requireAuth(request, async () => Response.json({ ok: true }));
      }
      export async function POST() { return Response.json({ exposed: true }); }
    `);
    expect(coverage).toEqual([
      expect.objectContaining({ method: 'GET', covered: true }),
      expect.objectContaining({ method: 'POST', covered: false }),
    ]);
  });

  it.each([
    [
      'a property call with an unused trusted auth import',
      `
        import { requireAuth } from '@/app/api/_lib/middleware';
        const fake = { requireAuth: (_request: Request, handler: () => Response) => handler() };
        export async function POST(request: Request) {
          return fake.requireAuth(request, () => Response.json({ exposed: true }));
        }
      `,
    ],
    [
      'a similarly named import from the wrong module',
      `
        import { requireAuth } from './lookalike';
        export async function POST(request: Request) {
          return requireAuth(request, () => Response.json({ exposed: true }));
        }
      `,
    ],
    [
      'a parameter shadowing a trusted auth import',
      `
        import { requireAuth } from '@/app/api/_lib/middleware';
        export async function POST(
          request: Request,
          requireAuth = (_request: Request, handler: () => Response) => handler(),
        ) {
          return requireAuth(request, () => Response.json({ exposed: true }));
        }
      `,
    ],
  ])('rejects %s', (_label, routeSource) => {
    expect(
      analyze(routeSource, {
        [`${ROOT}/app/api/example/lookalike.ts`]: `
          export function requireAuth(_request: Request, handler: () => Response) {
            return handler();
          }
        `,
      }),
    ).toEqual([expect.objectContaining({ method: 'POST', covered: false })]);
  });

  it.each([
    [
      'an untrusted server client',
      `
        import { jsonUnauthorized } from '@/app/api/_lib/response';
        import { createServerClient } from './fake-supabase';
        export async function POST() {
          const supabase = await createServerClient();
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error || !user) return jsonUnauthorized('Authentication required');
          return Response.json({ userId: user.id });
        }
      `,
    ],
    [
      'a non-awaited auth result',
      `
        import { jsonUnauthorized } from '@/app/api/_lib/response';
        import { createServerClient } from '@/lib/supabase/server';
        export async function POST() {
          const supabase = await createServerClient();
          const { data: { user }, error } = supabase.auth.getUser();
          if (error || !user) return jsonUnauthorized('Authentication required');
          return Response.json({ userId: user.id });
        }
      `,
    ],
    [
      'only the auth error',
      `
        import { jsonUnauthorized } from '@/app/api/_lib/response';
        import { createServerClient } from '@/lib/supabase/server';
        export async function POST() {
          const supabase = await createServerClient();
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error) return jsonUnauthorized('Authentication required');
          return Response.json({ userId: user?.id });
        }
      `,
    ],
    [
      'only an absent user',
      `
        import { jsonUnauthorized } from '@/app/api/_lib/response';
        import { createServerClient } from '@/lib/supabase/server';
        export async function POST() {
          const supabase = await createServerClient();
          const { data: { user }, error } = await supabase.auth.getUser();
          if (!user) return jsonUnauthorized('Authentication required');
          return Response.json({ userId: user.id, error });
        }
      `,
    ],
    [
      'wrong error polarity',
      `
        import { jsonUnauthorized } from '@/app/api/_lib/response';
        import { createServerClient } from '@/lib/supabase/server';
        export async function POST() {
          const supabase = await createServerClient();
          const { data: { user }, error } = await supabase.auth.getUser();
          if (!error || !user) return jsonUnauthorized('Authentication required');
          return Response.json({ userId: user.id });
        }
      `,
    ],
    [
      'a partial missing-user condition',
      `
        import { jsonUnauthorized } from '@/app/api/_lib/response';
        import { createServerClient } from '@/lib/supabase/server';
        export async function POST(request: Request) {
          const supabase = await createServerClient();
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error || (!user && request.headers.has('x-flag'))) {
            return jsonUnauthorized('Authentication required');
          }
          return Response.json({ userId: user?.id });
        }
      `,
    ],
    [
      'side effects between auth and denial',
      `
        import { jsonUnauthorized } from '@/app/api/_lib/response';
        import { createServerClient } from '@/lib/supabase/server';
        export async function POST() {
          const supabase = await createServerClient();
          const { data: { user }, error } = await supabase.auth.getUser();
          await recordProtectedActivity();
          if (error || !user) return jsonUnauthorized('Authentication required');
          return Response.json({ userId: user.id });
        }
      `,
    ],
    [
      'success between auth and denial',
      `
        import { jsonUnauthorized } from '@/app/api/_lib/response';
        import { createServerClient } from '@/lib/supabase/server';
        export async function POST(request: Request) {
          const supabase = await createServerClient();
          const { data: { user }, error } = await supabase.auth.getUser();
          if (request.headers.has('x-bypass')) return Response.json({ exposed: true });
          if (error || !user) return jsonUnauthorized('Authentication required');
          return Response.json({ userId: user.id });
        }
      `,
    ],
    [
      'a locally shadowed denial helper',
      `
        import { jsonUnauthorized } from '@/app/api/_lib/response';
        import { createServerClient } from '@/lib/supabase/server';
        export async function POST(
          _request: Request,
          jsonUnauthorized = (_message: string) => Response.json({ exposed: true }),
        ) {
          const supabase = await createServerClient();
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error || !user) return jsonUnauthorized('Authentication required');
          return Response.json({ userId: user.id });
        }
      `,
    ],
    [
      'a locally shadowed NextResponse denial',
      `
        import { NextResponse } from 'next/server';
        import { createServerClient } from '@/lib/supabase/server';
        export async function POST(
          _request: Request,
          NextResponse = { json: (body: unknown) => Response.json(body) },
        ) {
          const supabase = await createServerClient();
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error || !user) return NextResponse.json({}, { status: 401 });
          return Response.json({ userId: user.id });
        }
      `,
    ],
  ])('rejects session evidence from %s', (_label, routeSource) => {
    expect(
      analyze(routeSource, {
        [`${ROOT}/app/api/example/fake-supabase.ts`]: `
          export async function createServerClient() { return {} as never; }
        `,
      }),
    ).toEqual([expect.objectContaining({ method: 'POST', covered: false })]);
  });

  it.each([
    [
      'a self-comparison',
      `
        const secret = process.env.CRON_SECRET;
        const authorization = request.headers.get('authorization');
        if (!secret || authorization !== authorization) return jsonError('Unauthorized', 401);
      `,
    ],
    [
      'a reversed deny-on-equality comparison',
      `
        const secret = process.env.CRON_SECRET;
        const authorization = request.headers.get('authorization');
        if (!secret || authorization === \`Bearer \${secret}\`) return jsonError('Unauthorized', 401);
      `,
    ],
    [
      'an unrelated request header',
      `
        const secret = process.env.CRON_SECRET;
        const authorization = request.headers.get('x-api-key');
        if (!secret || authorization !== \`Bearer \${secret}\`) return jsonError('Unauthorized', 401);
      `,
    ],
    [
      'two configured secret bindings',
      `
        const firstSecret = process.env.CRON_SECRET;
        const secret = process.env.ADMIN_SECRET_TOKEN;
        const authorization = request.headers.get('authorization');
        if (!secret || authorization !== \`Bearer \${secret}\`) return jsonError('Unauthorized', 401);
      `,
    ],
    [
      'a credential-to-secret equality in the denial branch',
      `
        const secret = process.env.CRON_SECRET;
        const authorization = request.headers.get('authorization');
        if (!secret || authorization === \`Bearer \${secret}\`) return jsonError('Unauthorized', 403);
      `,
    ],
    [
      'reversed credential operands',
      `
        const secret = process.env.CRON_SECRET;
        const authorization = request.headers.get('authorization');
        if (!secret || \`Bearer \${secret}\` !== authorization) return jsonError('Unauthorized', 401);
      `,
    ],
  ])('rejects secret evidence from %s', (_label, guardBody) => {
    expect(
      analyze(`
        import { jsonError } from '@/app/api/_lib/response';
        export async function POST(request: Request) {
          ${guardBody}
          return Response.json({ protected: true });
        }
      `),
    ).toEqual([expect.objectContaining({ method: 'POST', covered: false })]);
  });

  it('rejects a locally shadowed secret denial helper', () => {
    expect(
      analyze(`
        import { jsonError } from '@/app/api/_lib/response';
        export async function POST(
          request: Request,
          jsonError = (_message: string, _status: number) => Response.json({ exposed: true }),
        ) {
          const secret = process.env.CRON_SECRET;
          const authorization = request.headers.get('authorization');
          if (!secret || authorization !== \`Bearer \${secret}\`) {
            return jsonError('Unauthorized', 401);
          }
          return Response.json({ protected: true });
        }
      `),
    ).toEqual([expect.objectContaining({ method: 'POST', covered: false })]);
  });

  it('rejects a locally shadowed process binding as a configured secret', () => {
    expect(
      analyze(`
        import { jsonError } from '@/app/api/_lib/response';
        export async function POST(
          request: Request,
          process = { env: { CRON_SECRET: 'attacker-controlled' } },
        ) {
          const secret = process.env.CRON_SECRET;
          const authorization = request.headers.get('authorization');
          if (!secret || authorization !== \`Bearer \${secret}\`) {
            return jsonError('Unauthorized', 401);
          }
          return Response.json({ protected: true });
        }
      `),
    ).toEqual([expect.objectContaining({ method: 'POST', covered: false })]);
  });

  it('rejects protected work before an invoked secret predicate', () => {
    expect(
      analyze(`
        import { jsonError } from '@/app/api/_lib/response';
        function isAuthorized(request: Request): boolean {
          const secret = process.env.CRON_SECRET;
          const authorization = request.headers.get('authorization');
          return Boolean(secret && authorization === \`Bearer \${secret}\`);
        }
        export async function POST(request: Request) {
          const result = performProtectedWork();
          if (!isAuthorized(request)) return jsonError('Unauthorized', 401);
          return Response.json({ result });
        }
      `),
    ).toEqual([expect.objectContaining({ method: 'POST', covered: false })]);
  });

  it('rejects a shadowed Boolean in a secret predicate', () => {
    expect(
      analyze(`
        import { jsonError } from '@/app/api/_lib/response';
        function isAuthorized(
          request: Request,
          Boolean = (_value: unknown) => true,
        ): boolean {
          const secret = process.env.CRON_SECRET;
          const authorization = request.headers.get('authorization');
          return Boolean(secret && authorization === \`Bearer \${secret}\`);
        }
        export async function POST(request: Request) {
          if (!isAuthorized(request)) return jsonError('Unauthorized', 401);
          return Response.json({ protected: true });
        }
      `),
    ).toEqual([expect.objectContaining({ method: 'POST', covered: false })]);
  });

  it('rejects a locally shadowed non-auth wrapper', () => {
    expect(
      analyze(
        `
          import { withCSRFProtection } from '@/lib/security/csrf';
          export async function POST(request: Request) {
            const withCSRFProtection = (callback: () => Response) => () => callback();
            return withCSRFProtection(() => Response.json({ exposed: true }))(request);
          }
        `,
        {
          [`${ROOT}/lib/security/csrf.ts`]: `
            export function withCSRFProtection(callback: () => Response) { return callback; }
          `,
        },
      ),
    ).toEqual([expect.objectContaining({ method: 'POST', covered: false })]);
  });

  it('rejects a similarly named non-auth wrapper from the wrong module', () => {
    expect(
      analyze(
        `
          import { requireAuth } from '@/app/api/_lib/middleware';
          import { withCSRFProtection } from './csrf-lookalike';
          export async function POST(request: Request) {
            return withCSRFProtection(
              () => requireAuth(request, async () => Response.json({ protected: true })),
            )(request);
          }
        `,
        {
          [`${ROOT}/app/api/example/csrf-lookalike.ts`]: `
            export function withCSRFProtection(callback: () => Response) { return callback; }
          `,
        },
      ),
    ).toEqual([expect.objectContaining({ method: 'POST', covered: false })]);
  });

  it('follows only invoked aliased imports and direct re-exports', () => {
    const shared = `${ROOT}/app/api/example/shared.ts`;
    const extras = {
      [shared]: `
        import { requireAuthWithRateLimit } from '@/app/api/_lib/middleware';
        export function guardedHandler(request: Request) {
          return requireAuthWithRateLimit(request, async () => Response.json({ ok: true }));
        }
      `,
    };
    const coverage = analyze(
      `
        import { guardedHandler as aliasedHandler } from './shared';
        export { aliasedHandler as GET };
        export { guardedHandler as POST } from './shared';
      `,
      extras,
    );
    expect(coverage).toEqual([
      expect.objectContaining({ method: 'GET', covered: true }),
      expect.objectContaining({ method: 'POST', covered: true }),
    ]);
  });

  it('accepts a reachable fail-closed session check', () => {
    expect(
      analyze(`
        import { jsonUnauthorized } from '@/app/api/_lib/response';
        import { createServerClient } from '@/lib/supabase/server';
        export async function POST() {
          const supabase = await createServerClient();
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error || !user) return jsonUnauthorized('Authentication required');
          return Response.json({ userId: user.id });
        }
      `),
    ).toEqual([expect.objectContaining({ method: 'POST', covered: true })]);
  });

  it('accepts an actual reachable fail-closed secret comparison', () => {
    expect(
      analyze(`
        import { jsonError } from '@/app/api/_lib/response';
        export async function POST(request: Request) {
          const secret = process.env.CRON_SECRET;
          const authorization = request.headers.get('authorization');
          if (!secret || authorization !== \`Bearer \${secret}\`) {
            return jsonError('Unauthorized', 401);
          }
          return Response.json({ protected: true });
        }
      `),
    ).toEqual([expect.objectContaining({ method: 'POST', covered: true })]);
  });

  it('follows a directly invoked fail-closed secret predicate helper', () => {
    expect(
      analyze(`
        import { jsonError } from '@/app/api/_lib/response';
        function isAuthorized(request: Request): boolean {
          const secret = process.env.CRON_SECRET;
          const authorization = request.headers.get('authorization');
          return Boolean(secret && authorization === \`Bearer \${secret}\`);
        }
        export async function POST(request: Request) {
          if (!isAuthorized(request)) return jsonError('Unauthorized', 401);
          return Response.json({ protected: true });
        }
      `),
    ).toEqual([expect.objectContaining({ method: 'POST', covered: true })]);
  });

  it('accepts a symbol-resolved alias of the trusted auth import', () => {
    expect(
      analyze(`
        import { requireAuth as enforceSession } from '@/app/api/_lib/middleware';
        export async function POST(request: Request) {
          return enforceSession(request, async () => Response.json({ protected: true }));
        }
      `),
    ).toEqual([expect.objectContaining({ method: 'POST', covered: true })]);
  });

  it('fails closed when public policy syntax is not fully supported', () => {
    const policy = `${ROOT}/lib/middleware.ts`;
    const loader = loaderFor({
      [policy]: `function isPublicApiPath(path: string) { return path === '/api/public'; }`,
    });
    expect(() => extractPublicApiPrefixes(policy, loader)).toThrow(
      'Unsupported isPublicApiPath policy syntax',
    );
  });

  it('prints the uncovered HTTP method and actionable remediation', () => {
    const output = formatUncoveredMethods('/api/example', 'app/api/example/route.ts', [
      { method: 'GET', covered: true },
      { method: 'POST', covered: false },
    ]).join('\n');
    expect(output).toContain('POST /api/example');
    expect(output).toContain('return requireAuth()');
    expect(output).not.toContain('GET /api/example');
  });
});
