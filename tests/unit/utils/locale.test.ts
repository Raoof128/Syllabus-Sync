/**
 * Locale Utility Tests
 * Tests locale string mapping, RTL detection, date/number/time formatting, and location helpers
 */
import { describe, it, expect } from 'vitest';
import {
  getLocaleString,
  isRTLLanguage,
  formatLocalizedDate,
  formatLocalizedNumber,
  formatRelativeTime,
  formatScheduleTime,
  formatLocation,
  RTL_LANGUAGES,
} from '@/lib/utils/locale';

describe('getLocaleString', () => {
  it('returns en-AU for English', () => {
    expect(getLocaleString('en')).toBe('en-AU');
  });

  it('returns fa-IR for Persian', () => {
    expect(getLocaleString('fa')).toBe('fa-IR');
  });

  it('returns zh-CN for Chinese', () => {
    expect(getLocaleString('zh')).toBe('zh-CN');
  });

  it('returns ja-JP for Japanese', () => {
    expect(getLocaleString('ja')).toBe('ja-JP');
  });

  it('returns ko-KR for Korean', () => {
    expect(getLocaleString('ko')).toBe('ko-KR');
  });

  it('returns ar-SA for Arabic', () => {
    expect(getLocaleString('ar')).toBe('ar-SA');
  });

  it('returns de-DE for German', () => {
    expect(getLocaleString('de')).toBe('de-DE');
  });
});

describe('isRTLLanguage', () => {
  it('returns true for RTL languages', () => {
    for (const lang of RTL_LANGUAGES) {
      expect(isRTLLanguage(lang)).toBe(true);
    }
  });

  it('returns false for LTR languages', () => {
    expect(isRTLLanguage('en')).toBe(false);
    expect(isRTLLanguage('es')).toBe(false);
    expect(isRTLLanguage('zh')).toBe(false);
    expect(isRTLLanguage('ja')).toBe(false);
    expect(isRTLLanguage('fr')).toBe(false);
  });
});

describe('formatLocalizedDate', () => {
  const date = new Date('2026-03-15T10:00:00Z');

  it('formats date in English', () => {
    const result = formatLocalizedDate(date, 'en', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    expect(result).toContain('March');
    expect(result).toContain('2026');
  });

  it('formats date in German', () => {
    const result = formatLocalizedDate(date, 'de', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    expect(result).toContain('März');
    expect(result).toContain('2026');
  });

  it('formats date in Japanese', () => {
    const result = formatLocalizedDate(date, 'ja', { year: 'numeric', month: 'long' });
    expect(result).toContain('2026');
  });
});

describe('formatLocalizedNumber', () => {
  it('formats number in English', () => {
    const result = formatLocalizedNumber(1234.5, 'en');
    expect(result).toContain('1');
    expect(result).toContain('234');
  });

  it('formats number with currency', () => {
    const result = formatLocalizedNumber(42.99, 'en', { style: 'currency', currency: 'AUD' });
    expect(result).toContain('42.99');
  });
});

describe('formatRelativeTime', () => {
  it('formats seconds ago', () => {
    const past = new Date(Date.now() - 30 * 1000);
    const result = formatRelativeTime(past, 'en');
    expect(result).toBeTruthy();
  });

  it('formats minutes ago', () => {
    const past = new Date(Date.now() - 5 * 60 * 1000);
    const result = formatRelativeTime(past, 'en');
    expect(result).toBeTruthy();
  });

  it('formats hours ago', () => {
    const past = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const result = formatRelativeTime(past, 'en');
    expect(result).toBeTruthy();
  });

  it('formats days ago', () => {
    const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(past, 'en');
    expect(result).toBeTruthy();
  });

  it('formats weeks ago', () => {
    const past = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(past, 'en');
    expect(result).toBeTruthy();
  });

  it('formats months ago', () => {
    const past = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(past, 'en');
    expect(result).toBeTruthy();
  });

  it('formats years ago', () => {
    const past = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(past, 'en');
    expect(result).toBeTruthy();
  });

  it('formats future dates', () => {
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(future, 'en');
    expect(result).toBeTruthy();
  });
});

describe('formatScheduleTime', () => {
  it('formats morning time', () => {
    const result = formatScheduleTime('09:00', 'en');
    expect(result).toBeTruthy();
    // Should contain 9 in some format
    expect(result).toMatch(/9/);
  });

  it('formats afternoon time', () => {
    const result = formatScheduleTime('14:30', 'en');
    expect(result).toBeTruthy();
  });

  it('returns original string for invalid input', () => {
    expect(formatScheduleTime('invalid', 'en')).toBe('invalid');
  });
});

describe('formatLocation', () => {
  it('returns just building when no room', () => {
    expect(formatLocation('C5C')).toBe('C5C');
    expect(formatLocation('C5C', '')).toBe('C5C');
    expect(formatLocation('C5C', undefined)).toBe('C5C');
  });

  it('returns building with room', () => {
    expect(formatLocation('C5C', '204')).toBe('C5C Room 204');
  });

  it('does not duplicate Room prefix', () => {
    expect(formatLocation('C5C', 'Room 204')).toBe('C5C Room 204');
    expect(formatLocation('C5C', 'room 301')).toBe('C5C room 301');
  });

  it('uses custom room label', () => {
    expect(formatLocation('C5C', '204', 'Raum')).toBe('C5C Raum 204');
  });
});
