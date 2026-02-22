"use client";

import React from "react";
import { LazyMotion, m, domAnimation, useReducedMotion } from "framer-motion";

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  threshold?: number;
  className?: string;
  staggerChildren?: number;
}

export function ScrollReveal({
  children,
  delay = 0,
  duration = 0.6,
  yOffset = 30,

  className = "",
  staggerChildren = 0,
}: ScrollRevealProps) {
  // Respect user's reduced motion preference
  const prefersReducedMotion = useReducedMotion();

  // Using the easing curve from mq-tokens.css (--t-ease-slow)
  // cubic-bezier(0.5, 0.5, 0, 1)
  const ease = [0.5, 0.5, 0, 1] as const;

  // If user prefers reduced motion, use instant transitions
  const variants = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { duration: 0.01, delay: 0 },
        },
      }
    : {
        hidden: {
          opacity: 0,
          y: yOffset,
          scale: 0.98,
          // Removed filter: 'blur(2px)' to prevent repaints and improve performance
        },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration,
            ease,
            delay,
            staggerChildren,
          },
        },
      };

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={variants}
        className={className}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}

export const revealChildVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.5, 0.5, 0, 1] as const,
    },
  },
};
