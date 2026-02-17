'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/mq/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Input } from '@/components/ui/mq/input';
import { PasswordInput } from '@/components/ui/custom/PasswordInput';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/mq/alert';
import { Icons } from '@/components/ui/icons';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import { API_ROUTES } from '@/lib/constants/config';
import { toastUtils } from '@/lib/utils/toast';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { useProfilesStore } from '@/lib/store/profilesStore';
import { AlertTriangle, Check, Loader2, Mail } from 'lucide-react';
import { calculatePasswordStrength } from '@/lib/utils/security';
import clsx from 'clsx';
import { createSignupSchema } from '@/lib/schemas/auth';
import { createBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';

// react-hook-form expects the schema *input* shape, not the transformed output.
type SignupFormData = z.input<ReturnType<typeof createSignupSchema>>;

export default function SignupClient() {
  const { t } = useTypedTranslation();
  const router = useRouter();
  const addProfile = useProfilesStore((state) => state.addProfile);

  // Memoize schema if performance is an issue, but usually fine here
  const signupSchema = createSignupSchema(t);

  const [step, setStep] = useState<'auth' | 'profile' | 'confirmation'>('auth');
  const [serverError, setServerError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [signupEmail, setSignupEmail] = useState<string>('');

  // Focus management
  const fullNameRef = useRef<HTMLInputElement>(null);

  // OAuth login handler
  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured()) {
      toastUtils.error(
        t('loginErrorFailed'),
        'Supabase is not configured. OAuth sign-up is disabled.',
      );
      return;
    }

    if (typeof window === 'undefined') return;

    setServerError(null);
    setOauthLoading(true);

    try {
      const supabase = createBrowserClient();

      // Redirect to home after OAuth sign-up (profile can be completed later)
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('redirectTo', '/home');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        toastUtils.error(t('loginErrorFailed'), error.message);
        setOauthLoading(false);
      }
    } catch {
      toastUtils.error(t('loginErrorFailed'), t('unexpectedError'));
      setOauthLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      agreedToTerms: false, // Initial value must be false, user must check it
      fullName: '',
      studentId: '',
      course: '',
      year: '',
      _gotcha: '',
    } as unknown as SignupFormData,
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const password = watch('password');
  // Calculate strength strictly for UI feedback
  const passwordStrength = password ? calculatePasswordStrength(password) : null;

  const handleNextStep = async () => {
    // Validate only auth fields
    const isValid = await trigger([
      'email',
      'password',
      'confirmPassword',
      'agreedToTerms',
      '_gotcha',
    ]);
    if (isValid) {
      setStep('profile');
      setServerError(null);
      // Wait for render, then focus
      setTimeout(() => fullNameRef.current?.focus(), 100);
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null);

    try {
      // Call the API route to create the user
      const response = await fetch(API_ROUTES.AUTH.SIGNUP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
          agreedToTerms: data.agreedToTerms,
          _gotcha: data._gotcha,
          fullName: data.fullName,
          studentId: data.studentId,
          course: data.course,
          year: data.year,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle API error response - error can be an object {code, message, details} or a string
        const errorMessage =
          typeof result.error === 'string'
            ? result.error
            : result.error?.message || t('unexpectedError');
        setServerError(errorMessage);
        return;
      }

      // Create local profile
      addProfile({
        name: data.fullName,
        email: data.email,
        studentId: data.studentId,
        course: data.course || '',
        year: data.year || '',
        preferences: {
          notifications: true,
          emailReminders: true,
          pushNotifications: false,
        },
      });

      // Check if we got a session back
      if (result.data?.session) {
        toastUtils.success(t('accountCreated'), t('signedInNow'));
        router.push('/home');
      } else {
        // Show email confirmation screen
        setSignupEmail(data.email);
        setStep('confirmation');
      }
    } catch {
      setServerError(t('unexpectedError'));
    }
  };

  return (
    <div className="signup-page min-h-screen flex items-center justify-center bg-mq-background p-4">
      <Card className="w-full max-w-md bg-mq-card-background border border-mq-border">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className={clsx(
              'w-12 h-12 rounded-mq-lg flex items-center justify-center',
              step === 'confirmation' ? 'bg-mq-success' : 'bg-mq-primary',
            )}>
              {step === 'confirmation' ? (
                <Mail className="w-6 h-6 text-white" />
              ) : (
                <Icons.Graduation className="w-6 h-6 text-white" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            {step === 'confirmation'
              ? t('accountCreated')
              : step === 'auth'
                ? t('joinApp', { appName: APP_CONFIG.name })
                : t('completeProfile')}
          </CardTitle>
          <CardDescription className="text-center">
            {step === 'confirmation'
              ? t('verifyEmail')
              : step === 'auth'
                ? t('createAccountFor', { uniName: UNIVERSITY_CONFIG.name })
                : t('fillProfileDetails')}
          </CardDescription>

          {/* Step indicator */}
          {step !== 'confirmation' && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => step === 'profile' && setStep('auth')}
                className={clsx(
                  'flex items-center gap-1 px-2 py-1 rounded-full transition-colors',
                  step === 'auth'
                    ? 'bg-mq-primary/10 text-mq-primary'
                    : 'bg-mq-success/10 text-mq-success cursor-pointer hover:bg-mq-success/20',
                )}
                disabled={step === 'auth' || isSubmitting}
              >
                {step === 'profile' ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-mq-primary" />
                )}
                <span className="text-xs font-medium">{t('stepAccount')}</span>
              </button>
              <div
                className={clsx('w-8 h-0.5', step === 'profile' ? 'bg-mq-primary' : 'bg-mq-border')}
              />
              <div
                className={clsx(
                  'flex items-center gap-1 px-2 py-1 rounded-full',
                  step === 'profile'
                    ? 'bg-mq-primary/10 text-mq-primary'
                    : 'bg-mq-surface text-mq-content-secondary',
                )}
              >
                <div
                  className={clsx(
                    'w-2 h-2 rounded-full',
                    step === 'profile' ? 'bg-mq-primary' : 'bg-mq-border',
                  )}
                />
                <span className="text-xs font-medium">{t('stepProfile')}</span>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {serverError && (
            <Alert variant="error">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Honeypot field - Hidden from real users */}
            <input
              {...register('_gotcha')}
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            {/* Step 1: Authentication */}
            <div className={clsx('space-y-4', step !== 'auth' && 'hidden')}>
              <div className="space-y-2">
                <Label htmlFor="email">
                  {t('email')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  disabled={isSubmitting}
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {t('password')} <span className="text-red-500">*</span>
                </Label>
                <PasswordInput
                  id="password"
                  disabled={isSubmitting}
                  maxLength={64}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}

                {/* Visual Password Feedback */}
                {passwordStrength && !errors.password && (
                  <div className="space-y-1 mt-2">
                    <div className="flex gap-1 h-1">
                      {[0, 1, 2, 3, 4].map((idx) => (
                        <div
                          key={idx}
                          className={clsx(
                            'flex-1 rounded-full transition-colors',
                            idx <= passwordStrength.score ? passwordStrength.color : 'bg-mq-border',
                          )}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <p
                        className={clsx(
                          'text-xs font-medium',
                          passwordStrength.score < 2 ? 'text-red-500' : 'text-green-600',
                        )}
                      >
                        {passwordStrength.label}
                      </p>
                      {passwordStrength.feedback?.[0] && (
                        <p className="text-xs text-mq-content-secondary">
                          {passwordStrength.feedback[0]}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <p className="text-xs text-mq-content-secondary mt-1">{t('passwordMinLength')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {t('confirmPassword')} <span className="text-red-500">*</span>
                </Label>
                <PasswordInput
                  id="confirmPassword"
                  disabled={isSubmitting}
                  maxLength={64}
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 h-4 w-4 rounded border-mq-border text-mq-primary focus:ring-mq-primary"
                  disabled={isSubmitting}
                  {...register('agreedToTerms')}
                />
                <label htmlFor="terms" className="text-sm text-mq-content-secondary">
                  <span className="text-red-500">*</span> {t('agreeToTerms')}{' '}
                  <a
                    href="/terms"
                    className="text-mq-primary hover:underline"
                  >
                    {t('termsOfService')}
                  </a>{' '}
                  {t('and')}{' '}
                  <a
                    href="/privacy"
                    className="text-mq-primary hover:underline"
                  >
                    {t('privacyPolicy')}
                  </a>
                </label>
              </div>
              {errors.agreedToTerms && (
                <p className="text-xs text-red-500">{errors.agreedToTerms.message}</p>
              )}

              {/* APP 5 Collection Notice */}
              <p className="text-xs text-mq-content-secondary leading-relaxed">
                {t('collectionNotice')}{' '}
                <a
                  href="/privacy"
                  className="text-mq-primary hover:underline"
                >
                  {t('privacyPolicy')}
                </a>
              </p>

              <Button
                type="button"
                onClick={handleNextStep}
                className="w-full"
                disabled={isSubmitting || oauthLoading}
              >
                {t('next')}
              </Button>

              {/* OAuth Sign Up Options */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-mq-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-mq-card-background px-2 text-mq-content-secondary">
                    {t('orSignWith')}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-11 w-full flex items-center justify-center gap-2"
                onClick={handleGoogleLogin}
                disabled={isSubmitting || oauthLoading}
              >
                {oauthLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
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
                )}
                <span className="text-sm font-medium">Google</span>
              </Button>
            </div>

            {/* Step 2: Profile */}
            <div className={clsx('space-y-4', step !== 'profile' && 'hidden')}>
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  {t('fullName')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  placeholder={t('enterFullName')}
                  disabled={isSubmitting}
                  {...register('fullName')}
                  // Use merge refs logic or just ref if register ref is enough,
                  // but we need to focus it manually.
                  // register returns { ref, ... }
                  // We can use a callback ref or compose refs.
                  // Simpler: use the ref from register and set autoFocus (which works for mount).
                  // But we are hiding/showing div, not mounting/unmounting?
                  // If just hiding, autoFocus won't trigger again.
                  // So we use the ref we created: fullNameRef.
                  // We need to merge it with register's ref.
                  ref={(e) => {
                    register('fullName').ref(e);
                    fullNameRef.current = e;
                  }}
                />
                {errors.fullName && (
                  <p className="text-xs text-red-500">{errors.fullName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentId">
                  {t('studentId')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="studentId"
                  placeholder={t('studentIdPlaceholder')}
                  disabled={isSubmitting}
                  {...register('studentId')}
                />
                {errors.studentId && (
                  <p className="text-xs text-red-500">{errors.studentId.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course">{t('course')}</Label>
                  <Input
                    id="course"
                    placeholder={t('coursePlaceholder')}
                    disabled={isSubmitting}
                    {...register('course')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">{t('year')}</Label>
                  <Input
                    id="year"
                    placeholder={t('yearPlaceholder')}
                    disabled={isSubmitting}
                    {...register('year')}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('auth')}
                  disabled={isSubmitting}
                >
                  {t('back')}
                </Button>
                <Button
                  type="submit"
                  className={clsx('flex-1', isSubmitting ? 'opacity-50 cursor-not-allowed' : '')}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                  {isSubmitting ? t('creatingAccount') : t('createAccount')}
                </Button>
              </div>
            </div>
          </form>

          {/* Email Confirmation Screen */}
          {step === 'confirmation' && (
            <div className="space-y-4 text-center">
              <div className="bg-mq-success/10 rounded-mq-lg p-4">
                <p className="text-sm text-mq-content leading-relaxed">
                  {t('signupConfirmationSent', { email: signupEmail })}
                </p>
              </div>
              <div className="space-y-2 text-sm text-mq-content-secondary">
                <p>{t('signupConfirmationHint')}</p>
              </div>
              <Button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full"
              >
                {t('goToLogin')}
              </Button>
            </div>
          )}

          {step !== 'confirmation' && (
            <div className="text-center text-sm text-mq-content-secondary">
              <p>
                {t('alreadyHaveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-mq-primary hover:underline font-medium"
                  disabled={isSubmitting || oauthLoading}
                >
                  {t('signIn')}
                </button>
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 text-center text-xs text-mq-content-secondary space-y-1">
            <div>© {new Date().getFullYear()} {UNIVERSITY_CONFIG.name}</div>
            <div>
              <a
                href="/privacy"
                className="hover:underline hover:text-mq-primary"
              >
                {t('privacyPolicy')}
              </a>
              {' · '}
              <a
                href="/terms"
                className="hover:underline hover:text-mq-primary"
              >
                {t('termsOfService')}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
