'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import type { PropsWithChildren } from 'react';

export default function RouteTransition({ children }: PropsWithChildren) {
  const pathname = usePathname();
  return (
    <motion.main
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.main>
  );
}


