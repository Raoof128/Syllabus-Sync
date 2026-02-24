import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardSolid({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-mq-card-background border border-mq-border shadow-sm rounded-mq-xl',
        'hover:border-mq-accent/40 hover:shadow-md hover:-translate-y-[1px] transition-all duration-200',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardMuted({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-mq-background-secondary border border-mq-border rounded-mq-xl shadow-none',
        'hover:border-mq-accent/40 transition-all duration-200',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
