import { middleware as middlewareHandler } from '@/lib/middleware';

export const middleware = middlewareHandler;

export const config = {
  matcher: [
    '/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest|woff2?|ttf|eot|ico|json|txt)$).*)',
  ],
};
