import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useInactivityLogout } from '@/lib/hooks/useInactivityLogout';

describe('useInactivityLogout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('triggers timeout when enabled and no activity occurs', () => {
    const onTimeout = vi.fn();

    renderHook(() =>
      useInactivityLogout({
        enabled: true,
        timeoutMs: 1000,
        onTimeout,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('resets timer when user activity occurs', () => {
    const onTimeout = vi.fn();

    renderHook(() =>
      useInactivityLogout({
        enabled: true,
        timeoutMs: 1000,
        onTimeout,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(onTimeout).not.toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new Event('mousemove'));
      vi.advanceTimersByTime(800);
    });
    expect(onTimeout).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('does not trigger timeout when disabled', () => {
    const onTimeout = vi.fn();

    renderHook(() =>
      useInactivityLogout({
        enabled: false,
        timeoutMs: 1000,
        onTimeout,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onTimeout).not.toHaveBeenCalled();
  });
});
