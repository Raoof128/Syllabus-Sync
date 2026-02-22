import crypto from "node:crypto";

/**
 * Produce a short, stable identifier suitable for logs/keys.
 *
 * SECURITY/PRIVACY:
 * - Prefer hashing PII (like emails) before using it in cache/ratelimit keys.
 * - We intentionally return a short prefix to keep keys readable and bounded.
 */
export function sha256HexPrefix(input: string, hexChars: number = 16): string {
  const normalized = input.trim().toLowerCase();
  const full = crypto.createHash("sha256").update(normalized).digest("hex");
  return full.slice(0, Math.max(8, Math.min(64, hexChars)));
}

export function emailKeyPrefix(email: string): string {
  return sha256HexPrefix(email, 16);
}
