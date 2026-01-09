// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Work_Sans, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import './mq-tokens.css';
import ClientLayout from './client-layout';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import { THEME_SCRIPT, RTL_SCRIPT } from '@/lib/security/csp';

const workSans = Work_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-work-sans',
  display: 'swap',
});

const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  variable: '--font-source-serif-4',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `${APP_CONFIG.name} - ${UNIVERSITY_CONFIG.name}`,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.fullDescription,
  metadataBase: new URL(UNIVERSITY_CONFIG.website),
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
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'var(--mq-background)' },
    { media: '(prefers-color-scheme: dark)', color: 'var(--mq-background)' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: APP_CONFIG.name,
    url: UNIVERSITY_CONFIG.website,
    logo: new URL('/MQ_Logo_Final.png', UNIVERSITY_CONFIG.website).toString(),
  };

  return (
    <html
      lang="en"
      className={`${workSans.variable} ${sourceSerif4.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Theme and RTL scripts - minified and hash-validated by CSP */}
        {/* SECURITY: These scripts are validated via SHA-256 hashes in the CSP header */}
        {/* If you modify these scripts, update lib/security/csp.ts with new hashes */}
        <script key="theme-script" dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script key="rtl-script" dangerouslySetInnerHTML={{ __html: RTL_SCRIPT }} />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <ClientLayout>{children}</ClientLayout>

        {/* SVG Filters for Liquid Glass Effects */}
        {/* These filters are required by liquid-glass.css for the organic distortion effects */}
        <svg
          width="0"
          height="0"
          style={{ position: 'absolute' }}
          aria-hidden="true"
          className="liquid-glass-filters"
        >
          {/* Main liquid distortion - organic wobble effect */}
          <filter id="mq-liquid-distortion">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" seed="2" />
            <feDisplacementMap in="SourceGraphic" scale="12" />
          </filter>

          {/* Subtle distortion for smaller elements */}
          <filter id="mq-liquid-subtle">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="1" seed="3" />
            <feDisplacementMap in="SourceGraphic" scale="6" />
          </filter>

          {/* Glow effect for buttons and interactive elements */}
          <filter id="mq-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Security shield effect - used for settings/security contexts */}
          <filter id="mq-security-shield">
            <feTurbulence type="turbulence" baseFrequency="0.01" numOctaves="2" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="8" />
          </filter>
        </svg>
      </body>
    </html>
  );
}
