"use client";
import { useEffect, useState } from "react";
import { redirect } from "next/navigation";

type DebugData = Record<string, unknown>;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export default function DebugPage() {
  const [data, setData] = useState<DebugData>({});

  // Block access in production
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      redirect("/home");
    }
  }, []);

  // Don't render anything in production
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const fetchData = async () => {
      const results: DebugData = {};

      try {
        const h = await fetch("/api/health");
        results.health = await h.json();
      } catch (error) {
        results.health = getErrorMessage(error);
      }

      try {
        const u = await fetch("/api/units");
        results.units = await u.json();
      } catch (error) {
        results.units = getErrorMessage(error);
      }

      try {
        const d = await fetch("/api/deadlines");
        results.deadlines = await d.json();
      } catch (error) {
        results.deadlines = getErrorMessage(error);
      }

      setData(results);
    };

    void fetchData();
  }, []);

  return (
    <div className="p-4 bg-white text-black min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Debug API (Dev Only)</h1>
      <pre className="whitespace-pre-wrap font-mono text-xs">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
