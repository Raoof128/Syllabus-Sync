/**
 * Constant-time string comparison.
 *
 * SECURITY (BA-0013): plain `===`/`!==` comparisons short-circuit on the
 * first mismatched character, which leaks how many leading bytes of a
 * guess were correct through response-timing differences. Any comparison
 * against a server-held secret (cron bearer tokens, webhook signatures,
 * API keys, etc.) must use a comparison whose running time does not depend
 * on where the strings first differ.
 *
 * We intentionally do NOT use `node:crypto`'s `timingSafeEqual` here: this
 * codebase runs on Cloudflare Workers via `nodejs_compat`, and that API's
 * availability/behavior there is not guaranteed the way it is on Node.
 * This hand-rolled XOR accumulator mirrors the existing precedent in
 * `lib/security/request-signing.ts` and only depends on primitives that
 * work identically in both runtimes.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  // Comparing against a fixed-length stand-in when lengths differ avoids
  // returning early on a cheap length check, while still not leaking exact
  // secret length behavior beyond what an early `false` already would.
  const length = Math.max(a.length, b.length);
  let result = a.length === b.length ? 0 : 1;

  for (let i = 0; i < length; i++) {
    const charA = i < a.length ? a.charCodeAt(i) : 0;
    const charB = i < b.length ? b.charCodeAt(i) : 0;
    result |= charA ^ charB;
  }

  return result === 0;
}
