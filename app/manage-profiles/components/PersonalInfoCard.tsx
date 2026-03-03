'use client';

import { UseFormReturn } from 'react-hook-form';
import { ProfileFormValues } from '../schema';
import { Input } from '@/components/ui/mq/input';
import { Label } from '@/components/ui/label';
import { User, Lock } from 'lucide-react';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { MagicCard } from '@/components/ui/MagicCard';

interface Props {
  form: UseFormReturn<ProfileFormValues>;
  email?: string; // Email is read-only, not in Zod form
  disabled?: boolean;
}

export function PersonalInfoCard({ form, email, disabled }: Props) {
  const { t } = useTypedTranslation();
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <MagicCard isLiquidEnhanced>
      <div className="mq-magic-card-content bg-mq-card-background border border-mq-border">
        {/* Section Header */}
        <div className="flex items-center gap-3 p-5 sm:p-6 pb-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-mq-primary/10">
            <User className="h-4 w-4 text-mq-primary" />
          </div>
          <h2 className="text-lg font-semibold text-mq-content">{t('personalInfo')}</h2>
        </div>

        {/* Fields */}
        <div className="p-5 sm:p-6 pt-4 space-y-4">
          {/* Name Input */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium text-mq-content-secondary">
              {t('fullName')}
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder={t('enterFullName')}
              disabled={disabled}
              className={errors.name ? 'border-red-500' : ''}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          </div>

          {/* Read Only Email */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-mq-content-secondary">
              {t('emailAddress')}
            </Label>
            <div className="relative">
              <Input
                value={email}
                disabled
                className="bg-mq-background-subtle opacity-70 cursor-not-allowed pr-9"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mq-content-tertiary" />
            </div>
            <p className="text-xs text-mq-content-tertiary">{t('emailCannotBeChanged')}</p>
          </div>

          {/* Student ID */}
          <div className="space-y-1.5">
            <Label htmlFor="studentId" className="text-sm font-medium text-mq-content-secondary">
              {t('studentId')}
            </Label>
            <Input
              id="studentId"
              {...register('studentId')}
              placeholder="12345678"
              maxLength={8}
              inputMode="numeric"
              disabled={disabled}
              className={errors.studentId ? 'border-red-500' : ''}
              aria-invalid={!!errors.studentId}
            />
            {errors.studentId && (
              <p className="text-red-500 text-xs">{errors.studentId.message}</p>
            )}
          </div>
        </div>
      </div>
    </MagicCard>
  );
}
