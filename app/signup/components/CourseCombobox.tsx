'use client';

import { useState, useRef, useEffect, useMemo, startTransition } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';
import { getCoursesByFaculty, DEGREE_TYPE_LABELS, DEGREE_TYPE_ORDER } from '@/lib/data/mq-courses';
import { cn } from '@/lib/utils';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  facultyFilter?: string;
};

export function CourseCombobox({ value, onChange, disabled, error, facultyFilter }: Props) {
  const { t } = useTypedTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  // Only render portal on the client (startTransition defers setState out of the effect body)
  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  // Compute fixed-position coords from trigger's bounding rect
  const updateDropdownPosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  };

  // Close dropdown on outside click (check both trigger and dropdown)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reposition dropdown on scroll or resize while open
  useEffect(() => {
    if (!open) return;
    updateDropdownPosition();
    const update = () => updateDropdownPosition();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 30);
  }, [open]);

  // Filter courses by query (name or code)
  const filtered = useMemo(() => {
    const pool = facultyFilter ? getCoursesByFaculty(facultyFilter) : getCoursesByFaculty('');
    const q = query.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [query, facultyFilter]);

  // Group filtered results by simplified degree label, in defined order
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const course of filtered) {
      const label = DEGREE_TYPE_LABELS[course.type] ?? course.type;
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(course);
    }
    const ordered = new Map<string, typeof filtered>();
    for (const label of DEGREE_TYPE_ORDER) {
      if (map.has(label)) ordered.set(label, map.get(label)!);
    }
    for (const [label, courses] of map) {
      if (!ordered.has(label)) ordered.set(label, courses);
    }
    return ordered;
  }, [filtered]);

  const handleToggle = () => {
    if (disabled) return;
    if (!open) updateDropdownPosition();
    setOpen((v) => !v);
  };

  const handleSelect = (name: string) => {
    onChange(name);
    setOpen(false);
    setQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
  };

  const totalResults = filtered.length;

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-mq border px-3 py-2 text-sm',
          'bg-mq-input-background text-mq-content',
          'transition-[color,box-shadow] outline-none',
          'focus-visible:ring-[3px] focus-visible:border-mq-focus focus-visible:ring-mq-focus/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'h-9',
          error ? 'border-red-500' : 'border-mq-border',
          open && 'border-mq-focus ring-[3px] ring-mq-focus/40',
        )}
      >
        <span className={cn('truncate text-left flex-1', !value && 'text-mq-content-tertiary')}>
          {value || (facultyFilter ? t('selectCoursePlaceholder') : t('selectFacultyFirst'))}
        </span>
        <span className="flex items-center gap-0.5 shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange('');
                  setQuery('');
                }
              }}
              aria-label={t('clearSelection')}
              className="p-0.5 rounded hover:bg-mq-hover-background text-mq-content-secondary hover:text-mq-content transition-colors"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 opacity-50 transition-transform duration-150',
              open && 'rotate-180',
            )}
          />
        </span>
      </button>

      {/* Dropdown — portalled to document.body to escape overflow:hidden & stacking contexts */}
      {open &&
        mounted &&
        createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            aria-label={t('courseList')}
            style={dropdownStyle}
            className="rounded-mq border border-mq-border bg-mq-card-background shadow-lg overflow-hidden"
          >
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-mq-border">
              <Search className="h-3.5 w-3.5 shrink-0 text-mq-content-tertiary" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchCoursesPlaceholder')}
                className="flex-1 bg-transparent text-sm text-mq-content placeholder:text-mq-content-tertiary outline-none"
              />
              {query && (
                <span className="text-xs text-mq-content-secondary shrink-0">
                  {totalResults} {t('results')}
                </span>
              )}
            </div>

            {/* Course list */}
            <div className="max-h-64 overflow-y-auto py-1">
              {grouped.size === 0 ? (
                <div className="px-3 py-6 text-sm text-mq-content-secondary text-center">
                  {t('noCoursesMatch')} &ldquo;{query}&rdquo;
                </div>
              ) : (
                Array.from(grouped.entries()).map(([label, courses]) => (
                  <div key={label}>
                    <div className="px-3 pt-2 pb-0.5 text-xs font-semibold tracking-wider uppercase text-mq-content-tertiary">
                      {label}
                    </div>
                    {courses.map((course) => (
                      <button
                        key={course.code}
                        type="button"
                        role="option"
                        aria-selected={value === course.name}
                        onClick={() => handleSelect(course.name)}
                        className={cn(
                          'w-full text-left px-3 py-1.5 text-sm transition-colors',
                          value === course.name
                            ? 'bg-mq-primary/10 text-mq-primary font-medium'
                            : 'text-mq-content hover:bg-mq-hover-background',
                        )}
                      >
                        {course.name}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
