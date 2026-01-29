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
        'hidden lg:block w-80 flex-shrink-0 space-y-6 h-[calc(100vh-80px)] overflow-y-auto sticky top-[80px] p-1',
        className,
      )}
    >
      <ScrollReveal>
        <div className="space-y-6">{children}</div>
      </ScrollReveal>
    </aside>
  );
}
