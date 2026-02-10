'use client';

import { memo, useMemo } from 'react';
import { TrendingUp, Calendar, Users, Pizza } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PublicEvent } from '@/lib/types/publicEvents';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';

interface QuickStatsProps {
  events: PublicEvent[];
  className?: string;
}

export const QuickStats = memo(({ events, className }: QuickStatsProps) => {
  const { t } = useTypedTranslation();

  const stats = useMemo(() => {
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));

    const thisWeekEvents = events.filter((e) => e.startAt <= endOfWeek);
    const freeFood = events.filter((e) => e.category === 'Free Food');
    const career = events.filter((e) => e.category === 'Career');
    const social = events.filter((e) => e.category === 'Social');
    const academic = events.filter((e) => e.category === 'Academic');

    return {
      total: events.length,
      thisWeek: thisWeekEvents.length,
      freeFood: freeFood.length,
      career: career.length,
      social: social.length,
      academic: academic.length,
    };
  }, [events]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-mq-primary" />
        <h3 className="font-bold text-mq-content">{t('thisWeek') || 'This Week'}</h3>
      </div>

      {/* Stats Cards */}
      <div className="space-y-2">
        <StatCard
          icon={Calendar}
          label={t('totalEvents') || 'Total Events'}
          value={stats.total}
          color="text-mq-primary"
          bgColor="bg-mq-primary/10"
        />
        <StatCard
          icon={Users}
          label={t('thisWeek') || 'This Week'}
          value={stats.thisWeek}
          color="text-purple-500"
          bgColor="bg-purple-500/10"
        />
        <StatCard
          icon={Pizza}
          label={t('freeFood') || 'Free Food'}
          value={stats.freeFood}
          color="text-amber-500"
          bgColor="bg-amber-500/10"
        />
      </div>

      {/* Category Breakdown */}
      <div className="pt-4 border-t border-mq-border">
        <p className="text-xs font-semibold text-mq-content-tertiary uppercase tracking-wide mb-3">
          {t('byCategory') || 'By Category'}
        </p>
        <div className="space-y-2">
          <CategoryBar
            icon="💼"
            label={t('career') || 'Career'}
            count={stats.career}
            total={stats.total}
            color="bg-blue-500"
          />
          <CategoryBar
            icon="📚"
            label={t('academic') || 'Academic'}
            count={stats.academic}
            total={stats.total}
            color="bg-emerald-500"
          />
          <CategoryBar
            icon="🎉"
            label={t('social') || 'Social'}
            count={stats.social}
            total={stats.total}
            color="bg-purple-500"
          />
          <CategoryBar
            icon="🍕"
            label={t('freeFood') || 'Free Food'}
            count={stats.freeFood}
            total={stats.total}
            color="bg-amber-500"
          />
        </div>
      </div>
    </div>
  );
});

QuickStats.displayName = 'QuickStats';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}

function StatCard({ icon: Icon, label, value, color, bgColor }: StatCardProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-mq-card-background border border-mq-border">
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg', bgColor)}>
          <Icon className={cn('h-4 w-4', color)} />
        </div>
        <span className="text-sm text-mq-content-secondary">{label}</span>
      </div>
      <span className="text-lg font-bold text-mq-content">{value}</span>
    </div>
  );
}

interface CategoryBarProps {
  icon: string;
  label: string;
  count: number;
  total: number;
  color: string;
}

function CategoryBar({ icon, label, count, total, color }: CategoryBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="flex items-center gap-1.5 text-mq-content-secondary">
          <span>{icon}</span>
          {label}
        </span>
        <span className="font-medium text-mq-content">{count}</span>
      </div>
      <div className="h-1.5 bg-mq-background-secondary rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
