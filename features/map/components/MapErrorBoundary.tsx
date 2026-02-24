'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/mq/button';
import { errorHandler } from '@/lib/utils/errorHandling';
import { logger } from '@/lib/logger';
import { useSafeTranslation } from '@/lib/hooks/useSafeTranslation';

/** Translated strings passed from the functional wrapper to the class component */
interface MapErrorTranslations {
  mapFailedToLoad: string;
  mapLoadErrorDescription: string;
  technicalDetails: string;
  tryAgain: string;
  reloadPage: string;
  mapErrorPersistHelp: string;
}

interface MapErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  translations?: MapErrorTranslations;
}

interface MapErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
  retryCount: number;
}

/**
 * Known Leaflet errors that are transient and can be automatically retried.
 * These typically occur during rapid mount/unmount cycles, hot reload, or
 * when Next.js Turbopack performs fast refresh.
 */
const TRANSIENT_LEAFLET_ERRORS = [
  // DOM element not ready errors
  "Cannot read properties of undefined (reading 'tagName')",
  "Cannot read properties of undefined (reading 'parentNode')",
  "Cannot read properties of undefined (reading 'style')",
  "Cannot read properties of undefined (reading 'className')",
  "Cannot read properties of undefined (reading 'classList')",
  "Cannot read properties of undefined (reading 'appendChild')",
  "Cannot read properties of undefined (reading 'removeChild')",
  "Cannot read properties of undefined (reading 'insertBefore')",
  // Leaflet internal state errors
  "Cannot set properties of undefined (setting '_leaflet_pos')",
  "Cannot set properties of undefined (setting '_leaflet_id')",
  // Null reference errors during unmount
  "Cannot read properties of null (reading 'appendChild')",
  "Cannot read properties of null (reading 'removeChild')",
  "Cannot read properties of null (reading 'parentNode')",
  "Cannot read properties of null (reading 'tagName')",
  "Cannot read properties of null (reading 'style')",
  "Cannot read properties of null (reading '_leaflet_pos')",
  // Map container errors
  'Map container is already initialized',
  'Map container not found',
  // Layer errors during rapid state changes
  "Cannot read properties of undefined (reading '_map')",
  "Cannot read properties of null (reading '_map')",
];

/**
 * Check if an error is a transient Leaflet error that can be retried
 */
function isTransientLeafletError(error: Error | null): boolean {
  if (!error) return false;
  const message = error.message || '';
  return TRANSIENT_LEAFLET_ERRORS.some(
    (pattern) => message.includes(pattern) || message.toLowerCase().includes(pattern.toLowerCase()),
  );
}

const MAX_AUTO_RETRIES = 3; // Increased from 2 to handle Turbopack fast refresh

/**
 * MapErrorBoundary - Error boundary specifically for map components
 * Catches rendering errors and provides a graceful fallback UI
 * Automatically retries transient Leaflet DOM errors
 */
export class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(props: MapErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<MapErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Check if this is a transient Leaflet error that can be auto-retried
    if (isTransientLeafletError(error) && this.state.retryCount < MAX_AUTO_RETRIES) {
      // Don't log transient errors to error handler - they're expected during HMR
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `MapErrorBoundary: Transient Leaflet error detected, auto-retrying (${this.state.retryCount + 1}/${MAX_AUTO_RETRIES})...`,
          error.message,
        );
      }

      // Auto-retry after a short delay to allow React to settle
      if (this.retryTimeout) clearTimeout(this.retryTimeout);
      this.retryTimeout = setTimeout(() => {
        this.setState((prev) => ({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: prev.retryCount + 1,
        }));
      }, 150); // Increased from 100ms to 150ms for better stability

      return;
    }

    // Log non-transient errors to our error handling system
    errorHandler.logError(error, 'Map Component', 'medium');

    this.setState({
      errorInfo: errorInfo.componentStack || null,
    });

    // In development, also log to console for debugging
    if (process.env.NODE_ENV === 'development') {
      logger.error('MapErrorBoundary caught an error:', error);
      logger.error('Component stack:', errorInfo.componentStack);
    }
  }

  componentWillUnmount(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const t = this.props.translations;

      // Default error UI
      return (
        <div
          className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-mq-background-secondary rounded-mq-lg border border-mq-border p-6"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex flex-col items-center text-center max-w-md">
            {/* Error icon */}
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full bg-mq-error/10 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-mq-error" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-mq-card-background border border-mq-border flex items-center justify-center">
                <MapPin className="h-3 w-3 text-mq-content-tertiary" />
              </div>
            </div>

            {/* Error message */}
            <h3 className="text-lg font-semibold text-mq-content mb-2">
              {t?.mapFailedToLoad ?? 'Map failed to load'}
            </h3>
            <p className="text-mq-sm text-mq-content-secondary mb-4">
              {t?.mapLoadErrorDescription ??
                'We encountered an issue loading the campus map. This might be due to a network issue or browser compatibility problem.'}
            </p>

            {/* Error details (development only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="w-full mb-4 text-left">
                <summary className="text-mq-xs text-mq-content-tertiary cursor-pointer hover:text-mq-content">
                  {t?.technicalDetails ?? 'Technical details'}
                </summary>
                <pre className="mt-2 p-3 text-xs bg-mq-background rounded-mq overflow-x-auto text-mq-error">
                  {this.state.error.message}
                  {this.state.errorInfo && (
                    <>
                      {'\n\nComponent Stack:'}
                      {this.state.errorInfo}
                    </>
                  )}
                </pre>
              </details>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <Button onClick={this.handleRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                {t?.tryAgain ?? 'Try again'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                {t?.reloadPage ?? 'Reload page'}
              </Button>
            </div>

            {/* Help text */}
            <p className="mt-4 text-mq-xs text-mq-content-tertiary">
              {t?.mapErrorPersistHelp ??
                'If the problem persists, try refreshing the page or clearing your browser cache.'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * TranslatedMapErrorBoundary — functional wrapper that provides i18n
 * translations to the class-based MapErrorBoundary.
 */
export function TranslatedMapErrorBoundary({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { safeT } = useSafeTranslation();

  const translations: MapErrorTranslations = {
    mapFailedToLoad: safeT('mapFailedToLoad', 'Map failed to load'),
    mapLoadErrorDescription: safeT(
      'mapLoadErrorDescription',
      'We encountered an issue loading the campus map. This might be due to a network issue or browser compatibility problem.',
    ),
    technicalDetails: safeT('technicalDetails', 'Technical details'),
    tryAgain: safeT('tryAgain', 'Try again'),
    reloadPage: safeT('reloadPage', 'Reload page'),
    mapErrorPersistHelp: safeT(
      'mapErrorPersistHelp',
      'If the problem persists, try refreshing the page or clearing your browser cache.',
    ),
  };

  return (
    <MapErrorBoundary fallback={fallback} translations={translations}>
      {children}
    </MapErrorBoundary>
  );
}

/**
 * withMapErrorBoundary - HOC to wrap components with MapErrorBoundary
 */
export function withMapErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode,
): React.FC<P> {
  const ComponentWithErrorBoundary: React.FC<P> = (props) => (
    <TranslatedMapErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </TranslatedMapErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withMapErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return ComponentWithErrorBoundary;
}

export default MapErrorBoundary;
