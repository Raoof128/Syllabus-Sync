'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/mq/button';

interface AuthRedirectHandlerProps {
  fallbackRedirect: string;
}

/**
 * Handles auth redirects from Supabase email links.
 *
 * When users click email verification or password reset links,
 * Supabase redirects them to the configured redirect_to URL with tokens in the hash fragment.
 * This component detects those tokens and redirects appropriately.
 */
export default function AuthRedirectHandler({ fallbackRedirect }: AuthRedirectHandlerProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'processing' | 'redirecting' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const handledRef = useRef(false);
  const supabase = createBrowserClient();

  // Check for recovery/auth tokens on mount
  useEffect(() => {
    if (typeof window === 'undefined' || handledRef.current) return;

    const hash = window.location.hash;
    const search = window.location.search;

    // Parse hash fragment - Supabase puts tokens here after PKCE flow
    // Format: #access_token=xxx&token_type=bearer&type=recovery&...
    const hashParams = new URLSearchParams(hash.substring(1));
    const searchParams = new URLSearchParams(search);

    const typeFromHash = hashParams.get('type');
    const typeFromSearch = searchParams.get('type');
    const type = typeFromHash || typeFromSearch;

    const error = hashParams.get('error') || searchParams.get('error');
    const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');

    console.log('AuthRedirectHandler: Checking URL', {
      hash: hash ? hash.substring(0, 50) + '...' : 'none',
      type,
      error
    });

    // Handle errors
    if (error) {
      console.error('AuthRedirectHandler: Error in URL', { error, errorDescription });
      handledRef.current = true;
      setStatus('error');
      setErrorMessage(errorDescription || error || 'Authentication failed.');
      return;
    }

    // If type=recovery, redirect to /reset-password with the hash
    if (type === 'recovery') {
      console.log('AuthRedirectHandler: Recovery detected, redirecting to /reset-password');
      handledRef.current = true;
      setStatus('redirecting');
      // Pass the entire hash to reset-password so it can process the tokens
      router.replace(`/reset-password${hash}`);
      return;
    }

    // Check if there are auth tokens in the hash
    const hasAuthTokens = hash && (hash.includes('access_token') || hash.includes('refresh_token'));

    if (!hasAuthTokens) {
      // No auth params - redirect to fallback
      console.log('AuthRedirectHandler: No auth params, redirecting to fallback');
      router.replace(fallbackRedirect);
      return;
    }

    // Has auth tokens but not recovery type - let Supabase process
    setStatus('processing');
  }, [router, fallbackRedirect]);

  // Listen for auth state changes from Supabase
  useEffect(() => {
    if (handledRef.current) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: unknown) => {
        if (handledRef.current) return;

        console.log('AuthRedirectHandler: Auth state change:', event);

        if (event === 'PASSWORD_RECOVERY' && session) {
          // Recovery flow - redirect to reset-password
          handledRef.current = true;
          setStatus('redirecting');
          router.replace('/reset-password');
        } else if (event === 'SIGNED_IN' && session) {
          // Normal sign in - redirect to home
          handledRef.current = true;
          setStatus('redirecting');
          router.replace('/home');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  // Fallback timeout - if nothing happens after 5 seconds, redirect to fallback
  useEffect(() => {
    if (handledRef.current || status !== 'processing') return;

    const timeout = setTimeout(async () => {
      if (handledRef.current) return;

      console.log('AuthRedirectHandler: Timeout, checking session');
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        handledRef.current = true;
        setStatus('redirecting');
        router.replace('/home');
      } else {
        // No session - redirect to fallback
        router.replace(fallbackRedirect);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [status, router, supabase.auth, fallbackRedirect]);

  // Show error state
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mq-background px-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-2xl border border-mq-border bg-mq-card-background shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-mq-content">Link Expired or Invalid</h1>
              <p className="text-sm text-mq-content-secondary">
                {errorMessage || 'The password reset link has expired or is invalid. Please request a new one.'}
              </p>
            </div>
            <div className="space-y-3">
              <Button
                type="button"
                className="w-full h-12 rounded-xl font-bold"
                onClick={() => router.push('/reset-password')}
              >
                Request New Reset Link
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-xl font-bold"
                onClick={() => router.push('/login')}
              >
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-mq-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-mq-primary" />
        <p className="mt-4 text-mq-content-secondary">
          {status === 'loading' && 'Loading...'}
          {status === 'processing' && 'Verifying your request...'}
          {status === 'redirecting' && 'Redirecting...'}
        </p>
      </div>
    </div>
  );
}
