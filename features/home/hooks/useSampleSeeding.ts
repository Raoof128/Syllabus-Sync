import { useState, useEffect, useRef } from "react";
import { useUnitsStore } from "@/lib/store/unitsStore";
import { useDeadlinesStore } from "@/lib/store/deadlinesStore";
import { sampleUnits, sampleDeadlines } from "@/data/sampleUnits";
import { useHydration } from "@/lib/hooks";

export function useSampleSeeding() {
  const hasHydrated = useHydration();
  const addUnit = useUnitsStore((state) => state.addUnit);
  const addDeadline = useDeadlinesStore((state) => state.addDeadline);

  const [seedDisabled] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("seed-disabled") === "true";
    } catch {
      return false;
    }
  });

  const hasSeededRef = useRef(false);

  useEffect(() => {
    if (!hasHydrated || hasSeededRef.current || seedDisabled) {
      return;
    }

    const unitsSeededKey = "units-seeded";
    const deadlinesSeededKey = "deadlines-seeded";

    try {
      const unitsSeeded = localStorage.getItem(unitsSeededKey) === "true";
      const deadlinesSeeded =
        localStorage.getItem(deadlinesSeededKey) === "true";

      // Validate sample data before adding
      const validUnits = sampleUnits.filter((unit) => {
        return (
          unit &&
          unit.code &&
          unit.name &&
          unit.color &&
          Array.isArray(unit.schedule) &&
          unit.schedule.length > 0
        );
      });

      const validDeadlines = sampleDeadlines.filter((deadline) => {
        return (
          deadline &&
          deadline.title &&
          deadline.unitCode &&
          deadline.priority &&
          deadline.dueDate &&
          !isNaN(new Date(deadline.dueDate).getTime())
        );
      });

      if (!unitsSeeded && validUnits.length > 0) {
        validUnits.forEach(addUnit);
        localStorage.setItem(unitsSeededKey, "true");
      }

      if (!deadlinesSeeded && validDeadlines.length > 0) {
        validDeadlines.forEach(addDeadline);
        localStorage.setItem(deadlinesSeededKey, "true");
      }
    } catch {
      try {
        // Fallback: add data without localStorage
        const validUnits = sampleUnits.filter(
          (unit) =>
            unit &&
            unit.code &&
            unit.name &&
            unit.color &&
            Array.isArray(unit.schedule),
        );
        const validDeadlines = sampleDeadlines.filter(
          (deadline) =>
            deadline && deadline.title && deadline.unitCode && deadline.dueDate,
        );

        validUnits.forEach(addUnit);
        validDeadlines.forEach(addDeadline);
      } catch {
        // Silent fail - sample data loading is not critical
      }
    }
    hasSeededRef.current = true;
  }, [addDeadline, addUnit, hasHydrated, seedDisabled]);
}
