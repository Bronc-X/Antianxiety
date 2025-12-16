import type { Variants, Transition } from 'framer-motion';

// Legacy animations (kept for backward compatibility)
export const fadeUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const springScaleIn: Variants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

// ============================================
// Capacitor Migration Animation Presets
// Requirements: 4.2, 4.4, 4.5
// ============================================

/**
 * Page transition animation preset
 * Duration: 0.3s (300ms) - within 200-400ms range per Requirements 4.2
 */
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeInOut' } as Transition,
};

/**
 * Stagger container for list animations
 * staggerChildren: 0.05 (50ms) per Requirements 4.4
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05, // 50ms delay between children
    },
  },
};

/**
 * Stagger item variant for use with staggerContainer
 */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

/**
 * Breathing background blob animations
 * Blob 1: 7s cycle, Blob 2: 9s cycle per Requirements 4.5
 */
export const breathingBlob = {
  blob1: {
    animate: {
      scale: [1, 1.1, 1],
      x: [0, 30, 0],
      y: [0, -20, 0],
    },
    transition: {
      duration: 7,
      ease: 'easeInOut',
      repeat: Infinity,
    } as Transition,
  },
  blob2: {
    animate: {
      scale: [1, 1.15, 1],
      x: [0, -25, 0],
      y: [0, 25, 0],
    },
    transition: {
      duration: 9,
      ease: 'easeInOut',
      repeat: Infinity,
      delay: 2,
    } as Transition,
  },
};


