import type { MetadataRoute } from 'next';
import { APP_CONFIG } from '@/lib/config';
import { getConfiguredAppOrigin } from '@/lib/platform/runtime';

export default function robots(): MetadataRoute.Robots {
  // BA-0040: this used to be UNIVERSITY_CONFIG.website, so production published
  // `Sitemap: https://www.mq.edu.au/sitemap.xml` — pointing crawlers at the
  // university's domain instead of this app's, and never announcing the real
  // pages at all.
  //
  // Resolved at call time rather than from a module-scope constant: OpenNext
  // populates process.env at its own point in isolate startup, so a value
  // captured at import can stay empty for the isolate's lifetime (see the
  // BA-0017 note in lib/supabase/admin.ts).
  const baseUrl = getConfiguredAppOrigin() ?? APP_CONFIG.url;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
