/**
 * Shared animation constants for consistent, snappy animations across the app.
 *
 * Design principles:
 * - Snappy: Quick durations (0.2-0.4s) that feel responsive
 * - Smooth: Custom easing curve for natural deceleration
 * - Staggered: Progressive delays for list items create visual flow
 */

// Custom easing curve - quick start, smooth deceleration
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// Animation durations
export const DURATION = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
} as const;

// Stagger delay between items in lists
export const STAGGER = {
  fast: 0.02,
  normal: 0.04,
  slow: 0.06,
};

// Common animation variants
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const fadeInScale = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

// Standard transition presets
export const transition = {
  fast: { duration: DURATION.fast, ease: EASE_OUT },
  normal: { duration: DURATION.normal, ease: EASE_OUT },
  slow: { duration: DURATION.slow, ease: EASE_OUT },
  spring: { type: "spring", stiffness: 400, damping: 30 },
  springBouncy: { type: "spring", stiffness: 500, damping: 25 },
} as const;

// Helper to create staggered transitions for list items
// Caps delay at 0.15s to prevent slow animations on large lists
export const staggeredTransition = (index: number, stagger = STAGGER.fast) => ({
  duration: DURATION.fast,
  delay: Math.min(index * stagger, 0.15),
  ease: EASE_OUT,
});

// Modal/dialog animations
export const modalOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: DURATION.fast },
};

export const modalContent = {
  initial: { opacity: 0, scale: 0.95, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 8 },
  transition: { duration: DURATION.normal, ease: EASE_OUT },
};
