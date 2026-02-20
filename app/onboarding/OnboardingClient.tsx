'use client';

import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { CourseCombobox } from '@/app/signup/components/CourseCombobox';
import { MQ_COURSES, DEGREE_TYPE_LABELS, DEGREE_MAX_YEARS } from '@/lib/data/mq-courses';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/mq/button';
import { Label } from '@/components/ui/label';
import { isValidRedirect } from '@/lib/utils/security';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { TranslationKey } from '@/lib/i18n/translations';

const createSchema = (
  t: (key: TranslationKey, options?: Record<string, string | number>) => string,
) =>
  z.object({
    course: z.string().min(1, t('pleaseSelectCourse' as TranslationKey)),
    year: z.string().min(1, t('pleaseSelectYear' as TranslationKey)),
  });
type FormData = z.infer<ReturnType<typeof createSchema>>;

export default function OnboardingClient() {
  const { t } = useTypedTranslation();
  const schema = createSchema(t);
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get('next') ?? '/home';
  const next = isValidRedirect(rawNext) ? rawNext : '/home';

  const [serverError, setServerError] = useState('');

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { course: '', year: '' },
  });

  const selectedCourse = watch('course');

  const maxYear = useMemo(() => {
    if (!selectedCourse) return 8;
    const course = MQ_COURSES.find((c) => c.name === selectedCourse);
    const label = course ? (DEGREE_TYPE_LABELS[course.type] ?? 'Other') : 'Other';
    return DEGREE_MAX_YEARS[label] ?? 8;
  }, [selectedCourse]);

  const yearOptions = useMemo(
    () =>
      Array.from({ length: maxYear }, (_, i) => ({
        value: String(i + 1),
        label: t('yearNumber', { year: i + 1 }),
      })),
    [maxYear, t],
  );

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message || t('failedToSave'));
      }
      router.push(next);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t('unexpectedError'));
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-mq-background">
      {/* Background image — same as login/signup */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <Image
          src="/images/login-bg.png"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
          quality={60}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#001528]/88 via-mq-background/80 to-mq-background/95" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-[100dvh] items-center justify-center px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-full max-w-md">
          {/* Glass card */}
          <div className="bg-mq-card-background/85 backdrop-blur-xl border border-mq-border/30 rounded-2xl shadow-[0_18px_70px_rgba(0,0,0,0.3)] overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-8 pb-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <Image
                  src="/MQ_Logo_Final.png"
                  alt={t('mqLogoAlt')}
                  width={216}
                  height={216}
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="text-2xl font-bold text-mq-content mb-2">{t('onboardingTitle')}</h1>
              <p className="text-sm text-mq-content-secondary">{t('onboardingDesc')}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-8 space-y-5">
              {/* Course */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-mq-content">{t('course')}</Label>
                <Controller
                  name="course"
                  control={control}
                  render={({ field }) => (
                    <CourseCombobox
                      value={field.value}
                      onChange={field.onChange}
                      error={!!errors.course}
                    />
                  )}
                />
                {errors.course && <p className="text-xs text-red-500">{errors.course.message}</p>}
              </div>

              {/* Year */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-mq-content">{t('yearOfStudy')}</Label>
                <Controller
                  name="year"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        className={`h-12 rounded-xl ${errors.year ? 'border-red-500' : ''}`}
                      >
                        <SelectValue placeholder={t('selectYearPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((y) => (
                          <SelectItem key={y.value} value={y.value}>
                            {y.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.year && <p className="text-xs text-red-500">{errors.year.message}</p>}
              </div>

              {serverError && <p className="text-sm text-red-500 text-center">{serverError}</p>}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl font-bold text-base mt-2 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {t('continue')}
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
