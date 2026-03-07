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
    formState: { errors, dirtyFields },
  } = form;

  const watchedFaculty = watch('faculty');
  const watchedCourse = watch('course');
  const yearOptions = watchedCourse ? getYearOptions(watchedCourse) : [];

  // Track previous values to detect actual user changes
  const prevFacultyRef = useRef<string>(watchedFaculty || '');
  const prevCourseRef = useRef<string>(watchedCourse || '');

  // Reset course & year when faculty changes (only when user actually changed it)
  useEffect(() => {
    const currentFaculty = watchedFaculty || '';

    // Only reset if:
    // 1. Faculty value actually changed
    // 2. AND the faculty field has been dirtied (user touched it)
    if (prevFacultyRef.current !== currentFaculty && dirtyFields.faculty) {
      setValue('course', '');
      setValue('year', '');
    }

    // Always update the ref to track current value
    prevFacultyRef.current = currentFaculty;
  }, [watchedFaculty, dirtyFields.faculty, setValue]);

  // Reset year when course changes (only when user actually changed it)
  useEffect(() => {
    const currentCourse = watchedCourse || '';

    // Only reset year if:
    // 1. Course value actually changed
    // 2. AND the course field has been dirtied (user touched it)
    // 3. AND course is now empty
    if (prevCourseRef.current !== currentCourse && dirtyFields.course && !currentCourse) {
      setValue('year', '');
    }

    // Always update the ref to track current value
    prevCourseRef.current = currentCourse;
  }, [watchedCourse, dirtyFields.course, setValue]);

  return (
    <MagicCard isLiquidEnhanced>
      <div className="mq-magic-card-content bg-mq-card-background border border-mq-border">
        {/* Section Header */}
        <div className="flex items-center gap-3 p-5 sm:p-6 pb-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FFB81C]/15">
            <GraduationCap className="h-4 w-4 text-[#c08c00]" />
          </div>
          <h2 className="text-lg font-semibold text-mq-content">{t('academicInfo')}</h2>
        </div>

        {/* Fields */}
        <div className="p-5 sm:p-6 pt-4 space-y-4">
          {/* Faculty */}
          <div className="space-y-1.5">
            <Label htmlFor="faculty" className="text-sm font-medium text-mq-content-secondary">
              {t('faculty')}
            </Label>
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
          <div className="space-y-1.5">
            <Label htmlFor="course" className="text-sm font-medium text-mq-content-secondary">
              {t('course')}
            </Label>
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
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-mq-content-secondary">{t('year')}</Label>
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
        </div>
      </div>
    </MagicCard>
  );
}
