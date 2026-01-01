import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-mq-sm font-medium text-mq-content">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-mq border border-mq-border bg-mq-background px-3 py-2 text-mq-sm text-mq-content placeholder:text-mq-content-tertiary transition-colors duration-mq-fast ease-mq-snap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-mq-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };