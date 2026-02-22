import { describe, it, expect } from "vitest";

function maskToken(token?: string | null): string {
  if (!token) return "[none]";
  if (token.length <= 8) return "[REDACTED]";
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

describe("maskToken", () => {
  it("returns [none] for missing token", () => {
    // @ts-ignore
    expect(maskToken(undefined)).toBe("[none]");
    // @ts-ignore
    expect(maskToken(null)).toBe("[none]");
  });

  it("redacts short tokens", () => {
    expect(maskToken("short")).toBe("[REDACTED]");
    expect(maskToken("abcd1234")).toBe("[REDACTED]");
  });

  it("masks long tokens showing only start and end", () => {
    const token = "abcdefghijklmnop"; // 16 chars
    expect(maskToken(token)).toBe("abcd...mnop");
    expect(maskToken("1234567890abcdef")).toBe("1234...cdef");
  });
});
