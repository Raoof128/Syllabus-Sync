import { RefObject, useEffect, useState } from 'react';
import type { CalendarIntentTarget } from '@/features/calendar/lib/calendarIntent';
import { CALENDAR_WIDGET_IDS } from '@/features/calendar/lib/calendarIntent';
import { useCalendarIntentStore } from '@/lib/store/calendarIntentStore';

type WidgetRefMap = Record<CalendarIntentTarget, RefObject<HTMLDivElement | null>>;
type OpenStateMap = Record<CalendarIntentTarget, boolean>;
type OpenFormMap = Record<CalendarIntentTarget, () => void>;

interface UsePendingCalendarIntentOptions {
  hasHydrated: boolean;
  widgetRefs: WidgetRefMap;
  openStates: OpenStateMap;
  openForms: OpenFormMap;
  prepareForIntent?: () => void;
}

interface ActiveCalendarHighlight {
  requestId: string;
  target: CalendarIntentTarget;
}

type ScrollContainer = Window | HTMLElement;

const SCROLL_VISIBILITY_MARGIN = 24;
const MAX_WIDGET_LOOKUP_ATTEMPTS = 90;
const HIGHLIGHT_DURATION_MS = 2200;
const SCROLL_SETTLE_TIMEOUT_MS = 700;

const isWindowContainer = (container: ScrollContainer): container is Window => {
  return container === window;
};

const isScrollable = (element: HTMLElement) => {
  const { overflowY } = window.getComputedStyle(element);
  return (
    (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
    element.scrollHeight > element.clientHeight
  );
};

const getScrollContainer = (element: HTMLElement): ScrollContainer => {
  let current = element.parentElement;

  while (current) {
    if (isScrollable(current)) {
      return current;
    }
    current = current.parentElement;
  }

  return window;
};

const isElementVisible = (element: HTMLElement, container: ScrollContainer) => {
  const rect = element.getBoundingClientRect();

  if (isWindowContainer(container)) {
    const viewportTop = 0 + SCROLL_VISIBILITY_MARGIN;
    const viewportBottom = window.innerHeight - SCROLL_VISIBILITY_MARGIN;
    return rect.bottom > viewportTop && rect.top < viewportBottom;
  }

  const containerRect = container.getBoundingClientRect();
  const viewportTop = containerRect.top + SCROLL_VISIBILITY_MARGIN;
  const viewportBottom = containerRect.bottom - SCROLL_VISIBILITY_MARGIN;
  return rect.bottom > viewportTop && rect.top < viewportBottom;
};

const scrollElementIntoView = (element: HTMLElement, container: ScrollContainer) => {
  if (isWindowContainer(container)) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    return;
  }

  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const centeredTop =
    container.scrollTop +
    (elementRect.top - containerRect.top) -
    (container.clientHeight / 2 - elementRect.height / 2);

  container.scrollTo({
    top: Math.max(0, centeredTop),
    behavior: 'smooth',
  });
};

const getScrollPosition = (container: ScrollContainer) => {
  return isWindowContainer(container) ? window.scrollY : container.scrollTop;
};

const waitForScrollToSettle = (container: ScrollContainer, onSettled: () => void): (() => void) => {
  let rafId = 0;
  let stableFrames = 0;
  let lastPosition = getScrollPosition(container);
  const startedAt = performance.now();

  const tick = () => {
    const currentPosition = getScrollPosition(container);
    const delta = Math.abs(currentPosition - lastPosition);

    if (delta < 1) {
      stableFrames += 1;
    } else {
      stableFrames = 0;
    }

    lastPosition = currentPosition;

    if (stableFrames >= 2 || performance.now() - startedAt >= SCROLL_SETTLE_TIMEOUT_MS) {
      onSettled();
      return;
    }

    rafId = window.requestAnimationFrame(tick);
  };

  rafId = window.requestAnimationFrame(tick);

  return () => {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
    }
  };
};

export function usePendingCalendarIntent({
  hasHydrated,
  widgetRefs,
  openStates,
  openForms,
  prepareForIntent,
}: UsePendingCalendarIntentOptions) {
  const pendingIntent = useCalendarIntentStore((state) => state.pendingIntent);
  const clearPendingIntent = useCalendarIntentStore((state) => state.clearPendingIntent);
  const [activeHighlight, setActiveHighlight] = useState<ActiveCalendarHighlight | null>(null);

  useEffect(() => {
    if (!hasHydrated || !pendingIntent) {
      return;
    }

    let cancelled = false;
    let lookupAttempts = 0;
    let settleCleanup: (() => void) | null = null;
    let highlightTimer = 0;
    let rafId = 0;

    const completeIntent = () => {
      if (cancelled) {
        return;
      }

      if (pendingIntent.autoOpenForm && !openStates[pendingIntent.target]) {
        prepareForIntent?.();
        openForms[pendingIntent.target]();
      }

      clearPendingIntent(pendingIntent.requestId);
    };

    const runIntent = () => {
      if (cancelled) {
        return;
      }

      const targetElement =
        widgetRefs[pendingIntent.target].current ??
        document.getElementById(CALENDAR_WIDGET_IDS[pendingIntent.target]);

      if (!targetElement) {
        lookupAttempts += 1;

        if (lookupAttempts < MAX_WIDGET_LOOKUP_ATTEMPTS) {
          rafId = window.requestAnimationFrame(runIntent);
        } else {
          clearPendingIntent(pendingIntent.requestId);
        }

        return;
      }

      if (pendingIntent.highlight) {
        setActiveHighlight({
          requestId: pendingIntent.requestId,
          target: pendingIntent.target,
        });

        highlightTimer = window.setTimeout(() => {
          setActiveHighlight((current) =>
            current?.requestId === pendingIntent.requestId ? null : current,
          );
        }, HIGHLIGHT_DURATION_MS);
      }

      const scrollContainer = getScrollContainer(targetElement);
      const isVisible = isElementVisible(targetElement, scrollContainer);

      if (!isVisible) {
        scrollElementIntoView(targetElement, scrollContainer);
        settleCleanup = waitForScrollToSettle(scrollContainer, completeIntent);
        return;
      }

      rafId = window.requestAnimationFrame(() => {
        rafId = window.requestAnimationFrame(completeIntent);
      });
    };

    rafId = window.requestAnimationFrame(() => {
      rafId = window.requestAnimationFrame(runIntent);
    });

    return () => {
      cancelled = true;
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      if (settleCleanup) {
        settleCleanup();
      }
      if (highlightTimer) {
        window.clearTimeout(highlightTimer);
      }
    };
  }, [
    clearPendingIntent,
    hasHydrated,
    openForms,
    openStates,
    pendingIntent,
    prepareForIntent,
    widgetRefs,
  ]);

  return activeHighlight?.target ?? null;
}
