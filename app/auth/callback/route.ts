import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Email Verification Callback Handler
 *
 * This route handles the OAuth/email verification callback from Supabase.
 * When a user clicks the verification link in their email, Supabase redirects
 * them here with a temporary `code` parameter. We exchange this code for a
 * permanent session cookie.
 *
 * SECURITY: This is the "Key Exchange" - the temporary code is single-use
 * and time-limited. Exchanging it for a session cookie establishes the user's
 * authenticated state securely.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createServerClient();

    // The handshake: Exchange temporary code for permanent session
    // This validates the code with Supabase and sets the session cookie
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // Log error but redirect to login - user can try again
      console.error('Email verification error:', error.message);
      return NextResponse.redirect(new URL('/login?error=verification_failed', request.url));
    }
  }

  // Redirect to home (dashboard) after successful verification
  // The session cookie is now set and middleware will recognize the user
  return NextResponse.redirect(new URL('/home', request.url));
}
