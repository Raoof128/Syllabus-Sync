import { cn } from '@/lib/utils';

interface StrengthMeterProps {
  score: number;
  label: string;
}

export function StrengthMeter({ score, label }: StrengthMeterProps) {
  // 0 = empty, 1 = weak, 2 = fair, 3 = good, 4 = strong
  return (
    <div className="space-y-1">
      <div className="flex gap-1 h-1.5 mt-2">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              'h-full w-full rounded-full transition-colors duration-300',
              score >= level
                ? score <= 1
                  ? 'bg-red-500'
                  : score === 2
                    ? 'bg-yellow-500'
                    : score === 3
                      ? 'bg-blue-500'
                      : 'bg-green-500'
                : 'bg-muted',
            )}
          />
        ))}
      </div>
      <p
        className={cn(
          'text-xs text-right font-medium',
          score <= 1 ? 'text-red-500' : score === 4 ? 'text-green-600' : 'text-muted-foreground',
        )}
      >
        {label}
      </p>
    </div>
  );
}
