/**
 * API Response Utility Tests
 *
 * Tests for standardized API response helpers
 */

import { describe, it, expect } from "vitest";
import {
  jsonSuccess,
  jsonError,
  jsonUnauthorized,
  handleValidationError,
  ERROR_CODES,
} from "@/app/api/_lib/response";
import { ZodError, z } from "zod";

describe("API Response Utilities", () => {
  describe("jsonSuccess", () => {
    it("should return 200 status by default", async () => {
      const response = jsonSuccess({ message: "ok" });
      expect(response.status).toBe(200);
    });

    it("should return custom status code", async () => {
      const response = jsonSuccess({ id: "123" }, 201);
      expect(response.status).toBe(201);
    });

    it("should include data in response body", async () => {
      const data = { name: "Test", value: 42 };
      const response = jsonSuccess(data);
      const body = await response.json();
      expect(body.data).toEqual(data);
    });

    it("should include metadata when provided", async () => {
      const pagination = { page: 1, limit: 10, total: 100, totalPages: 10 };
      const response = jsonSuccess({ items: [] }, 200, { pagination });
      const body = await response.json();
      expect(body.meta.pagination).toEqual(pagination);
    });
  });

  describe("jsonError", () => {
    it("should return correct error status", async () => {
      const response = jsonError("Not found", 404, ERROR_CODES.NOT_FOUND);
      expect(response.status).toBe(404);
    });

    it("should include error message and code", async () => {
      const response = jsonError(
        "Validation failed",
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
      const body = await response.json();
      expect(body.error.message).toBe("Validation failed");
      expect(body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it("should include additional details when provided", async () => {
      const response = jsonError(
        "Rate limited",
        429,
        ERROR_CODES.RATE_LIMITED,
        {
          retryAfter: 60,
        },
      );
      const body = await response.json();
      expect(body.error.details.retryAfter).toBe(60);
    });
  });

  describe("jsonUnauthorized", () => {
    it("should return 401 status", async () => {
      const response = jsonUnauthorized();
      expect(response.status).toBe(401);
    });

    it("should include custom message", async () => {
      const response = jsonUnauthorized("Token expired");
      const body = await response.json();
      expect(body.error.message).toBe("Token expired");
    });
  });

  describe("handleValidationError", () => {
    it("should handle Zod validation errors", async () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().positive(),
      });

      try {
        schema.parse({ name: "", age: -1 });
      } catch (error) {
        if (error instanceof ZodError) {
          const response = handleValidationError(error);
          expect(response.status).toBe(400);
          const body = await response.json();
          expect(body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
        }
      }
    });
  });
});
