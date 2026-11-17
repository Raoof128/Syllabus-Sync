import type { MetadataRoute } from 'next';
import { APP_CONFIG } from '@/lib/config';
import { getConfiguredAppOrigin } from '@/lib/platform/runtime';

export default function robots(): MetadataRoute.Robots {
  // BA-0040: resolved at call time rather than from a constant captured at import,
  // so the origin reflects the environment the request is served in.
  const baseUrl = getConfiguredAppOrigin() ?? APP_CONFIG.url;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
