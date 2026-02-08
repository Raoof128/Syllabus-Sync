'use client';

import { useState, memo, useCallback } from 'react';
import { TrendingUp, Calendar, Users, Megaphone, ChevronRight, Sparkles, Info, ExternalLink } from 'lucide-react';
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

const FeedSidebarComponent = ({
  stats,
  categoryStats,
  onCategoryClick
}: FeedSidebarProps) => {
  const { t } = useTypedTranslation();

  // Dialog states
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [announcementsDialogOpen, setAnnouncementsDialogOpen] = useState(false);
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Announcements data - using hardcoded content since these are static announcements
  const announcements: Announcement[] = [
    {
      id: 'featured-calendar',
      type: 'featured',
      title: 'Add Events to Your Calendar',
      description: 'Click "Add to Calendar" on any event to save it to your personal calendar...',
      fullDescription: 'You can add any campus event to your personal calendar with just one click. This helps you stay organized and never miss important events. Simply click the "Add to Calendar" button on any event card to save it to Google Calendar, Apple Calendar, or download an ICS file.',
    },
    {
      id: 'new-enrollment',
      type: 'new',
      title: 'Semester 1 Enrollment Open',
      description: 'Course enrolment for Semester 1, 2026 is now open. Check your...',
      fullDescription: 'Course enrolment for Semester 1, 2026 is now open. Check your enrolled units, add new courses, or modify your timetable through the student portal. Make sure to complete your enrolment before the deadline to secure your spot in popular classes.',
      link: 'https://students.mq.edu.au/enrolment',
      linkText: 'Go to Enrollment Portal',
    },
    {
      id: 'info-library',
      type: 'info',
      title: 'Library Extended Hours',
      description: 'During exam period, the library will be open 24/7. Additional study...',
      fullDescription: 'During exam period, the library will be open 24/7. Additional study spaces have been made available on levels 2 and 3. Free coffee and snacks will be provided between 10pm and 6am to support your late-night study sessions. Security patrols have also been increased for your safety.',
    },
  ];

  const handleAnnouncementClick = useCallback((announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
  }, []);

  const handleCategoryItemClick = useCallback((category: string) => {
    setCategoriesDialogOpen(false);
    onCategoryClick?.(category);
  }, [onCategoryClick]);

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
            <Card
              className="border-mq-border bg-mq-card-background shadow-mq-sm cursor-pointer group"
              onClick={() => setStatsDialogOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setStatsDialogOpen(true)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-mq-primary" aria-hidden="true" />
                    {t('thisWeek')}
                  </span>
                  <ChevronRight className="h-4 w-4 text-mq-content-tertiary group-hover:text-mq-primary transition-colors" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 bg-mq-info/10 rounded-mq-lg border border-mq-info/20 hover:bg-mq-info/15 transition-colors">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-mq-info" aria-hidden="true" />
                    <span className="text-mq-sm font-medium text-mq-content">{t('totalEvents')}</span>
                  </div>
                  <span
                    className="text-mq-lg font-bold text-mq-info"
                    aria-label={`${stats.total} ${t('totalEvents')}`}
                  >
                    {stats.total}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-mq-purple/10 rounded-mq-lg border border-mq-purple/20 hover:bg-mq-purple/15 transition-colors">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-mq-purple" aria-hidden="true" />
                    <span className="text-mq-sm font-medium text-mq-content">{t('thisWeek')}</span>
                  </div>
                  <span
                    className="text-mq-lg font-bold text-mq-purple"
                    aria-label={`${stats.thisWeek} ${t('thisWeek')}`}
                  >
                    {stats.thisWeek}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-mq-warning/10 rounded-mq-lg border border-mq-warning/20 hover:bg-mq-warning/15 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-mq-warning" aria-hidden="true">
                      🍕
                    </span>
                    <span className="text-mq-sm font-medium text-mq-content">{t('freeFood')}</span>
                  </div>
                  <span
                    className="text-mq-lg font-bold text-mq-warning"
                    aria-label={`${stats.freeFood} ${t('freeFood')}`}
                  >
                    {stats.freeFood}
                  </span>
                </div>
              </CardContent>
            </Card>
          </MagicCard>
        </ScrollReveal>

        {/* Announcements - Clickable */}
        <ScrollReveal delay={0.3}>
          <MagicCard isLiquidEnhanced className="overflow-hidden">
            <Card
              className="border-mq-border bg-mq-card-background shadow-mq-sm cursor-pointer group"
              onClick={() => setAnnouncementsDialogOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setAnnouncementsDialogOpen(true)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-mq-primary" aria-hidden="true" />
                    {t('announcements')}
                  </span>
                  <ChevronRight className="h-4 w-4 text-mq-content-tertiary group-hover:text-mq-primary transition-colors" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {announcements.slice(0, 2).map((announcement) => (
                  <article
                    key={announcement.id}
                    className={`p-3 rounded-mq-lg border hover:shadow-sm transition-all ${
                      announcement.type === 'featured' 
                        ? 'bg-mq-primary/10 border-mq-primary/20' 
                        : announcement.type === 'new'
                        ? 'bg-mq-success/10 border-mq-success/20'
                        : 'bg-mq-info/10 border-mq-info/20'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Badge className={`${getBadgeStyle(announcement.type)} flex-shrink-0 text-[10px]`}>
                        {getBadgeLabel(announcement.type)}
                      </Badge>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-mq-content text-mq-sm line-clamp-1">
                          {announcement.title}
                        </h4>
                        <p className="text-mq-xs text-mq-content-secondary mt-1 line-clamp-2">
                          {announcement.description}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </CardContent>
            </Card>
          </MagicCard>
        </ScrollReveal>

        {/* Event Categories Legend - Clickable */}
        <ScrollReveal delay={0.35}>
          <MagicCard isLiquidEnhanced className="overflow-hidden">
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
                      <span className="text-mq-sm font-medium text-mq-content">{t('category_Career')}</span>
                    </dt>
                    <dd className="text-mq-sm font-semibold text-mq-info">{categoryStats?.Career ?? 0}</dd>
                  </div>
                  <div className="flex items-center justify-between hover:bg-mq-hover-background p-2 -mx-2 rounded-mq transition-colors">
                    <dt className="flex items-center gap-2">
                      <span>📚</span>
                      <span className="text-mq-sm font-medium text-mq-content">{t('category_Academic')}</span>
                    </dt>
                    <dd className="text-mq-sm font-semibold text-mq-success">{categoryStats?.Academic ?? 0}</dd>
                  </div>
                  <div className="flex items-center justify-between hover:bg-mq-hover-background p-2 -mx-2 rounded-mq transition-colors">
                    <dt className="flex items-center gap-2">
                      <span>🎉</span>
                      <span className="text-mq-sm font-medium text-mq-content">{t('category_Social')}</span>
                    </dt>
                    <dd className="text-mq-sm font-semibold text-mq-purple">{categoryStats?.Social ?? 0}</dd>
                  </div>
                  <div className="flex items-center justify-between hover:bg-mq-hover-background p-2 -mx-2 rounded-mq transition-colors">
                    <dt className="flex items-center gap-2">
                      <span>🍕</span>
                      <span className="text-mq-sm font-medium text-mq-content">{t('category_FreeFood')}</span>
                    </dt>
                    <dd className="text-mq-sm font-semibold text-mq-warning">{categoryStats?.['Free Food'] ?? 0}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
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
            <DialogDescription>
              Overview of events happening on campus
            </DialogDescription>
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
              <p className="text-mq-sm text-mq-content-secondary">
                Total number of upcoming campus events
              </p>
            </div>

            <div className="p-4 bg-mq-purple/10 rounded-mq-lg border border-mq-purple/20">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 font-medium">
                  <Users className="h-5 w-5 text-mq-purple" />
                  {t('thisWeek')}
                </span>
                <span className="text-2xl font-bold text-mq-purple">{stats.thisWeek}</span>
              </div>
              <p className="text-mq-sm text-mq-content-secondary">
                Events happening in the next 7 days
              </p>
            </div>

            <div className="p-4 bg-mq-warning/10 rounded-mq-lg border border-mq-warning/20">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 font-medium">
                  <span className="text-xl">🍕</span>
                  {t('freeFood')}
                </span>
                <span className="text-2xl font-bold text-mq-warning">{stats.freeFood}</span>
              </div>
              <p className="text-mq-sm text-mq-content-secondary">
                Events with free food or refreshments
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 bg-mq-background-secondary rounded-mq-lg">
              <Sparkles className="h-4 w-4 text-mq-primary" />
              <p className="text-mq-sm text-mq-content-secondary">
                Click on categories below to filter events by type
              </p>
            </div>
          </div>
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
            <DialogDescription>
              Important updates and news from the university
            </DialogDescription>
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
      <Dialog open={!!selectedAnnouncement} onOpenChange={(open) => !open && setSelectedAnnouncement(null)}>
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
                      onClick={() => window.open(selectedAnnouncement.link, '_blank', 'noopener,noreferrer')}
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
            <DialogTitle className="flex items-center gap-2">
              {t('eventCategories')}
            </DialogTitle>
            <DialogDescription>
              Filter events by category to find what interests you
            </DialogDescription>
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
              <Badge className="bg-mq-warning text-white">{categoryStats?.['Free Food'] ?? 0}</Badge>
            </button>

            <div className="flex items-center gap-2 p-3 bg-mq-background-secondary rounded-mq-lg mt-4">
              <Info className="h-4 w-4 text-mq-content-tertiary" />
              <p className="text-mq-sm text-mq-content-secondary">
                Click a category to filter the event feed
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const FeedSidebar = memo(FeedSidebarComponent);
