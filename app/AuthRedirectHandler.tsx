'use client';

import { useEffect } from 'react';
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
 * Supabase may redirect them to the root URL with tokens in the hash fragment.
 * This component detects those tokens and redirects appropriately.
 */
export default function AuthRedirectHandler({ fallbackRedirect }: AuthRedirectHandlerProps) {
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    const handleAuthRedirect = async () => {
      // Check for hash fragment with auth tokens
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;

        if (hash) {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const type = params.get('type');
          const error = params.get('error');
          const errorDescription = params.get('error_description');

          // Handle errors
          if (error) {
            console.error('Auth redirect error:', error, errorDescription);
            router.replace(`/login?error=${error}`);
            return;
          }

          // Handle password recovery
          if (accessToken && type === 'recovery') {
            // Supabase will auto-handle the session from hash
            // Wait a moment for Supabase to process
            await new Promise(resolve => setTimeout(resolve, 500));

            // Check if session was established
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              router.replace('/reset-password');
              return;
            }
          }

          // Handle signup verification
          if (accessToken && type === 'signup') {
            // Wait for Supabase to process
            await new Promise(resolve => setTimeout(resolve, 500));

            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              router.replace('/home');
              return;
            }
          }

          // Handle magic link or other types
          if (accessToken) {
            await new Promise(resolve => setTimeout(resolve, 500));

            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              router.replace('/home');
              return;
            }
          }
        }

        // No hash or couldn't process - redirect to fallback
        router.replace(fallbackRedirect);
      }
    };

    handleAuthRedirect();
  }, [router, supabase.auth, fallbackRedirect]);

  // Show loading while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-mq-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-mq-primary" />
        <p className="mt-4 text-mq-content-secondary">Loading...</p>
      </div>
    </div>
  );
}

