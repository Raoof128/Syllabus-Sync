/**
 * MFA SMS flow tests
 *
 * Verifies:
 * - SMS enroll creates a factor and a challenge (so an SMS is actually sent).
 * - SMS verify uses the provided challengeId (does not create a new challenge).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as enroll } from "@/app/api/auth/mfa/sms/enroll/route";
import { POST as verify } from "@/app/api/auth/mfa/sms/verify/route";

const createServerClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => createServerClientMock(),
}));

// Rate limiters are exercised elsewhere; keep these tests deterministic.
vi.mock("@/lib/security/mfa", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/security/mfa")>(
      "@/lib/security/mfa",
    );
  return {
    ...actual,
    smsSendLimiter: vi
      .fn()
      .mockResolvedValue({ allowed: true, remaining: 9, resetIn: 60 }),
    mfaVerifyLimiter: vi
      .fn()
      .mockResolvedValue({ allowed: true, remaining: 9, resetIn: 60 }),
  };
});

describe("MFA SMS flow", () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
  });

  it("enroll returns factorId + challengeId", async () => {
    const mfa = {
      enroll: vi.fn().mockResolvedValue({
        data: { id: "550e8400-e29b-41d4-a716-446655440000" },
        error: null,
      }),
      challenge: vi.fn().mockResolvedValue({
        data: {
          id: "660e8400-e29b-41d4-a716-446655440000",
          expires_at: "2026-01-01T00:00:00Z",
        },
        error: null,
      }),
    };

    createServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
        mfa,
      },
    });

    const req = new Request("http://localhost/api/auth/mfa/sms/enroll", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: "+61412345678" }),
    });

    const res = await enroll(req as never);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.factorId).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(json.data.challengeId).toBe("660e8400-e29b-41d4-a716-446655440000");
    expect(mfa.challenge).toHaveBeenCalledWith({
      factorId: "550e8400-e29b-41d4-a716-446655440000",
    });
  });

  it("verify uses provided challengeId and does not call challenge()", async () => {
    const mfa = {
      challenge: vi.fn(),
      verify: vi.fn().mockResolvedValue({ error: null }),
    };

    createServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
        mfa,
      },
    });

    const req = new Request("http://localhost/api/auth/mfa/sms/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        factorId: "550e8400-e29b-41d4-a716-446655440000",
        challengeId: "660e8400-e29b-41d4-a716-446655440000",
        code: "123456",
      }),
    });

    const res = await verify(req as never);
    expect(res.status).toBe(200);

    expect(mfa.challenge).not.toHaveBeenCalled();
    expect(mfa.verify).toHaveBeenCalledWith({
      factorId: "550e8400-e29b-41d4-a716-446655440000",
      challengeId: "660e8400-e29b-41d4-a716-446655440000",
      code: "123456",
    });
  });
});
