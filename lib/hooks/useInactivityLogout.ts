"use client";

import { useEffect, useRef } from "react";

type UseInactivityLogoutOptions = {
  enabled: boolean;
  timeoutMs?: number;
  onTimeout: () => void;
};

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "pointerdown",
];

export function useInactivityLogout({
  enabled,
  timeoutMs = 5 * 60 * 1000,
  onTimeout,
}: UseInactivityLogoutOptions): void {
  const timeoutRef = useRef<number | null>(null);
  const triggeredRef = useRef(false);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    triggeredRef.current = false;

    const clearTimer = () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const armTimer = () => {
      clearTimer();
      timeoutRef.current = window.setTimeout(() => {
        if (triggeredRef.current) return;
        triggeredRef.current = true;
        onTimeoutRef.current();
      }, timeoutMs);
    };

    const handleActivity = () => {
      if (triggeredRef.current) return;
      armTimer();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleActivity();
      }
    };

    armTimer();
    const listenerOptions: AddEventListenerOptions = { passive: true };
    ACTIVITY_EVENTS.forEach((eventName) =>
      window.addEventListener(eventName, handleActivity, listenerOptions),
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimer();
      ACTIVITY_EVENTS.forEach((eventName) =>
        window.removeEventListener(eventName, handleActivity),
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, timeoutMs]);
}
