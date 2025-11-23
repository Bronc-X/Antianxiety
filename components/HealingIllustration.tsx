'use client';

import { motion } from 'framer-motion';

interface HealingIllustrationProps {
  variant?: 'leaf' | 'wave' | 'circle' | 'breath';
  className?: string;
}

export default function HealingIllustration({ variant = 'leaf', className = '' }: HealingIllustrationProps) {
  const variants = {
    leaf: (
      <motion.div
        className="relative w-24 h-24"
        animate={{
          rotate: [0, 5, -5, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <motion.path
            d="M50 20 Q30 40, 35 60 Q40 80, 50 75 Q60 80, 65 60 Q70 40, 50 20"
            fill="none"
            stroke="#0B3D2E"
            strokeWidth="2"
            strokeOpacity="0.3"
            initial={{ pathLength: 0.5 }}
            animate={{
              pathLength: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <circle cx="50" cy="50" r="3" fill="#0B3D2E" opacity="0.4" />
        </svg>
      </motion.div>
    ),
    wave: (
      <motion.div
        className="relative w-32 h-16"
        animate={{
          x: [0, 10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <motion.path
            d="M0 25 Q25 15, 50 25 T100 25"
            fill="none"
            stroke="#0B3D2E"
            strokeWidth="2"
            strokeOpacity="0.2"
            initial={{ d: 'M0 25 Q25 15, 50 25 T100 25' }}
            animate={{
              d: [
                'M0 25 Q25 15, 50 25 T100 25',
                'M0 25 Q25 20, 50 25 T100 25',
                'M0 25 Q25 15, 50 25 T100 25',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </svg>
      </motion.div>
    ),
    circle: (
      <motion.div
        className="relative w-20 h-20"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#0B3D2E" strokeWidth="2" opacity="0.3" />
          <circle cx="50" cy="50" r="25" fill="none" stroke="#0B3D2E" strokeWidth="1.5" opacity="0.4" />
          <circle cx="50" cy="50" r="10" fill="#0B3D2E" opacity="0.2" />
        </svg>
      </motion.div>
    ),
    breath: (
      <motion.div
        className="relative w-16 h-16"
        animate={{
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <motion.circle
            cx="50"
            cy="50"
            r="30"
            fill="none"
            stroke="#0B3D2E"
            strokeWidth="2"
            strokeOpacity="0.3"
            initial={{ r: 30 }}
            animate={{
              r: [30, 35, 30],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </svg>
      </motion.div>
    ),
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {variants[variant]}
    </div>
  );
}

