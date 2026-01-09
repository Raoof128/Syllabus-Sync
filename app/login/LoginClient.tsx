'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { FingerprintButton } from '@/components/auth/FingerprintButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Input } from '@/components/ui/mq/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/mq/alert';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import { toastUtils } from '@/lib/utils/toast';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function LoginClient() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Validate redirect URL to prevent open redirect attacks
  const isValidRedirect = useCallback((url: string | null): boolean => {
    if (!url) return false;
    try {
      const decodedUrl = decodeURIComponent(url);
      if (!decodedUrl.startsWith('/')) return false;
      if (decodedUrl.startsWith('//')) return false;
      const parsed = new URL(decodedUrl, window.location.origin);
      if (parsed.origin !== window.location.origin) return false;
      if (!parsed.pathname.startsWith('/')) return false;
      return true;
    } catch {
      return false;
    }
  }, []);

  const rawRedirect = searchParams.get('redirectTo');
  const redirectTo = isValidRedirect(rawRedirect) ? rawRedirect! : '/home';

  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createBrowserClient(), []);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      if (isLoading || isSuccess) return;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.push(redirectTo);
      }
    };
    checkUser();
  }, [supabase.auth, router, redirectTo, isLoading, isSuccess]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    setIsSuccess(false);
    setIsError(false);
    setError(null);

    try {
      // Direct Supabase login
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        console.error('Login error:', authError.message);
        setIsError(true);

        // Map Supabase errors to user-friendly messages
        if (authError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Please check your email to confirm your account');
        } else if (authError.message.includes('Too many requests')) {
          setError('Too many login attempts. Please wait a few minutes.');
        } else {
          setError(authError.message);
        }

        setIsLoading(false);
        return;
      }

      if (!data?.session) {
        setIsError(true);
        setError('Login failed. Please try again.');
        setIsLoading(false);
        return;
      }

      // Success!
      setIsSuccess(true);
      setIsLoading(false);
      toastUtils.success(t('welcomeBack'), t('loginSuccess'));

      // Navigate after success animation
      setTimeout(() => {
        router.push(redirectTo);
      }, 800);
    } catch (err) {
      console.error('Unexpected login error:', err);
      setIsError(true);
      setError(t('unexpectedError'));
      setIsLoading(false);
    }
  };

  // Reset error state after animation completes
  const handleAnimationComplete = useCallback(() => {
    if (isError) {
      setIsError(false);
    }
  }, [isError]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-mq-background p-4">
      <Card className="w-full max-w-md mq-liquid-glass-elevated">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-65 h-65 flex items-center justify-center">
              <Image
                src="/MQ_Logo_Final.png"
                alt={t('mqLogoAlt')}
                width={260}
                height={260}
                className="object-contain w-full h-full drop-shadow-xl"
                priority
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
                autoComplete="email"
                disabled={isLoading || isSuccess}
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
                autoComplete="current-password"
                disabled={isLoading || isSuccess}
              />
            </div>
            <div className="flex justify-center mt-6 mb-6">
              <FingerprintButton
                type="submit"
                isLoading={isLoading}
                isSuccess={isSuccess}
                isError={isError}
                onAnimationComplete={handleAnimationComplete}
                className="mx-auto"
              />
            </div>
          </form>

          <div className="text-center text-sm text-mq-content-secondary">
            <p>
              {t('noAccount')}{' '}
              <button
                type="button"
                onClick={() => router.push('/signup')}
                className="text-mq-primary hover:underline font-medium"
                disabled={isLoading || isSuccess}
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
