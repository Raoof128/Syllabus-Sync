import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';

export default function Head() {
  const title = `${APP_CONFIG.name} - Home`;
  const description = "Dashboard overview for units, deadlines, and today's schedule.";
  const ogImageUrl = `${UNIVERSITY_CONFIG.website}/MQ_Logo_Final.png`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content={ogImageUrl} />
    </>
  );
}
