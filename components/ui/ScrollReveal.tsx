'use client';

import React from 'react';
import { motion } from 'framer-motion';

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

  className = '',
  staggerChildren = 0,
}: ScrollRevealProps) {
  // Using the easing curve from mq-tokens.css (--t-ease-slow)
  // cubic-bezier(0.5, 0.5, 0, 1)
  const ease = [0.5, 0.5, 0, 1] as const;

  const variants = {
    hidden: {
      opacity: 0,
      y: yOffset,
      scale: 0.98,
      filter: 'blur(2px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration,
        ease,
        delay,
        staggerChildren,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
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
