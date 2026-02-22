import { useState, useEffect } from "react";

export function useHomeErrorBoundary() {
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
      setErrorMessage(event.error?.message || "An unexpected error occurred");
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setHasError(true);
      setErrorMessage(event.reason?.message || "An unexpected error occurred");
    };

    window.addEventListener("error", handleUnhandledError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleUnhandledError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  return {
    hasError,
    errorMessage,
    handleErrorRecovery,
  };
}
