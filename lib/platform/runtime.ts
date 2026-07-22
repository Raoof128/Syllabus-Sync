export type EnvironmentMap = Readonly<Record<string, string | undefined>>;

export type DeploymentPlatform = 'cloudflare' | 'vercel' | 'local' | 'unknown';

export type DeploymentEnvironment = 'production' | 'preview' | 'development' | 'test';

function normalise(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}

function parseHttpOrigin(value: string | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) return null;
    if (url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function isValidVercelHostname(value: string): boolean {
  if (value.length === 0 || value.length > 253 || value.includes('..')) return false;

  return value.split('.').every((label) => {
    return (
      label.length > 0 &&
      label.length <= 63 &&
      /^[a-z0-9-]+$/i.test(label) &&
      !label.startsWith('-') &&
      !label.endsWith('-')
    );
  });
}

export function getDeploymentPlatform(env: EnvironmentMap = process.env): DeploymentPlatform {
  const explicit = normalise(env.DEPLOYMENT_PLATFORM);

  if (explicit === 'cloudflare') return 'cloudflare';
  if (explicit === 'vercel') return 'vercel';
  if (normalise(env.VERCEL) === '1' || normalise(env.VERCEL_ENV)) return 'vercel';

  const nodeEnvironment = normalise(env.NODE_ENV);
  if (nodeEnvironment === 'development' || nodeEnvironment === 'test') return 'local';

  return 'unknown';
}

export function getDeploymentEnvironment(env: EnvironmentMap = process.env): DeploymentEnvironment {
  const explicit = normalise(env.DEPLOYMENT_ENV);

  if (explicit === 'production') return 'production';
  if (explicit === 'preview') return 'preview';
  if (explicit === 'test') return 'test';
  if (explicit === 'development') return 'development';

  const vercelEnvironment = normalise(env.VERCEL_ENV);
  if (vercelEnvironment === 'production') return 'production';
  if (vercelEnvironment === 'preview') return 'preview';
  if (vercelEnvironment === 'development') return 'development';

  const nodeEnvironment = normalise(env.NODE_ENV);
  if (nodeEnvironment === 'test') return 'test';
  if (nodeEnvironment === 'development') return 'development';

  return nodeEnvironment === 'production' ? 'production' : 'development';
}

export function isProductionDeployment(env: EnvironmentMap = process.env): boolean {
  return getDeploymentEnvironment(env) === 'production';
}

export function getConfiguredAppOrigin(env: EnvironmentMap = process.env): string | null {
  for (const candidate of [env.NEXT_PUBLIC_APP_URL, env.NEXT_PUBLIC_SITE_URL]) {
    const origin = parseHttpOrigin(candidate);
    if (origin) return origin;
  }

  const vercelHost = (
    env.VERCEL_PROJECT_PRODUCTION_URL ??
    env.VERCEL_BRANCH_URL ??
    env.VERCEL_URL
  )?.trim();

  if (!vercelHost || !isValidVercelHostname(vercelHost)) return null;
  return `https://${vercelHost.toLowerCase()}`;
}
