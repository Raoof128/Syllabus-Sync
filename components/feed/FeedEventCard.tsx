import { memo } from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Navigation, Bell, Check, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/mq/button';
import { Badge } from '@/components/ui/mq/badge';
import { useTranslation } from '@/lib/hooks/useTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { cn } from '@/lib/utils';
import { Event } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MagicCard } from '@/components/ui/MagicCard';

const categoryColors: Record<string, string> = {
  Career: 'bg-mq-info/10 text-mq-info border-mq-info/20',
  Social: 'bg-mq-purple/10 text-mq-purple border-mq-purple/20',
  Academic: 'bg-mq-success/10 text-mq-success border-mq-success/20',
  'Free Food': 'bg-mq-warning/10 text-mq-warning border-mq-warning/20',
};

interface FeedEventCardProps {
  event: Event;
  isReminded: boolean;
  isLoading: boolean;
  isHighlighted: boolean;
  onRemind: (e: React.MouseEvent) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  getLocaleString: string;
}

export const FeedEventCard = memo(
  ({
    event,
    isReminded,
    isLoading,
    isHighlighted,
    onRemind,
    onEdit,
    onDelete,
    getLocaleString,
  }: FeedEventCardProps) => {
    const { t } = useTranslation();

    return (
      <MagicCard isLiquidEnhanced className="h-full">
        <article
          className={cn(
            'group relative flex flex-col h-full bg-mq-card-background rounded-2xl border transition-all duration-300',
            isHighlighted
              ? 'border-mq-primary ring-2 ring-mq-primary/20 shadow-lg shadow-mq-primary/5 bg-mq-primary/5'
              : 'border-mq-border hover:border-mq-border-secondary hover:shadow-mq-md',
          )}
        >
          {/* Top Row: Category + Actions */}
          <div className="flex items-center justify-between p-4 pb-2">
            <Badge
              className={cn(
                'border px-2.5 py-0.5 text-xs font-semibold rounded-full',
                categoryColors[event.category as keyof typeof categoryColors],
              )}
            >
              {t(`category_${event.category.replace(/ /g, '')}` as TranslationKey) ||
                event.category}
            </Badge>

            {(onEdit || onDelete) && (
              // eslint-disable-next-line jsx-a11y/no-static-element-interactions
              <div
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                className="-mr-2"
              >
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-mq-content-tertiary hover:text-mq-content"
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">{t('actions')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit();
                        }}
                      >
                        {t('edit')}
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete();
                        }}
                        className="text-red-500 focus:text-red-600"
                      >
                        {t('delete')}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="px-4 pb-4 flex-1 flex flex-col">
            <h3 className="font-bold text-lg text-mq-content mb-2 line-clamp-1 group-hover:text-mq-primary transition-colors min-h-[28px]">
              {t((event.translationKey || event.title) as TranslationKey)}
            </h3>

            <p className="text-sm text-mq-content-secondary line-clamp-2 mb-4 min-h-[40px]">
              {t((event.descriptionKey || event.description) as TranslationKey)}
            </p>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-y-2 text-sm text-mq-content-secondary mt-auto">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-mq-content-tertiary" />
                <time dateTime={new Date(event.date).toISOString()}>
                  {new Date(event.date).toLocaleDateString(getLocaleString, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-mq-content-tertiary" />
                <span>{event.time}</span>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-mq-content-tertiary" />
                <span className="truncate">{event.location}</span>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-mq-border bg-mq-background-secondary/50 rounded-b-2xl flex gap-2">
            <Button
              variant={isReminded ? 'primary' : 'outline'}
              size="sm"
              onClick={onRemind}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full mr-2" />
              ) : isReminded ? (
                <Check className="h-3 w-3 mr-2" />
              ) : (
                <Bell className="h-3 w-3 mr-2" />
              )}
              {isReminded ? t('reminderSet') || 'Reminder Set' : t('remindMe')}
            </Button>

            {event.building && (
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="shrink-0 text-mq-content-secondary hover:text-mq-primary hover:bg-mq-primary/10"
              >
                <Link
                  href={`/map?building=${encodeURIComponent(event.building)}${event.room ? `&room=${encodeURIComponent(event.room)}` : ''}&autonav=true`}
                  aria-label={t('navigateToBuildingAria', { building: event.building })}
                >
                  <Navigation className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </article>
      </MagicCard>
    );
  },
);

FeedEventCard.displayName = 'FeedEventCard';
