import { TrendingUp, Calendar, Users, Megaphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { MagicCard } from '@/components/ui/MagicCard';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

interface FeedSidebarProps {
  stats: {
    total: number;
    thisWeek: number;
    freeFood: number;
  };
}

export function FeedSidebar({ stats }: FeedSidebarProps) {
  const { t } = useTypedTranslation();

  return (
    <aside
      className="space-y-4 lg:space-y-6 w-full lg:w-auto lg:sticky lg:top-[88px] lg:h-fit"
      aria-label={t('eventStatistics')}
    >
      {/* Mobile section header - only visible on smaller screens */}
      <div className="lg:hidden flex items-center gap-2 pb-2 border-b border-mq-border">
        <h2 className="text-lg font-semibold text-mq-content">{t('eventStatistics')}</h2>
      </div>

      {/* Quick Stats */}
      <ScrollReveal delay={0.25}>
        <MagicCard isLiquidEnhanced className="overflow-hidden">
          <Card className="border-mq-border bg-mq-card-background shadow-mq-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-mq-primary" aria-hidden="true" />
                {t('thisWeek')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 bg-mq-info/10 rounded-mq-lg border border-mq-info/20">
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
              <div className="flex items-center justify-between p-3 bg-mq-purple/10 rounded-mq-lg border border-mq-purple/20">
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
              <div className="flex items-center justify-between p-3 bg-mq-warning/10 rounded-mq-lg border border-mq-warning/20">
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

      {/* Announcements */}
      <ScrollReveal delay={0.3}>
        <MagicCard isLiquidEnhanced className="overflow-hidden">
          <Card className="border-mq-border bg-mq-card-background shadow-mq-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Megaphone className="h-5 w-5 text-mq-primary" aria-hidden="true" />
                {t('announcements')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <article className="p-3 bg-mq-success/10 rounded-mq-lg border border-mq-success/20">
                <div className="flex items-start gap-2">
                  <Badge className="bg-mq-success text-white flex-shrink-0 text-[10px]">
                    {t('new')}
                  </Badge>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-mq-content text-mq-sm">
                      {t('phase2Updates')}
                    </h4>
                    <p className="text-mq-xs text-mq-content-secondary mt-1">
                      {t('phase2UpdatesDesc')}
                    </p>
                  </div>
                </div>
              </article>
              <article className="p-3 bg-mq-warning/10 rounded-mq-lg border border-mq-warning/20">
                <div className="flex items-start gap-2">
                  <Badge className="bg-mq-warning text-white flex-shrink-0 text-[10px]">
                    {t('info')}
                  </Badge>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-mq-content text-mq-sm">
                      {t('welcomeToApp', { appName: 'Syllabus Sync' })}
                    </h4>
                    <p className="text-mq-xs text-mq-content-secondary mt-1">
                      {t('appCompanionDesc')}
                    </p>
                  </div>
                </div>
              </article>
            </CardContent>
          </Card>
        </MagicCard>
      </ScrollReveal>

      {/* Event Categories Legend */}
      <ScrollReveal delay={0.35}>
        <MagicCard isLiquidEnhanced className="overflow-hidden">
          <Card className="border-mq-border bg-mq-card-background shadow-mq-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t('eventCategories')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <dl className="space-y-3">
                <div className="flex items-center justify-between">
                  <dt>
                    <Badge className="bg-mq-success/10 text-mq-success border-mq-success/20">
                      {t('category_Academic')}
                    </Badge>
                  </dt>
                  <dd className="text-mq-sm text-mq-content-secondary">{t('workshopsStudy')}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>
                    <Badge className="bg-mq-info/10 text-mq-info border-mq-info/20">
                      {t('category_Career')}
                    </Badge>
                  </dt>
                  <dd className="text-mq-sm text-mq-content-secondary">{t('jobInternship')}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>
                    <Badge className="bg-mq-purple/10 text-mq-purple border-mq-purple/20">
                      {t('category_Social')}
                    </Badge>
                  </dt>
                  <dd className="text-mq-sm text-mq-content-secondary">{t('meetupsNetworking')}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>
                    <Badge className="bg-mq-warning/10 text-mq-warning border-mq-warning/20">
                      {t('category_FreeFood')}
                    </Badge>
                  </dt>
                  <dd className="text-mq-sm text-mq-content-secondary">{t('mealsSnacks')}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </MagicCard>
      </ScrollReveal>
    </aside>
  );
}
