'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { BookOpen, Search, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/mq/input';
import { Button } from '@/components/ui/mq/button';
import { Badge } from '@/components/ui/mq/badge';
import { searchMQUnits, getMQUnitByCode, type MQUnit } from '@/data/mqUnits';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';

interface UnitAutocompleteProps {
  /** Current unit code value */
  codeValue: string;
  /** Current unit name value */
  nameValue: string;
  /** Called when a unit is selected - provides both code and name */
  onSelect: (code: string, name: string) => void;
  /** Error message to display */
  error?: string;
  /** Placeholder text for code input */
  codePlaceholder?: string;
  /** Placeholder text for name input */
  namePlaceholder?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Additional className */
  className?: string;
  /** Whether to allow custom input (not from MQ units list) */
  allowCustom?: boolean;
}

export default function UnitAutocomplete({
  codeValue,
  nameValue,
  onSelect,
  error,
  codePlaceholder,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  namePlaceholder: _namePlaceholder,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  required: _required = false,
  disabled = false,
  className,
  allowCustom = true,
}: UnitAutocompleteProps) {
  const { t } = useTypedTranslation();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const tOr = (key: TranslationKey | string, fallback: string) => {
    const value = t(key as TranslationKey);
    return value === key ? fallback : value;
  };

  // Find if current code matches an MQ unit
  const selectedMQUnit = useMemo(() => {
    if (!codeValue) return null;
    return getMQUnitByCode(codeValue);
  }, [codeValue]);

  // Search results
  const searchResults = useMemo(() => {
    if (!isOpen) return [];
    return searchMQUnits(query, 15);
  }, [query, isOpen]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(0);
  }, []);

  // Handle selection from dropdown
  const handleSelect = useCallback(
    (unit: MQUnit) => {
      onSelect(unit.code, unit.title);
      setQuery('');
      setIsOpen(false);
    },
    [onSelect],
  );

  // Handle clear
  const handleClear = useCallback(() => {
    onSelect('', '');
    setQuery('');
    setIsOpen(false);
  }, [onSelect]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
          setIsOpen(true);
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (searchResults[highlightedIndex]) {
            handleSelect(searchResults[highlightedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setQuery('');
          break;
      }
    },
    [isOpen, searchResults, highlightedIndex, handleSelect],
  );

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Get level badge variant based on unit level
  const getLevelBadgeVariant = (level: number): 'neutral' | 'brand' | 'secondary' => {
    if (level >= 8000) return 'brand';
    if (level >= 6000) return 'secondary';
    return 'neutral';
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Selected unit display or search input */}
      {selectedMQUnit && !isOpen ? (
        /* Selected unit card */
        <div
          className={cn(
            'flex items-start gap-3 p-3 border rounded-lg bg-mq-card-background',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-mq-primary',
          )}
          onClick={() => !disabled && setIsOpen(true)}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!disabled) setIsOpen(true);
            }
          }}
        >
          <BookOpen className="h-5 w-5 text-mq-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-semibold text-sm">{selectedMQUnit.code}</span>
              <Badge variant={getLevelBadgeVariant(selectedMQUnit.level)} className="text-[10px] h-5">
                {selectedMQUnit.unitType}
              </Badge>
            </div>
            <span className="block text-sm truncate">{selectedMQUnit.title}</span>
            <span className="block text-xs text-mq-content-secondary truncate mt-0.5">
              {selectedMQUnit.school}
            </span>
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : codeValue && !selectedMQUnit && !isOpen ? (
        /* Custom unit display (not from MQ list) */
        <div
          className={cn(
            'flex items-start gap-3 p-3 border rounded-lg bg-mq-card-background border-dashed',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-mq-primary',
          )}
          onClick={() => !disabled && setIsOpen(true)}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!disabled) setIsOpen(true);
            }
          }}
        >
          <BookOpen className="h-5 w-5 text-mq-content-secondary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-sm">{codeValue}</span>
              <Badge variant="neutral" className="text-[10px] h-5">
                {tOr('customUnit', 'Custom')}
              </Badge>
            </div>
            <span className="block text-sm truncate">{nameValue || tOr('noName', 'No name')}</span>
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        /* Search input */
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mq-content-secondary" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            placeholder={codePlaceholder || tOr('searchMQUnit', 'Search MQ units by code or name...')}
            disabled={disabled}
            className={cn('pl-10', error && 'border-red-500')}
          />
        </div>
      )}

      {/* Dropdown list */}
      {isOpen && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 max-h-72 overflow-auto bg-mq-background border border-mq-border rounded-md shadow-lg"
          role="listbox"
        >
          {searchResults.length === 0 ? (
            <li className="px-3 py-4 text-center text-sm text-mq-content-secondary">
              {query.length > 0
                ? tOr('noUnitsFound', 'No units found matching your search')
                : tOr('typeToSearchUnits', 'Type to search MQ units...')}
            </li>
          ) : (
            searchResults.map((unit, index) => (
              // Keyboard navigation is handled by the input's onKeyDown
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events
              <li
                key={unit.code}
                role="option"
                aria-selected={highlightedIndex === index}
                className={cn(
                  'flex items-start gap-3 px-3 py-2 cursor-pointer transition-colors',
                  highlightedIndex === index
                    ? 'bg-mq-primary/10 text-mq-primary'
                    : 'hover:bg-mq-hover-background',
                  selectedMQUnit?.code === unit.code && 'font-medium',
                )}
                onClick={() => handleSelect(unit)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <BookOpen className="h-4 w-4 shrink-0 text-mq-content-secondary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-semibold text-sm">{unit.code}</span>
                    <Badge variant={getLevelBadgeVariant(unit.level)} className="text-[10px] h-4 px-1">
                      {unit.level}
                    </Badge>
                  </div>
                  <span className="block text-sm truncate">{unit.title}</span>
                  <span className="block text-xs text-mq-content-secondary truncate">
                    {unit.school}
                  </span>
                </div>
                {selectedMQUnit?.code === unit.code && (
                  <Check className="h-4 w-4 shrink-0 text-mq-primary mt-0.5" />
                )}
              </li>
            ))
          )}

          {/* Option to enter custom unit if allowed */}
          {allowCustom && query.length > 0 && (
            <li className="border-t border-mq-border px-3 py-2 text-xs text-mq-content-secondary">
              {tOr('customUnitHint', "Can't find your unit? Enter the code and name manually below.")}
            </li>
          )}
        </ul>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-mq-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

