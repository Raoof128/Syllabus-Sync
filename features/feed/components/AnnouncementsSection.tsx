'use client';

import { memo, useState, useCallback } from 'react';
import { Bell, Sparkles, Info, AlertCircle, Megaphone } from 'lucide-react';
import { Badge } from '@/components/ui/mq/badge';
import { cn } from '@/lib/utils';
import { MagicCard } from '@/components/ui/MagicCard';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/mq/button';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'new' | 'info' | 'warning' | 'highlight';
  link?: string;
}

const typeStyles = {
  new: {
    badge: 'bg-emerald-500 text-white',
    icon: Sparkles,
    iconClass: 'text-emerald-500',
    bgClass: 'hover:border-emerald-500/30',
  },
  info: {
    badge: 'bg-blue-500 text-white',
    icon: Info,
    iconClass: 'text-blue-500',
    bgClass: 'hover:border-blue-500/30',
  },
  warning: {
    badge: 'bg-amber-500 text-white',
    icon: AlertCircle,
    iconClass: 'text-amber-500',
    bgClass: 'hover:border-amber-500/30',
  },
  highlight: {
    badge: 'bg-purple-500 text-white',
    icon: Megaphone,
    iconClass: 'text-purple-500',
    bgClass: 'hover:border-purple-500/30',
  },
};

// Static announcements - could be fetched from DB in the future
// Defined inside the component to support translation (see below)

interface AnnouncementsSectionProps {
  announcements?: Announcement[];
  className?: string;
}

export const AnnouncementsSection = memo(
  ({ announcements, className }: AnnouncementsSectionProps) => {
    const { t } = useTypedTranslation();

    const staticAnnouncements: Announcement[] = [
      {
        id: '0',
        title: t('ann0Title' as TranslationKey),
        message: t('ann0Msg' as TranslationKey),
        type: 'highlight',
      },
      {
        id: '1',
        title: t('ann1Title' as TranslationKey),
        message: t('ann1Msg' as TranslationKey),
        type: 'new',
      },
      {
        id: '2',
        title: t('ann2Title' as TranslationKey),
        message: t('ann2Msg' as TranslationKey),
        type: 'info',
      },
    ];
    const resolvedAnnouncements = announcements ?? staticAnnouncements;
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    const openAnnouncement = useCallback((announcement: Announcement) => {
      setSelectedAnnouncement(announcement);
    }, []);

    const closeDialog = useCallback(() => {
      setSelectedAnnouncement(null);
    }, []);

    return (
      <div className={cn('', className)}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-mq-primary" />
          <h2 className="text-xl font-bold text-mq-content">{t('announcements')}</h2>
        </div>

        {/* Announcements List */}
        <div className="space-y-3">
          {resolvedAnnouncements.map((announcement) => {
            const style = typeStyles[announcement.type];
            const Icon = style.icon;

            return (
              <MagicCard key={announcement.id} isLiquidEnhanced>
                <div
                  className={cn(
                    'p-4 rounded-xl border border-mq-border bg-mq-card-background transition-all cursor-pointer select-none hover:shadow-md active:scale-[0.98]',
                    style.bgClass,
                  )}
                  onClick={() => openAnnouncement(announcement)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openAnnouncement(announcement);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={t('openAnnouncement', { title: announcement.title })}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'p-1.5 rounded-lg bg-mq-background-secondary shrink-0',
                        style.iconClass,
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={cn('text-[10px] uppercase tracking-wide', style.badge)}>
                          {announcement.type === 'new' && t('new')}
                          {announcement.type === 'info' && t('info')}
                          {announcement.type === 'warning' && t('important')}
                          {announcement.type === 'highlight' && t('featured')}
                        </Badge>
                        <h4 className="font-semibold text-sm text-mq-content truncate">
                          {announcement.title}
                        </h4>
                      </div>
                      <p className="text-xs text-mq-content-secondary line-clamp-2">
                        {announcement.message}
                      </p>
                    </div>
                  </div>
                </div>
              </MagicCard>
            );
          })}
        </div>

        {/* Announcement Dialog */}
        <Dialog
          open={selectedAnnouncement !== null}
          onOpenChange={(open: boolean) => {
            if (!open) closeDialog();
          }}
        >
          <DialogContent className="max-w-2xl">
            {selectedAnnouncement && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={cn(
                        'p-2 rounded-lg bg-mq-background-secondary',
                        typeStyles[selectedAnnouncement.type].iconClass,
                      )}
                    >
                      {(() => {
                        const Icon = typeStyles[selectedAnnouncement.type].icon;
                        return <Icon className="h-5 w-5" aria-hidden="true" />;
                      })()}
                    </div>
                    <Badge
                      className={cn(
                        'text-xs uppercase tracking-wide',
                        typeStyles[selectedAnnouncement.type].badge,
                      )}
                    >
                      {selectedAnnouncement.type === 'new' && t('new')}
                      {selectedAnnouncement.type === 'info' && t('info')}
                      {selectedAnnouncement.type === 'warning' && t('important')}
                      {selectedAnnouncement.type === 'highlight' && t('featured')}
                    </Badge>
                  </div>
                  <DialogTitle className="text-2xl">{selectedAnnouncement.title}</DialogTitle>
                </DialogHeader>
                <DialogDescription className="text-base leading-relaxed text-mq-content-secondary mt-4">
                  {selectedAnnouncement.message}
                </DialogDescription>
                <div className="flex items-center justify-end gap-3 mt-6">
                  {selectedAnnouncement.link && (
                    <Button variant="primary" asChild>
                      <a href={selectedAnnouncement.link} target="_blank" rel="noopener noreferrer">
                        {t('learnMore')}
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" onClick={closeDialog}>
                    {t('close')}
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  },
);

AnnouncementsSection.displayName = 'AnnouncementsSection';
