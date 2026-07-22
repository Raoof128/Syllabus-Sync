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
        export async function POST() {
          const supabase = await getClient();
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
