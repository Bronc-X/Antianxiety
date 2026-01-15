/**
 * Liquid Glass Design System v2.0
 * 
 * Advanced glass morphism styles inspired by iOS 26 Liquid Glass design.
 * Includes micro-interactions, haptic feedback patterns, and fluid animations.
 * 
 * Design Principles:
 * - Translucent backgrounds with multi-layer backdrop blur
 * - Subtle borders with light refraction and specular highlights
 * - Layered shadows for realistic depth
 * - Dynamic color adaptation with gradient animations
 * - Micro-interactions with haptic sync
 * - Spring physics for natural motion
 */

import type { Transition, Variants } from 'framer-motion';

// ============================================
// Glass Effect CSS Classes
// ============================================

export const glassBase = `
  bg-white/80 dark:bg-white/10
  backdrop-blur-xl
  border border-white/40 dark:border-white/20
`;

export const glassCard = `
  ${glassBase}
  rounded-2xl
  shadow-lg shadow-stone-200/50 dark:shadow-none
`;

export const glassCardLarge = `
  ${glassBase}
  rounded-3xl
  shadow-xl shadow-stone-200/60 dark:shadow-none
`;

export const glassFrosted = `
  bg-white/90 dark:bg-white/15
  backdrop-blur-2xl
  border border-white/50 dark:border-white/25
  rounded-2xl
`;

export const glassSubtle = `
  bg-white/60 dark:bg-white/5
  backdrop-blur-lg
  border border-white/30 dark:border-white/10
  rounded-xl
`;

export const glassNav = `
  bg-white/80 dark:bg-stone-900/80
  backdrop-blur-xl
  border-b border-stone-200/60 dark:border-stone-800
`;

export const glassSheet = `
  bg-white dark:bg-stone-900
  backdrop-blur-2xl
  rounded-t-3xl
  shadow-2xl
`;

// ============================================
// iOS 26 Liquid Glass Effects (Enhanced)
// ============================================

export const liquidGlassPrimary = `
  bg-gradient-to-br from-white/20 via-white/10 to-white/5
  backdrop-blur-[25px] backdrop-saturate-[1.8]
  border border-white/25
  shadow-[0_4px_30px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.05)]
  rounded-3xl
`;

export const liquidGlassSpecular = `
  bg-gradient-to-br from-white/30 via-transparent to-white/10
  backdrop-blur-[30px] backdrop-saturate-200
  border border-white/30
  shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_2px_0_rgba(255,255,255,0.4)]
  rounded-3xl
  before:absolute before:inset-0 before:rounded-3xl
  before:bg-gradient-to-br before:from-white/20 before:via-transparent before:to-transparent
  before:pointer-events-none
`;

// ============================================
// Gradient Glass Effects
// ============================================

export const glassGradientPrimary = `
  bg-gradient-to-br from-emerald-500/90 via-teal-500/90 to-cyan-500/90
  backdrop-blur-xl
  border border-white/30
  shadow-lg shadow-emerald-500/30
`;

export const glassGradientSecondary = `
  bg-gradient-to-br from-violet-500/90 via-purple-500/90 to-fuchsia-500/90
  backdrop-blur-xl
  border border-white/30
  shadow-lg shadow-purple-500/30
`;

export const glassGradientWarm = `
  bg-gradient-to-br from-amber-500/90 via-orange-500/90 to-red-500/90
  backdrop-blur-xl
  border border-white/30
  shadow-lg shadow-orange-500/30
`;

// ============================================
// Interactive Glass Effects
// ============================================

export const glassPressable = `
  ${glassCard}
  cursor-pointer
  transition-all duration-200 ease-out
  hover:bg-white/90 dark:hover:bg-white/15
  hover:shadow-xl hover:shadow-stone-300/50
  hover:scale-[1.01]
  active:scale-[0.98]
  active:bg-stone-50 dark:active:bg-white/20
`;

export const glassToggle = `
  bg-stone-200 dark:bg-stone-700
  rounded-full
  transition-colors duration-200
`;

export const glassToggleActive = `
  bg-emerald-500
  rounded-full
`;

// ============================================
// Haptic Feedback Patterns
// ============================================

export const hapticPatterns = {
  /** Light tap - selection, navigation */
  light: { style: 'light' as const, duration: 10 },

  /** Medium impact - confirmation, success */
  medium: { style: 'medium' as const, duration: 20 },

  /** Heavy impact - error, warning, important action */
  heavy: { style: 'heavy' as const, duration: 30 },

  /** Selection feedback - toggle, checkbox */
  selection: { style: 'selection' as const, duration: 15 },

  /** Success pattern - completion, achievement */
  success: [
    { style: 'light' as const, duration: 10 },
    { delay: 50 },
    { style: 'medium' as const, duration: 20 },
  ],

  /** Error pattern - shake, warning */
  error: [
    { style: 'medium' as const, duration: 15 },
    { delay: 30 },
    { style: 'medium' as const, duration: 15 },
    { delay: 30 },
    { style: 'heavy' as const, duration: 25 },
  ],

  /** Slider tick - granular feedback */
  tick: { style: 'light' as const, duration: 5 },

  /** Button press */
  buttonPress: { style: 'medium' as const, duration: 15 },

  /** Pull-to-refresh threshold */
  threshold: { style: 'heavy' as const, duration: 25 },
};

// ============================================
// Spring Physics Configurations
// ============================================

export const springConfigs = {
  /** Snappy, responsive - buttons, toggles */
  snappy: { type: 'spring' as const, stiffness: 400, damping: 30 },

  /** Gentle, smooth - cards, panels */
  gentle: { type: 'spring' as const, stiffness: 200, damping: 25 },

  /** Bouncy - celebrations, achievements */
  bouncy: { type: 'spring' as const, stiffness: 300, damping: 15, mass: 0.8 },

  /** Slow, elegant - page transitions */
  elegant: { type: 'spring' as const, stiffness: 100, damping: 20, mass: 1.2 },

  /** Quick - micro-interactions */
  quick: { type: 'spring' as const, stiffness: 500, damping: 35 },

  /** Rubber band - overscroll, pull gestures */
  rubber: { type: 'spring' as const, stiffness: 600, damping: 15, mass: 0.5 },
} satisfies Record<string, Transition>;

// ============================================
// Micro-Interaction Animations
// ============================================

/** Shimmer/Glint effect for glass surfaces */
export const shimmerAnimation = {
  initial: { x: '-100%', opacity: 0 },
  animate: {
    x: '100%',
    opacity: [0, 0.5, 0],
    transition: { duration: 1.5, ease: 'easeInOut' }
  },
};

/** Breathing/Pulse effect for active states */
export const breatheAnimation: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  },
};

/** Glow pulse for notifications/alerts */
export const glowPulseAnimation: Variants = {
  initial: { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0)' },
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(16, 185, 129, 0.4)',
      '0 0 20px 10px rgba(16, 185, 129, 0)',
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeOut'
    }
  },
};

/** Float/Levitate effect */
export const floatAnimation: Variants = {
  initial: { y: 0, rotate: 0 },
  animate: {
    y: [-5, 5, -5],
    rotate: [-1, 1, -1],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  },
};

/** Shake for error feedback */
export const shakeAnimation: Variants = {
  initial: { x: 0 },
  shake: {
    x: [-10, 10, -8, 8, -5, 5, 0],
    transition: { duration: 0.5, ease: 'easeOut' }
  },
};

// ============================================
// Glass Card Variants (Enhanced)
// ============================================

export const glassCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.92,
    filter: 'blur(10px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: springConfigs.gentle,
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    filter: 'blur(8px)',
    transition: { duration: 0.2 }
  },
  hover: {
    y: -4,
    scale: 1.02,
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
    transition: springConfigs.snappy,
  },
  tap: {
    scale: 0.98,
    transition: springConfigs.quick,
  },
};

export const glassContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    }
  },
};

export const glassItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springConfigs.gentle,
  },
};

// ============================================
// Page Transition Variants
// ============================================

export const pageSlideVariants: Variants = {
  initial: { opacity: 0, x: 50 },
  in: {
    opacity: 1,
    x: 0,
    transition: { ...springConfigs.elegant, duration: 0.4 }
  },
  out: {
    opacity: 0,
    x: -30,
    transition: { duration: 0.2 }
  },
};

export const pageFadeVariants: Variants = {
  initial: { opacity: 0, scale: 0.98 },
  in: {
    opacity: 1,
    scale: 1,
    transition: springConfigs.gentle,
  },
  out: {
    opacity: 0,
    scale: 1.02,
    transition: { duration: 0.15 }
  },
};

// ============================================
// CSS Custom Properties (Inline Styles)
// ============================================

export const glassStyles = {
  light: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '1rem',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  },

  dark: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '1rem',
    boxShadow: 'none',
  },

  liquidGlass: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.15) 100%)',
    backdropFilter: 'blur(25px) saturate(200%)',
    WebkitBackdropFilter: 'blur(25px) saturate(200%)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    borderRadius: '1.5rem',
    boxShadow: `
      0 4px 30px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      inset 0 -1px 0 rgba(0, 0, 0, 0.05)
    `,
  },

  prism: {
    background: `linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.25) 0%,
      rgba(255, 255, 255, 0.05) 50%,
      rgba(255, 255, 255, 0.2) 100%
    )`,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.35)',
  },

  specular: {
    background: `
      linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 40%),
      linear-gradient(225deg, rgba(255,255,255,0.15) 0%, transparent 40%),
      rgba(255, 255, 255, 0.08)
    `,
    backdropFilter: 'blur(30px) saturate(200%) brightness(1.1)',
    WebkitBackdropFilter: 'blur(30px) saturate(200%) brightness(1.1)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '1.5rem',
    boxShadow: `
      0 8px 32px rgba(0, 0, 0, 0.12),
      0 2px 8px rgba(0, 0, 0, 0.06),
      inset 0 2px 0 rgba(255, 255, 255, 0.5)
    `,
  },
};

// ============================================
// CSS Keyframes (For Global Styles)
// ============================================

export const keyframes = {
  shimmer: `
    @keyframes shimmer {
      0% { transform: translateX(-100%); opacity: 0; }
      50% { opacity: 0.5; }
      100% { transform: translateX(100%); opacity: 0; }
    }
  `,

  breathe: `
    @keyframes breathe {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }
  `,

  glowPulse: `
    @keyframes glowPulse {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
      70% { box-shadow: 0 0 20px 10px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
  `,

  float: `
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      25% { transform: translateY(-5px) rotate(-1deg); }
      75% { transform: translateY(5px) rotate(1deg); }
    }
  `,

  gradientShift: `
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `,
};

// ============================================
// Utility Functions
// ============================================

export function getGlassClasses(opacity: number = 80, blur: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'xl'): string {
  const opacityValue = Math.min(100, Math.max(0, opacity));
  return `
    bg-white/${opacityValue} dark:bg-white/${Math.round(opacityValue / 8)}
    backdrop-blur-${blur}
    border border-white/${Math.min(60, opacityValue - 20)} dark:border-white/${Math.round((opacityValue - 20) / 4)}
  `.trim();
}

export function getColoredGlassClasses(
  color: 'emerald' | 'violet' | 'amber' | 'blue' | 'rose' | 'stone' | 'indigo' | 'pink',
  variant: 'light' | 'medium' | 'dark' = 'light'
): string {
  const opacityMap = { light: 10, medium: 20, dark: 30 };
  const opacity = opacityMap[variant];

  return `
    bg-${color}-500/${opacity} dark:bg-${color}-500/${opacity + 10}
    backdrop-blur-xl
    border border-${color}-200/50 dark:border-${color}-500/30
  `.trim();
}

export type GlassVariant = 'base' | 'card' | 'cardLarge' | 'frosted' | 'subtle' | 'nav' | 'sheet' | 'liquid' | 'specular';
export type GlassGradient = 'primary' | 'secondary' | 'warm';

export function getGlassByVariant(variant: GlassVariant): string {
  const map: Record<GlassVariant, string> = {
    base: glassBase,
    card: glassCard,
    cardLarge: glassCardLarge,
    frosted: glassFrosted,
    subtle: glassSubtle,
    nav: glassNav,
    sheet: glassSheet,
    liquid: liquidGlassPrimary,
    specular: liquidGlassSpecular,
  };
  return map[variant];
}

export function getGradientGlass(gradient: GlassGradient): string {
  const map: Record<GlassGradient, string> = {
    primary: glassGradientPrimary,
    secondary: glassGradientSecondary,
    warm: glassGradientWarm,
  };
  return map[gradient];
}

// ============================================
// Default Export
// ============================================

const liquidGlass = {
  // Classes
  glassBase,
  glassCard,
  glassCardLarge,
  glassFrosted,
  glassSubtle,
  glassNav,
  glassSheet,
  liquidGlassPrimary,
  liquidGlassSpecular,
  glassGradientPrimary,
  glassGradientSecondary,
  glassGradientWarm,
  glassPressable,
  glassToggle,
  glassToggleActive,

  // Functions
  getGlassClasses,
  getColoredGlassClasses,
  getGlassByVariant,
  getGradientGlass,

  // Styles
  glassStyles,
  keyframes,

  // Haptics
  hapticPatterns,

  // Springs
  springConfigs,

  // Animations
  shimmerAnimation,
  breatheAnimation,
  glowPulseAnimation,
  floatAnimation,
  shakeAnimation,
  glassCardVariants,
  glassContainerVariants,
  glassItemVariants,
  pageSlideVariants,
  pageFadeVariants,
};

export default liquidGlass;
