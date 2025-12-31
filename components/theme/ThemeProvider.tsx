'use client';

import { useThemeEffect } from '@/lib/store/themeStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useThemeEffect();

  return <>{children}</>;
}
