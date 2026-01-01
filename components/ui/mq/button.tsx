import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-mq font-medium transition-all duration-mq-mid ease-mq-ease focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-mq-primary text-white shadow-mq-sm hover:bg-mq-red-bright hover:shadow-mq active:scale-[0.98]',
        secondary: 'bg-mq-secondary text-mq-content border border-mq-border hover:bg-mq-sand-300 hover:border-mq-border-secondary active:scale-[0.98]',
        ghost: 'text-mq-content-secondary hover:bg-mq-background-secondary hover:text-mq-content active:scale-[0.98]',
      },
      size: {
        sm: 'h-8 px-3 text-mq-sm',
        default: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 text-mq-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };