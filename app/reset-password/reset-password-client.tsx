'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff, Mail } from 'lucide-react';
import { Input } from '@/components/ui/mq/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/mq/button';
import { Alert, AlertDescription } from '@/components/ui/mq/alert';
import { API_ROUTES, SECURITY_CONFIG } from '@/lib/constants/config';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { toastUtils } from '@/lib/utils/toast';
import { createBrowserClient } from '@/lib/supabase/client';
type Mode = 'request' | 'set' | 'loading' | 'success';

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

type RequestForm = z.infer<typeof requestSchema>;
type SetForm = {
  newPassword: string;
  confirmPassword: string;
};

export default function ResetPasswordClient() {
  const { t } = useTypedTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = searchParams.get('code');
  const recovery = searchParams.get('recovery');
  const from = searchParams.get('from');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const isFromSettings = from === 'settings';
  const backHref = isFromSettings ? '/settings/security' : '/login';
  const backLabel = isFromSettings ? t('backToSettings') : t('backToLogin');

  const [hasHashFragment, setHasHashFragment] = useState(false);
  const [hashChecked, setHashChecked] = useState(false);

  const [mode, setMode] = useState<Mode>('request');
  const tStr = t as (key: string) => string;

  const [generalError, setGeneralError] = useState<string | null>(
    errorParam ? errorDescription || tStr('invalidResetLink') : null,
  );
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const [supabase] = useState(() => createBrowserClient());

  // Check for hash fragment on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !hashChecked) {
      queueMicrotask(() => setHashChecked(true));
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const type = params.get('type');

        if (accessToken && type === 'recovery') {
          queueMicrotask(() => {
            setHasHashFragment(true);
            setMode('loading');
          });
        }
      } else if (code) {
        queueMicrotask(() => setMode('loading'));
      } else if (recovery) {
        queueMicrotask(() => setMode('loading'));
      }
    }
  }, [code, recovery, hashChecked]);

  // Handle Supabase auth
  useEffect(() => {
    const handleAuth = async () => {
      if (authChecked) return;
      setAuthChecked(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setIsAuthenticated(true);
        setMode('set');
        return;
      }

      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Code exchange error:', error.message);
            setGeneralError(tStr('invalidResetLink'));
            setMode('request');
          } else {
            setIsAuthenticated(true);
            setMode('set');
          }
        } catch (err) {
          console.error('Code exchange exception:', err);
          setGeneralError(tStr('invalidResetLink'));
          setMode('request');
        }
        return;
      }

      const {
        data: { session: sessionAfter },
      } = await supabase.auth.getSession();
      if (sessionAfter) {
        setIsAuthenticated(true);
        setMode('set');
        return;
      }

      if (!hasHashFragment) {
        setMode('request');
      }
    };

    if (mode === 'loading') {
      setTimeout(handleAuth, 500);
    }
  }, [code, mode, supabase.auth, authChecked, hasHashFragment, tStr]);

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: unknown) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setIsAuthenticated(true);
        setMode('set');
      } else if (event === 'SIGNED_IN' && session && mode === 'loading') {
        setIsAuthenticated(true);
        setMode('set');
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, mode]);

  const requestForm = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: '' },
    mode: 'onSubmit',
  });

  const setSchema = useMemo(
    () =>
      z
        .object({
          newPassword: z.string().min(SECURITY_CONFIG.MIN_PASSWORD_LENGTH),
          confirmPassword: z.string().min(SECURITY_CONFIG.MIN_PASSWORD_LENGTH),
        })
        .refine((v) => v.newPassword === v.confirmPassword, {
          message: tStr('passwordsDoNotMatch'),
          path: ['confirmPassword'],
        }),
    [tStr],
  );

  const setForm = useForm<SetForm>({
    resolver: zodResolver(setSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
    mode: 'onSubmit',
  });

  const isSubmitting = requestForm.formState.isSubmitting || setForm.formState.isSubmitting;

  const onRequest = async (data: RequestForm) => {
    setGeneralError(null);
    setSuccess(false);

    try {
      const res = await fetch(API_ROUTES.AUTH.PASSWORD_REQUEST_RESET, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      if (!res.ok) {
        setGeneralError(t('unexpectedError'));
        return;
      }

      setSuccess(true);
      toastUtils.success(t('resetPasswordSent'), t('resetPasswordSentDesc'));
    } catch {
      setGeneralError(t('unexpectedError'));
    }
  };

  const onSet = async (data: SetForm) => {
    setGeneralError(null);

    if (!isAuthenticated) {
      setGeneralError(tStr('sessionExpiredResetLink'));
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) {
        setGeneralError(error.message || tStr('failedToUpdatePassword'));
        return;
      }

      await supabase.auth.signOut();
      setMode('success');
    } catch {
      setGeneralError(t('unexpectedError'));
    }
  };

  // ── Loading state ──
  if (mode === 'loading') {
    return (
      <div className="relative min-h-[100dvh] bg-mq-background flex items-center justify-center">
        <div className="fixed inset-0 overflow-hidden">
          <Image
            src="/images/login-bg.png"
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
            quality={60}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#001528]/88 via-mq-background/80 to-mq-background/95" />
        </div>
        <div className="relative z-10 text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-mq-primary" />
          <p className="mt-4 text-mq-content-secondary font-medium">{t('verifying')}</p>
        </div>
      </div>
    );
  }

  // ── Success state ──
  if (mode === 'success') {
    return (
      <div className="relative min-h-[100dvh] bg-mq-background flex items-center justify-center px-4 py-8">
        <div className="fixed inset-0 overflow-hidden">
          <Image
            src="/images/login-bg.png"
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
            quality={60}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#001528]/88 via-mq-background/80 to-mq-background/95" />
        </div>
        <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-mq-card-background/85 backdrop-blur-xl border border-mq-border/30 rounded-2xl shadow-[0_18px_70px_rgba(0,0,0,0.3)] p-8 text-center space-y-6">
            <div className="flex justify-center">
              <Image
                src="/MQ_Logo_Final.png"
                alt={t('mqLogoAlt')}
                width={216}
                height={216}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9 text-green-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-mq-content">{t('passwordChangedSuccess')}</h1>
            </div>
            <Button
              type="button"
              className="w-full h-12 rounded-xl font-bold"
              onClick={() => router.push(backHref)}
            >
              {backLabel}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Request / Set form ──
  return (
    <div className="relative min-h-[100dvh] bg-mq-background">
      {/* Fixed background */}
      <div className="fixed inset-0 overflow-hidden">
        <Image
          src="/images/login-bg.png"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
          quality={60}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#001528]/88 via-mq-background/80 to-mq-background/95" />
      </div>

      {/* Scrollable content */}
      <div className="relative z-10 flex min-h-[100dvh] items-center justify-center px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-full max-w-md">
          <div className="bg-mq-card-background/85 backdrop-blur-xl border border-mq-border/30 rounded-2xl shadow-[0_18px_70px_rgba(0,0,0,0.3)] p-6 sm:p-8 space-y-6">
            <div className="flex justify-center">
              <Image
                src="/MQ_Logo_Final.png"
                alt={t('mqLogoAlt')}
                width={216}
                height={216}
                className="object-contain"
                priority
              />
            </div>

            <div className="space-y-1 text-center">
              <h1 className="text-xl font-bold text-mq-content">{t('resetPassword')}</h1>
              <p className="text-sm text-mq-content-secondary">
                {mode === 'request' ? t('forgotPasswordDesc') : t('changePasswordDesc')}
              </p>
            </div>

            {generalError && (
              <Alert variant="error">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}

            {success && mode === 'request' && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{t('resetPasswordSentDesc')}</AlertDescription>
              </Alert>
            )}

            {mode === 'request' ? (
              <form onSubmit={requestForm.handleSubmit(onRequest)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-mq-content font-bold">
                    {t('email')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      disabled={isSubmitting}
                      className="h-12 rounded-xl pr-10"
                      {...requestForm.register('email')}
                    />
                    <Mail className="h-4 w-4 text-mq-content-secondary absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                  {requestForm.formState.errors.email?.message && (
                    <p className="text-xs text-red-500 font-medium ml-1">
                      {requestForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl font-bold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('loading')}
                    </span>
                  ) : (
                    t('resetPassword')
                  )}
                </Button>

                <div className="text-center text-sm">
                  <Link href={backHref} className="text-mq-primary hover:underline font-bold">
                    {backLabel}
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={setForm.handleSubmit(onSet)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-mq-content font-bold">
                    {t('newPassword')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className="h-12 rounded-xl pr-10"
                      {...setForm.register('newPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-mq-content hover:text-mq-primary transition-colors"
                      aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                      aria-pressed={showPassword}
                      disabled={isSubmitting}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {setForm.formState.errors.newPassword?.message && (
                    <p className="text-xs text-red-500 font-medium ml-1">
                      {setForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-mq-content font-bold">
                    {t('confirmPassword')}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    className="h-12 rounded-xl"
                    {...setForm.register('confirmPassword')}
                  />
                  {setForm.formState.errors.confirmPassword?.message && (
                    <p className="text-xs text-red-500 font-medium ml-1">
                      {setForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl font-bold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('loading')}
                    </span>
                  ) : (
                    t('changePassword')
                  )}
                </Button>

                <div className="text-center text-sm">
                  <Link href={backHref} className="text-mq-primary hover:underline font-bold">
                    {backLabel}
                  </Link>
                </div>
              </form>
            )}
          </div>

          <p className="text-xs text-mq-content-secondary text-center mt-4">
            {mode === 'request' ? tStr('revealEmailNote') : t('resetLinkExpireNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
