// tests/NextDeadline.test.tsx
import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { Deadline } from "@/lib/types";

// Use vi.hoisted to create stable mock state that survives vi.mock hoisting
const { mockState } = vi.hoisted(() => ({
  mockState: {
    deadlines: [] as Deadline[],
  },
}));

// Mock the zustand store
vi.mock("@/lib/store/deadlinesStore", () => ({
  useDeadlinesStore: (selector: (state: typeof mockState) => unknown) =>
    selector(mockState),
}));

import NextDeadline from "@/features/home/components/NextDeadline";

describe("NextDeadline", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the component header", () => {
    render(<NextDeadline />);
    expect(screen.getByText("Next Deadline")).toBeInTheDocument();
  });

  it("shows loading or empty state", async () => {
    render(<NextDeadline />);
    // The component may show loading briefly or move directly to empty state
    await waitFor(() => {
      const hasLoading = screen.queryByText("Loading...");
      const hasEmpty = screen.queryByText("No upcoming deadlines");
      expect(hasLoading || hasEmpty).toBeTruthy();
    });
  });

  it("shows empty state when no upcoming deadlines", async () => {
    render(<NextDeadline />);
    await waitFor(() => {
      expect(screen.getByText("No upcoming deadlines")).toBeInTheDocument();
    });
  });

  it("falls back gracefully on invalid dates", async () => {
    mockState.deadlines = [
      {
        id: "deadline-invalid",
        title: "Broken Date",
        unitCode: "COMP0000",
        dueDate: new Date("invalid-date"),
        priority: "High",
        type: "Assignment",
        completed: false,
        createdAt: new Date(),
      },
    ];

    render(<NextDeadline />);

    await waitFor(() => {
      expect(screen.getByText(/Invalid date/i)).toBeInTheDocument();
    });

    const invalidDateText = screen.getByText(/Invalid date/i);
    const cardLink = invalidDateText.closest("a");
    expect(cardLink?.getAttribute("href")).toBe("/calendar");
  });
});
