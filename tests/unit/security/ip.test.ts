import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getClientIPFromHeaders } from "@/lib/security/ip";

function headersOf(entries: Record<string, string>) {
  return {
    get(name: string) {
      return entries[name.toLowerCase()] ?? null;
    },
  };
}

describe("getClientIPFromHeaders", () => {
  const originalEnv = { ...process.env };

  function setEnv(updates: Record<string, string>) {
    // `process.env.NODE_ENV` is typed as readonly in TS; replace the env object instead.
    process.env = { ...process.env, ...updates } as NodeJS.ProcessEnv;
  }

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("uses x-forwarded-for on vercel production runtime", () => {
    setEnv({ VERCEL: "1", VERCEL_ENV: "production", NODE_ENV: "production" });

    const ip = getClientIPFromHeaders(
      headersOf({
        "x-forwarded-for": "1.2.3.4, 5.6.7.8",
      }),
    );
    expect(ip).toBe("1.2.3.4");
  });

  it("prefers x-real-ip when present in production", () => {
    setEnv({ VERCEL: "1", VERCEL_ENV: "production", NODE_ENV: "production" });

    const ip = getClientIPFromHeaders(
      headersOf({
        "x-real-ip": "9.9.9.9",
        "x-forwarded-for": "1.2.3.4, 5.6.7.8",
      }),
    );
    expect(ip).toBe("9.9.9.9");
  });

  it("does not trust x-forwarded-for in production when not on vercel unless explicitly enabled", () => {
    setEnv({ VERCEL: "", VERCEL_ENV: "", NODE_ENV: "production" });

    const untrusted = getClientIPFromHeaders(
      headersOf({
        "x-forwarded-for": "1.2.3.4, 5.6.7.8",
      }),
    );
    expect(untrusted).toBe("unknown");

    const trusted = getClientIPFromHeaders(
      headersOf({
        "x-forwarded-for": "1.2.3.4, 5.6.7.8",
      }),
      { trustForwardedFor: true },
    );
    expect(trusted).toBe("1.2.3.4");
  });

  it("falls back to 127.0.0.1 in development when no headers are present", () => {
    setEnv({ VERCEL: "", VERCEL_ENV: "", NODE_ENV: "development" });

    const ip = getClientIPFromHeaders(headersOf({}));
    expect(ip).toBe("127.0.0.1");
  });
});
