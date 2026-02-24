import type { MetadataRoute } from 'next';
import { UNIVERSITY_CONFIG } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = UNIVERSITY_CONFIG.website;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
