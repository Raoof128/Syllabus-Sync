// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Work_Sans, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import './mq-tokens.css';
import ClientLayout from './client-layout';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';

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
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'var(--mq-background)' },
    { media: '(prefers-color-scheme: dark)', color: 'var(--mq-background)' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: APP_CONFIG.name,
    url: UNIVERSITY_CONFIG.website,
    logo: new URL('/MQ_Logo_Final.png', UNIVERSITY_CONFIG.website).toString(),
  };

  // Inline script to prevent theme flash on page load
  // This runs before React hydration to set the correct theme immediately
  const themeScript = `
    (function() {
      try {
        var stored = localStorage.getItem('theme-storage');
        var theme = 'system';
        if (stored) {
          var parsed = JSON.parse(stored);
          theme = parsed.state?.theme || 'system';
        }
        var resolved = theme;
        if (theme === 'system') {
          resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.classList.add(resolved);
        document.documentElement.style.colorScheme = resolved;
      } catch (e) {
        // Ignore localStorage/parsing errors - will fall back to system default
      }
    })();
  `;

  // Inline script to handle RTL direction based on stored language
  const rtlScript = `
    (function() {
      try {
        var stored = localStorage.getItem('language-storage');
        if (stored) {
          var parsed = JSON.parse(stored);
          var lang = parsed.state?.language || 'en';
          var rtlLanguages = ['fa', 'ar', 'ur', 'he'];
          if (rtlLanguages.includes(lang)) {
            document.documentElement.dir = 'rtl';
            document.documentElement.lang = lang;
          } else {
            document.documentElement.dir = 'ltr';
            document.documentElement.lang = lang;
          }
        }
      } catch (e) {
        // Ignore localStorage/parsing errors - will fall back to LTR English
      }
    })();
  `;

  return (
    <html
      lang="en"
      className={`${workSans.variable} ${sourceSerif4.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Theme and RTL scripts run before body to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: rtlScript }} />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
