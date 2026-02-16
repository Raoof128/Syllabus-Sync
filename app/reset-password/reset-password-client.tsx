'use client';

import { useMemo, useState } from 'react';
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

type Mode = 'request' | 'set';

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

type RequestForm = z.infer<typeof requestSchema>;
type SetForm = {
  token: string;
  newPassword: string;
  confirmPassword: string;
};

export default function ResetPasswordClient() {
  const { t } = useTypedTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token');
  const tokenValid = useMemo(() => !!token && /^[0-9a-f]{64}$/.test(token), [token]);
  const mode: Mode = tokenValid ? 'set' : 'request';

  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const requestForm = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: '' },
    mode: 'onSubmit',
  });

  const setSchema = useMemo(
    () =>
      z
        .object({
          token: z
            .string()
            .length(64)
            .regex(/^[0-9a-f]{64}$/),
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
    defaultValues: { token: tokenValid ? token! : '', newPassword: '', confirmPassword: '' },
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

    try {
      const res = await fetch(API_ROUTES.AUTH.PASSWORD_RESET, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: data.token, newPassword: data.newPassword }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.data?.reset) {
        setGeneralError('Invalid or expired reset link. Please request a new one.');
        return;
      }

      setSuccess(true);
      toastUtils.success(t('passwordChangedSuccess'), t('loginSuccess'));
      setTimeout(() => router.push('/login'), 800);
    } catch {
      setGeneralError(t('unexpectedError'));
    }
  };

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

              <Button className="w-full h-12 rounded-xl font-bold" disabled={isSubmitting}>
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
              <input type="hidden" {...setForm.register('token')} />

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

              <Button className="w-full h-12 rounded-xl font-bold" disabled={isSubmitting}>
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
