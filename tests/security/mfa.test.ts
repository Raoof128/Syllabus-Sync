/**
 * Tests for MFA (Multi-Factor Authentication) utilities
 *
 * Tests validators, helpers, mappers, and rate limiter configs
 * from lib/security/mfa.ts
 */

import { describe, it, expect } from "vitest";
import {
  MFA_MAX_VERIFY_ATTEMPTS,
  MFA_VERIFY_WINDOW_MS,
  SMS_MAX_SENDS_PER_HOUR,
  isValidTOTPCode,
  isValidE164Phone,
  maskPhoneNumber,
  mapSupabaseFactor,
} from "@/lib/security/mfa";

describe("MFA Utilities", () => {
  // ============================================================================
  // CONSTANTS
  // ============================================================================

  describe("Constants", () => {
    it("should define reasonable rate limit constants", () => {
      expect(MFA_MAX_VERIFY_ATTEMPTS).toBeGreaterThanOrEqual(3);
      expect(MFA_MAX_VERIFY_ATTEMPTS).toBeLessThanOrEqual(10);
      expect(MFA_VERIFY_WINDOW_MS).toBeGreaterThanOrEqual(60_000); // 1 min min
      expect(SMS_MAX_SENDS_PER_HOUR).toBeGreaterThanOrEqual(3);
      expect(SMS_MAX_SENDS_PER_HOUR).toBeLessThanOrEqual(10);
    });
  });

  // ============================================================================
  // TOTP CODE VALIDATION
  // ============================================================================

  describe("isValidTOTPCode", () => {
    it("should accept valid 6-digit codes", () => {
      expect(isValidTOTPCode("123456")).toBe(true);
      expect(isValidTOTPCode("000000")).toBe(true);
      expect(isValidTOTPCode("999999")).toBe(true);
    });

    it("should reject short codes", () => {
      expect(isValidTOTPCode("12345")).toBe(false);
      expect(isValidTOTPCode("1")).toBe(false);
      expect(isValidTOTPCode("")).toBe(false);
    });

    it("should reject long codes", () => {
      expect(isValidTOTPCode("1234567")).toBe(false);
      expect(isValidTOTPCode("12345678")).toBe(false);
    });

    it("should reject non-numeric codes", () => {
      expect(isValidTOTPCode("abcdef")).toBe(false);
      expect(isValidTOTPCode("12345a")).toBe(false);
      expect(isValidTOTPCode("12 345")).toBe(false);
    });

    it("should reject codes with special characters", () => {
      expect(isValidTOTPCode("123-45")).toBe(false);
      expect(isValidTOTPCode("12.345")).toBe(false);
    });
  });

  // ============================================================================
  // E.164 PHONE VALIDATION
  // ============================================================================

  describe("isValidE164Phone", () => {
    it("should accept valid E.164 phone numbers", () => {
      expect(isValidE164Phone("+14155552671")).toBe(true);
      expect(isValidE164Phone("+61412345678")).toBe(true);
      expect(isValidE164Phone("+442071234567")).toBe(true);
    });

    it("should reject numbers without + prefix", () => {
      expect(isValidE164Phone("14155552671")).toBe(false);
      expect(isValidE164Phone("0412345678")).toBe(false);
    });

    it("should reject too-short numbers", () => {
      expect(isValidE164Phone("+1")).toBe(false);
      expect(isValidE164Phone("+12")).toBe(false);
    });

    it("should reject too-long numbers", () => {
      expect(isValidE164Phone("+12345678901234567")).toBe(false);
    });

    it("should reject numbers with non-digit characters", () => {
      expect(isValidE164Phone("+1-415-555-2671")).toBe(false);
      expect(isValidE164Phone("+1 415 555 2671")).toBe(false);
    });

    it("should reject empty strings", () => {
      expect(isValidE164Phone("")).toBe(false);
    });
  });

  // ============================================================================
  // PHONE MASKING
  // ============================================================================

  describe("maskPhoneNumber", () => {
    it("should mask middle digits, keeping country code and last 4", () => {
      const masked = maskPhoneNumber("+14155552671");
      // Shows country code, masks middle, shows last 4
      expect(masked).toContain("2671");
      expect(masked).toContain("****");
      expect(masked).not.toBe("+14155552671");
    });

    it("should mask short phone numbers gracefully", () => {
      const masked = maskPhoneNumber("+123");
      expect(masked).toBe("***"); // too short
    });

    it("should not expose the full number", () => {
      const original = "+14155552671";
      const masked = maskPhoneNumber(original);
      expect(masked).not.toBe(original);
    });
  });

  // ============================================================================
  // SUPABASE FACTOR MAPPING
  // ============================================================================

  describe("mapSupabaseFactor", () => {
    it("should map a verified TOTP factor correctly", () => {
      const supabaseFactor = {
        id: "factor-123",
        factor_type: "totp",
        friendly_name: "My Authenticator",
        status: "verified",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      const mapped = mapSupabaseFactor(supabaseFactor);

      expect(mapped.id).toBe("factor-123");
      expect(mapped.type).toBe("totp");
      expect(mapped.friendlyName).toBe("My Authenticator");
      expect(mapped.status).toBe("verified");
      expect(mapped.createdAt).toBe("2025-01-01T00:00:00Z");
    });

    it("should map a phone factor with phone number", () => {
      const supabaseFactor = {
        id: "factor-456",
        factor_type: "phone",
        friendly_name: undefined,
        status: "verified",
        phone: "+14155552671",
        created_at: "2025-02-01T00:00:00Z",
        updated_at: "2025-02-01T00:00:00Z",
      };

      const mapped = mapSupabaseFactor(supabaseFactor);

      expect(mapped.id).toBe("factor-456");
      expect(mapped.type).toBe("phone");
      expect(mapped.phone).toBe("+14155552671");
    });

    it("should handle unverified factors", () => {
      const supabaseFactor = {
        id: "factor-789",
        factor_type: "totp",
        friendly_name: undefined,
        status: "unverified",
        created_at: "2025-03-01T00:00:00Z",
        updated_at: "2025-03-01T00:00:00Z",
      };

      const mapped = mapSupabaseFactor(supabaseFactor);
      expect(mapped.status).toBe("unverified");
    });

    it("should handle missing optional fields", () => {
      const supabaseFactor = {
        id: "factor-abc",
        factor_type: "totp",
        status: "verified",
        created_at: "2025-04-01T00:00:00Z",
        updated_at: "2025-04-01T00:00:00Z",
      };

      const mapped = mapSupabaseFactor(supabaseFactor);
      expect(mapped.id).toBe("factor-abc");
      expect(mapped.friendlyName).toBeUndefined();
      expect(mapped.phone).toBeUndefined();
    });
  });
});
