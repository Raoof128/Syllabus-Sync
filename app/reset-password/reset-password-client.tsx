'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff, Mail } from 'lucide-react';
import { Input } from '@/components/ui/mq/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/mq/button';
import { Alert, AlertDescription } from '@/components/ui/mq/alert';
import { API_ROUTES, SECURITY_CONFIG } from '@/lib/constants/config';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { toastUtils } from '@/lib/utils/toast';
import { createBrowserClient } from '@/lib/supabase/client';

type Mode = 'request' | 'set' | 'loading';

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

  // Check for Supabase auth params (code, error, error_description)
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Check if we have recovery params (code or hash fragment will be handled)
  // Also check for hash fragment on client side (used by some Supabase flows)
  const [hasHashFragment, setHasHashFragment] = useState(false);

  useEffect(() => {
    // Check for hash fragment containing access_token or type=recovery
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && (hash.includes('access_token') || hash.includes('type=recovery'))) {
        setHasHashFragment(true);
      }
    }
  }, []);

  const hasRecoveryParams = !!code || hasHashFragment;

  const [mode, setMode] = useState<Mode>('request');
  const [generalError, setGeneralError] = useState<string | null>(
    errorParam ? errorDescription || 'Invalid or expired reset link' : null
  );
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const supabase = createBrowserClient();

  // Set to loading mode when we have recovery params
  useEffect(() => {
    if (hasRecoveryParams && mode === 'request' && !authChecked) {
      setMode('loading');
    }
  }, [hasRecoveryParams, mode, authChecked]);

  // Handle Supabase auth - check for existing session or exchange code
  useEffect(() => {
    const handleAuth = async () => {
      setAuthChecked(true);

      // First check if user already has a session (from hash fragment auto-handling)
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // User is authenticated (session from hash fragment or previous auth)
        setIsAuthenticated(true);
        setMode('set');
        return;
      }

      // If we have a code, exchange it for a session
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setGeneralError('Invalid or expired reset link. Please request a new one.');
            setMode('request');
          } else {
            setIsAuthenticated(true);
            setMode('set');
          }
        } catch {
          setGeneralError('Invalid or expired reset link. Please request a new one.');
          setMode('request');
        }
        return;
      }

      // No code and no session, stay in request mode
      setMode('request');
    };

    if (mode === 'loading') {
      handleAuth();
    }
  }, [code, mode, supabase.auth]);

  // Also listen for auth state changes (handles hash fragment recovery)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: unknown) => {
        if (event === 'PASSWORD_RECOVERY' && session) {
          setIsAuthenticated(true);
          setMode('set');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

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
          message: 'Passwords do not match',
          path: ['confirmPassword'],
        }),
    [],
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
    setSuccess(false);

    if (!isAuthenticated) {
      setGeneralError('Session expired. Please request a new reset link.');
      return;
    }

    try {
      // Use Supabase's updateUser to change password
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) {
        setGeneralError(error.message || 'Failed to update password. Please try again.');
        return;
      }

      // Sign out after password change for security
      await supabase.auth.signOut();

      setSuccess(true);
      toastUtils.success(t('passwordChangedSuccess'), t('loginSuccess'));
      setTimeout(() => router.push('/login'), 800);
    } catch {
      setGeneralError(t('unexpectedError'));
    }
  };

  if (mode === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mq-background px-4 py-6">
        <div className="w-full max-w-md text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-mq-primary" />
          <p className="mt-4 text-mq-content-secondary">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-mq-background px-4 py-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-mq-border bg-mq-card-background shadow-sm p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
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

              <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={isSubmitting}>
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
                <Link href="/login" className="text-mq-primary hover:underline font-bold">
                  {t('backToLogin')}
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

              <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={isSubmitting}>
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
                <Link href="/login" className="text-mq-primary hover:underline font-bold">
                  {t('backToLogin')}
                </Link>
              </div>
            </form>
          )}
        </div>

        <p className="text-xs text-mq-content-secondary text-center mt-4">
          {mode === 'request'
            ? 'We will never reveal whether an email is registered.'
            : 'For your security, reset links expire quickly.'}
        </p>
      </div>
    </div>
  );
}
