'use client';

import { motion } from 'framer-motion';
import { fadeUp, fadeIn, springScaleIn } from '@/lib/animations';
import type { PropsWithChildren } from 'react';

type VariantName = 'fadeUp' | 'fadeIn' | 'springScaleIn';
type MotionVariant = {
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: any;
};

const variantsMap: Record<VariantName, MotionVariant> = {
  fadeUp,
  fadeIn,
  springScaleIn,
};

type AnimatedSectionProps = PropsWithChildren<{
  className?: string;
  variant?: VariantName;
  inView?: boolean;
}>;

export default function AnimatedSection({
  children,
  className,
  variant = 'fadeUp',
  inView = false,
}: AnimatedSectionProps) {
  const variants = variantsMap[variant] || fadeUp;

  if (inView) {
    return (
      <motion.section
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.2 }}
        transition={variants.transition}
        variants={variants}
        className={className}
      >
        {children}
      </motion.section>
    );
  }

  return (
    <motion.section
      initial="initial"
      animate="animate"
      exit="exit"
      transition={variants.transition}
      variants={variants}
      className={className}
    >
      {children}
    </motion.section>
  );
}


