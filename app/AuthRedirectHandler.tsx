'use client';

import { useEffect, useState, useRef } from 'react';
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
  const handledRef = useRef(false);
  const supabase = createBrowserClient();

  // IMMEDIATE check on mount - detect recovery type and redirect before anything else
  useEffect(() => {
    if (typeof window === 'undefined' || handledRef.current) return;

    const hash = window.location.hash;
    const search = window.location.search;

    // Parse hash fragment - Supabase puts tokens here after PKCE flow
    // Format: #access_token=xxx&token_type=bearer&type=recovery&...
    const hashParams = new URLSearchParams(hash.substring(1));
    const searchParamsLocal = new URLSearchParams(search);

    const typeFromHash = hashParams.get('type');
    const typeFromSearch = searchParamsLocal.get('type');
    const type = typeFromHash || typeFromSearch;

    console.log('AuthRedirectHandler: Checking for recovery', {
      hash: hash ? 'present' : 'none',
      type,
      typeFromHash,
      typeFromSearch
    });

    // If type=recovery is present, redirect to reset-password IMMEDIATELY
    if (type === 'recovery') {
      console.log('AuthRedirectHandler: Recovery detected, redirecting to /reset-password');
      handledRef.current = true;
      setStatus('redirecting');
      // Pass the hash fragment to reset-password page so it can process the tokens
      router.replace(`/reset-password${hash}`);
      return;
    }

    // Check for errors
    const error = searchParams.get('error') || hashParams.get('error');
    const errorCode = searchParams.get('error_code') || hashParams.get('error_code');
    const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');

    if (error || errorCode) {
      console.error('Auth error from URL:', { error, errorCode, errorDescription });
      handledRef.current = true;
      setStatus('error');
      setErrorMessage(errorDescription || error || 'Authentication failed. Please try again.');
      return;
    }

    // Check if there are any auth params at all
    const hasAuthParams = hash && (
      hash.includes('access_token') ||
      hash.includes('refresh_token') ||
      hash.includes('error')
    );

    // No auth params - redirect to fallback
    if (!hasAuthParams) {
      console.log('AuthRedirectHandler: No auth params, redirecting to fallback');
      router.replace(fallbackRedirect);
      return;
    }

    // Has auth params but not recovery - let Supabase handle it
    setStatus('processing');
  }, [router, searchParams, fallbackRedirect]);

  // Listen for auth state changes from Supabase
  useEffect(() => {
    if (handledRef.current) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: unknown) => {
        if (handledRef.current) return;

        console.log('Auth state change:', event);

        if (event === 'PASSWORD_RECOVERY' && session) {
          handledRef.current = true;
          setStatus('redirecting');
          router.replace('/reset-password');
        } else if (event === 'SIGNED_IN' && session) {
          handledRef.current = true;
          setStatus('redirecting');
          router.replace('/home');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase.auth]);

  // Fallback timeout - if nothing happens after 5 seconds, check session manually
  useEffect(() => {
    if (handledRef.current || status !== 'processing') return;

    const timeout = setTimeout(async () => {
      if (handledRef.current) return;

      console.log('AuthRedirectHandler: Timeout, checking session manually');
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        handledRef.current = true;
        setStatus('redirecting');
        router.replace('/home');
      } else {
        // No session after timeout
        router.replace('/login?error=session_timeout');
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [status, router, supabase.auth]);

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
