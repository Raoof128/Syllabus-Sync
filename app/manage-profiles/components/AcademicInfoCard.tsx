'use client';

import { useMemo, useEffect } from 'react';
import { UseFormReturn, Controller } from 'react-hook-form';
import { ProfileFormValues } from '../schema';
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
import { CourseCombobox } from '@/app/signup/components/CourseCombobox';
import { MQ_COURSES, DEGREE_TYPE_LABELS, DEGREE_MAX_YEARS } from '@/lib/data/mq-courses';

interface Props {
  form: UseFormReturn<ProfileFormValues>;
  disabled?: boolean;
}

export function AcademicInfoCard({ form, disabled }: Props) {
  const { t } = useTypedTranslation();
  const {
    control,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const selectedCourse = watch('course');
  const currentYear = watch('year');

  // Dynamic year range — same logic as signup page
  const maxYear = useMemo(() => {
    if (!selectedCourse) return 8;
    const course = MQ_COURSES.find((c) => c.name === selectedCourse);
    const label = course ? (DEGREE_TYPE_LABELS[course.type] ?? 'Other') : 'Other';
    return DEGREE_MAX_YEARS[label] ?? 8;
  }, [selectedCourse]);

  const academicYears = useMemo(
    () =>
      Array.from({ length: maxYear }, (_, i) => ({
        value: String(i + 1),
        label: `Year ${i + 1}`,
      })),
    [maxYear],
  );

  // Reset year when course changes to a shorter degree type
  useEffect(() => {
    const currentYearNum = Number(currentYear);
    if (currentYearNum > maxYear) {
      setValue('year', '', { shouldValidate: true });
    }
  }, [maxYear, currentYear, setValue]);

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
            {/* Course — searchable combobox (same as signup) */}
            <div className="space-y-2">
              <Label htmlFor="course">{t('course')}</Label>
              <Controller
                name="course"
                control={control}
                render={({ field }) => (
                  <CourseCombobox
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    disabled={disabled}
                    error={!!errors.course}
                  />
                )}
              />
              {errors.course && <p className="text-red-500 text-xs">{errors.course.message}</p>}
            </div>

            {/* Year Select — dynamic based on course, values match signup */}
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
                  {academicYears.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
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
