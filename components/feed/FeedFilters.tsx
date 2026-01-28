import { Search } from 'lucide-react';
import { Input } from '@/components/ui/mq/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/lib/hooks/useTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { cn } from '@/lib/utils';

export type TimeRange = 'today' | 'week' | 'upcoming';
export type SortMode = 'soonest' | 'newest' | 'popular';
export type CategoryFilter = 'All' | 'Academic' | 'Career' | 'Social' | 'Free Food';

interface FeedFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: CategoryFilter;
  onFilterChange: (filter: CategoryFilter) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  counts: Record<CategoryFilter, number>;
}

export function FeedFilters({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  timeRange,
  onTimeRangeChange,
  sortMode,
  onSortModeChange,
  counts,
}: FeedFiltersProps) {
  const { t } = useTranslation();

  const filters: CategoryFilter[] = ['All', 'Academic', 'Career', 'Social', 'Free Food'];

  return (
    <div className="sticky top-[72px] z-10 bg-mq-surface/80 backdrop-blur-md border-b border-mq-border -mx-4 px-4 py-3 sm:mx-0 sm:px-0 sm:border-0 sm:bg-transparent sm:backdrop-blur-none mb-6 space-y-4">
      {/* Search and Sort Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mq-content-tertiary pointer-events-none" />
          <Input
            placeholder={t('searchEventsPlaceholder') || 'Search events...'}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-mq-background-secondary border-mq-border"
          />
        </div>

        <div className="flex gap-2">
          <Select value={sortMode} onValueChange={(v) => onSortModeChange(v as SortMode)}>
            <SelectTrigger className="w-[140px] bg-mq-background-secondary border-mq-border">
              <SelectValue placeholder={t('sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="soonest">{t('sortSoonest') || 'Soonest'}</SelectItem>
              <SelectItem value="newest">{t('sortNewest') || 'Newest'}</SelectItem>
              {/* <SelectItem value="popular">{t('sortPopular') || "Popular"}</SelectItem> */}
            </SelectContent>
          </Select>

          <div className="bg-mq-background-secondary border border-mq-border rounded-md p-1 flex">
            {(['today', 'week', 'upcoming'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => onTimeRangeChange(range)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded transition-colors',
                  timeRange === range
                    ? 'bg-mq-surface shadow-sm text-mq-content'
                    : 'text-mq-content-secondary hover:text-mq-content',
                )}
              >
                {t(`timeRange_${range}` as TranslationKey) ||
                  range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Chips Row */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
        {filters.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap',
                isActive
                  ? 'bg-mq-primary/10 border-mq-primary text-mq-primary'
                  : 'bg-mq-background-secondary border-mq-border text-mq-content-secondary hover:border-mq-border-secondary',
              )}
            >
              <span>{t(`category_${filter.replace(/ /g, '')}` as TranslationKey) || filter}</span>
              <span
                className={cn(
                  'ml-1 text-[10px] px-1.5 py-0.5 rounded-full',
                  isActive
                    ? 'bg-mq-primary text-white'
                    : 'bg-mq-surface-hover text-mq-content-tertiary',
                )}
              >
                {counts[filter] || 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
