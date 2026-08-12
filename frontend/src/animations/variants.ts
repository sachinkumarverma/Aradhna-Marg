import type { Variants } from 'framer-motion';

export const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 200 }
  }
};

export const fadeLeftVariant: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', damping: 25, stiffness: 200 }
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const scaleVariant: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', damping: 20, stiffness: 200 }
  }
};

export const cardHoverVariant = {
  initial: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: { type: 'spring', stiffness: 300 }
  },
  tap: { scale: 0.98 }
};

export const buttonTapVariant = {
  tap: { scale: 0.95 },
  hover: { scale: 1.03 }
};
