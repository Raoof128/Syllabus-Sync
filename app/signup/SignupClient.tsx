'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/mq/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Input } from '@/components/ui/mq/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/mq/alert';
import { Icons } from '@/components/ui/icons';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import { toastUtils } from '@/lib/utils/toast';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { useProfilesStore } from '@/lib/store/profilesStore';
import { Eye, EyeOff, AlertTriangle, Check } from 'lucide-react';

// Password strength calculator
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'passwordWeak', color: 'bg-red-500' };
  if (score === 2) return { score: 2, label: 'passwordFair', color: 'bg-orange-500' };
  if (score === 3) return { score: 3, label: 'passwordGood', color: 'bg-yellow-500' };
  return { score: 4, label: 'passwordStrong', color: 'bg-green-500' };
}

export default function SignupClient() {
  const { t } = useTranslation();
  // Basic auth fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Profile fields
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'auth' | 'profile'>('auth');
  const router = useRouter();

  const addProfile = useProfilesStore((state) => state.addProfile);

  // Calculate password strength
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    if (password.length < 12) {
      setError(t('passwordTooShort'));
      return;
    }

    if (!agreedToTerms) {
      setError(t('mustAgreeToTerms'));
      return;
    }

    // Move to profile step
    setStep('profile');
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Call the API route to create the user
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              student_id: studentId,
              course,
              year,
            },
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || t('unexpectedError'));
        return;
      }

      // Create local profile
      addProfile({
        name: fullName,
        email,
        studentId,
        course,
        year,
        preferences: {
          notifications: true,
          emailReminders: true,
          pushNotifications: false,
        },
      });

      // Check if we got a session back (dev email auto-confirmed)
      if (result.data?.session) {
        toastUtils.success(t('accountCreated'), 'You are now signed in!');
        router.push('/home');
      } else {
        toastUtils.success(t('accountCreated'), t('verifyEmail'));
        router.push('/login');
      }
    } catch {
      setError(t('unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mq-background p-4">
      <Card className="w-full max-w-md mq-liquid-glass-elevated">
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

          {/* Step indicator - clickable */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => step === 'profile' && setStep('auth')}
              className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
                step === 'auth'
                  ? 'bg-mq-primary/10 text-mq-primary'
                  : 'bg-mq-success/10 text-mq-success cursor-pointer hover:bg-mq-success/20'
              }`}
              disabled={step === 'auth'}
            >
              {step === 'profile' ? (
                <Check className="w-3 h-3" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-mq-primary" />
              )}
              <span className="text-xs font-medium">{t('stepAccount')}</span>
            </button>
            <div className={`w-8 h-0.5 ${step === 'profile' ? 'bg-mq-primary' : 'bg-mq-border'}`} />
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                step === 'profile'
                  ? 'bg-mq-primary/10 text-mq-primary'
                  : 'bg-mq-surface text-mq-content-secondary'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${step === 'profile' ? 'bg-mq-primary' : 'bg-mq-border'}`}
              />
              <span className="text-xs font-medium">{t('stepProfile')}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="error">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'auth' ? (
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
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
                    disabled={isLoading}
                    minLength={12}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mq-content-secondary hover:text-mq-content-primary transition-colors"
                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Password strength indicator */}
                {password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            level <= passwordStrength.score
                              ? passwordStrength.color
                              : 'bg-mq-border'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-mq-content-secondary">
                      {t('passwordStrength')}:{' '}
                      {t(
                        passwordStrength.label as
                          | 'passwordWeak'
                          | 'passwordFair'
                          | 'passwordGood'
                          | 'passwordStrong',
                      )}
                    </p>
                  </div>
                )}
                <p className="text-xs text-mq-content-secondary">{t('passwordMinLength')}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    minLength={12}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mq-content-secondary hover:text-mq-content-primary transition-colors"
                    aria-label={showConfirmPassword ? t('hidePassword') : t('showPassword')}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {/* Password match indicator */}
                {confirmPassword && (
                  <p
                    className={`text-xs ${password === confirmPassword ? 'text-mq-success' : 'text-mq-error'}`}
                  >
                    {password === confirmPassword
                      ? '✓ Passwords match'
                      : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              {/* Terms and Privacy checkbox */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-mq-border text-mq-primary focus:ring-mq-primary"
                  disabled={isLoading}
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {t('next')}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('fullName')}</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder={t('enterFullName')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentId">{t('studentId')}</Label>
                <Input
                  id="studentId"
                  type="text"
                  placeholder="12345678"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course">{t('course')}</Label>
                  <Input
                    id="course"
                    type="text"
                    placeholder={t('coursePlaceholder')}
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">{t('year')}</Label>
                  <Input
                    id="year"
                    type="text"
                    placeholder={t('yearPlaceholder')}
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('auth')}
                  disabled={isLoading}
                >
                  {t('back')}
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? t('creatingAccount') : t('createAccount')}
                </Button>
              </div>
            </form>
          )}

          <div className="text-center text-sm text-mq-content-secondary">
            <p>
              {t('alreadyHaveAccount')}{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-mq-primary hover:underline font-medium"
                disabled={isLoading}
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
