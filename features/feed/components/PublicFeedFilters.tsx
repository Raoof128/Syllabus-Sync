"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/mq/button";
import { Badge } from "@/components/ui/mq/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MagicCard } from "@/components/ui/MagicCard";
import { cn } from "@/lib/utils";
import { useTypedTranslation } from "@/lib/hooks/useTypedTranslation";
import { CategoryFilter, TimeFilter, SortOption } from "../types";
import { CATEGORY_FILTERS } from "../constants";

interface PublicFeedFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categoryFilter: CategoryFilter;
  onCategoryChange: (value: CategoryFilter) => void;
  timeFilter: TimeFilter;
  onTimeChange: (value: TimeFilter) => void;
  sortOption: SortOption;
  onSortChange: (value: SortOption) => void;
  categoryCounts: Record<CategoryFilter, number>;
}

export function PublicFeedFilters({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  timeFilter,
  onTimeChange,
  sortOption,
  onSortChange,
  categoryCounts,
}: PublicFeedFiltersProps) {
  const { t } = useTypedTranslation();

  const categoryLabelByValue: Record<CategoryFilter, string> = {
    All: t("all"),
    Academic: t("academic"),
    Career: t("career"),
    Social: t("social"),
    "Free Food": t("freeFood"),
  };

  return (
    <MagicCard isLiquidEnhanced className="mb-6">
      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mq-content-tertiary" />
          <Input
            type="search"
            placeholder={t("searchEventsPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORY_FILTERS.map((cat) => (
              <Button
                key={cat.value}
                variant={categoryFilter === cat.value ? "primary" : "outline"}
                size="sm"
                onClick={() => onCategoryChange(cat.value)}
                className="gap-1.5"
              >
                <span>{cat.icon}</span>
                {categoryLabelByValue[cat.value]}
                {cat.value !== "All" && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "ml-1 text-[10px] min-w-4.5 h-4.5 flex items-center justify-center",
                      categoryFilter === cat.value
                        ? "bg-white/20 text-white"
                        : "bg-mq-background-secondary",
                    )}
                  >
                    {categoryCounts[cat.value]}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Sort & Time Filter */}
          <div className="flex items-center gap-2 ml-auto">
            <Select
              value={timeFilter}
              onValueChange={(v) => onTimeChange(v as TimeFilter)}
            >
              <SelectTrigger className="w-30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allTime")}</SelectItem>
                <SelectItem value="today">{t("today")}</SelectItem>
                <SelectItem value="week">{t("thisWeek")}</SelectItem>
                <SelectItem value="month">{t("thisMonth")}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortOption}
              onValueChange={(v) => onSortChange(v as SortOption)}
            >
              <SelectTrigger className="w-32.5">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">{t("sortByDate")}</SelectItem>
                <SelectItem value="priority">{t("sortByPriority")}</SelectItem>
                <SelectItem value="category">{t("sortByCategory")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </MagicCard>
  );
}
