'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/mq/card';
import type { TranslationKey } from '@/lib/i18n/translations';

type SettingsSkeletonProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const SettingsSkeleton = memo(({ t }: SettingsSkeletonProps) => {
  return (
    <div className="settings-page container mx-auto p-6 max-w-7xl">
      <header className="mb-8">
        <div className="h-8 w-48 bg-mq-card-background rounded-mq-lg animate-pulse mb-2" />
        <div className="h-4 w-64 bg-mq-card-background rounded-mq-lg animate-pulse" />
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
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
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
              {[1, 2].map((i) => (
                <div
                  key={i}
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
                          key={j}
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
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
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
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-10 w-full bg-mq-card-background rounded-mq-lg border border-mq-border animate-pulse"
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="mt-8 text-center">
        <p className="text-mq-sm text-mq-content-secondary animate-pulse">{t('loadingSettings')}</p>
      </div>
    </div>
  );
});

SettingsSkeleton.displayName = 'SettingsSkeleton';

export default SettingsSkeleton;
