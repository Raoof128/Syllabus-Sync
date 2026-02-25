// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import './globals.css';
// mq-tokens.css is already imported via globals.css — do not import again here
import ClientLayout from './client-layout';
import QueryProvider from '@/components/providers/QueryProvider';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import { THEME_SCRIPT, RTL_SCRIPT } from '@/lib/security/csp';

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.name,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.fullDescription,
  applicationName: APP_CONFIG.name,
  metadataBase: new URL(UNIVERSITY_CONFIG.website),
  alternates: {
    canonical: '/',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: APP_CONFIG.name,
    statusBarStyle: 'default',
  },
  openGraph: {
    title: `${APP_CONFIG.name} - ${UNIVERSITY_CONFIG.name}`,
    description: APP_CONFIG.fullDescription,
    type: 'website',
    images: [
      {
        url: '/MQ_Logo_Final.png',
        alt: `${APP_CONFIG.name} logo`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/MQ_Logo_Final.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'var(--mq-background)' },
    { media: '(prefers-color-scheme: dark)', color: 'var(--mq-background)' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // SECURITY: Read the per-request CSP nonce set by middleware.ts
  const nonce = (await headers()).get('x-nonce') ?? '';

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: APP_CONFIG.name,
    url: UNIVERSITY_CONFIG.website,
    logo: new URL('/MQ_Logo_Final.png', UNIVERSITY_CONFIG.website).toString(),
  };

  // SECURITY: THEME_SCRIPT and RTL_SCRIPT are static string constants defined
  // in lib/security/csp.ts — they are NOT user input. The nonce attribute
  // authorises these known scripts under the nonce-based CSP policy.
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme and RTL scripts - validated by nonce-based CSP */}
        {/* SECURITY: The nonce is generated per-request by middleware.ts */}
        {/* Hash-based validation remains as fallback in csp.ts/csp-enhanced.ts */}
        <script
          key="theme-script"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
        />
        <script
          key="rtl-script"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: RTL_SCRIPT }}
        />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        {/* ================================================================
            LIQUID GLASS EFFECTS REMOVED
            Replaced with solid surface design system (Phase 0.2)
            ================================================================ */}

        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <QueryProvider>
          <ClientLayout>{children}</ClientLayout>
        </QueryProvider>
      </body>
    </html>
  );
}
