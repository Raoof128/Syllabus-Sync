'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/mq/button';
import { MagicCard } from '@/components/ui/MagicCard';
import type { TranslationKey } from '@/lib/i18n/translations';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string | ((t: (key: TranslationKey) => string) => string);
  description?: string | ((t: (key: TranslationKey) => string) => string);
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
  t: (key: TranslationKey) => string;
  isMagicCard?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
  t,
  isMagicCard = true,
}: EmptyStateProps) {
  const resolvedTitle = typeof title === 'function' ? title(t) : title;
  const resolvedDescription = typeof description === 'function' ? description(t) : description;

  const content = (
    <div className={cn('text-center py-12', className)}>
      {icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center text-mq-content-tertiary">
          {icon}
        </div>
      )}
      <h3 className="text-mq-lg font-semibold text-mq-content mb-2">{resolvedTitle}</h3>
      {resolvedDescription && (
        <p className="text-mq-content-secondary text-sm max-w-md mx-auto mb-4">
          {resolvedDescription}
        </p>
      )}
      {actionLabel && (onAction || actionHref) && (
        <Button asChild={!!actionHref} onClick={onAction} className="gap-2">
          {actionHref ? <a href={actionHref}>{actionLabel}</a> : actionLabel}
        </Button>
      )}
    </div>
  );

  if (isMagicCard) {
    return (
      <MagicCard isLiquidEnhanced className="w-full">
        <div className="mq-magic-card-content">{content}</div>
      </MagicCard>
    );
  }

  return content;
}

export default EmptyState;
