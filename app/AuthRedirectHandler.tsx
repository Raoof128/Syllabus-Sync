'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
 * Supabase redirects them to the root URL with tokens in the hash fragment.
 * This component detects those tokens, lets Supabase process them,
 * and redirects appropriately based on the auth event.
 */
export default function AuthRedirectHandler({ fallbackRedirect }: AuthRedirectHandlerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'processing' | 'redirecting' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [handled, setHandled] = useState(false);
  const supabase = createBrowserClient();

  // Check for error in URL query params (Supabase sends errors as query params)
  useEffect(() => {
    const error = searchParams.get('error');
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');

    if (error || errorCode) {
      console.error('Auth error from URL:', { error, errorCode, errorDescription });
      setStatus('error');
      setErrorMessage(errorDescription || error || 'Authentication failed. Please try again.');
      setHandled(true);
    }
  }, [searchParams]);

  // Listen for auth state changes - this is the most reliable way to detect recovery
  useEffect(() => {
    if (handled) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: unknown) => {
        if (handled) return;

        console.log('Auth state change:', event);

        if (event === 'PASSWORD_RECOVERY' && session) {
          setHandled(true);
          setStatus('redirecting');
          router.replace('/reset-password');
        } else if (event === 'SIGNED_IN' && session) {
          // Check if this was from hash fragment processing
          const hash = typeof window !== 'undefined' ? window.location.hash : '';
          const params = new URLSearchParams(hash.substring(1));
          const type = params.get('type');

          if (type === 'recovery') {
            setHandled(true);
            setStatus('redirecting');
            router.replace('/reset-password');
          } else if (type === 'signup') {
            setHandled(true);
            setStatus('redirecting');
            router.replace('/home');
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase.auth, handled]);

  // Also handle the case where no auth event fires
  useEffect(() => {
    if (handled) return;

    const handleAuthRedirect = async () => {
      if (typeof window === 'undefined') return;

      const hash = window.location.hash;
      const search = window.location.search;

      // Check both hash and search params for type=recovery
      // Supabase may send it in either location depending on the flow
      const hashParams = new URLSearchParams(hash.substring(1));
      const searchParamsObj = new URLSearchParams(search);

      const typeFromHash = hashParams.get('type');
      const typeFromSearch = searchParamsObj.get('type');
      const type = typeFromHash || typeFromSearch;

      const hasAuthParams = hash && (
        hash.includes('access_token') ||
        hash.includes('error') ||
        hash.includes('type=recovery') ||
        hash.includes('type=signup')
      );

      // Also check URL search params for type=recovery (Supabase sometimes uses this)
      const hasRecoveryInSearch = search.includes('type=recovery');

      // If no auth params anywhere, redirect to fallback immediately
      if (!hasAuthParams && !hasRecoveryInSearch) {
        router.replace(fallbackRedirect);
        return;
      }

      // If type=recovery is present anywhere, redirect to reset-password immediately
      // Don't wait for Supabase to process - let the reset-password page handle it
      if (type === 'recovery') {
        console.log('Recovery type detected, redirecting to reset-password');
        setHandled(true);
        setStatus('redirecting');
        // Pass along any tokens in the hash
        const resetUrl = hash ? `/reset-password${hash}` : '/reset-password';
        router.replace(resetUrl);
        return;
      }

      setStatus('processing');

      // Check for errors in hash
      const error = hashParams.get('error');
      const errorDescription = hashParams.get('error_description');

      // Handle errors
      if (error) {
        console.error('Auth redirect error:', error, errorDescription);
        router.replace(`/login?error=${encodeURIComponent(error)}`);
        return;
      }

      // Wait for auth state change event to handle redirect
      // If it doesn't fire within timeout, fall back to manual check
      await new Promise(resolve => setTimeout(resolve, 3000));

      if (!handled) {
        // Check session manually
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setHandled(true);
          setStatus('redirecting');
          if (type === 'recovery') {
            router.replace('/reset-password');
          } else {
            router.replace('/home');
          }
        } else {
          // No session established
          router.replace('/login?error=session_failed');
        }
      }
    };

    handleAuthRedirect();
  }, [router, supabase.auth, fallbackRedirect, handled]);

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
