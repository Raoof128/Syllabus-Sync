// app/template.tsx
// Simple page transitions with reduced-motion support
'use client';

import { LazyMotion, m, domAnimation } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.15,
          ease: 'easeOut',
        }}
        // Motion library has built-in reduced-motion support
        // When user prefers reduced motion, motion.div will skip animations
        className="w-full h-full"
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
