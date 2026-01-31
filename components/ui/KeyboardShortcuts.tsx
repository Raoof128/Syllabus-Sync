'use client';

import { Keyboard, Command } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/mq/button';

import { useTranslation } from '@/lib/hooks/useTranslation';

export function KeyboardShortcuts() {
  const { t } = useTranslation();

  const shortcuts = [
    { id: 'add-unit', description: t('addUnit'), keys: ['U'], highlight: true },
    { id: 'add-deadline', description: t('addDeadline'), keys: ['D'], highlight: true },
    { id: 'search', description: t('search'), keys: ['K'] },
    { id: 'save', description: t('save'), keys: ['S'] },
    { id: 'close', description: t('close'), keys: ['Esc'] },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-mq-content-secondary hover:text-mq-content hover:bg-mq-background-secondary rounded-mq-md transition-colors"
          title={t('keyboardShortcuts')}
        >
          <Keyboard className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 bg-mq-background border-mq-border shadow-mq-lg rounded-mq-lg p-2"
      >
        <DropdownMenuLabel className="text-mq-content font-semibold flex items-center gap-2 mb-1 px-2">
          <Command className="h-4 w-4" />
          {t('keyboardShortcuts')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-mq-border" />
        <div className="space-y-1 mt-1">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.id}
              className="flex items-center justify-between px-2 py-1.5 rounded-mq-md hover:bg-mq-background-secondary text-mq-sm"
            >
              <span className="text-mq-content-secondary">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key) => (
                  <div key={`${shortcut.id}-${key}`} className="flex items-center gap-1">
                    {shortcut.keys.length > 0 && key !== 'Esc' && (
                      <>
                        <kbd className="inline-flex h-5 items-center gap-1 rounded border border-mq-border bg-mq-background-tertiary px-1.5 font-mono text-[10px] font-medium text-mq-content-secondary opacity-100">
                          {t('ctrlKey')}
                        </kbd>
                        <span className="text-xs text-mq-content-tertiary">/</span>
                        <kbd className="inline-flex h-5 items-center gap-1 rounded border border-mq-border bg-mq-background-tertiary px-1.5 font-mono text-[10px] font-medium text-mq-content-secondary opacity-100">
                          ⌘
                        </kbd>
                      </>
                    )}
                    <kbd className="inline-flex h-5 items-center gap-1 rounded border border-mq-border bg-mq-background-tertiary px-1.5 font-mono text-[10px] font-medium text-mq-content-secondary opacity-100">
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
