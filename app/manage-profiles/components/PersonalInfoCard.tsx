'use client';

import { Input } from '@/components/ui/mq/input';
import { Label } from '@/components/ui/label';
import { MagicCard } from '@/components/ui/MagicCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { User } from 'lucide-react';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';

interface PersonalInfoCardProps {
  data: {
    name: string;
    studentId: string;
  };
  email: string | undefined;
  onChange: (field: string, value: string) => void;
  disabled: boolean;
  isStudentIdLocked: boolean;
}

export function PersonalInfoCard({
  data,
  email,
  onChange,
  disabled,
  isStudentIdLocked,
}: PersonalInfoCardProps) {
  const { t } = useTypedTranslation();

  return (
    <MagicCard isLiquidEnhanced className="mb-4 sm:mb-6">
      <div className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border">
        <Card className="border border-mq-border bg-mq-card-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('personalInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="profile-name">{t('fullName')}</Label>
              <Input
                id="profile-name"
                value={data.name}
                onChange={(e) => onChange('name', e.target.value)}
                placeholder={t('enterFullName')}
                disabled={disabled}
              />
            </div>

            {/* Email - Read only */}
            <div className="space-y-2">
              <Label htmlFor="profile-email">{t('emailAddress')}</Label>
              <Input
                id="profile-email"
                value={email || ''}
                disabled
                className="bg-mq-background-subtle cursor-not-allowed"
              />
              <p className="text-mq-xs text-mq-content-tertiary">{t('emailCannotBeChanged')}</p>
            </div>

            {/* Student ID */}
            <div className="space-y-2">
              <Label htmlFor="profile-student-id">{t('studentId')}</Label>
              <Input
                id="profile-student-id"
                value={data.studentId}
                onChange={(e) => onChange('studentId', e.target.value)}
                placeholder="12345678"
                disabled={disabled || isStudentIdLocked}
                className={isStudentIdLocked ? 'bg-mq-background-subtle cursor-not-allowed' : ''}
              />
              {isStudentIdLocked && (
                <p className="text-mq-xs text-mq-content-tertiary">
                  {t('studentIdCannotBeChanged')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MagicCard>
  );
}
