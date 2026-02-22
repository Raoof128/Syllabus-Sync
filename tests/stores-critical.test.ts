/**
 * Critical Path Tests - Store State Management
 * Tests core Zustand stores that manage application state
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useUnitsStore } from "@/lib/store/unitsStore";
import { useDeadlinesStore } from "@/lib/store/deadlinesStore";
import { useNotificationsStore } from "@/lib/store/notificationsStore";
import { type Unit, type Deadline, type Notification } from "@/lib/types";

describe("Store State Management", () => {
  beforeEach(() => {
    // Reset all stores before each test
    vi.clearAllMocks();
    useUnitsStore.setState({ units: [], isLoading: false, hasLoaded: false });
    useDeadlinesStore.setState({
      deadlines: [],
      isLoading: false,
      hasLoaded: false,
    });
    useNotificationsStore.setState({ notifications: [] });
  });

  afterEach(() => {
    // Cleanup any subscriptions
    vi.restoreAllMocks();
  });

  describe("Units Store", () => {
    it("should initialize with empty state", () => {
      const state = useUnitsStore.getState();

      expect(state.units).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.hasLoaded).toBe(false);
    });

    it("should add unit successfully", async () => {
      const mockUnit: Unit = {
        id: "9cfb795b-5be6-4c8e-92c1-b4e3fde59bf9",
        code: "COMP2310",
        name: "Advanced Software Development",
        color: "#3B82F6",
        location: {
          building: "C5C",
          room: "204",
        },
        schedule: [],
        createdAt: new Date("2024-01-01T00:00:00Z"),
      };

      await useUnitsStore.getState().addUnit(mockUnit);
      const state = useUnitsStore.getState();

      expect(state.units).toHaveLength(1);
      expect(state.units[0]).toEqual(mockUnit);
    });

    it("should update unit successfully", async () => {
      const mockUnit: Unit = {
        id: "9cfb795b-5be6-4c8e-92c1-b4e3fde59bf9",
        code: "COMP2310",
        name: "Advanced Software Development",
        color: "#3B82F6",
        location: {
          building: "C5C",
          room: "204",
        },
        schedule: [],
        createdAt: new Date("2024-01-01T00:00:00Z"),
      };

      // Mock API calls
      vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockUnit }),
      } as any);

      // Add initial unit
      await useUnitsStore.getState().addUnit(mockUnit);

      // Update the unit mock
      const updatedUnit = { ...mockUnit, name: "Updated Software Development" };
      vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: updatedUnit }),
      } as any);

      await useUnitsStore.getState().updateUnit(mockUnit.id, updatedUnit);

      const state = useUnitsStore.getState();
      expect(state.units[0].name).toBe("Updated Software Development");
    });

    it("should remove unit successfully", async () => {
      const mockUnit: Unit = {
        id: "9cfb795b-5be6-4c8e-92c1-b4e3fde59bf9",
        code: "COMP2310",
        name: "Advanced Software Development",
        color: "#3B82F6",
        location: {
          building: "C5C",
          room: "204",
        },
        schedule: [],
        createdAt: new Date("2024-01-01T00:00:00Z"),
      };

      // Mock API calls
      vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockUnit }),
      } as any);

      // Add initial unit
      await useUnitsStore.getState().addUnit(mockUnit);
      expect(useUnitsStore.getState().units).toHaveLength(1);

      // Mock DELETE call
      vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { id: mockUnit.id } }),
      } as any);

      // Remove the unit
      await useUnitsStore.getState().removeUnit(mockUnit.id);

      const state = useUnitsStore.getState();
      expect(state.units).toHaveLength(0);
    });
  });

  describe("Deadlines Store", () => {
    it("should initialize with empty state", () => {
      const state = useDeadlinesStore.getState();

      expect(state.deadlines).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.hasLoaded).toBe(false);
    });

    it("should add deadline successfully", async () => {
      const mockDeadline: Deadline = {
        id: "8307fcc0-882c-4d6c-8ba2-6de5a22b540c",
        title: "Assignment 1",
        unitCode: "COMP2310",
        dueDate: new Date("2024-01-15T23:59:59Z"),
        priority: "High",
        type: "Assignment",
        completed: false,
        createdAt: new Date("2024-01-01T00:00:00Z"),
      };

      await useDeadlinesStore.getState().addDeadline(mockDeadline);
      const state = useDeadlinesStore.getState();

      expect(state.deadlines).toHaveLength(1);
      expect(state.deadlines[0]).toEqual(mockDeadline);
    });

    it("should toggle deadline completion status", async () => {
      const mockDeadline: Deadline = {
        id: "8307fcc0-882c-4d6c-8ba2-6de5a22b540c",
        title: "Assignment 1",
        unitCode: "COMP2310",
        dueDate: new Date("2024-01-15T23:59:59Z"),
        priority: "High",
        type: "Assignment",
        completed: false,
        createdAt: new Date("2024-01-01T00:00:00Z"),
      };

      // Add initial deadline
      await useDeadlinesStore.getState().addDeadline(mockDeadline);
      expect(useDeadlinesStore.getState().deadlines[0].completed).toBe(false);

      // Toggle completion
      await useDeadlinesStore.getState().toggleComplete(mockDeadline.id);

      const state = useDeadlinesStore.getState();
      expect(state.deadlines[0].completed).toBe(true);
    });

    it("should sort deadlines by due date", async () => {
      // Mock API call for adding deadlines
      vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      } as any);

      // Reset store to ensure clean state
      useDeadlinesStore.setState({
        deadlines: [],
        isLoading: false,
        hasLoaded: false,
      });

      // Use dates with significant difference to ensure sorting order
      const deadline1: Deadline = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        title: "Assignment 1",
        unitCode: "COMP2310",
        dueDate: new Date("2024-02-15T23:59:59Z"), // Later
        priority: "High",
        type: "Assignment",
        completed: false,
        createdAt: new Date("2024-01-01T00:00:00Z"),
      };

      const deadline2: Deadline = {
        id: "550e8400-e29b-41d4-a716-446655440002",
        title: "Assignment 2",
        unitCode: "COMP2310",
        dueDate: new Date("2024-01-10T23:59:59Z"), // Earlier
        priority: "Medium",
        type: "Assignment",
        completed: false,
        createdAt: new Date("2024-01-01T00:00:00Z"),
      };

      // Add earlier one first, then later one
      await useDeadlinesStore.getState().addDeadline(deadline2);
      await useDeadlinesStore.getState().addDeadline(deadline1);

      const state = useDeadlinesStore.getState();

      // Deadlines should be sorted by dueDate ascending (earlier first)
      expect(state.deadlines[0].id).toBe(
        "550e8400-e29b-41d4-a716-446655440002",
      );
      expect(state.deadlines[1].id).toBe(
        "550e8400-e29b-41d4-a716-446655440001",
      );
    });
  });

  describe("Notifications Store", () => {
    it("should initialize with empty state", () => {
      const state = useNotificationsStore.getState();

      expect(state.notifications).toEqual([]);
    });

    it("should add notification successfully", async () => {
      const mockNotification: Omit<Notification, "id" | "createdAt"> = {
        title: "Test Notification",
        message: "This is a test notification",
        type: "system",
        read: false,
      };

      await useNotificationsStore.getState().addNotification(mockNotification);
      const state = useNotificationsStore.getState();

      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].title).toBe("Test Notification");
      expect(state.notifications[0].read).toBe(false);
    });

    it("should mark notification as read", async () => {
      const mockNotification: Omit<Notification, "id" | "createdAt"> = {
        title: "Test Notification",
        message: "This is a test notification",
        type: "system",
        read: false,
      };

      // Add notification
      await useNotificationsStore.getState().addNotification(mockNotification);
      const notificationId =
        useNotificationsStore.getState().notifications[0].id;

      // Mark as read
      await useNotificationsStore.getState().markAsRead(notificationId);

      const state = useNotificationsStore.getState();
      expect(state.notifications[0].read).toBe(true);
    });

    it("should clear all notifications", async () => {
      const mockNotification1: Omit<Notification, "id" | "createdAt"> = {
        title: "Test Notification 1",
        message: "This is a test notification",
        type: "system",
        read: false,
      };

      const mockNotification2: Omit<Notification, "id" | "createdAt"> = {
        title: "Test Notification 2",
        message: "This is another test notification",
        type: "system",
        read: false,
      };

      // Add notifications
      await useNotificationsStore.getState().addNotification(mockNotification1);
      await useNotificationsStore.getState().addNotification(mockNotification2);

      expect(useNotificationsStore.getState().notifications).toHaveLength(2);

      // Clear all notifications
      useNotificationsStore.getState().clearNotifications();

      const state = useNotificationsStore.getState();
      expect(state.notifications).toHaveLength(0);
    });
  });
});
