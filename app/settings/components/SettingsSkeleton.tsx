'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/mq/card';
import type { TranslationKey } from '@/lib/i18n/translations';

type SettingsSkeletonProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const SKELETON_COUNTS = {
  notifications: 3,
  appearance: 2,
  privacy: 4,
  quickActions: 5,
} as const;

const SettingsSkeleton = memo(({ t }: SettingsSkeletonProps) => {
  return (
    <div
      className="settings-page container mx-auto p-6 max-w-7xl"
      data-testid="settings-skeleton"
      aria-busy="true"
      aria-label={t('loading')}
    >
      <header className="mb-8">
        <div
          className="h-8 w-48 bg-mq-card-background rounded-mq-lg animate-pulse mb-2"
          aria-hidden="true"
        />
        <div
          className="h-4 w-64 bg-mq-card-background rounded-mq-lg animate-pulse"
          aria-hidden="true"
        />
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Notification Settings Skeleton */}
        <div className="mq-magic-card">
          <Card className="mq-magic-card-content">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-mq-card-background rounded animate-pulse" />
                <div className="h-6 w-32 bg-mq-card-background rounded-mq-lg animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: SKELETON_COUNTS.notifications }).map((_, i) => (
                <div
                  key={`notification-${i}`}
                  className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 bg-mq-hover-background rounded animate-pulse" />
                      <div>
                        <div className="h-4 w-32 bg-mq-hover-background rounded animate-pulse mb-1" />
                        <div className="h-3 w-48 bg-mq-hover-background rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-8 w-20 bg-mq-hover-background rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Appearance Settings Skeleton */}
        <div className="mq-magic-card">
          <Card className="mq-magic-card-content">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-mq-card-background rounded animate-pulse" />
                <div className="h-6 w-32 bg-mq-card-background rounded-mq-lg animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: SKELETON_COUNTS.appearance }).map((_, i) => (
                <div
                  key={`appearance-${i}`}
                  className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-5 w-24 bg-mq-hover-background rounded animate-pulse mb-1" />
                      <div className="h-3 w-32 bg-mq-hover-background rounded animate-pulse" />
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3].map((j) => (
                        <div
                          key={`appearance-btn-${j}`}
                          className="h-8 w-16 bg-mq-hover-background rounded animate-pulse"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Privacy Settings Skeleton */}
        <div className="mq-magic-card">
          <Card className="mq-magic-card-content">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-mq-card-background rounded animate-pulse" />
                <div className="h-6 w-40 bg-mq-card-background rounded-mq-lg animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: SKELETON_COUNTS.privacy }).map((_, i) => (
                <div
                  key={`privacy-${i}`}
                  className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-5 w-32 bg-mq-hover-background rounded animate-pulse mb-1" />
                      <div className="h-3 w-48 bg-mq-hover-background rounded animate-pulse" />
                    </div>
                    <div className="h-8 w-24 bg-mq-hover-background rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Skeleton */}
        <div className="mq-magic-card">
          <Card className="mq-magic-card-content">
            <CardHeader>
              <div className="h-6 w-32 bg-mq-card-background rounded-mq-lg animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: SKELETON_COUNTS.quickActions }).map((_, i) => (
                <div
                  key={`action-${i}`}
                  className="h-10 w-full bg-mq-card-background rounded-mq-lg border border-mq-border animate-pulse"
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="mt-8 text-center" role="status">
        <p className="text-mq-sm text-mq-content-secondary animate-pulse">{t('loadingSettings')}</p>
      </div>
    </div>
  );
});

SettingsSkeleton.displayName = 'SettingsSkeleton';

export default SettingsSkeleton;
