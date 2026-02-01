'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/mq/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  sectionName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for settings sections.
 * Prevents a single section crash from taking down the entire settings page.
 */
export class SettingsSectionBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `SettingsSectionBoundary caught an error in ${this.props.sectionName || 'section'}:`,
      error,
      errorInfo,
    );
  }

  public componentDidUpdate(prevProps: Props) {
    if (this.props.sectionName !== prevProps.sectionName && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 border border-destructive/20 rounded-lg bg-destructive/5 flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-3 bg-destructive/10 rounded-full">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {this.props.sectionName ? `Error in ${this.props.sectionName}` : 'Section Error'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mt-1">
              Something went wrong while loading this section. You can try again or check other
              settings.
            </p>
          </div>
          <Button variant="outline" onClick={this.handleRetry}>
            Try Again
          </Button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="text-xs text-left w-full p-2 bg-black/5 rounded overflow-auto max-h-40 mt-4">
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
