'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/mq/button';
import { FingerprintButton } from '@/components/auth/FingerprintButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/mq/alert';
import { Icons } from '@/components/ui/icons';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import { toastUtils } from '@/lib/utils/toast';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function LoginClient() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/home';

  const supabase = createBrowserClient();



  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      // If we are currently handling a login (isLoading), don't auto-redirect via this check
      // This prevents the "fast redirect" race condition the user reported
      if (isLoading) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push(redirectTo);
      }
    };
    checkUser();
  }, [supabase.auth, router, redirectTo, isLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Enforce minimum 60s wait (1 minute) per user request
      const minWait = new Promise(resolve => setTimeout(resolve, 6300));

      const [authResult] = await Promise.all([
        supabase.auth.signInWithPassword({
          email,
          password,
        }).catch(err => ({ error: err })), // Catch auth errors to prevent fail-fast
        minWait
      ]);

      const { error } = authResult || {};

      if (error) {
        setError(error.message);
        return;
      }

      toastUtils.success(t('welcomeBack'), t('loginSuccess'));
      router.push(redirectTo);
    } catch {
      setError(t('unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth disabled - requires Supabase configuration
  // const handleGoogleLogin = async () => { ... }

  return (
    <div className="min-h-screen flex items-center justify-center bg-mq-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-65 h-65 flex items-center justify-center">
              {/* Use consistent MQ branding logo */}
              <img
                src="/MQ_Logo_Final.png"
                alt="Macquarie University Logo"
                className="object-contain w-full h-full drop-shadow-xl"
              />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            {t('welcomeTo', { appName: APP_CONFIG.name })}
          </CardTitle>
          <CardDescription className="text-center">
            {t('signInToAccess', { uniName: UNIVERSITY_CONFIG.name })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="error">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="flex justify-center mt-6 mb-6">
              <FingerprintButton
                type="submit"
                isLoading={isLoading}
                className="mx-auto" /* Center the fixed-width button */
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-mq-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-mq-card-background px-2 text-mq-content-secondary">
                  {t('orSignWith')}
                </span>
              </div>
            </div>
          </form>

          <div className="text-center text-sm text-mq-content-secondary mt-6 p-4 bg-mq-info/10 rounded-mq-lg border border-mq-info/20">
            <div className="font-medium text-mq-info mb-1">{t('oauthRequired')}</div>
            <div className="text-xs">
              {t('googleOAuthDesc')}
            </div>
          </div>

          <div className="text-center text-sm text-mq-content-secondary">
            <p>
              {t('noAccount')}{' '}
              <button
                onClick={() => router.push('/signup')}
                className="text-mq-primary hover:underline font-medium"
                disabled={isLoading}
              >
                {t('signUp')}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
