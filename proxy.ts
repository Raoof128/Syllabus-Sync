import { proxy as proxyHandler } from './tools/proxy/proxy';

export const proxy = proxyHandler;

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
