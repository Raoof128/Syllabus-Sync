'use client';

import { memo, useState, useCallback } from 'react';
import { Bell, Sparkles, Info, AlertCircle, Megaphone, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/mq/badge';
import { cn } from '@/lib/utils';
import { MagicCard } from '@/components/ui/MagicCard';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';

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
const staticAnnouncements: Announcement[] = [
  {
    id: '0',
    title: 'Add Events to Your Calendar',
    message:
      'Click "Add to Calendar" on any event to save it to your personal calendar. View and manage all your events in the Calendar tab.',
    type: 'highlight',
  },
  {
    id: '1',
    title: 'Semester 1 Enrolment Open',
    message:
      'Course enrolment for Semester 1, 2026 is now open. Check your student portal for available units.',
    type: 'new',
  },
  {
    id: '2',
    title: 'Library Extended Hours',
    message:
      'During exam period, the library will be open 24/7. Additional study spaces available in Building C3C.',
    type: 'info',
  },
];

interface AnnouncementsSectionProps {
  announcements?: Announcement[];
  className?: string;
}

export const AnnouncementsSection = memo(
  ({ announcements = staticAnnouncements, className }: AnnouncementsSectionProps) => {
    const { t } = useTypedTranslation();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpanded = useCallback((id: string) => {
      setExpandedId((prev) => (prev === id ? null : id));
    }, []);

    return (
      <div className={cn('', className)}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-mq-primary" />
          <h2 className="text-xl font-bold text-mq-content">
            {t('announcements') || 'Announcements'}
          </h2>
        </div>

        {/* Announcements List */}
        <div className="space-y-3">
          {announcements.map((announcement) => {
            const style = typeStyles[announcement.type];
            const Icon = style.icon;
            const isExpanded = expandedId === announcement.id;

            return (
              <MagicCard key={announcement.id} isLiquidEnhanced>
                <div
                  className={cn(
                    'p-4 rounded-xl border border-mq-border bg-mq-card-background transition-all cursor-pointer select-none',
                    style.bgClass,
                    isExpanded && 'border-mq-primary/30 shadow-sm',
                  )}
                  onClick={() => toggleExpanded(announcement.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleExpanded(announcement.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'p-1.5 rounded-lg bg-mq-background-secondary shrink-0',
                        style.iconClass,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={cn('text-[10px] uppercase tracking-wide', style.badge)}>
                          {announcement.type === 'new' && (t('new') || 'New')}
                          {announcement.type === 'info' && (t('info') || 'Info')}
                          {announcement.type === 'warning' && (t('important') || 'Important')}
                          {announcement.type === 'highlight' && (t('featured') || 'Featured')}
                        </Badge>
                        <h4 className="font-semibold text-sm text-mq-content truncate">
                          {announcement.title}
                        </h4>
                      </div>
                      <p
                        className={cn(
                          'text-xs text-mq-content-secondary transition-all duration-200',
                          isExpanded ? '' : 'line-clamp-2',
                        )}
                      >
                        {announcement.message}
                      </p>
                      {isExpanded && announcement.link && (
                        <a
                          href={announcement.link}
                          className="inline-block mt-2 text-xs text-mq-primary hover:underline font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t('learnMore') || 'Learn more'}
                        </a>
                      )}
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 text-mq-content-tertiary transition-transform duration-200',
                        isExpanded && 'rotate-180',
                      )}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </MagicCard>
            );
          })}
        </div>
      </div>
    );
  },
);

AnnouncementsSection.displayName = 'AnnouncementsSection';
