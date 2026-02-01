'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/mq/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Input } from '@/components/ui/mq/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/mq/alert';
import { Icons } from '@/components/ui/icons';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import { API_ROUTES, SECURITY_CONFIG } from '@/lib/constants/config';
import { toastUtils } from '@/lib/utils/toast';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { useProfilesStore } from '@/lib/store/profilesStore';
import { Eye, EyeOff, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { calculatePasswordStrength } from '@/lib/utils/security';
import clsx from 'clsx';

// Schema Validation
const signupSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(
        SECURITY_CONFIG.MIN_PASSWORD_LENGTH,
        `Must be at least ${SECURITY_CONFIG.MIN_PASSWORD_LENGTH} chars`,
      )
      .regex(/[A-Z]/, 'Needs an uppercase letter')
      .regex(/[0-9]/, 'Needs a number'),
    confirmPassword: z.string(),
    agreedToTerms: z.literal(true, {
      message: 'You must agree to the terms',
    }),
    // Profile fields are optional initially, but required for the second step
    // We can refine them or just use simple checks.
    // For a unified schema, we make them required strings, but valid initially as empty if we only trigger partial validation.
    fullName: z.string().min(1, 'Full name is required'),
    studentId: z.string().min(1, 'Student ID is required'),
    course: z.string().optional(),
    year: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupClient() {
  const { t } = useTypedTranslation();
  const router = useRouter();
  const addProfile = useProfilesStore((state) => state.addProfile);

  const [step, setStep] = useState<'auth' | 'profile'>('auth');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

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
    } as unknown as SignupFormData, // Initial value for agreedToTerms is false, which conflicts with literal true in schema
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const password = watch('password');
  // Calculate strength strictly for UI feedback
  const passwordStrength = password ? calculatePasswordStrength(password) : null;

  const handleNextStep = async () => {
    // Validate only auth fields
    const isValid = await trigger(['email', 'password', 'confirmPassword', 'agreedToTerms']);
    if (isValid) {
      setStep('profile');
      setServerError(null);
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

      const result = await response.json();

      if (!response.ok) {
        setServerError(result.error || t('unexpectedError'));
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
        toastUtils.success(t('accountCreated'), 'You are now signed in!');
        router.push('/home');
      } else {
        toastUtils.success(t('accountCreated'), t('verifyEmail'));
        router.push('/login');
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
            {/* Step 1: Authentication */}
            <div className={clsx('space-y-4', step !== 'auth' && 'hidden')}>
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
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    disabled={isSubmitting}
                    maxLength={64}
                    // minLength={SECURITY_CONFIG.MIN_PASSWORD_LENGTH} // Handled by Zod
                    className="pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mq-content-secondary hover:text-mq-content-primary transition-colors"
                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
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
                <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    disabled={isSubmitting}
                    maxLength={64}
                    className="pr-10"
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mq-content-secondary hover:text-mq-content-primary transition-colors"
                    aria-label={showConfirmPassword ? t('hidePassword') : t('showPassword')}
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
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
            </div>

            {/* Step 2: Profile */}
            <div className={clsx('space-y-4', step !== 'profile' && 'hidden')}>
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('fullName')}</Label>
                <Input
                  id="fullName"
                  placeholder={t('enterFullName')}
                  disabled={isSubmitting}
                  {...register('fullName')}
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
                  className={clsx('flex-1', isSubmitting ? 'opacity-50 cursor-not-allowed' : '')}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                  {isSubmitting ? t('creatingAccount') : t('createAccount')}
                </Button>
              </div>
            </div>
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
