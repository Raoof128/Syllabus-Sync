import type { MetadataRoute } from 'next';
import { APP_CONFIG } from '@/lib/config';
import { getConfiguredAppOrigin } from '@/lib/platform/runtime';

export default function sitemap(): MetadataRoute.Sitemap {
  // BA-0040: resolved at call time rather than from a constant captured at import,
  // so the origin reflects the environment the request is served in.
  const baseUrl = getConfiguredAppOrigin() ?? APP_CONFIG.url;
  const now = new Date();

  return [
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];
}
