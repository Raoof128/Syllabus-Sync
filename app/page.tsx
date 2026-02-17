// app/page.tsx
import AuthRedirectHandler from './AuthRedirectHandler';

export default function RootPage() {
  // The AuthRedirectHandler will check for auth tokens in hash fragment
  // If found, it redirects appropriately. Otherwise, redirect to home.
  return <AuthRedirectHandler fallbackRedirect="/home" />;
}
