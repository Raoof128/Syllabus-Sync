import { useState, forwardRef } from 'react';
import { Input, InputProps } from '@/components/ui/mq/input';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PasswordInput = forwardRef<HTMLInputElement, InputProps>(
  ({ className, onCopy, ...props }, ref) => {
    const [show, setShow] = useState(false);

    return (
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          className={cn('pr-10', className)}
          ref={ref}
          autoComplete="new-password"
          onCopy={onCopy}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-mq-content-secondary hover:text-mq-content-primary"
          tabIndex={-1} // Don't let users tab to this, it's annoying
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
