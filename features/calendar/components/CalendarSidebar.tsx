'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

interface CalendarSidebarProps {
  children: React.ReactNode;
  className?: string;
}

export default function CalendarSidebar({ children, className }: CalendarSidebarProps) {
  return (
    <aside
      className={cn(
        // Mobile & tablet: full width, stacked below calendar
        'w-full min-w-0 space-y-4 lg:w-[22rem] lg:flex-shrink-0 lg:space-y-6 xl:w-96',
        // Desktop: no nested scroll — let the main page handle scrolling
        'lg:p-1',
        // Order: on mobile, widgets come after calendar (order handled in parent)
        className,
      )}
    >
      <ScrollReveal>
        <div className="space-y-4 lg:space-y-6">{children}</div>
      </ScrollReveal>
    </aside>
  );
}
