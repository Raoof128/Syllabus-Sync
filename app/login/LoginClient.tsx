'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/mq/button';
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

  // Add debug logging
  console.debug('🔍 LoginClient rendered, supabase client:', !!supabase);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push(redirectTo);
      }
    };
    checkUser();
  }, [supabase.auth, router, redirectTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      toastUtils.success(t('welcomeBack'), t('loginSuccess'));
      router.push(redirectTo);
    } catch (err) {
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
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-mq-primary rounded-mq-lg flex items-center justify-center">
              <Icons.Graduation className="w-6 h-6 text-white" />
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
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? t('signingIn') : t('signIn')}
            </Button>
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
