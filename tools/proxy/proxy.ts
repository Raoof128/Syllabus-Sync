// proxy.ts - Next.js 16 proxy file (formerly middleware.ts)
// Import the proxy handler from lib
import { proxy as proxyHandler } from '@/lib/proxy';

// Export as 'proxy' (Next.js 16 convention, renamed from 'middleware')
export const proxy = proxyHandler;

// Config must be defined directly in proxy.ts - cannot be re-exported
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
