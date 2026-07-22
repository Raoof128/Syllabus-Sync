import { middleware as middlewareHandler } from '@/lib/middleware';

export const middleware = middlewareHandler;

export const config = {
  matcher: [
    '/((?!_next/static(?:/|$)|icons(?:/|$)|images(?:/|$)|tiles(?:/|$)|favicon\\.ico$|apple-touch-icon\\.png$|manifest\\.webmanifest$|security\\.txt$|sw\\.js$|syllabus-sync-logo\\.png$).*)',
  ],
};
