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
  title: `${APP_CONFIG.name} - ${UNIVERSITY_CONFIG.name}`,
  description: APP_CONFIG.fullDescription,
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${workSans.variable} ${sourceSerif4.variable}`}>
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
