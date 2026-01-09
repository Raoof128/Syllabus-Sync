'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/mq/button';
import { errorHandler } from '@/lib/utils/errorHandling';

interface MapErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface MapErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

/**
 * MapErrorBoundary - Error boundary specifically for map components
 * Catches rendering errors and provides a graceful fallback UI
 */
export class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  constructor(props: MapErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<MapErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to our error handling system
    errorHandler.logError(error, 'Map Component', 'medium');

    this.setState({
      errorInfo: errorInfo.componentStack || null,
    });

    // In development, also log to console for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('MapErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div
          className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-mq-background-secondary/50 rounded-mq-lg border border-mq-border p-6"
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
            <h3 className="text-lg font-semibold text-mq-content mb-2">Map failed to load</h3>
            <p className="text-mq-sm text-mq-content-secondary mb-4">
              We encountered an issue loading the campus map. This might be due to a network issue
              or browser compatibility problem.
            </p>

            {/* Error details (development only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="w-full mb-4 text-left">
                <summary className="text-mq-xs text-mq-content-tertiary cursor-pointer hover:text-mq-content">
                  Technical details
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
                Try again
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                Reload page
              </Button>
            </div>

            {/* Help text */}
            <p className="mt-4 text-mq-xs text-mq-content-tertiary">
              If the problem persists, try refreshing the page or clearing your browser cache.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * withMapErrorBoundary - HOC to wrap components with MapErrorBoundary
 */
export function withMapErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode,
): React.FC<P> {
  const ComponentWithErrorBoundary: React.FC<P> = (props) => (
    <MapErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </MapErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withMapErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return ComponentWithErrorBoundary;
}

export default MapErrorBoundary;
