import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-mq-content placeholder:text-mq-content-tertiary selection:bg-mq-focus selection:text-mq-background-invert border-mq-border h-9 w-full min-w-0 rounded-mq border bg-mq-input-background px-3 py-1 text-base text-mq-content shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-mq-focus focus-visible:ring-mq-focus/40 focus-visible:ring-[3px]',
        'aria-invalid:ring-mq-error/20 dark:aria-invalid:ring-mq-error/40 aria-invalid:border-mq-error',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
