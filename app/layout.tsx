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
    default: APP_CONFIG.name,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.fullDescription,
  metadataBase: new URL(UNIVERSITY_CONFIG.website),
  alternates: {
    canonical: '/',
  },
  manifest: '/manifest.webmanifest',
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
        {/* ================================================================
            ANIMATED MESH BACKGROUND - "Macquarie Fluid Mesh"
            ================================================================
            CSS-only animated background with MQ Navy and Red brand colors.
            Creates slowly drifting gradient blobs that make the liquid glass
            refraction effect visible and dynamic.
            
            WHY HERE (not in ClientLayout):
            - Renders immediately without JS hydration delay
            - Prevents flash of unstyled background
            - Pure CSS = works even with JS disabled
            ================================================================ */}
        <div className="mq-mesh-background" aria-hidden="true" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <ClientLayout>{children}</ClientLayout>

        {/* ================================================================
            SVG FILTERS FOR LIQUID GLASS EFFECTS
            ================================================================
            These filters are required by liquid-glass.css and the 
            LiquidRefractionMap component for organic distortion effects.
            
            Filter IDs:
            - #mq-liquid-refraction: Primary Apple Liquid Glass filter
            - #mq-liquid-distortion: Legacy filter for backward compatibility
            - #mq-liquid-subtle: Lighter effect for smaller elements
            - #mq-glow: Bloom effect for buttons and interactive elements
            - #mq-security-shield: Navy-tinted security context filter
            ================================================================ */}
        <svg
          width="0"
          height="0"
          style={{ position: 'absolute' }}
          aria-hidden="true"
          className="liquid-glass-filters"
        >
          <defs>
            {/* ============================================================
                PRIMARY LIQUID REFRACTION FILTER
                ============================================================
                Apple Liquid Glass style using feTurbulence + feDisplacementMap
                with Gaussian blur softening for organic "liquid" warping.
                ============================================================ */}
            <filter
              id="mq-liquid-refraction"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
              colorInterpolationFilters="sRGB"
            >
              {/* Step 1: Generate organic noise pattern */}
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.012"
                numOctaves="3"
                seed="42"
                stitchTiles="stitch"
                result="noise"
              />
              {/* Step 2: Apply displacement for "liquid" warping */}
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="35"
                xChannelSelector="R"
                yChannelSelector="G"
                result="displaced"
              />
              {/* Step 3: Soften with Gaussian blur for smooth effect */}
              <feGaussianBlur in="displaced" stdDeviation="2" result="softened" />
              {/* Step 4: Add subtle specular highlight */}
              <feFlood floodColor="white" floodOpacity="0.08" result="highlight" />
              <feComposite in="highlight" in2="softened" operator="atop" result="withHighlight" />
              <feBlend in="withHighlight" in2="softened" mode="screen" />
            </filter>

            {/* Legacy distortion filter for backward compatibility */}
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
            <filter id="mq-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* MQ Red glow for hover states */}
            <filter id="mq-liquid-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="0.65 0 0 0 0
                        0.1 0 0 0 0
                        0.18 0 0 0 0
                        0 0 0 0.8 0"
                result="coloredBlur"
              />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Security shield effect - used for settings/security contexts */}
            <filter id="mq-security-shield">
              <feTurbulence type="turbulence" baseFrequency="0.01" numOctaves="2" seed="7" />
              <feDisplacementMap in="SourceGraphic" scale="8" />
            </filter>

            {/* Specular highlight for rim lighting */}
            <filter id="mq-specular-highlight" x="-10%" y="-10%" width="120%" height="120%">
              <feMorphology in="SourceAlpha" operator="dilate" radius="1" result="dilated" />
              <feGaussianBlur in="dilated" stdDeviation="2" result="blurred" />
              <feFlood floodColor="white" floodOpacity="0.15" result="white" />
              <feComposite in="white" in2="blurred" operator="in" result="rim" />
              <feMerge>
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="rim" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </body>
    </html>
  );
}
