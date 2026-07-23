import { describe, expect, it, vi } from 'vitest';
import { resolveHostAddresses, type DnsResolver } from '@/lib/security/dns-resolution';

describe('resolveHostAddresses', () => {
  it('combines public IPv4 and IPv6 answers', async () => {
    const resolver: DnsResolver = {
      resolve4: vi.fn().mockResolvedValue(['203.0.113.10']),
      resolve6: vi.fn().mockResolvedValue(['2001:db8::10']),
    };

    await expect(resolveHostAddresses('example.com', resolver)).resolves.toEqual([
      '203.0.113.10',
      '2001:db8::10',
    ]);
  });

  it('continues when only one address family resolves', async () => {
    const resolver: DnsResolver = {
      resolve4: vi.fn().mockResolvedValue(['203.0.113.10']),
      resolve6: vi.fn().mockRejectedValue(new Error('ENODATA')),
    };

    await expect(resolveHostAddresses('example.com', resolver)).resolves.toEqual(['203.0.113.10']);
  });

  it('throws the stable route error when neither address family resolves', async () => {
    const resolver: DnsResolver = {
      resolve4: vi.fn().mockRejectedValue(new Error('ENODATA')),
      resolve6: vi.fn().mockRejectedValue(new Error('ENODATA')),
    };

    await expect(resolveHostAddresses('missing.example', resolver)).rejects.toThrow(
      'Unable to resolve target host',
    );
  });

  it('deduplicates answers while preserving resolver order', async () => {
    const resolver: DnsResolver = {
      resolve4: vi.fn().mockResolvedValue(['203.0.113.10', '203.0.113.10']),
      resolve6: vi.fn().mockResolvedValue(['2001:db8::10', '2001:db8::10']),
    };

    await expect(resolveHostAddresses('example.com', resolver)).resolves.toEqual([
      '203.0.113.10',
      '2001:db8::10',
    ]);
  });

  it('preserves literal addresses without issuing record queries', async () => {
    const resolver: DnsResolver = {
      resolve4: vi.fn(),
      resolve6: vi.fn(),
    };

    await expect(resolveHostAddresses('2001:db8::10', resolver)).resolves.toEqual(['2001:db8::10']);
    expect(resolver.resolve4).not.toHaveBeenCalled();
    expect(resolver.resolve6).not.toHaveBeenCalled();
  });

  it('fails closed when a resolver returns a malformed address', async () => {
    const resolver: DnsResolver = {
      resolve4: vi.fn().mockResolvedValue(['not-an-address']),
      resolve6: vi.fn().mockResolvedValue([]),
    };

    await expect(resolveHostAddresses('example.com', resolver)).rejects.toThrow(
      'Unable to resolve target host',
    );
  });
});
