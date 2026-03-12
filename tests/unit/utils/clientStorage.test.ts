/**
 * Client Storage Utility Tests
 * Tests clearing storage, resetting stores, and data detection
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  clearAllClientStorage,
  clearStoreData,
  clearAllApplicationData,
  getAllStorageKeys,
  hasUserData,
} from '@/lib/utils/clientStorage';

describe('clearAllClientStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should remove Zustand storage keys', () => {
    localStorage.setItem('units-storage', '{}');
    localStorage.setItem('deadlines-storage', '{}');
    localStorage.setItem('todos-storage', '{}');

    clearAllClientStorage();

    expect(localStorage.getItem('units-storage')).toBeNull();
    expect(localStorage.getItem('deadlines-storage')).toBeNull();
    expect(localStorage.getItem('todos-storage')).toBeNull();
  });

  it('should preserve theme/language when preservePreferences is true', () => {
    localStorage.setItem('syllabus-sync-theme', 'dark');
    localStorage.setItem('syllabus-sync-language', 'fa');
    localStorage.setItem('units-storage', '{}');

    clearAllClientStorage(true);

    expect(localStorage.getItem('syllabus-sync-theme')).toBe('dark');
    expect(localStorage.getItem('syllabus-sync-language')).toBe('fa');
    expect(localStorage.getItem('units-storage')).toBeNull();
  });

  it('should remove everything when preservePreferences is false', () => {
    localStorage.setItem('syllabus-sync-theme', 'dark');
    localStorage.setItem('units-storage', '{}');

    clearAllClientStorage(false);

    expect(localStorage.getItem('syllabus-sync-theme')).toBeNull();
    expect(localStorage.getItem('units-storage')).toBeNull();
  });
});

describe('clearStoreData', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should clear only Zustand store keys', () => {
    localStorage.setItem('units-storage', '{}');
    localStorage.setItem('custom-key', 'keep');

    clearStoreData();

    expect(localStorage.getItem('units-storage')).toBeNull();
    expect(localStorage.getItem('custom-key')).toBe('keep');
  });
});

describe('clearAllApplicationData', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should clear everything including preferences', () => {
    localStorage.setItem('syllabus-sync-theme', 'dark');
    localStorage.setItem('units-storage', '{}');

    clearAllApplicationData();

    expect(localStorage.getItem('syllabus-sync-theme')).toBeNull();
    expect(localStorage.getItem('units-storage')).toBeNull();
  });
});

describe('getAllStorageKeys', () => {
  it('should return a non-empty array', () => {
    const keys = getAllStorageKeys();
    expect(Array.isArray(keys)).toBe(true);
    expect(keys.length).toBeGreaterThan(0);
  });

  it('should include known keys', () => {
    const keys = getAllStorageKeys();
    expect(keys).toContain('units-storage');
    expect(keys).toContain('deadlines-storage');
    expect(keys).toContain('todos-storage');
  });
});

describe('hasUserData', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return false when storage is empty', () => {
    expect(hasUserData()).toBe(false);
  });

  it('should return true when Zustand data exists', () => {
    localStorage.setItem('units-storage', '{"state":{"units":[]},"version":0}');
    expect(hasUserData()).toBe(true);
  });
});
