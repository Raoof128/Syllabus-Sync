export const REMINDER_TIMING_OPTIONS = [
  { value: 15, labelKey: 'timing15min' as const },
  { value: 30, labelKey: 'timing30min' as const },
  { value: 60, labelKey: 'timing1hour' as const },
  { value: 120, labelKey: 'timing2hours' as const },
  { value: 1440, labelKey: 'timing1day' as const },
  { value: 2880, labelKey: 'timing2days' as const },
] as const;
