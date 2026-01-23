'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/mq/card';
import type { TranslationKey } from '@/lib/i18n/translations';

type SettingsSkeletonProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const SKELETON_COUNTS = {
  notifications: 3,
  account: 1,
  appearance: 2,
  privacy: 4,
  security: 2,
  quickActions: 5,
  gamification: 5,
  map: 1,
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
        <div className="mq-magic-card mq-liquid-enhanced">
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

        {/* Account Settings Skeleton */}
        <div className="mq-magic-card mq-liquid-enhanced">
          <Card className="mq-magic-card-content">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-mq-card-background rounded animate-pulse" />
                <div className="h-6 w-28 bg-mq-card-background rounded-mq-lg animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: SKELETON_COUNTS.account }).map((_, i) => (
                <div
                  key={`account-${i}`}
                  className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-mq-hover-background rounded-full animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-mq-hover-background rounded animate-pulse mb-1" />
                      <div className="h-3 w-48 bg-mq-hover-background rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Appearance Settings Skeleton */}
        <div className="mq-magic-card mq-liquid-enhanced">
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
        <div className="mq-magic-card mq-liquid-enhanced">
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

        {/* Security Settings Skeleton */}
        <div className="mq-magic-card mq-liquid-enhanced">
          <Card className="mq-magic-card-content">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-mq-card-background rounded animate-pulse" />
                <div className="h-6 w-28 bg-mq-card-background rounded-mq-lg animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: SKELETON_COUNTS.security }).map((_, i) => (
                <div
                  key={`security-${i}`}
                  className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-mq-hover-background rounded-full animate-pulse" />
                      <div>
                        <div className="h-5 w-36 bg-mq-hover-background rounded animate-pulse mb-1" />
                        <div className="h-3 w-52 bg-mq-hover-background rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-8 w-20 bg-mq-hover-background rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Skeleton */}
        <div className="mq-magic-card mq-liquid-enhanced">
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

        {/* Gamification Settings Skeleton */}
        <div className="mq-magic-card mq-liquid-enhanced">
          <Card className="mq-magic-card-content">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-mq-card-background rounded animate-pulse" />
                <div className="h-6 w-32 bg-mq-card-background rounded-mq-lg animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Progress Display Skeleton */}
              <div className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border">
                <div className="h-5 w-28 bg-mq-hover-background rounded animate-pulse mb-3" />
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={`progress-${i}`} className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-mq-hover-background rounded animate-pulse" />
                      <div>
                        <div className="h-3 w-16 bg-mq-hover-background rounded animate-pulse mb-1" />
                        <div className="h-4 w-20 bg-mq-hover-background rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Toggle Items Skeleton */}
              {Array.from({ length: SKELETON_COUNTS.gamification - 1 }).map((_, i) => (
                <div
                  key={`gamification-${i}`}
                  className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-5 w-40 bg-mq-hover-background rounded animate-pulse mb-1" />
                      <div className="h-3 w-56 bg-mq-hover-background rounded animate-pulse" />
                    </div>
                    <div className="h-6 w-11 bg-mq-hover-background rounded-full animate-pulse" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Map Navigation Settings Skeleton */}
        <div className="mq-magic-card mq-liquid-enhanced">
          <Card className="mq-magic-card-content">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-mq-card-background rounded animate-pulse" />
                <div className="h-6 w-32 bg-mq-card-background rounded-mq-lg animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: SKELETON_COUNTS.map }).map((_, i) => (
                <div
                  key={`map-${i}`}
                  className="p-3 bg-mq-card-background rounded-mq-lg border border-mq-border"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-4 w-4 bg-mq-hover-background rounded animate-pulse" />
                      <div className="flex-1">
                        <div className="h-5 w-40 bg-mq-hover-background rounded animate-pulse mb-1" />
                        <div className="h-3 w-56 bg-mq-hover-background rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-6 w-11 bg-mq-hover-background rounded-full animate-pulse" />
                  </div>
                </div>
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
