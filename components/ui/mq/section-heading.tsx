import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const headingVariants = cva('', {
  variants: {
    level: {
      h1: 'text-mq-4xl sm:text-mq-5xl font-serif font-bold tracking-tight text-mq-content',
      h2: 'text-mq-3xl sm:text-mq-4xl font-serif font-bold tracking-tight text-mq-content',
      h3: 'text-mq-2xl sm:text-mq-3xl font-serif font-semibold tracking-tight text-mq-content',
    },
  },
  defaultVariants: {
    level: 'h2',
  },
});

interface SectionHeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>, VariantProps<typeof headingVariants> {}

export const SectionHeading = React.forwardRef<HTMLHeadingElement, SectionHeadingProps>(
  ({ className, level = 'h2', ...props }, ref) => {
    const headingClass = cn(headingVariants({ level }), className);

    switch (level) {
      case 'h1':
        return <h1 ref={ref} className={headingClass} {...props} />;
      case 'h2':
        return <h2 ref={ref} className={headingClass} {...props} />;
      case 'h3':
        return <h3 ref={ref} className={headingClass} {...props} />;
      default:
        return <h2 ref={ref} className={headingClass} {...props} />;
    }
  },
);
SectionHeading.displayName = 'SectionHeading';
