import { proxy as proxyHandler } from "./tools/proxy/proxy";

export const proxy = proxyHandler;

export const config = {
  matcher: [
    "/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest|woff2?|ttf|eot|ico|json|txt)$).*)",
  ],
};
