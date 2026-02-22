import { describe, it, expect } from "vitest";
import {
  formatDistance,
  formatDuration,
} from "@/features/map/lib/navigationHelpers";

describe("formatDistance", () => {
  it("should format meters correctly", () => {
    expect(formatDistance(0)).toBe("0 m");
    expect(formatDistance(50)).toBe("50 m");
    expect(formatDistance(500)).toBe("500 m");
    expect(formatDistance(999)).toBe("999 m");
  });

  it("should format kilometers correctly", () => {
    expect(formatDistance(1000)).toBe("1.0 km");
    expect(formatDistance(1500)).toBe("1.5 km");
    expect(formatDistance(2500)).toBe("2.5 km");
    expect(formatDistance(10000)).toBe("10.0 km");
  });

  it("should round meters to whole numbers", () => {
    expect(formatDistance(50.7)).toBe("51 m");
    expect(formatDistance(50.3)).toBe("50 m");
  });

  it("should show one decimal place for kilometers", () => {
    expect(formatDistance(1234)).toBe("1.2 km");
    expect(formatDistance(1567)).toBe("1.6 km");
  });
});

describe("formatDuration", () => {
  it("should format seconds as minutes", () => {
    expect(formatDuration(60)).toBe("1 min");
    expect(formatDuration(120)).toBe("2 min");
    expect(formatDuration(300)).toBe("5 min");
  });

  it("should round to nearest minute", () => {
    expect(formatDuration(90)).toBe("2 min");
    expect(formatDuration(89)).toBe("1 min");
    expect(formatDuration(30)).toBe("1 min");
  });

  it("should format hours and minutes for longer durations", () => {
    expect(formatDuration(3600)).toBe("1 h 0 min");
    expect(formatDuration(3660)).toBe("1 h 1 min");
    expect(formatDuration(5400)).toBe("1 h 30 min");
    expect(formatDuration(7200)).toBe("2 h 0 min");
  });

  it("should handle edge cases", () => {
    expect(formatDuration(0)).toBe("0 min");
    expect(formatDuration(59)).toBe("1 min");
  });
});
