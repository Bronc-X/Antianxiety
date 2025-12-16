'use client';

import { motion } from 'framer-motion';
import type { PropsWithChildren } from 'react';

type AnimateOnViewProps = PropsWithChildren<{
  className?: string;
  once?: boolean;
}>;

export default function AnimateOnView({
  children,
  className,
  once = true,
}: AnimateOnViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      viewport={{ once, amount: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}


