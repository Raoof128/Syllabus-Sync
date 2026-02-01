'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { MapPin, Search, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/mq/input';
import { Button } from '@/components/ui/mq/button';
import { buildings, type Building } from '@/lib/map/buildings';
import { searchBuildings } from '@/lib/utils/buildingValidation';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';

interface BuildingAutocompleteProps {
  /** Current value (building ID) */
  value: string;
  /** Called when a building is selected */
  onChange: (buildingId: string) => void;
  /** Error message to display */
  error?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Additional className */
  className?: string;
  /** Label for the field */
  label?: string;
}

export default function BuildingAutocomplete({
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  className,
  label,
}: BuildingAutocompleteProps) {
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

  // Find the selected building from the imported buildings array
  const selectedBuilding = useMemo(() => {
    if (!value) return null;
    return buildings.find((b) => b.id === value) || null;
  }, [value]);

  // Search results
  const searchResults = useMemo(() => {
    if (!isOpen) return [];
    return searchBuildings(query, 15);
  }, [query, isOpen]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(0);
  }, []);

  // Handle selection
  const handleSelect = useCallback(
    (building: Building) => {
      onChange(building.id);
      setQuery('');
      setIsOpen(false);
    },
    [onChange],
  );

  // Handle clear
  const handleClear = useCallback(() => {
    onChange('');
    setQuery('');
    setIsOpen(false);
  }, [onChange]);

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

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-mq-content mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Selected building display */}
        {selectedBuilding && !isOpen ? (
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 border rounded-md bg-mq-background',
              error ? 'border-red-500' : 'border-mq-border',
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
            <MapPin className="h-4 w-4 text-mq-content-secondary shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-medium truncate">{selectedBuilding.name}</span>
              {selectedBuilding.address && (
                <span className="block text-xs text-mq-content-secondary truncate">
                  {selectedBuilding.address}
                </span>
              )}
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
              placeholder={placeholder || tOr('searchBuilding', 'Search for a building...')}
              disabled={disabled}
              className={cn('pl-10', error && 'border-red-500')}
            />
          </div>
        )}

        {/* Dropdown list */}
        {isOpen && (
          <ul
            ref={listRef}
            className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-mq-background border border-mq-border rounded-md shadow-lg"
            role="listbox"
          >
            {searchResults.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-mq-content-secondary">
                {query.length > 0
                  ? tOr('noBuildingsFound', 'No buildings found')
                  : tOr('typeToSearchBuildings', 'Type to search buildings...')}
              </li>
            ) : (
              searchResults.map((building, index) => (
                // Keyboard navigation is handled by the input's onKeyDown
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                <li
                  key={building.id}
                  role="option"
                  aria-selected={highlightedIndex === index}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors',
                    highlightedIndex === index
                      ? 'bg-mq-primary/10 text-mq-primary'
                      : 'hover:bg-mq-hover-background',
                    selectedBuilding?.id === building.id && 'font-medium',
                  )}
                  onClick={() => handleSelect(building)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <MapPin className="h-4 w-4 shrink-0 text-mq-content-secondary" />
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm truncate">{building.name}</span>
                    {building.address && (
                      <span className="block text-xs text-mq-content-secondary truncate">
                        {building.address}
                      </span>
                    )}
                  </div>
                  {selectedBuilding?.id === building.id && (
                    <Check className="h-4 w-4 shrink-0 text-mq-primary" />
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {/* Error message */}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
