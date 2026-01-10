import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  /* config options here */
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@radix-ui/react-dialog', '@radix-ui/react-toast'],
  },

  // Empty turbopack config to acknowledge Turbopack usage
  // Turbopack handles chunk splitting automatically in Next.js 16+
  turbopack: {},

  // Webpack fallback for chunk loading issues (used when running with --no-turbopack)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization?.splitChunks,
          cacheGroups: {
            default: false,
            vendors: false,
            // Prevent chunk loading errors by creating stable chunks
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
          },
        },
      };
    }
    return config;
  },

  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
  },

  // Enable compression
  compress: true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // CSP is now handled by middleware.ts with nonces
          // Keeping basic headers here for static assets
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(bundleAnalyzer(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps in CI or production builds
  silent: !process.env.CI,

  // Upload source maps to Sentry for better debugging
  widenClientFileUpload: true,

  // Automatically annotate React components to show their names in Sentry
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route handlers and server components are automatically instrumented
  automaticVercelMonitors: true,

  // Source map configuration
  sourcemaps: {
    // Disable source map upload if no auth token is configured
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
