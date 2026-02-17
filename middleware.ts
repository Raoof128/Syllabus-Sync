// middleware.ts - Next.js Middleware
// Import the middleware handler from lib
import { proxy as middleware } from '@/lib/proxy';

// Export as 'middleware' (standard Next.js convention)
export { middleware };

// Config must be defined directly in middleware.ts
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/ (all Next.js internals, including HMR websocket endpoints)
     * - favicon.ico (favicon file)
     * - public folder static assets (images, fonts, manifest, etc.)
     */
    '/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest|woff2?|ttf|eot|ico|json|txt|xml|css|js|map)$).*)',
  ],
};

