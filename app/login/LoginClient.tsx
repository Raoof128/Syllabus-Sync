'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { FingerprintButton } from '@/components/auth/FingerprintButton';
import { Input } from '@/components/ui/mq/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/mq/alert';
import { Button } from '@/components/ui/mq/button';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import { toastUtils } from '@/lib/utils/toast';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { AlertTriangle, Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react';

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
      setError(t('loginErrorMissingFields'));
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
          setError(t('loginErrorInvalidCredentials'));
        } else if (authError.message.includes('Email not confirmed')) {
          setError(t('loginErrorEmailNotConfirmed'));
        } else if (authError.message.includes('Too many requests')) {
          setError(t('loginErrorTooManyRequests'));
        } else {
          setError(authError.message);
        }

        setIsLoading(false);
        return;
      }

      if (!data?.session) {
        setIsError(true);
        setError(t('loginErrorFailed'));
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

  // Handle OAuth login (Placeholder)
  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    // For now, show a "coming soon" message as these require backend setup
    // In a real implementation:
    // const { error } = await supabase.auth.signInWithOAuth({ provider });
    const providerName = provider === 'google' ? t('loginWithGoogle') : t('loginWithFacebook');
    toastUtils.info(t('featureComingSoon'), t('oauthComingSoon', { provider: providerName }));
  };

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
    <div className="login-page min-h-screen flex items-center justify-center bg-mq-background p-0 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/32 to-mq-background/85" />

      <div className="relative z-10 w-full max-w-none min-h-[calc(100vh)] h-[calc(100vh)] overflow-hidden bg-mq-background/10 border border-mq-border/18 backdrop-blur-3xl shadow-[0_18px_70px_rgba(0,0,0,0.25)] flex flex-col lg:flex-row">
        {/* Left Panel */}
        <div className="w-full lg:w-5/12 bg-mq-background text-mq-content backdrop-blur-xl border-b lg:border-b-0 lg:border-r border-mq-border px-8 lg:px-12 py-12 flex flex-col">
          <div className="flex items-center justify-center mb-8">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <Image
                src="/MQ_Logo_Final.png"
                alt={t('mqLogoAlt')}
                fill
                className="object-contain drop-shadow-xl"
                priority
              />
            </div>
          </div>

          <div className="space-y-2 mb-6 text-center">
            <h1 className="text-2xl font-bold text-mq-content">
              {t('welcomeTo', { appName: APP_CONFIG.name })}
            </h1>
            <p className="text-mq-content font-medium">
              {t('signInToAccess', { uniName: UNIVERSITY_CONFIG.name })}
            </p>
            <p className="text-sm text-mq-content font-medium">
              {t('noAccount')}{' '}
              <button type="button" className="text-mq-primary hover:underline font-bold">
                {t('signUp')}
              </button>
            </p>
          </div>

          {error && (
            <Alert variant="error" className="mb-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {showForgotPassword ? (
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
                  <h3 className="text-lg font-bold text-mq-content">{t('resetPasswordSent')}</h3>
                  <p className="text-sm text-mq-content font-medium">{t('resetPasswordSentDesc')}</p>
                  <Button
                    variant="outline"
                    className="w-full font-bold"
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
                  <p className="text-sm text-mq-content font-medium text-center">
                    {t('forgotPasswordDesc')}
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-mq-content font-bold">
                      {t('email')}
                    </Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      disabled={isLoading}
                      className="h-12 rounded-xl text-mq-content font-medium"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-full font-bold" disabled={isLoading}>
                    {isLoading ? '...' : t('sendResetLink')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full font-semibold"
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
            <form onSubmit={handleLogin} className="space-y-4 flex-1 flex flex-col">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-mq-content font-bold">
                  {t('email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={isLoading || isSuccess}
                  className="h-12 rounded-xl text-mq-content font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-mq-content font-bold">
                  {t('password')}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={isLoading || isSuccess}
                    className="pr-10 h-12 rounded-xl text-mq-content font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mq-content hover:text-mq-primary transition-colors"
                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                    disabled={isLoading || isSuccess}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setError(null);
                  }}
                  className="text-mq-primary hover:underline font-bold"
                  disabled={isLoading || isSuccess}
                >
                  {t('forgotPassword')}
                </button>
              </div>

              <div className="pt-2 flex justify-center">
                <FingerprintButton
                  type="submit"
                  text={t('signIn')}
                  disabled={isLoading || isSuccess}
                  isLoading={isLoading}
                  isSuccess={isSuccess}
                  isError={isError}
                  onAnimationComplete={handleAnimationComplete}
                  className="w-full max-w-[260px] font-bold"
                />
              </div>

              <div className="text-center text-sm text-mq-content font-medium">
                <p>
                  {t('noAccount')}{' '}
                  <button type="button" className="text-mq-primary hover:underline font-bold">
                    {t('signUp')}
                  </button>
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-mq-content font-semibold pt-2">
                <div className="h-px flex-1 bg-mq-border" />
                <span>{t('orSignWith')}</span>
                <div className="h-px flex-1 bg-mq-border" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-full flex items-center justify-center gap-2 font-bold"
                  onClick={() => handleOAuthLogin('google')}
                >
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 533.5 544.3"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M533.5 278.4c0-17.4-1.5-34.1-4.3-50.4H272.1v95.4h146.9c-6.3 34-25 62.8-53.4 82.1v68.2h86.5c50.7-46.7 81.4-115.5 81.4-195.3z"
                    />
                    <path
                      fill="#34A853"
                      d="M272.1 544.3c72.4 0 133.1-23.9 177.5-64.9l-86.5-68.2c-24.1 16.2-55 25.7-90.9 25.7-69.9 0-129.3-47.2-150.5-110.7H34.1v69.6c44.5 88.3 136.1 148.5 238 148.5z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M121.6 325.9c-10-29.6-10-61.5 0-91.1v-69.6H34.1c-44.5 88.3-44.5 192.1 0 280.4l87.5-69.7z"
                    />
                    <path
                      fill="#EA4335"
                      d="M272.1 107.7c37.1-.6 72.6 12.8 99.8 37.8l74.5-74.5C405.1 24 345.4 0 272.1 0 170.2 0 78.6 60.2 34.1 148.5l87.5 69.7c21.1-63.5 80.6-110.7 150.5-110.7z"
                    />
                  </svg>
                  {t('loginWithGoogle')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-full flex items-center justify-center gap-2 font-bold"
                  onClick={() => handleOAuthLogin('facebook')}
                >
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M22.675 0h-21.35C.597 0 0 .597 0 1.333v21.334C0 23.403.597 24 1.325 24h11.495v-9.294H9.847v-3.622h2.973V8.413c0-2.937 1.793-4.54 4.413-4.54 1.255 0 2.332.093 2.646.135v3.07l-1.818.001c-1.428 0-1.704.678-1.704 1.674v2.195h3.406l-.444 3.622h-2.962V24h5.805C23.403 24 24 23.403 24 22.667V1.333C24 .597 23.403 0 22.675 0z" />
                  </svg>
                  {t('loginWithFacebook')}
                </Button>
              </div>

              <div className="pt-4 text-center text-xs text-mq-content font-medium">
                © {new Date().getFullYear()} {UNIVERSITY_CONFIG.name}
              </div>
            </form>
          )}
        </div>

        {/* Right Panel */}
        <div className="relative flex-1 lg:w-7/12 bg-black/55">
          <Image
            src="/images/login-bg.png"
            alt={t('mqSignpostAlt')}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a]/88 via-[#0a2f3c]/82 to-[#0f172a]/90" />
          <div className="relative z-10 h-full w-full p-8 lg:p-12 flex flex-col justify-between text-white">
            <div className="space-y-4 max-w-xl">
              <p className="uppercase tracking-[0.2em] text-xs text-white/70">{t('campusNavigation')}</p>
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                {t('loginHeroTitle')}
              </h2>
              <p className="text-white text-sm lg:text-base max-w-xl">
                {t('loginHeroDescription')}
              </p>
              <button className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-mq-primary transition-colors">
                {t('exploreMap')}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="relative flex-1 w-full mt-10 lg:mt-0">
              <div className="absolute left-6 top-6 bg-white/15 backdrop-blur-lg rounded-2xl w-16 h-16 flex items-center justify-center shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l7 19-7-4-7 4 7-19z" />
                </svg>
              </div>

              <div className="absolute right-6 bottom-6 bg-white/12 backdrop-blur-xl border border-white/20 rounded-2xl w-[260px] p-4 shadow-[0_14px_48px_rgba(0,0,0,0.3)] space-y-2">
                <p className="text-sm font-semibold text-white">{t('todaysClassesDemo')}</p>
                <div className="flex items-center justify-between text-xs text-white/80">
                  <span>COMP2310</span>
                  <span>10:00 AM</span>
                </div>
                <div className="flex items-center justify-between text-xs text-white/80">
                  <span>Room 4RPD</span>
                  <span>Macquarie Walk</span>
                </div>
                <div className="h-px bg-white/20" />
                <div className="text-xs text-white/70">
                  {t('navigateNextClassDemo')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
