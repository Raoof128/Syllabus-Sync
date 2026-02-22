/**
 * Tests for WebAuthn Credentials API route
 *
 * Tests GET /api/webauthn/credentials (list passkeys)
 * and DELETE /api/webauthn/credentials (remove passkey)
 * including rate limiting (security audit fix)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, DELETE } from "@/app/api/webauthn/credentials/route";
import { NextRequest } from "next/server";

const createServerClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => createServerClientMock(),
}));

const mockGetCredentialsForUser = vi.fn();
const mockDeleteCredential = vi.fn();
const mockWebauthnCredentialsLimiter = vi.fn();

vi.mock("@/lib/security/webauthn", () => ({
  getCredentialsForUser: (...args: unknown[]) =>
    mockGetCredentialsForUser(...args),
  deleteCredential: (...args: unknown[]) => mockDeleteCredential(...args),
  webauthnCredentialsLimiter: (...args: unknown[]) =>
    mockWebauthnCredentialsLimiter(...args),
}));

vi.mock("@/lib/security/ip", () => ({
  getClientIP: () => "127.0.0.1",
}));

// Helper to create a GET request
const makeGetRequest = () =>
  new NextRequest("http://localhost/api/webauthn/credentials", {
    method: "GET",
  });

describe("WebAuthn Credentials API", () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
    mockGetCredentialsForUser.mockReset();
    mockDeleteCredential.mockReset();
    mockWebauthnCredentialsLimiter.mockReset();
    mockWebauthnCredentialsLimiter.mockResolvedValue({
      allowed: true,
      resetIn: 0,
    });
  });

  describe("Rate Limiting (Security Audit Fix)", () => {
    it("returns 429 on GET when rate limited", async () => {
      mockWebauthnCredentialsLimiter.mockResolvedValue({
        allowed: false,
        resetIn: 300,
      });

      const response = await GET(makeGetRequest());
      expect(response.status).toBe(429);
    });

    it("returns 429 on DELETE when rate limited", async () => {
      mockWebauthnCredentialsLimiter.mockResolvedValue({
        allowed: false,
        resetIn: 300,
      });

      const request = new NextRequest(
        "http://localhost/api/webauthn/credentials",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "content-length": "60",
          },
          body: JSON.stringify({
            credentialDbId: "550e8400-e29b-41d4-a716-446655440000",
          }),
        },
      );

      const response = await DELETE(request);
      expect(response.status).toBe(429);
    });
  });

  describe("GET /api/webauthn/credentials", () => {
    it("returns 401 when unauthenticated", async () => {
      createServerClientMock.mockResolvedValue({
        auth: {
          getUser: vi
            .fn()
            .mockResolvedValue({ data: { user: null }, error: null }),
        },
      });

      const response = await GET(makeGetRequest());
      expect(response.status).toBe(401);
    });

    it("returns credentials for authenticated user", async () => {
      createServerClientMock.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-1" } },
            error: null,
          }),
        },
      });

      mockGetCredentialsForUser.mockResolvedValue([
        {
          id: "cred-1",
          credentialId: "abc123",
          deviceName: "iPhone",
          createdAt: "2025-01-01T00:00:00Z",
          lastUsedAt: null,
        },
      ]);

      const response = await GET(makeGetRequest());
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.credentials).toHaveLength(1);
      expect(json.data.credentials[0].deviceName).toBe("iPhone");
    });

    it("returns empty array for user with no credentials", async () => {
      createServerClientMock.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-1" } },
            error: null,
          }),
        },
      });

      mockGetCredentialsForUser.mockResolvedValue([]);

      const response = await GET(makeGetRequest());
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.credentials).toEqual([]);
    });
  });

  describe("DELETE /api/webauthn/credentials", () => {
    it("returns 401 when unauthenticated", async () => {
      createServerClientMock.mockResolvedValue({
        auth: {
          getUser: vi
            .fn()
            .mockResolvedValue({ data: { user: null }, error: null }),
        },
      });

      const request = new NextRequest(
        "http://localhost/api/webauthn/credentials",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "content-length": "20",
          },
          body: JSON.stringify({ credentialId: "cred-1" }),
        },
      );

      const response = await DELETE(request);
      expect(response.status).toBe(401);
    });

    it("returns 400 when credentialDbId is missing", async () => {
      createServerClientMock.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-1" } },
            error: null,
          }),
        },
      });

      const request = new NextRequest(
        "http://localhost/api/webauthn/credentials",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "content-length": "2",
          },
          body: JSON.stringify({}),
        },
      );

      const response = await DELETE(request);
      expect(response.status).toBe(400);
    });

    it("deletes credential successfully", async () => {
      createServerClientMock.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-1" } },
            error: null,
          }),
        },
      });

      mockDeleteCredential.mockResolvedValue(true);

      const credDbId = "550e8400-e29b-41d4-a716-446655440000";
      const request = new NextRequest(
        "http://localhost/api/webauthn/credentials",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "content-length": "60",
          },
          body: JSON.stringify({ credentialDbId: credDbId }),
        },
      );

      const response = await DELETE(request);
      expect(response.status).toBe(200);
      expect(mockDeleteCredential).toHaveBeenCalledWith("user-1", credDbId);
    });
  });
});
