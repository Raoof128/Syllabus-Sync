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
    { description: t('addUnit'), keys: ['U'], highlight: true },
    { description: t('addDeadline'), keys: ['D'], highlight: true },
    { description: t('search'), keys: ['K'] },
    { description: t('save'), keys: ['S'] },
    { description: t('close'), keys: ['Esc'] },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-mq-content-secondary hover:text-mq-content hover:bg-mq-background-secondary rounded-mq-md transition-colors"
          title="Keyboard Shortcuts"
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
          Keyboard Shortcuts
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-mq-border" />
        <div className="space-y-1 mt-1">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between px-2 py-1.5 rounded-mq-md hover:bg-mq-background-secondary/50 text-mq-sm"
            >
              <span className="text-mq-content-secondary">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, kIndex) => (
                  <div key={kIndex} className="flex items-center gap-1">
                    {kIndex === 0 && shortcut.keys.length > 0 && key !== 'Esc' && (
                      <>
                        <kbd className="inline-flex h-5 items-center gap-1 rounded border border-mq-border bg-mq-background-tertiary px-1.5 font-mono text-[10px] font-medium text-mq-content-secondary opacity-100">
                          Ctrl
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
