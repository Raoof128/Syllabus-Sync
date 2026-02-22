import { describe, it, expect } from "vitest";
import { calculatePasswordStrength } from "@/lib/utils/security";

describe("Security Utils - Password Strength", () => {
  it("should flag empty passwords as score 0", () => {
    const result = calculatePasswordStrength("");
    expect(result.score).toBe(0);
    expect(result.label).toBe("Empty");
  });

  it("should flag weak passwords (common patterns)", () => {
    // zxcvbn knows 'password123' is trash
    const result = calculatePasswordStrength("password123");
    expect(result.score).toBeLessThan(2);
    expect(result.label).toBe("Risky");
  });

  it("should reward complexity", () => {
    // Length + Caps + Special Char + Numbers (avoid dictionary words)
    const result = calculatePasswordStrength("Xk9#mP2$vL5@qR8!");
    expect(result.score).toBeGreaterThanOrEqual(3);
  });

  it("should identify strong passwords correctly", () => {
    const result = calculatePasswordStrength("Raouf_Secure_2026!");
    expect(result.strength).toBe("strong");
    expect(result.score).toBeGreaterThanOrEqual(4);
  });

  it("should provide color codes based on strength", () => {
    const weak = calculatePasswordStrength("password");
    expect(weak.color).toBe("bg-red-500");

    const strong = calculatePasswordStrength("MyStr0ng!Passw0rd");
    expect(strong.color).toBe("bg-green-500");
  });
});
