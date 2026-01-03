// components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { errorHandler } from '@/lib/utils/errorHandling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export default class ErrorBoundary extends Component<Props, State> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    errorHandler.logError(error, 'ErrorBoundary', 'high');

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service (when implemented)
    this.reportError(error, errorInfo);

    this.setState({ errorInfo });
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Placeholder for error reporting service
    // In a real app, this would send to services like Sentry, LogRocket, etc.
    if (typeof window === 'undefined') {
      return;
    }
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Store in localStorage for debugging (in development)
    if (process.env.NODE_ENV === 'development') {
      try {
        const existingReports = JSON.parse(localStorage.getItem('errorReports') || '[]');
        existingReports.push(errorReport);
        localStorage.setItem('errorReports', JSON.stringify(existingReports.slice(-10))); // Keep last 10
      } catch {
        // Swallow localStorage errors in development
      }
    }

    // TODO: Send to error tracking service
    // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  };

  private handleRetry = () => {
    const { retryCount } = this.state;
    const maxRetries = 3;

    if (retryCount < maxRetries) {
      // Implement exponential backoff
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s

      this.retryTimeout = setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: retryCount + 1,
        });
      }, delay);
    } else {
      // Max retries reached, redirect to home
      window.location.href = '/';
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, retryCount } = this.state;
      const maxRetries = 3;
      const canRetry = retryCount < maxRetries;

      return (
        <div className="flex items-center justify-center min-h-[60vh] px-4 animate-fade-in">
          <div className="text-center max-w-lg mx-auto">
            {/* Error Icon */}
            <div className="mx-auto w-20 h-20 bg-mq-error/10 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-10 h-10 text-mq-error" />
            </div>

            {/* Error Title */}
            <h1 className="text-mq-3xl font-bold text-mq-content mb-3">
              Oops! Something went wrong
            </h1>

            {/* Error Description */}
            <p className="text-mq-content-secondary mb-6 text-mq-medium">
              We encountered an unexpected error. This has been automatically reported and
              we&apos;re working to fix it.
            </p>

            {/* Retry Counter */}
            {retryCount > 0 && (
              <div className="mb-4 p-3 bg-mq-warning/10 border border-mq-warning/20 rounded-mq-lg">
                <p className="text-mq-sm text-mq-warning">
                  Retry attempt {retryCount} of {maxRetries}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              {canRetry ? (
                <Button onClick={this.handleRetry} className="gap-2" size="lg">
                  <RefreshCcw className="w-4 h-4" />
                  Try Again
                </Button>
              ) : (
                <Button asChild className="gap-2" size="lg">
                  <Link href="/home">
                    <Home className="w-4 h-4" />
                    Go Home
                  </Link>
                </Button>
              )}

              <Button variant="outline" onClick={this.handleReset} className="gap-2" size="lg">
                <Bug className="w-4 h-4" />
                Reset
              </Button>
            </div>

            {/* Development Error Details */}
            {(this.props.showErrorDetails || process.env.NODE_ENV === 'development') && error && (
              <details className="mt-8 text-left bg-mq-background-secondary p-4 rounded-mq-lg border border-mq-border">
                <summary className="cursor-pointer font-medium text-mq-content mb-2">
                  🔧 Error Details (Development)
                </summary>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-mq-content mb-1">
                      Error Message:
                    </h4>
                    <code className="text-mq-sm bg-mq-error/10 text-mq-error p-2 rounded-mq block">
                      {error.message}
                    </code>
                  </div>

                  {errorInfo && (
                    <div>
                      <h4 className="font-medium text-mq-content mb-1">
                        Component Stack:
                      </h4>
                      <pre className="text-mq-xs bg-mq-background-tertiary text-mq-content p-3 rounded-mq overflow-auto max-h-48 whitespace-pre-wrap">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-mq-content mb-1">
                      Stack Trace:
                    </h4>
                    <pre className="text-mq-xs bg-mq-background-tertiary text-mq-content p-3 rounded-mq overflow-auto max-h-48">
                      {error.stack}
                    </pre>
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
