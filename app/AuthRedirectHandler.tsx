'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

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
  const [status, setStatus] = useState<'loading' | 'processing' | 'redirecting'>('loading');
  const [handled, setHandled] = useState(false);
  const supabase = createBrowserClient();

  // Listen for auth state changes - this is the most reliable way to detect recovery
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: unknown) => {
        if (handled) return;

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
      const hasAuthParams = hash && (
        hash.includes('access_token') ||
        hash.includes('error') ||
        hash.includes('type=recovery') ||
        hash.includes('type=signup')
      );

      // If no auth params in hash, redirect to fallback immediately
      if (!hasAuthParams) {
        router.replace(fallbackRedirect);
        return;
      }

      setStatus('processing');

      // Parse hash to check for errors
      const params = new URLSearchParams(hash.substring(1));
      const error = params.get('error');
      const errorDescription = params.get('error_description');

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
        const type = params.get('type');

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
