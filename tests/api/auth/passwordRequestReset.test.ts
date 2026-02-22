import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/password/request-reset/route";

const createServerClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: async () => createServerClientMock(),
}));

const mocks = vi.hoisted(() => ({
  limiterMock: vi.fn(async (_id: string) => ({
    allowed: true,
    remaining: 5,
    resetIn: 3600,
  })),
}));

vi.mock("@/lib/security/passwordReset", () => ({
  passwordResetRequestLimiter: (id: string) => mocks.limiterMock(id),
}));

describe("password reset request API", () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
    mocks.limiterMock.mockClear();
  });

  it("returns generic success regardless of whether user exists (anti-enumeration)", async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });
    createServerClientMock.mockReturnValue({
      auth: { resetPasswordForEmail },
    });

    const req = new NextRequest(
      "http://localhost/api/auth/password/request-reset",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@example.com" }),
      },
    );

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.sent).toBe(true);
    expect(resetPasswordForEmail).toHaveBeenCalledWith("user@example.com", {
      redirectTo: expect.stringContaining("/auth/callback/recovery"),
    });
  });

  it("still returns success even when Supabase returns an error (anti-enumeration)", async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({
      error: { message: "User not found" },
    });
    createServerClientMock.mockReturnValue({
      auth: { resetPasswordForEmail },
    });

    const req = new NextRequest(
      "http://localhost/api/auth/password/request-reset",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "unknown@example.com" }),
      },
    );

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.sent).toBe(true);
  });

  it("triggers password reset via Supabase native email", async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });
    createServerClientMock.mockReturnValue({
      auth: { resetPasswordForEmail },
    });

    const req = new NextRequest(
      "http://localhost/api/auth/password/request-reset",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@example.com" }),
      },
    );

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.sent).toBe(true);
    expect(resetPasswordForEmail).toHaveBeenCalledWith("user@example.com", {
      redirectTo: expect.stringContaining("/auth/callback/recovery"),
    });
  });
});
