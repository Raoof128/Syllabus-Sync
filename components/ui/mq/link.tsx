import React from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const linkVariants = cva(
  'inline-flex items-center transition-all duration-mq-fast ease-mq-snap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'text-mq-primary hover:text-mq-red-bright hover:underline underline-offset-2',
        subtle:
          'text-mq-content-secondary hover:text-mq-content hover:underline underline-offset-2',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>, VariantProps<typeof linkVariants> {
  href: string;
  external?: boolean;
}

const MQLink = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, variant, href, external = false, ...props }, ref) => {
    const linkClass = cn(linkVariants({ variant, className }));

    if (external) {
      return (
        <a
          ref={ref}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          {...props}
        />
      );
    }

    return <Link href={href} className={linkClass} ref={ref} {...props} />;
  },
);
MQLink.displayName = 'MQLink';

export { MQLink, linkVariants };
