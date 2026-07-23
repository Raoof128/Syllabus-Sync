import { resolve4, resolve6 } from 'node:dns/promises';
import { isIP } from 'node:net';

export interface DnsResolver {
  resolve4(hostname: string): Promise<string[]>;
  resolve6(hostname: string): Promise<string[]>;
}

const defaultResolver: DnsResolver = {
  resolve4,
  resolve6,
};

/**
 * Resolve every address family that the Worker-compatible DNS API exposes.
 * A literal address is returned directly because resolve4/resolve6 only query
 * DNS records, whereas the previous lookup implementation accepted literals.
 */
export async function resolveHostAddresses(
  hostname: string,
  resolver: DnsResolver = defaultResolver,
): Promise<string[]> {
  if (isIP(hostname)) {
    return [hostname];
  }

  const results = await Promise.allSettled([
    resolver.resolve4(hostname),
    resolver.resolve6(hostname),
  ]);

  const addresses = results.flatMap((result) =>
    result.status === 'fulfilled' ? result.value : [],
  );
  const uniqueAddresses = [...new Set(addresses)];

  if (
    uniqueAddresses.length === 0 ||
    uniqueAddresses.some((address) => isIP(address) === 0)
  ) {
    throw new Error('Unable to resolve target host');
  }

  return uniqueAddresses;
}
