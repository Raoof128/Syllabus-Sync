'use client';

import { useState } from 'react';
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

export default function SignupClient() {
  const { t } = useTranslation();
  // Basic auth fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <div
              className={`w-2 h-2 rounded-full ${step === 'auth' ? 'bg-mq-primary' : 'bg-mq-success'}`}
            />
            <div className={`w-8 h-0.5 ${step === 'profile' ? 'bg-mq-primary' : 'bg-mq-border'}`} />
            <div
              className={`w-2 h-2 rounded-full ${step === 'profile' ? 'bg-mq-primary' : 'bg-mq-border'}`}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="error">
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
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={12}
                />
                <p className="text-xs text-mq-content-secondary">{t('passwordMinLength')}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={12}
                />
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
