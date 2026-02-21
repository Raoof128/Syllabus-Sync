'use client';

import { useState, memo, useCallback } from 'react';
import {
  TrendingUp,
  Calendar,
  Users,
  Megaphone,
  ChevronRight,
  Sparkles,
  Info,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { Button } from '@/components/ui/mq/button';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { MagicCard } from '@/components/ui/MagicCard';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface FeedSidebarProps {
  stats: {
    total: number;
    thisWeek: number;
    freeFood: number;
  };
  categoryStats?: {
    Academic: number;
    Career: number;
    Social: number;
    'Free Food': number;
  };
  onCategoryClick?: (category: string) => void;
}

// Announcement data type
interface Announcement {
  id: string;
  type: 'featured' | 'new' | 'info';
  title: string;
  description: string;
  fullDescription?: string;
  link?: string;
  linkText?: string;
}

const FeedSidebarComponent = ({ stats, categoryStats, onCategoryClick }: FeedSidebarProps) => {
  const { t } = useTypedTranslation();

  // Dialog states
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [announcementsDialogOpen, setAnnouncementsDialogOpen] = useState(false);
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [selectedStat, setSelectedStat] = useState<'total' | 'thisWeek' | 'freeFood' | null>(null);

  // Announcements data - using internationalized content
  const announcements: Announcement[] = [
    {
      id: 'featured-calendar',
      type: 'featured',
      title: t('announcementCalendarTitle'),
      description: t('announcementCalendarDesc'),
      fullDescription: t('announcementCalendarFull'),
    },
    {
      id: 'new-enrollment',
      type: 'new',
      title: t('announcementEnrollmentTitle'),
      description: t('announcementEnrollmentDesc'),
      fullDescription: t('announcementEnrollmentFull'),
      link: 'https://students.mq.edu.au/enrolment',
      linkText: t('enrollmentPortal'),
    },
    {
      id: 'info-library',
      type: 'info',
      title: t('announcementLibraryTitle'),
      description: t('announcementLibraryDesc'),
      fullDescription: t('announcementLibraryFull'),
    },
  ];

  const handleAnnouncementClick = useCallback((announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
  }, []);

  const handleCategoryItemClick = useCallback(
    (category: string) => {
      setCategoriesDialogOpen(false);
      onCategoryClick?.(category);
    },
    [onCategoryClick],
  );

  const getBadgeStyle = (type: Announcement['type']) => {
    switch (type) {
      case 'featured':
        return 'bg-mq-primary text-white';
      case 'new':
        return 'bg-mq-success text-white';
      case 'info':
        return 'bg-mq-info text-white';
      default:
        return 'bg-mq-primary text-white';
    }
  };

  const getBadgeLabel = (type: Announcement['type']): string => {
    switch (type) {
      case 'featured':
        return t('featured') || 'FEATURED';
      case 'new':
        return t('new') || 'NEW';
      case 'info':
        return t('info') || 'INFO';
    }
  };

  return (
    <>
      <aside
        className="space-y-4 lg:space-y-6 w-full lg:w-auto lg:sticky lg:top-[88px] lg:h-fit"
        aria-label={t('eventStatistics')}
      >
        {/* Mobile section header - only visible on smaller screens */}
        <div className="lg:hidden flex items-center gap-2 pb-2 border-b border-mq-border">
          <h2 className="text-lg font-semibold text-mq-content">{t('eventStatistics')}</h2>
        </div>

        {/* Quick Stats - Clickable */}
        <ScrollReveal delay={0.25}>
          <MagicCard isLiquidEnhanced className="overflow-hidden">
            <div className="mq-magic-card-content">
              <Card className="border-mq-border bg-mq-card-background shadow-mq-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-mq-primary" aria-hidden="true" />
                      {t('thisWeek')}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStat('total');
                    }}
                    className="w-full flex items-center justify-between p-3 bg-mq-info/10 rounded-mq-lg border border-mq-info/20 hover:bg-mq-info/20 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-mq-info" aria-hidden="true" />
                      <span className="text-mq-sm font-medium text-mq-content">
                        {t('totalEvents')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-mq-lg font-bold text-mq-info"
                        aria-label={`${stats.total} ${t('totalEvents')}`}
                      >
                        {stats.total}
                      </span>
                      <ChevronRight className="h-4 w-4 text-mq-content-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStat('thisWeek');
                    }}
                    className="w-full flex items-center justify-between p-3 bg-mq-purple/10 rounded-mq-lg border border-mq-purple/20 hover:bg-mq-purple/20 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-mq-purple" aria-hidden="true" />
                      <span className="text-mq-sm font-medium text-mq-content">
                        {t('thisWeek')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-mq-lg font-bold text-mq-purple"
                        aria-label={`${stats.thisWeek} ${t('thisWeek')}`}
                      >
                        {stats.thisWeek}
                      </span>
                      <ChevronRight className="h-4 w-4 text-mq-content-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStat('freeFood');
                    }}
                    className="w-full flex items-center justify-between p-3 bg-mq-warning/10 rounded-mq-lg border border-mq-warning/20 hover:bg-mq-warning/20 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-mq-warning" aria-hidden="true">
                        🍕
                      </span>
                      <span className="text-mq-sm font-medium text-mq-content">
                        {t('freeFood')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-mq-lg font-bold text-mq-warning"
                        aria-label={`${stats.freeFood} ${t('freeFood')}`}
                      >
                        {stats.freeFood}
                      </span>
                      <ChevronRight className="h-4 w-4 text-mq-content-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                </CardContent>
              </Card>
            </div>
          </MagicCard>
        </ScrollReveal>

        {/* Announcements - Clickable */}
        <ScrollReveal delay={0.3}>
          <MagicCard isLiquidEnhanced className="overflow-hidden">
            <div className="mq-magic-card-content">
              <Card className="border-mq-border bg-mq-card-background shadow-mq-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span className="flex items-center gap-2">
                      <Megaphone className="h-5 w-5 text-mq-primary" aria-hidden="true" />
                      {t('announcements')}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  {announcements.map((announcement) => (
                    <button
                      key={announcement.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnnouncementClick(announcement);
                      }}
                      className={`w-full text-left p-3 rounded-mq-lg border hover:shadow-md transition-all cursor-pointer group ${
                        announcement.type === 'featured'
                          ? 'bg-mq-primary/10 border-mq-primary/20 hover:bg-mq-primary/15'
                          : announcement.type === 'new'
                            ? 'bg-mq-success/10 border-mq-success/20 hover:bg-mq-success/15'
                            : 'bg-mq-info/10 border-mq-info/20 hover:bg-mq-info/15'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {announcement.type === 'featured' && (
                          <Megaphone className="h-4 w-4 text-mq-content-secondary flex-shrink-0 mt-0.5" />
                        )}
                        {announcement.type === 'new' && (
                          <Sparkles className="h-4 w-4 text-mq-content-secondary flex-shrink-0 mt-0.5" />
                        )}
                        {announcement.type === 'info' && (
                          <Info className="h-4 w-4 text-mq-content-secondary flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              className={`${getBadgeStyle(announcement.type)} flex-shrink-0 text-[10px]`}
                            >
                              {getBadgeLabel(announcement.type)}
                            </Badge>
                            <h4 className="font-semibold text-mq-content text-mq-sm line-clamp-1">
                              {announcement.title}
                            </h4>
                          </div>
                          <p className="text-mq-xs text-mq-content-secondary line-clamp-2">
                            {announcement.description}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-mq-content-tertiary flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </MagicCard>
        </ScrollReveal>

        {/* Event Categories Legend - Clickable */}
        <ScrollReveal delay={0.35}>
          <MagicCard isLiquidEnhanced className="overflow-hidden">
            <div className="mq-magic-card-content">
              <Card
                className="border-mq-border bg-mq-card-background shadow-mq-sm cursor-pointer group"
                onClick={() => setCategoriesDialogOpen(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setCategoriesDialogOpen(true)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span>{t('byCategory')}</span>
                    <ChevronRight className="h-4 w-4 text-mq-content-tertiary group-hover:text-mq-primary transition-colors" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <dl className="space-y-3">
                    <div className="flex items-center justify-between hover:bg-mq-hover-background p-2 -mx-2 rounded-mq transition-colors">
                      <dt className="flex items-center gap-2">
                        <span>💼</span>
                        <span className="text-mq-sm font-medium text-mq-content">
                          {t('category_Career')}
                        </span>
                      </dt>
                      <dd className="text-mq-sm font-semibold text-mq-info">
                        {categoryStats?.Career ?? 0}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between hover:bg-mq-hover-background p-2 -mx-2 rounded-mq transition-colors">
                      <dt className="flex items-center gap-2">
                        <span>📚</span>
                        <span className="text-mq-sm font-medium text-mq-content">
                          {t('category_Academic')}
                        </span>
                      </dt>
                      <dd className="text-mq-sm font-semibold text-mq-success">
                        {categoryStats?.Academic ?? 0}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between hover:bg-mq-hover-background p-2 -mx-2 rounded-mq transition-colors">
                      <dt className="flex items-center gap-2">
                        <span>🎉</span>
                        <span className="text-mq-sm font-medium text-mq-content">
                          {t('category_Social')}
                        </span>
                      </dt>
                      <dd className="text-mq-sm font-semibold text-mq-purple">
                        {categoryStats?.Social ?? 0}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between hover:bg-mq-hover-background p-2 -mx-2 rounded-mq transition-colors">
                      <dt className="flex items-center gap-2">
                        <span>🍕</span>
                        <span className="text-mq-sm font-medium text-mq-content">
                          {t('category_FreeFood')}
                        </span>
                      </dt>
                      <dd className="text-mq-sm font-semibold text-mq-warning">
                        {categoryStats?.['Free Food'] ?? 0}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </MagicCard>
        </ScrollReveal>
      </aside>

      {/* Stats Detail Dialog */}
      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-mq-primary" />
              {t('eventStatistics')}
            </DialogTitle>
            <DialogDescription>{t('eventsOverview')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="p-4 bg-mq-info/10 rounded-mq-lg border border-mq-info/20">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 font-medium">
                  <Calendar className="h-5 w-5 text-mq-info" />
                  {t('totalEvents')}
                </span>
                <span className="text-2xl font-bold text-mq-info">{stats.total}</span>
              </div>
              <p className="text-mq-sm text-mq-content-secondary">{t('totalEventsDesc')}</p>
            </div>

            <div className="p-4 bg-mq-purple/10 rounded-mq-lg border border-mq-purple/20">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 font-medium">
                  <Users className="h-5 w-5 text-mq-purple" />
                  {t('thisWeek')}
                </span>
                <span className="text-2xl font-bold text-mq-purple">{stats.thisWeek}</span>
              </div>
              <p className="text-mq-sm text-mq-content-secondary">{t('thisWeekEventsDesc')}</p>
            </div>

            <div className="p-4 bg-mq-warning/10 rounded-mq-lg border border-mq-warning/20">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 font-medium">
                  <span className="text-xl">🍕</span>
                  {t('freeFood')}
                </span>
                <span className="text-2xl font-bold text-mq-warning">{stats.freeFood}</span>
              </div>
              <p className="text-mq-sm text-mq-content-secondary">{t('freeFoodEventsDesc')}</p>
            </div>

            <div className="flex items-center gap-2 p-3 bg-mq-background-secondary rounded-mq-lg">
              <Sparkles className="h-4 w-4 text-mq-primary" />
              <p className="text-mq-sm text-mq-content-secondary">{t('filterByCategoryDesc')}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Individual Stat Detail Dialog */}
      <Dialog open={!!selectedStat} onOpenChange={(open) => !open && setSelectedStat(null)}>
        <DialogContent className="max-w-md">
          {selectedStat === 'total' && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-mq-info/20 rounded-full">
                    <Calendar className="h-6 w-6 text-mq-info" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{t('totalEvents')}</DialogTitle>
                    <p className="text-3xl font-bold text-mq-info mt-1">{stats.total}</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <p className="text-mq-content-secondary leading-relaxed">
                  {t('totalEventsDetail')}
                </p>
                <div className="p-4 bg-mq-background-secondary rounded-mq-lg">
                  <h4 className="font-medium text-mq-content mb-2">{t('whatsIncluded')}</h4>
                  <ul className="space-y-2 text-sm text-mq-content-secondary">
                    <li className="flex items-center gap-2">
                      <span>💼</span> {t('careerEventsList')}
                    </li>
                    <li className="flex items-center gap-2">
                      <span>📚</span> {t('academicEventsList')}
                    </li>
                    <li className="flex items-center gap-2">
                      <span>🎉</span> {t('socialEventsList')}
                    </li>
                    <li className="flex items-center gap-2">
                      <span>🍕</span> {t('freeFoodEventsList')}
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}
          {selectedStat === 'thisWeek' && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-mq-purple/20 rounded-full">
                    <Users className="h-6 w-6 text-mq-purple" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{t('thisWeek')}</DialogTitle>
                    <p className="text-3xl font-bold text-mq-purple mt-1">{stats.thisWeek}</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <p className="text-mq-content-secondary leading-relaxed">
                  {t('thisWeekEventsDetail')}
                </p>
                <div className="p-4 bg-mq-background-secondary rounded-mq-lg">
                  <h4 className="font-medium text-mq-content mb-2">{t('proTips')}</h4>
                  <ul className="space-y-2 text-sm text-mq-content-secondary">
                    <li className="flex items-center gap-2">
                      <span>📅</span> {t('proTipCalendar')}
                    </li>
                    <li className="flex items-center gap-2">
                      <span>🔔</span> {t('proTipNotifications')}
                    </li>
                    <li className="flex items-center gap-2">
                      <span>👥</span> {t('proTipFriends')}
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}
          {selectedStat === 'freeFood' && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-mq-warning/20 rounded-full">
                    <span className="text-2xl">🍕</span>
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{t('freeFood')}</DialogTitle>
                    <p className="text-3xl font-bold text-mq-warning mt-1">{stats.freeFood}</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <p className="text-mq-content-secondary leading-relaxed">
                  {t('freeFoodEventsDetail')}
                </p>
                <div className="p-4 bg-mq-background-secondary rounded-mq-lg">
                  <h4 className="font-medium text-mq-content mb-2">{t('whatsNext')}</h4>
                  <ul className="space-y-2 text-sm text-mq-content-secondary">
                    <li className="flex items-center gap-2">
                      <span>🍕</span> {t('expectPizza')}
                    </li>
                    <li className="flex items-center gap-2">
                      <span>☕</span> {t('expectCoffee')}
                    </li>
                    <li className="flex items-center gap-2">
                      <span>🍪</span> {t('expectTreats')}
                    </li>
                    <li className="flex items-center gap-2">
                      <span>🥤</span> {t('expectRefreshments')}
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Announcements Detail Dialog */}
      <Dialog open={announcementsDialogOpen} onOpenChange={setAnnouncementsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-mq-primary" />
              {t('announcements')}
            </DialogTitle>
            <DialogDescription>{t('importantUpdates')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto">
            {announcements.map((announcement) => (
              <button
                key={announcement.id}
                onClick={() => handleAnnouncementClick(announcement)}
                className={`w-full text-left p-4 rounded-mq-lg border hover:shadow-md transition-all ${
                  announcement.type === 'featured'
                    ? 'bg-mq-primary/10 border-mq-primary/20 hover:bg-mq-primary/15'
                    : announcement.type === 'new'
                      ? 'bg-mq-success/10 border-mq-success/20 hover:bg-mq-success/15'
                      : 'bg-mq-info/10 border-mq-info/20 hover:bg-mq-info/15'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Badge className={`${getBadgeStyle(announcement.type)} flex-shrink-0`}>
                    {getBadgeLabel(announcement.type)}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-mq-content">{announcement.title}</h4>
                    <p className="text-mq-sm text-mq-content-secondary mt-1">
                      {announcement.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-mq-content-tertiary flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Single Announcement Detail Dialog */}
      <Dialog
        open={!!selectedAnnouncement}
        onOpenChange={(open) => !open && setSelectedAnnouncement(null)}
      >
        <DialogContent className="max-w-md">
          {selectedAnnouncement && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getBadgeStyle(selectedAnnouncement.type)}>
                    {getBadgeLabel(selectedAnnouncement.type)}
                  </Badge>
                </div>
                <DialogTitle>{selectedAnnouncement.title}</DialogTitle>
              </DialogHeader>

              <div className="mt-4">
                <p className="text-mq-content-secondary leading-relaxed">
                  {selectedAnnouncement.fullDescription || selectedAnnouncement.description}
                </p>

                {selectedAnnouncement.link && (
                  <div className="mt-6">
                    <Button
                      onClick={() =>
                        window.open(selectedAnnouncement.link, '_blank', 'noopener,noreferrer')
                      }
                      className="w-full gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {selectedAnnouncement.linkText || t('learnMore')}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Categories Detail Dialog */}
      <Dialog open={categoriesDialogOpen} onOpenChange={setCategoriesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">{t('eventCategories')}</DialogTitle>
            <DialogDescription>{t('filterInterestDesc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 mt-4">
            <button
              onClick={() => handleCategoryItemClick('Career')}
              className="w-full flex items-center justify-between p-4 bg-mq-info/10 rounded-mq-lg border border-mq-info/20 hover:bg-mq-info/15 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">💼</span>
                <div className="text-left">
                  <h4 className="font-semibold text-mq-content">{t('category_Career')}</h4>
                  <p className="text-mq-sm text-mq-content-secondary">{t('jobInternship')}</p>
                </div>
              </div>
              <Badge className="bg-mq-info text-white">{categoryStats?.Career ?? 0}</Badge>
            </button>

            <button
              onClick={() => handleCategoryItemClick('Academic')}
              className="w-full flex items-center justify-between p-4 bg-mq-success/10 rounded-mq-lg border border-mq-success/20 hover:bg-mq-success/15 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📚</span>
                <div className="text-left">
                  <h4 className="font-semibold text-mq-content">{t('category_Academic')}</h4>
                  <p className="text-mq-sm text-mq-content-secondary">{t('workshopsStudy')}</p>
                </div>
              </div>
              <Badge className="bg-mq-success text-white">{categoryStats?.Academic ?? 0}</Badge>
            </button>

            <button
              onClick={() => handleCategoryItemClick('Social')}
              className="w-full flex items-center justify-between p-4 bg-mq-purple/10 rounded-mq-lg border border-mq-purple/20 hover:bg-mq-purple/15 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div className="text-left">
                  <h4 className="font-semibold text-mq-content">{t('category_Social')}</h4>
                  <p className="text-mq-sm text-mq-content-secondary">{t('meetupsNetworking')}</p>
                </div>
              </div>
              <Badge className="bg-mq-purple text-white">{categoryStats?.Social ?? 0}</Badge>
            </button>

            <button
              onClick={() => handleCategoryItemClick('Free Food')}
              className="w-full flex items-center justify-between p-4 bg-mq-warning/10 rounded-mq-lg border border-mq-warning/20 hover:bg-mq-warning/15 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🍕</span>
                <div className="text-left">
                  <h4 className="font-semibold text-mq-content">{t('category_FreeFood')}</h4>
                  <p className="text-mq-sm text-mq-content-secondary">{t('mealsSnacks')}</p>
                </div>
              </div>
              <Badge className="bg-mq-warning text-white">
                {categoryStats?.['Free Food'] ?? 0}
              </Badge>
            </button>

            <div className="flex items-center gap-2 p-3 bg-mq-background-secondary rounded-mq-lg mt-4">
              <Info className="h-4 w-4 text-mq-content-tertiary" />
              <p className="text-mq-sm text-mq-content-secondary">{t('clickCategoryToFilter')}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const FeedSidebar = memo(FeedSidebarComponent);
