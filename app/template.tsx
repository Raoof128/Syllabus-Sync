// app/template.tsx
// Lightweight page transition using CSS animation instead of framer-motion.
// Saves ~30-50KB of JS from every route bundle.

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full h-full animate-fade-in"
      style={{ animationDuration: "0.15s" }}
    >
      {children}
    </div>
  );
}
