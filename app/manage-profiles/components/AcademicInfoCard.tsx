'use client';

import { UseFormReturn } from 'react-hook-form';
import { ProfileFormValues } from '../schema';
import { Input } from '@/components/ui/mq/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { GraduationCap } from 'lucide-react';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { MagicCard } from '@/components/ui/MagicCard';
import { TranslationKey } from '@/lib/i18n/translations';

// Academic year options
const ACADEMIC_YEARS = [
  { value: '1st Year', labelKey: 'academicYear_1' },
  { value: '2nd Year', labelKey: 'academicYear_2' },
  { value: '3rd Year', labelKey: 'academicYear_3' },
  { value: '4th Year', labelKey: 'academicYear_4' },
  { value: '5th Year', labelKey: 'academicYear_5' },
  { value: 'Postgraduate', labelKey: 'academicYear_postgrad' },
  { value: 'PhD', labelKey: 'academicYear_phd' },
];

interface Props {
  form: UseFormReturn<ProfileFormValues>;
  disabled?: boolean;
}

export function AcademicInfoCard({ form, disabled }: Props) {
  const { t } = useTypedTranslation();
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const currentYear = watch('year'); // Subscribe to year changes

  return (
    <MagicCard isLiquidEnhanced className="mb-4 sm:mb-6">
      <div className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border">
        <Card className="border border-mq-border bg-mq-card-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" /> {t('academicInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Course */}
            <div className="space-y-2">
              <Label htmlFor="course">{t('course')}</Label>
              <Input
                id="course"
                {...register('course')}
                placeholder={t('coursePlaceholder')}
                disabled={disabled}
                className={errors.course ? 'border-red-500' : ''}
                aria-invalid={!!errors.course}
              />
              {errors.course && <p className="text-red-500 text-xs">{errors.course.message}</p>}
            </div>

            {/* Year Select - Connecting UI to RHF */}
            <div className="space-y-2">
              <Label>{t('year')}</Label>
              <Select
                value={currentYear}
                onValueChange={(val) => setValue('year', val, { shouldValidate: true })}
                disabled={disabled}
              >
                <SelectTrigger className={errors.year ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t('yearPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_YEARS.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {t(year.labelKey as TranslationKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.year && <p className="text-red-500 text-xs">{errors.year.message}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </MagicCard>
  );
}
