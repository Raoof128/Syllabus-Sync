'use client';

import { Input } from '@/components/ui/mq/input';
import { Label } from '@/components/ui/label';
import { MagicCard } from '@/components/ui/MagicCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { GraduationCap } from 'lucide-react';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { TranslationKey } from '@/lib/i18n/translations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

interface AcademicInfoCardProps {
  data: {
    course: string;
    year: string;
  };
  onChange: (field: string, value: string) => void;
  disabled: boolean;
}

export function AcademicInfoCard({ data, onChange, disabled }: AcademicInfoCardProps) {
  const { t } = useTypedTranslation();

  return (
    <MagicCard isLiquidEnhanced className="mb-4 sm:mb-6">
      <div className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border">
        <Card className="border border-mq-border bg-mq-card-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {t('academicInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Course/Major */}
            <div className="space-y-2">
              <Label htmlFor="profile-course">{t('course')}</Label>
              <Input
                id="profile-course"
                value={data.course}
                onChange={(e) => onChange('course', e.target.value)}
                placeholder={t('coursePlaceholder')}
                disabled={disabled}
              />
            </div>

            {/* Academic Year */}
            <div className="space-y-2">
              <Label htmlFor="profile-year">{t('year')}</Label>
              <Select
                value={data.year}
                onValueChange={(value) => onChange('year', value)}
                disabled={disabled}
              >
                <SelectTrigger id="profile-year">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </MagicCard>
  );
}
