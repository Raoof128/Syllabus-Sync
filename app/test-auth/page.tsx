// Test page for authentication API
'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function TestAuthPage() {
  const { t } = useTranslation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testSignup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test2@student.mq.edu.au',
          password: 'testpassword123',
          fullName: 'Test User 2',
          studentId: '87654321',
        }),
      });
      const data = await response.json();
      setResult({ action: 'signup', ...data });
    } catch (error) {
      setResult({
        action: 'signup',
        error: error instanceof Error ? error.message : String(error),
      });
    }
    setLoading(false);
  };

  const testSignin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@student.mq.edu.au',
          password: 'testpassword123',
        }),
      });
      const data = await response.json();
      setResult({ action: 'signin', ...data });
    } catch (error) {
      setResult({
        action: 'signin',
        error: error instanceof Error ? error.message : String(error),
      });
    }
    setLoading(false);
  };

  const testUser = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/user');
      const data = await response.json();
      setResult({ action: 'user', ...data });
    } catch (error) {
      setResult({ action: 'user', error: error instanceof Error ? error.message : String(error) });
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{t('authenticationApiTest')}</h1>

      <div className="space-x-4 mb-8">
        <button
          onClick={testSignup}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {t('testSignup')}
        </button>

        <button
          onClick={testSignin}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {t('testSignin')}
        </button>

        <button
          onClick={testUser}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {t('testUser')}
        </button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">{t('resultAction', { action: result.action })}</h2>
          <pre className="text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
