/* eslint-disable no-console */
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const isDev = process.env.NODE_ENV === 'development';

const formatLog = (level: LogLevel, message: string, meta?: any) => {
  const timestamp = new Date().toISOString();
  if (isDev) {
    // Pretty print for you
    const color = level === 'error' ? '\x1b[31m' : '\x1b[34m';
    const metaStr = meta
      ? typeof meta === 'object' && Object.keys(meta).length
        ? JSON.stringify(meta, null, 2)
        : ''
      : '';
    console.log(`${color}[${level.toUpperCase()}] \x1b[0m ${message} ${metaStr}`);
  } else {
    // JSON for machines (DataDog, CloudWatch, Sentry)
    console.log(JSON.stringify({ timestamp, level, message, ...meta }));
  }
};

export const logger = {
  info: (msg: string, ...args: any[]) => formatLog('info', msg, args.length ? { args } : undefined),
  warn: (msg: string, ...args: any[]) => formatLog('warn', msg, args.length ? { args } : undefined),
  error: (msg: string, ...args: any[]) => {
    const errorObj = args.find((a) => a instanceof Error);
    const meta = {
      args,
      ...(errorObj ? { error: errorObj.message, stack: errorObj.stack } : {}),
    };
    formatLog('error', msg, meta);
  },
};
