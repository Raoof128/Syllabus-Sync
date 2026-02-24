'use client';

import { useEffect, useRef } from 'react';
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
import { FacultySelect } from '@/app/signup/components/FacultySelect';
import { getYearOptions } from '@/lib/data/mq-courses';

interface Props {
  form: UseFormReturn<ProfileFormValues>;
  disabled?: boolean;
}

export function AcademicInfoCard({ form, disabled }: Props) {
  const { t } = useTypedTranslation();
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const watchedFaculty = watch('faculty');
  const watchedCourse = watch('course');
  const yearOptions = watchedCourse ? getYearOptions(watchedCourse) : [];

  // Skip reset on initial hydration so we don't wipe loaded profile data
  const isInitialMount = useRef(true);

  // Reset course & year when faculty changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setValue('course', '');
    setValue('year', '');
  }, [watchedFaculty, setValue]);

  // Reset year when course changes
  useEffect(() => {
    if (!watchedCourse) {
      setValue('year', '');
    }
  }, [watchedCourse, setValue]);

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
            {/* Faculty */}
            <div className="space-y-2">
              <Label htmlFor="faculty">{t('faculty')}</Label>
              <Controller
                name="faculty"
                control={control}
                render={({ field }) => (
                  <FacultySelect
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder={t('selectFaculty')}
                  />
                )}
              />
              {errors.faculty && <p className="text-red-500 text-xs">{errors.faculty.message}</p>}
            </div>

            {/* Course — searchable combobox */}
            <div className="space-y-2">
              <Label htmlFor="course">{t('course')}</Label>
              <Controller
                name="course"
                control={control}
                render={({ field }) => (
                  <CourseCombobox
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    disabled={disabled || !watchedFaculty}
                    error={!!errors.course}
                    facultyFilter={watchedFaculty}
                  />
                )}
              />
              {errors.course && <p className="text-red-500 text-xs">{errors.course.message}</p>}
            </div>

            {/* Year Select — dynamic based on course */}
            <div className="space-y-2">
              <Label>{t('year')}</Label>
              <Controller
                name="year"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ''}
                    onValueChange={field.onChange}
                    disabled={disabled || !watchedCourse}
                  >
                    <SelectTrigger className={errors.year ? 'border-red-500' : ''}>
                      <SelectValue
                        placeholder={watchedCourse ? t('yearPlaceholder') : t('selectCourseFirst')}
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-mq-card-background border-mq-border">
                      {yearOptions.map((y) => (
                        <SelectItem
                          key={y}
                          value={String(y)}
                          className="cursor-pointer hover:bg-mq-hover-background focus:bg-mq-hover-background focus:text-mq-primary"
                        >
                          {t('yearNumber', { year: y })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.year && <p className="text-red-500 text-xs">{errors.year.message}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </MagicCard>
  );
}
