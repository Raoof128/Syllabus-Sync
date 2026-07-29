import type { MetadataRoute } from 'next';
import { APP_CONFIG } from '@/lib/config';
import { getConfiguredAppOrigin } from '@/lib/platform/runtime';

export default function sitemap(): MetadataRoute.Sitemap {
  // BA-0040: this used to be UNIVERSITY_CONFIG.website, which made every entry
  // below point at https://www.mq.edu.au/... — claiming pages on the
  // university's domain and never listing this app's own URLs.
  // Read at call time; see the note in app/robots.ts.
  const baseUrl = getConfiguredAppOrigin() ?? APP_CONFIG.url;
  const now = new Date();

  return [
    {
      url: `${baseUrl}/home`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/calendar`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/map`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/feed`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/settings`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/manage-profiles`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];
}
