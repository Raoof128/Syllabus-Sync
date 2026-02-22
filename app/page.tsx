// app/page.tsx
import { Suspense } from "react";
import AuthRedirectHandler from "./AuthRedirectHandler";
import { Loader2 } from "lucide-react";

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-mq-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-mq-primary" />
        <p className="mt-4 text-mq-content-secondary">Loading...</p>
      </div>
    </div>
  );
}

export default function RootPage() {
  // The AuthRedirectHandler will check for auth tokens in hash fragment
  // If found, it redirects appropriately. Otherwise, redirect to home.
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthRedirectHandler fallbackRedirect="/home" />
    </Suspense>
  );
}
