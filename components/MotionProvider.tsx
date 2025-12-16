'use client';

import { createContext, useContext, useMemo } from 'react';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import type { PropsWithChildren } from 'react';

type MotionConfig = {
  defaultDuration: number;
  ease: [number, number, number, number] | 'easeOut' | 'easeInOut' | 'easeIn';
};

const MotionContext = createContext<MotionConfig>({
  defaultDuration: 0.35,
  ease: 'easeOut',
});

export function useMotionConfig() {
  return useContext(MotionContext);
}

/**
 * MotionProvider Component
 * 
 * Provides motion configuration context and wraps children with AnimatePresence
 * for exit animations support. Respects user's reduced motion preferences.
 * 
 * Requirements: 6.2 - Root layout with MotionProvider (AnimatePresence)
 */
export default function MotionProvider({ children }: PropsWithChildren) {
  const prefersReducedMotion = useReducedMotion();
  const value = useMemo<MotionConfig>(
    () => ({
      defaultDuration: prefersReducedMotion ? 0 : 0.35,
      ease: prefersReducedMotion ? 'easeOut' : 'easeOut',
    }),
    [prefersReducedMotion]
  );

  return (
    <MotionContext.Provider value={value}>
      <AnimatePresence mode="wait">
        {children}
      </AnimatePresence>
    </MotionContext.Provider>
  );
}


