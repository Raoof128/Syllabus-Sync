// components/layout/Clock.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { Language } from '@/lib/i18n/translations';

// Map language codes to locale strings
const localeMap: Record<Language, string> = {
    en: 'en-AU',
    es: 'es-ES',
    fa: 'fa-IR',
    zh: 'zh-CN',
    ar: 'ar-SA',
    hi: 'hi-IN',
    ko: 'ko-KR',
    ja: 'ja-JP',
    ur: 'ur-PK',
    th: 'th-TH',
    vi: 'vi-VN',
    ru: 'ru-RU',
};

/**
 * Client-side clock component that updates every second.
 * Displays time in the user's locale format.
 * 
 * Pattern: Client Clock + Server Date
 * - Clock runs on client (updates smoothly, no SSR mismatch)
 * - Date rendered on server (stable, no hydration errors)
 */
export function Clock() {
    const { language } = useTranslation();
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        // This is a legitimate setState in effect: syncing with external system (system clock)
        /* eslint-disable react-hooks/set-state-in-effect */
        setTime(new Date());

        const id = setInterval(() => {
            setTime(new Date());
        }, 1000);
        /* eslint-enable react-hooks/set-state-in-effect */

        return () => clearInterval(id);
    }, []);

    // Show placeholder until hydrated to prevent mismatch
    if (!time) {
        return (
            <span className="text-mq-sm font-medium text-mq-content-secondary tabular-nums w-20 inline-block">
                --:--:--
            </span>
        );
    }

    const locale = localeMap[language] || 'en-AU';

    return (
        <span className="text-mq-sm font-medium text-mq-content-secondary tabular-nums">
            {time.toLocaleTimeString(locale, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            })}
        </span>
    );
}

Clock.displayName = 'Clock';
