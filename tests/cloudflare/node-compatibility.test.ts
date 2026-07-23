import { describe, expect, it } from 'vitest';

/**
 * Early warning that the server dependencies bundled into the Worker still
 * resolve and evaluate. This is a Node-level check, not the authoritative
 * Workerd proof — `npm run cf:build` and the preview parity matrix own that.
 */
describe('server dependency import compatibility', () => {
  it('imports Worker-targeted server dependencies', async () => {
    const modules = await Promise.all([
      import('@simplewebauthn/server'),
      import('@supabase/ssr'),
      import('@supabase/supabase-js'),
      import('resend'),
      import('uuid'),
      import('web-push'),
    ]);

    expect(modules).toHaveLength(6);
    for (const module of modules) {
      expect(module).toBeTruthy();
    }
  });

  it('exposes the entry points the application actually calls', async () => {
    const [webauthn, ssr, supabase, resend, uuid, webPush] = await Promise.all([
      import('@simplewebauthn/server'),
      import('@supabase/ssr'),
      import('@supabase/supabase-js'),
      import('resend'),
      import('uuid'),
      import('web-push'),
    ]);

    expect(typeof webauthn.verifyRegistrationResponse).toBe('function');
    expect(typeof webauthn.verifyAuthenticationResponse).toBe('function');
    expect(typeof ssr.createServerClient).toBe('function');
    expect(typeof supabase.createClient).toBe('function');
    expect(typeof resend.Resend).toBe('function');
    expect(typeof uuid.v4).toBe('function');
    expect(typeof (webPush.default ?? webPush).sendNotification).toBe('function');
  });
});
