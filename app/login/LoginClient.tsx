'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { FingerprintButton } from '@/components/auth/FingerprintButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Input } from '@/components/ui/mq/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/mq/alert';
import { Button } from '@/components/ui/mq/button';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import { toastUtils } from '@/lib/utils/toast';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { AlertTriangle, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function LoginClient() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
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

  const supabaseRef = useRef<SupabaseClient | null>(null);

  const getSupabaseClient = useCallback(async () => {
    if (supabaseRef.current) {
      return supabaseRef.current;
    }

    const { createBrowserClient } = await import('@/lib/supabase/client');
    const client = createBrowserClient();
    supabaseRef.current = client;
    return client;
  }, []);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      if (isLoading || isSuccess) return;
      const client = await getSupabaseClient();
      const {
        data: { session },
      } = await client.auth.getSession();
      if (session) {
        router.push(redirectTo);
      }
    };
    checkUser();
  }, [getSupabaseClient, router, redirectTo, isLoading, isSuccess]);

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
      const client = await getSupabaseClient();
      // Direct Supabase login
      const { data, error: authError } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
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
    } catch {
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

  // Handle forgot password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError(t('emailRequired'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const client = await getSupabaseClient();
      const { error: resetError } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setResetEmailSent(true);
        toastUtils.success(t('resetPasswordSent'), t('resetPasswordSentDesc'));
      }
    } catch {
      setError(t('unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page min-h-screen flex items-center justify-center bg-mq-background p-4">
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
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {showForgotPassword ? (
            // Forgot Password View
            <div className="space-y-4">
              {resetEmailSent ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-mq-success/10 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-mq-success"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">{t('resetPasswordSent')}</h3>
                  <p className="text-sm text-mq-content-secondary">{t('resetPasswordSentDesc')}</p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmailSent(false);
                      setError(null);
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('backToLogin')}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-sm text-mq-content-secondary text-center">
                    {t('forgotPasswordDesc')}
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">{t('email')}</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? '...' : t('sendResetLink')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setError(null);
                    }}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('backToLogin')}
                  </Button>
                </form>
              )}
            </div>
          ) : (
            // Login Form
            <>
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
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      disabled={isLoading || isSuccess}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-mq-content-secondary hover:text-mq-content-primary transition-colors"
                      aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                      disabled={isLoading || isSuccess}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setError(null);
                    }}
                    className="text-sm text-mq-primary hover:underline"
                    disabled={isLoading || isSuccess}
                  >
                    {t('forgotPassword')}
                  </button>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
