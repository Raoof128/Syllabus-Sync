'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/mq/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Input } from '@/components/ui/mq/input';
import { PasswordInput } from '@/components/ui/custom/PasswordInput';
import { StrengthMeter } from '@/components/ui/custom/StrengthMeter';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/mq/alert';
import { Icons } from '@/components/ui/icons';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import { API_ROUTES } from '@/lib/constants/config';
import { toastUtils } from '@/lib/utils/toast';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';

import { AlertTriangle, Check, Loader2, Mail } from 'lucide-react';
import { calculatePasswordStrength } from '@/lib/utils/security';
import clsx from 'clsx';
import { createSignupSchema } from '@/lib/schemas/auth';

type SignupFormData = z.infer<ReturnType<typeof createSignupSchema>>;

const DRAFT_KEY = 'signup_draft';

export default function SignupClient() {
  const { t } = useTypedTranslation();
  const router = useRouter();

  const [isSuccess, setIsSuccess] = useState(false);

  // Memoize schema if performance is an issue, but usually fine here
  const signupSchema = createSignupSchema(t);

  const [step, setStep] = useState<'auth' | 'profile'>('auth');
  const [serverError, setServerError] = useState<string | null>(null);

  // Focus management
  const fullNameRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      agreedToTerms: false,
      fullName: '',
      studentId: '',
      course: '',
      year: '',
      _gotcha: '',
    } as unknown as SignupFormData,
  });

  const password = watch('password');
  const passwordStrength = password ? calculatePasswordStrength(password) : null;

  // 1. Load draft on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        // Only restore safe fields (never password/confirmPassword)
        if (data.email) setValue('email', data.email);
        if (data.fullName) setValue('fullName', data.fullName);
        if (data.studentId) setValue('studentId', data.studentId);
        if (data.course) setValue('course', data.course);
        if (data.year) setValue('year', data.year);
      } catch {
        console.error('Corrupt draft data');
      }
    }
  }, [setValue]);

  // 2. Save draft on change (excluding sensitive fields)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = watch((value) => {
      // Destructure to ISOLATE unsafe fields - intentionally not storing password fields
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, confirmPassword, _gotcha, ...safeData } = value;
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(safeData));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const handleNextStep = async () => {
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
      setTimeout(() => fullNameRef.current?.focus(), 100);
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null);

    try {
      const response = await fetch(API_ROUTES.AUTH.SIGNUP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              student_id: data.studentId,
              course: data.course,
              year: data.year,
            },
          },
        }),
      });

      // Handle Rate Limiting specifically (429 Too Many Requests)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const seconds = retryAfter ? parseInt(retryAfter, 10) : 60;
        toastUtils.error('Too Many Requests', `Please try again in ${seconds} seconds`);
        setServerError('Too many attempts. Please wait before trying again.');
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        // Surgical Error Handling: Map backend errors to specific fields
        if (result.target && ['email', 'studentId'].includes(result.target)) {
          setError(result.target as 'email' | 'studentId', {
            type: 'server',
            message: result.error,
          });
          // Automatically focus the bad field
          if (result.target === 'email') {
            setStep('auth');
            setTimeout(() => setFocus('email'), 50);
          } else if (result.target === 'studentId') {
            setStep('profile');
            setTimeout(() => setFocus('studentId'), 50);
          }
        } else {
          setServerError(result.error || t('unexpectedError'));
        }
        return;
      }

      // Clear the draft on success
      sessionStorage.removeItem(DRAFT_KEY);

      if (result.data?.session) {
        toastUtils.success(t('accountCreated'), 'You are now signed in!');
        router.push('/home');
      } else {
        // Show verification pending UI instead of redirecting
        setIsSuccess(true);
      }
    } catch {
      setServerError(t('unexpectedError'));
    }
  };

  // Show verification pending UI after successful signup (email confirmation required)
  if (isSuccess) {
    return (
      <div className="signup-page min-h-screen flex items-center justify-center bg-mq-background p-4">
        <Card className="w-full max-w-md bg-mq-card-background border border-mq-border">
          <CardContent className="pt-6 pb-6 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-in fade-in zoom-in duration-300">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">{t('checkInbox')}</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {t('sentLinkTo')}{' '}
                <span className="font-medium text-foreground">{watch('email')}</span>.{' '}
                {t('clickToVerify')}
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push('/login')} className="w-full">
              {t('backToLogin')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="signup-page min-h-screen flex items-center justify-center bg-mq-background p-4">
      <Card className="w-full max-w-md bg-mq-card-background border border-mq-border">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-mq-primary rounded-mq-lg flex items-center justify-center">
              <Icons.Graduation className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            {step === 'auth' ? t('joinApp', { appName: APP_CONFIG.name }) : t('completeProfile')}
          </CardTitle>
          <CardDescription className="text-center">
            {step === 'auth'
              ? t('createAccountFor', { uniName: UNIVERSITY_CONFIG.name })
              : t('fillProfileDetails')}
          </CardDescription>

          {/* Step indicator */}
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

            <AnimatePresence mode="wait">
              {step === 'auth' ? (
                <motion.div
                  key="auth"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('email')}</Label>
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
                    <Label htmlFor="password">{t('password')}</Label>
                    <PasswordInput
                      id="password"
                      disabled={isSubmitting}
                      maxLength={64}
                      {...register('password')}
                    />
                    {errors.password && (
                      <p className="text-xs text-red-500">{errors.password.message}</p>
                    )}

                    {/* Visual Password Feedback with StrengthMeter */}
                    {passwordStrength && !errors.password && (
                      <StrengthMeter
                        score={passwordStrength.score}
                        label={passwordStrength.label}
                      />
                    )}
                    <p className="text-xs text-mq-content-secondary mt-1">
                      {t('passwordMinLength')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                    <PasswordInput
                      id="confirmPassword"
                      disabled={isSubmitting}
                      maxLength={64}
                      autoComplete="new-password"
                      onCopy={(e) => e.preventDefault()}
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
                      {t('agreeToTerms')}{' '}
                      <a
                        href="/terms"
                        className="text-mq-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('termsOfService')}
                      </a>{' '}
                      {t('and')}{' '}
                      <a
                        href="/privacy"
                        className="text-mq-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('privacyPolicy')}
                      </a>
                    </label>
                  </div>
                  {errors.agreedToTerms && (
                    <p className="text-xs text-red-500">{errors.agreedToTerms.message}</p>
                  )}

                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {t('next')}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t('fullName')}</Label>
                    <Input
                      id="fullName"
                      placeholder={t('enterFullName')}
                      disabled={isSubmitting}
                      {...register('fullName')}
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
                    <Label htmlFor="studentId">{t('studentId')}</Label>
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
                      className={clsx(
                        'flex-1',
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : '',
                      )}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                      {isSubmitting ? t('creatingAccount') : t('createAccount')}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <div className="text-center text-sm text-mq-content-secondary">
            <p>
              {t('alreadyHaveAccount')}{' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-mq-primary hover:underline font-medium"
                disabled={isSubmitting}
              >
                {t('signIn')}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
