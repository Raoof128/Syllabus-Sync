/**
 * Security Audit Tests — TOTP Enroll Cache-Control
 *
 * Tests that the TOTP enrollment response includes Cache-Control: no-store
 * to prevent proxy caching of TOTP secrets.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/mfa/enroll/route";
import { NextRequest } from "next/server";

const createServerClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => createServerClientMock(),
}));

const mockMfaEnrollLimiter = vi.fn();

vi.mock("@/lib/security/mfa", () => ({
  mfaEnrollLimiter: (...args: unknown[]) => mockMfaEnrollLimiter(...args),
}));

vi.mock("@/lib/security/ip", () => ({
  getClientIP: () => "127.0.0.1",
}));

function makeRequest() {
  return new NextRequest("http://localhost/api/auth/mfa/enroll", {
    method: "POST",
  });
}

describe("TOTP Enroll Cache-Control (Security Audit)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMfaEnrollLimiter.mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetIn: 3600,
    });
  });

  it("includes Cache-Control: no-store on successful enrollment", async () => {
    createServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
        mfa: {
          listFactors: vi.fn().mockResolvedValue({
            data: { totp: [], phone: [] },
            error: null,
          }),
          enroll: vi.fn().mockResolvedValue({
            data: {
              id: "factor-1",
              totp: {
                qr_code: "data:image/png;base64,QR_CODE",
                secret: "JBSWY3DPEHPK3PXP",
                uri: "otpauth://totp/App:user@test.com?secret=JBSWY3DPEHPK3PXP",
              },
            },
            error: null,
          }),
        },
      },
    });

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);

    // SECURITY: TOTP secret must not be cached by proxies
    expect(response.headers.get("Cache-Control")).toBe(
      "no-store, no-cache, must-revalidate",
    );
    expect(response.headers.get("Pragma")).toBe("no-cache");

    const json = await response.json();
    expect(json.data.secret).toBe("JBSWY3DPEHPK3PXP");
  });

  it("returns 429 when rate limited", async () => {
    mockMfaEnrollLimiter.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetIn: 600,
    });

    const response = await POST(makeRequest());
    expect(response.status).toBe(429);
  });
});
