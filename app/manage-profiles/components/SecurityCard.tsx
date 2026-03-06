'use client';

import { memo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/mq/button';
import { Shield, Lock, Laptop } from 'lucide-react';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { MagicCard } from '@/components/ui/MagicCard';
import { SessionsList } from '@/features/settings/components/privacy/SessionsList';

export const SecurityCard = memo(() => {
  const { t } = useTypedTranslation();
  const router = useRouter();
  const [showSessionsDialog, setShowSessionsDialog] = useState(false);

  return (
    <>
      <MagicCard isLiquidEnhanced>
        <div className="mq-magic-card-content bg-mq-card-background border border-mq-border">
          {/* Section Header */}
          <div className="flex items-center gap-3 p-5 sm:p-6 pb-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-mq-primary/10">
              <Shield className="h-4 w-4 text-mq-primary" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-mq-content">{t('security')}</h2>
          </div>

          <div className="p-5 sm:p-6 pt-4 space-y-3">
            {/* Change Password */}
            <div className="p-3.5 rounded-mq border border-mq-border/60 hover:border-mq-border transition-colors">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-mq-primary/8 shrink-0">
                    <Lock className="h-4 w-4 text-mq-primary" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-mq-content">{t('changePassword')}</h3>
                    <p className="text-xs text-mq-content-tertiary leading-relaxed">
                      {t('changePasswordDesc')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full sm:w-auto bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                  onClick={() => router.push('/reset-password?from=settings')}
                >
                  {t('changePassword')}
                </Button>
              </div>
            </div>

            {/* Manage Sessions */}
            <div className="p-3.5 rounded-mq border border-mq-border/60 hover:border-mq-border transition-colors">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-mq-primary/8 shrink-0">
                    <Laptop className="h-4 w-4 text-mq-primary" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-mq-content">{t('manageSessions')}</h3>
                    <p className="text-xs text-mq-content-tertiary leading-relaxed">
                      {t('manageSessionsDesc')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full sm:w-auto bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                  onClick={() => setShowSessionsDialog(true)}
                >
                  {t('manageSessions')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </MagicCard>

      <SessionsList open={showSessionsDialog} onOpenChange={setShowSessionsDialog} t={t} />
    </>
  );
});

SecurityCard.displayName = 'SecurityCard';
