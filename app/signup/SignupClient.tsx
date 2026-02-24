'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/mq/button';
import { Input } from '@/components/ui/mq/input';
import { PasswordInput } from '@/components/ui/custom/PasswordInput';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/mq/alert';
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
import { CourseCombobox } from './components/CourseCombobox';
import { FacultySelect } from './components/FacultySelect';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getYearOptions } from '@/lib/data/mq-courses';

// react-hook-form expects the schema *input* shape, not the transformed output.
type SignupFormData = z.input<ReturnType<typeof createSignupSchema>>;

export default function SignupClient() {
  const { t } = useTypedTranslation();
  const router = useRouter();
  const addProfile = useProfilesStore((state) => state.addProfile);

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

      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('redirectTo', '/home');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        toastUtils.error(t('loginErrorFailed'), error.message);
        setOauthLoading(false);
        return;
      }

      if (data?.url) {
        window.location.assign(data.url);
        return;
      }

      toastUtils.error(t('loginErrorFailed'), t('oauthSignInFailed'));
      setOauthLoading(false);
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
    control,
    setValue,
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
      faculty: '',
      course: '',
      year: '',
      _gotcha: '',
    } as unknown as SignupFormData,
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const password = watch('password');
  const passwordStrength = password ? calculatePasswordStrength(password) : null;

  const watchedFaculty = watch('faculty');
  const watchedCourse = watch('course');
  const yearOptions = watchedCourse ? getYearOptions(watchedCourse) : [];

  // Reset course when faculty changes:
  useEffect(() => {
    setValue('course', '');
    setValue('year', '');
  }, [watchedFaculty, setValue]);

  // Reset year when course changes:
  useEffect(() => {
    setValue('year', '');
  }, [watchedCourse, setValue]);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
          agreedToTerms: data.agreedToTerms,
          _gotcha: data._gotcha,
          fullName: data.fullName,
          studentId: data.studentId,
          faculty: data.faculty,
          course: data.course,
          year: data.year,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof result.error === 'string'
            ? result.error
            : result.error?.message || t('unexpectedError');
        setServerError(errorMessage);
        return;
      }

      addProfile({
        name: data.fullName,
        email: data.email,
        studentId: data.studentId,
        faculty: data.faculty || '',
        course: data.course || '',
        year: data.year || '',
        preferences: {
          notifications: true,
          emailReminders: true,
          pushNotifications: false,
        },
      });

      if (result.data?.session) {
        toastUtils.success(t('accountCreated'), t('signedInNow'));
        router.push('/home');
      } else {
        setSignupEmail(data.email);
        setStep('confirmation');
      }
    } catch {
      setServerError(t('unexpectedError'));
    }
  };

  return (
    <div className="signup-page relative min-h-[100dvh] bg-mq-background">
      {/* Fixed background image */}
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
      <div className="relative z-10 flex min-h-[100dvh] items-start sm:items-center justify-center px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-full max-w-md">
          <div className="bg-mq-card-background/85 backdrop-blur-xl border border-mq-border/30 rounded-2xl shadow-[0_18px_70px_rgba(0,0,0,0.3)] overflow-hidden">
            {/* Card Header */}
            <div className="px-6 pt-8 pb-4 space-y-3">
              <div className="flex items-center justify-center">
                {step === 'confirmation' ? (
                  <div className="w-14 h-14 rounded-full bg-mq-success flex items-center justify-center shadow-lg">
                    <Mail className="w-7 h-7 text-white" />
                  </div>
                ) : (
                  <Image
                    src="/MQ_Logo_Final.png"
                    alt={t('mqLogoAlt')}
                    width={240}
                    height={240}
                    className="object-contain"
                    priority
                  />
                )}
              </div>

              <div className="text-center space-y-1">
                <h1 className="text-2xl font-bold text-mq-content">
                  {step === 'confirmation'
                    ? t('accountCreated')
                    : step === 'auth'
                      ? t('joinApp', { appName: APP_CONFIG.name })
                      : t('completeProfile')}
                </h1>
                <p className="text-sm text-mq-content-secondary">
                  {step === 'confirmation'
                    ? t('verifyEmail')
                    : step === 'auth'
                      ? t('createAccountFor', {
                          uniName: UNIVERSITY_CONFIG.name,
                        })
                      : t('fillProfileDetails')}
                </p>
              </div>

              {/* Step indicator */}
              {step !== 'confirmation' && (
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => step === 'profile' && setStep('auth')}
                    className={clsx(
                      'flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors text-xs font-semibold',
                      step === 'auth'
                        ? 'bg-mq-primary/15 text-mq-primary border border-mq-primary/20'
                        : 'bg-mq-success/15 text-mq-success cursor-pointer hover:bg-mq-success/25 border border-mq-success/20',
                    )}
                    disabled={step === 'auth' || isSubmitting}
                  >
                    {step === 'profile' ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-mq-primary" />
                    )}
                    {t('stepAccount')}
                  </button>
                  <div
                    className={clsx(
                      'w-8 h-0.5 rounded-full',
                      step === 'profile' ? 'bg-mq-primary' : 'bg-mq-border',
                    )}
                  />
                  <div
                    className={clsx(
                      'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border',
                      step === 'profile'
                        ? 'bg-mq-primary/15 text-mq-primary border-mq-primary/20'
                        : 'bg-mq-border/30 text-mq-content-secondary border-mq-border/20',
                    )}
                  >
                    <div
                      className={clsx(
                        'w-2 h-2 rounded-full',
                        step === 'profile' ? 'bg-mq-primary' : 'bg-mq-border',
                      )}
                    />
                    {t('stepProfile')}
                  </div>
                </div>
              )}
            </div>

            {/* Card Content */}
            <div className="px-6 pb-8 space-y-4">
              {serverError && (
                <Alert variant="error">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Honeypot field */}
                <input
                  {...register('_gotcha')}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                {/* ── Step 1: Authentication ── */}
                <div className={clsx('space-y-4', step !== 'auth' && 'hidden')}>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-bold text-mq-content">
                      {t('email')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      disabled={isSubmitting}
                      className="h-12 rounded-xl"
                      {...register('email')}
                    />
                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="font-bold text-mq-content">
                      {t('password')} <span className="text-red-500">*</span>
                    </Label>
                    <PasswordInput
                      id="password"
                      disabled={isSubmitting}
                      maxLength={64}
                      className="h-12 rounded-xl"
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
                                idx <= passwordStrength.score
                                  ? passwordStrength.color
                                  : 'bg-mq-border',
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
                    <p className="text-xs text-mq-content-secondary mt-1">
                      {t('passwordMinLength')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="font-bold text-mq-content">
                      {t('confirmPassword')} <span className="text-red-500">*</span>
                    </Label>
                    <PasswordInput
                      id="confirmPassword"
                      disabled={isSubmitting}
                      maxLength={64}
                      className="h-12 rounded-xl"
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
                      <Link href="/terms" className="text-mq-primary hover:underline font-medium">
                        {t('termsOfService')}
                      </Link>{' '}
                      {t('and')}{' '}
                      <Link href="/privacy" className="text-mq-primary hover:underline font-medium">
                        {t('privacyPolicy')}
                      </Link>
                    </label>
                  </div>
                  {errors.agreedToTerms && (
                    <p className="text-xs text-red-500">{errors.agreedToTerms.message}</p>
                  )}

                  {/* APP 5 Collection Notice */}
                  <p className="text-xs text-mq-content-secondary leading-relaxed">
                    {t('collectionNotice')}{' '}
                    <Link href="/privacy" className="text-mq-primary hover:underline font-medium">
                      {t('privacyPolicy')}
                    </Link>
                  </p>

                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full h-12 rounded-xl font-bold"
                    disabled={isSubmitting || oauthLoading}
                  >
                    {t('next')}
                  </Button>

                  {/* OAuth divider */}
                  <div className="flex items-center gap-3 text-xs text-mq-content font-semibold">
                    <div className="h-px flex-1 bg-mq-border" />
                    <span>{t('orSignWith')}</span>
                    <div className="h-px flex-1 bg-mq-border" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full rounded-full flex items-center justify-center gap-2 font-bold"
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
                    <span>{t('loginWithGoogle')}</span>
                  </Button>
                </div>

                {/* ── Step 2: Profile ── */}
                <div className={clsx('space-y-4', step !== 'profile' && 'hidden')}>
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="font-bold text-mq-content">
                      {t('fullName')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      placeholder={t('enterFullName')}
                      disabled={isSubmitting}
                      className="h-12 rounded-xl"
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
                    <Label htmlFor="studentId" className="font-bold text-mq-content">
                      {t('studentId')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="studentId"
                      placeholder={t('studentIdPlaceholder')}
                      disabled={isSubmitting}
                      className="h-12 rounded-xl"
                      {...register('studentId')}
                    />
                    {errors.studentId && (
                      <p className="text-xs text-red-500">{errors.studentId.message}</p>
                    )}
                  </div>

                  {/* Faculty */}
                  <div className="space-y-2">
                    <Label htmlFor="faculty" className="font-bold text-mq-content">
                      {t('faculty')} <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="faculty"
                      control={control}
                      render={({ field }) => (
                        <FacultySelect
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          placeholder={t('selectFaculty')}
                        />
                      )}
                    />
                    {errors.faculty && (
                      <p className="text-xs text-red-500">{errors.faculty.message}</p>
                    )}
                  </div>

                  {/* Course — searchable combobox */}
                  <div className="space-y-2">
                    <Label htmlFor="course" className="font-bold text-mq-content">
                      {t('course')} <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="course"
                      control={control}
                      render={({ field }) => (
                        <CourseCombobox
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          disabled={isSubmitting || !watchedFaculty}
                          error={!!errors.course}
                          facultyFilter={watchedFaculty}
                        />
                      )}
                    />
                    {errors.course && (
                      <p className="text-xs text-red-500">{errors.course.message}</p>
                    )}
                  </div>

                  {/* Year of Study */}
                  <div className="space-y-2">
                    <Label htmlFor="year" className="font-bold text-mq-content">
                      {t('year')} <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="year"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? ''}
                          onValueChange={field.onChange}
                          disabled={isSubmitting || !watchedCourse}
                        >
                          <SelectTrigger
                            className={clsx(
                              'w-full h-12 rounded-xl border-mq-border focus:ring-[3px] focus:border-mq-focus focus:ring-mq-focus/40 bg-mq-input-background',
                              errors.year && 'border-red-500',
                            )}
                          >
                            <SelectValue
                              placeholder={
                                watchedCourse ? t('yearPlaceholder') : t('selectCourseFirst')
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-mq-card-background border-mq-border overflow-hidden">
                            {yearOptions.map((y) => (
                              <SelectItem
                                key={y}
                                value={String(y)}
                                className="cursor-pointer hover:bg-mq-hover-background focus:bg-mq-hover-background focus:text-mq-primary"
                              >
                                {t('yearNumber', { year: y })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.year && <p className="text-xs text-red-500">{errors.year.message}</p>}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-12 rounded-xl font-bold"
                      onClick={() => setStep('auth')}
                      disabled={isSubmitting}
                    >
                      {t('back')}
                    </Button>
                    <Button
                      type="submit"
                      className={clsx(
                        'flex-1 h-12 rounded-xl font-bold',
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : '',
                      )}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                      {isSubmitting ? t('creatingAccount') : t('createAccount')}
                    </Button>
                  </div>
                </div>
              </form>

              {/* ── Email Confirmation Screen ── */}
              {step === 'confirmation' && (
                <div className="space-y-4 text-center">
                  <div className="bg-mq-success/10 border border-mq-success/20 rounded-xl p-4">
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
                    className="w-full h-12 rounded-xl font-bold"
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
                      className="text-mq-primary hover:underline font-bold"
                      disabled={isSubmitting || oauthLoading}
                    >
                      {t('signIn')}
                    </button>
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="pt-2 text-center text-xs text-mq-content-secondary space-y-1">
                <div>{t('copyright', { year: new Date().getFullYear() })}</div>
                <div>
                  <Link href="/privacy" className="hover:underline hover:text-mq-primary">
                    {t('privacyPolicy')}
                  </Link>
                  {' · '}
                  <Link href="/terms" className="hover:underline hover:text-mq-primary">
                    {t('termsOfService')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
