'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FingerprintButton } from '@/components/auth/FingerprintButton'; // Keeping original UI component
import { Input } from '@/components/ui/mq/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/mq/alert';
import { Button } from '@/components/ui/mq/button';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import { AUTH_ERRORS } from '@/lib/constants/errors';
import { toastUtils } from '@/lib/utils/toast';
import { isValidRedirect } from '@/lib/utils/security';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { loginSchema, type LoginFormData } from './schemas/loginSchema';
import { loginAction } from './actions';
import { usePasskeyLogin } from './hooks/usePasskeyLogin';
import { AlertTriangle, Eye, EyeOff, Fingerprint, Loader2 } from 'lucide-react';

export default function LoginClient() {
  const { t } = useTypedTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithPasskey, isPasskeyLoading } = usePasskeyLogin();

  // Form Management
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onSubmit',
  });

  // Check email for UI states
  // eslint-disable-next-line react-hooks/incompatible-library
  const email = watch('email');

  // UI States (Preserving original UI richness)
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Passkey availability check (could be in the hook too, but kept simple here for now)
  const [passkeyStatus, setPasskeyStatus] = useState<
    'idle' | 'checking' | 'available' | 'unavailable' | 'unsupported'
  >('idle');

  // Redirect Logic
  const rawRedirect = searchParams.get('redirectTo');
  const redirectTo = isValidRedirect(rawRedirect) ? rawRedirect! : '/home';

  // Computed
  const isGlobalLoading = isSubmitting || isPasskeyLoading || isSuccess;
  const isError = !!generalError || Object.keys(errors).length > 0;

  const onSubmit = async (data: LoginFormData) => {
    setGeneralError(null);
    setIsSuccess(false);

    try {
      const result = await loginAction(data);

      if (result.error) {
        if (result.error.includes(AUTH_ERRORS.INVALID_LOGIN)) {
          setGeneralError(t('loginErrorInvalidCredentials'));
        } else if (result.error.includes(AUTH_ERRORS.EMAIL_NOT_CONFIRMED)) {
          setGeneralError(t('loginErrorEmailNotConfirmed'));
        } else if (
          result.error.includes(AUTH_ERRORS.TOO_MANY_REQUESTS) ||
          result.error.includes('Too many login attempts')
        ) {
          setGeneralError(t('loginErrorTooManyRequests'));
        } else {
          setGeneralError(result.error);
        }
        return;
      }

      setIsSuccess(true);
      toastUtils.success(t('welcomeBack'), t('loginSuccess'));

      setTimeout(() => {
        router.push(redirectTo);
      }, 800);
    } catch {
      setGeneralError(t('unexpectedError'));
    }
  };

  // Passkey Login Handler
  const handlePasskeyLogin = () => {
    setGeneralError(null);
    loginWithPasskey(email, () => {
      setIsSuccess(true);
      setTimeout(() => router.push(redirectTo), 800);
    });
  };

  // Passkey Availability Effect
  useEffect(() => {
    if (!email || !email.includes('@')) {
      setPasskeyStatus('idle');
      return;
    }

    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      setPasskeyStatus('unsupported');
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setPasskeyStatus('checking');
      try {
        const response = await fetch('/api/auth/passkey/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });
        const result = await response.json();
        if (!active) return;
        setPasskeyStatus(result?.data?.available ? 'available' : 'unavailable');
      } catch {
        if (active) {
          setPasskeyStatus('unavailable');
        }
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [email]);

  // OAuth Placeholder
  const handleOAuthLogin = (provider: 'google' | 'facebook') => {
    const providerName = provider === 'google' ? t('loginWithGoogle') : t('loginWithFacebook');
    toastUtils.info(t('featureComingSoon'), t('oauthComingSoon', { provider: providerName }));
  };

  return (
    <div className="login-page min-h-[100dvh] flex items-start lg:items-center justify-center bg-mq-background p-0 relative overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/32 to-mq-background/85" />

      <div className="relative z-10 w-full max-w-none min-h-[100dvh] h-auto lg:h-[100dvh] overflow-hidden bg-mq-background/10 border border-mq-border/18 backdrop-blur-3xl shadow-[0_18px_70px_rgba(0,0,0,0.25)] flex flex-col lg:flex-row">
        {/* Left Panel */}
        <div className="w-full lg:w-5/12 bg-mq-background text-mq-content backdrop-blur-xl border-b lg:border-b-0 lg:border-r border-mq-border px-8 lg:px-12 py-12 flex flex-col">
          <div className="flex items-center justify-center mb-8">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <Image
                src="/MQ_Logo_Final.png"
                alt={t('mqLogoAlt')}
                width={160}
                height={160}
                className="object-contain drop-shadow-xl w-auto h-auto"
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
              <Link href="/signup" className="text-mq-primary hover:underline font-bold">
                {t('signUp')}
              </Link>
            </p>
          </div>

          {generalError && (
            <Alert variant="error" className="mb-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}

          {showForgotPassword ? (
            <div className="space-y-4">
              {/* Simplified Forgot Password UI Placeholder since we are focusing on Login Refactor */}
              <div className="text-center">
                <p className="text-sm">
                  Please implement Forgot Password using shared hooks later.
                </p>
                <Button variant="ghost" onClick={() => setShowForgotPassword(false)}>
                  {t('backToLogin')}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex-1 flex flex-col">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-mq-content font-bold">
                  {t('email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  {...register('email')}
                  autoComplete="email"
                  disabled={isGlobalLoading}
                  className="h-12 rounded-xl text-mq-content font-medium"
                />
                {errors.email && (
                  <p className="text-xs text-red-500 font-medium ml-1">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-mq-content font-bold">
                  {t('password')}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    autoComplete="current-password"
                    disabled={isGlobalLoading}
                    className="pr-10 h-12 rounded-xl text-mq-content font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mq-content hover:text-mq-primary transition-colors"
                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                    aria-pressed={showPassword}
                    disabled={isGlobalLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 font-medium ml-1">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setGeneralError(null);
                  }}
                  className="text-mq-primary hover:underline font-bold"
                  disabled={isGlobalLoading}
                >
                  {t('forgotPassword')}
                </button>
              </div>

              <div className="pt-2 flex justify-center">
                <FingerprintButton
                  type="submit"
                  text={t('signIn')}
                  disabled={isGlobalLoading}
                  isLoading={isSubmitting}
                  isSuccess={isSuccess}
                  isError={isError}
                  onAnimationComplete={() => isError && setGeneralError(null)}
                  className="w-full max-w-[260px] font-bold"
                />
              </div>

              <div className="text-center text-sm text-mq-content font-medium">
                <p>
                  {t('noAccount')}{' '}
                  <Link href="/signup" className="text-mq-primary hover:underline font-bold">
                    {t('signUp')}
                  </Link>
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-full flex items-center justify-center gap-2 font-bold"
                onClick={handlePasskeyLogin}
                disabled={isGlobalLoading || !email}
              >
                {isPasskeyLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Fingerprint className="h-4 w-4" aria-hidden="true" />
                )}
                {isPasskeyLoading ? t('loading') : t('biometricLogin')}
              </Button>
              <p className="text-xs text-mq-content-secondary text-center">
                {t('biometricLogin')}:{' '}
                {passkeyStatus === 'checking'
                  ? t('loading')
                  : passkeyStatus === 'available'
                    ? t('enabled')
                    : passkeyStatus === 'unsupported'
                      ? t('notSupported')
                      : t('disabled')}
              </p>

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
              <p className="uppercase tracking-[0.2em] text-xs text-[color:var(--alabaster)]">
                {t('campusNavigation')}
              </p>
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight text-[color:var(--alabaster)]">
                {t('loginHeroTitle')}
              </h2>
              <p className="text-sm lg:text-base max-w-xl text-[color:var(--alabaster)]">
                {t('loginHeroDescription')}
              </p>
            </div>

            <div className="relative flex-1 w-full mt-10 lg:mt-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
