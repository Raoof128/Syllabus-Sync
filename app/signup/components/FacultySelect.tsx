'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getFaculties } from '@/lib/data/mq-courses';

interface FacultySelectProps {
  value: string;
  onChange: (faculty: string) => void;
  placeholder?: string;
}

const FACULTIES = getFaculties();

export function FacultySelect({
  value,
  onChange,
  placeholder = 'Select faculty',
}: FacultySelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full bg-mq-input-background border-mq-border focus:ring-[3px] focus:border-mq-focus focus:ring-mq-focus/40 h-9 text-sm">
        <SelectValue placeholder={placeholder} />
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
