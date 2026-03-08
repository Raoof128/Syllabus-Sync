import { useState, useEffect } from 'react';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';

export function useHomeErrorBoundary() {
  const { t } = useTypedTranslation();
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Error recovery function
  const handleErrorRecovery = () => {
    setHasError(false);
    setErrorMessage(null);
    window.location.reload();
  };

  // Catch any unhandled errors in child components
  useEffect(() => {
    const handleUnhandledError = (event: ErrorEvent) => {
      setHasError(true);
      setErrorMessage(event.error?.message || t('unexpectedError'));
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setHasError(true);
      setErrorMessage(event.reason?.message || t('unexpectedError'));
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [t]);

  return {
    hasError,
    errorMessage,
    handleErrorRecovery,
  };
}
