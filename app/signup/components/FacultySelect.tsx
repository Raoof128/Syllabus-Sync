'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getFaculties } from '@/lib/data/mq-courses';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { cn } from '@/lib/utils';

interface FacultySelectProps {
  value: string;
  onChange: (faculty: string) => void;
  placeholder?: string;
  error?: boolean;
}

const FACULTIES = getFaculties();

export function FacultySelect({ value, onChange, placeholder, error }: FacultySelectProps) {
  const { t } = useTypedTranslation();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          'w-full bg-mq-input-background focus:ring-[3px] focus:border-mq-focus focus:ring-mq-focus/40 h-9 text-sm',
          error ? 'border-mq-error' : 'border-mq-border',
        )}
        aria-invalid={error}
      >
        <SelectValue placeholder={placeholder || t('selectFaculty')} />
      </SelectTrigger>
      <SelectContent className="bg-mq-card-background border-mq-border">
        {FACULTIES.map((faculty) => (
          <SelectItem
            key={faculty}
            value={faculty}
            className="hover:bg-mq-hover-background focus:bg-mq-hover-background focus:text-mq-primary cursor-pointer"
          >
            {faculty}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
