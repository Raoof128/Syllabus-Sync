// lib/utils/devLog.ts
/**
 * Development-only logging utility.
 * Logs are only output in development mode to keep production clean.
 */

/* eslint-disable no-console */

type LogLevel = "log" | "warn" | "error" | "info" | "debug";

interface DevLogger {
  log: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  debug: (message: string, data?: unknown) => void;
}

const createLogger = (prefix: string): DevLogger => {
  const isDev = process.env.NODE_ENV === "development";

  const logWithLevel = (level: LogLevel, message: string, data?: unknown) => {
    if (!isDev) return;

    const formattedMessage = `[${prefix}] ${message}`;
    const consoleFn = console[level];

    if (data !== undefined) {
      consoleFn(formattedMessage, data);
    } else {
      consoleFn(formattedMessage);
    }
  };

  return {
    log: (message, data) => logWithLevel("log", message, data),
    warn: (message, data) => logWithLevel("warn", message, data),
    error: (message, data) => logWithLevel("error", message, data),
    info: (message, data) => logWithLevel("info", message, data),
    debug: (message, data) => logWithLevel("debug", message, data),
  };
};

// Pre-configured loggers for common modules
export const devLog = {
  map: createLogger("Map"),
  home: createLogger("Home"),
  auth: createLogger("Auth"),
  api: createLogger("API"),
  store: createLogger("Store"),
  ui: createLogger("UI"),
};

// Factory function for custom loggers
export const createDevLogger = createLogger;

// Simple one-liner for quick logging (backward compatible)
export const devLogSimple = (
  prefix: string,
  message: string,
  data?: unknown,
) => {
  if (process.env.NODE_ENV !== "development") return;

  const formattedMessage = `[${prefix}] ${message}`;
  if (data !== undefined) {
    console.log(formattedMessage, data);
  } else {
    console.log(formattedMessage);
  }
};

/* eslint-enable no-console */
