'use client';

import { motion, type Variants } from 'framer-motion';
import { fadeUp, fadeIn, springScaleIn } from '@/lib/animations';
import type { PropsWithChildren } from 'react';

type VariantName = 'fadeUp' | 'fadeIn' | 'springScaleIn';

const variantsMap: Record<VariantName, Variants> = {
  fadeUp: fadeUp as Variants,
  fadeIn: fadeIn as Variants,
  springScaleIn: springScaleIn as Variants,
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
      variants={variants}
      className={className}
    >
      {children}
    </motion.section>
  );
}


