// proxy.ts - Next.js 16 proxy file (formerly middleware.ts)
// Import the proxy handler from lib
import { proxy as proxyHandler } from "@/lib/proxy";

// Export as 'proxy' (Next.js 16 convention, renamed from 'middleware')
export const proxy = proxyHandler;

// Config must be defined directly in proxy.ts - cannot be re-exported
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/ (all Next.js internals, including HMR websocket endpoints)
     * - favicon.ico (favicon file)
     * - public folder static assets
     */
    "/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest|woff2?|ttf|eot|ico|json|txt)$).*)",
  ],
};
