import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { cn } from '@utils/cn';
import { cardHoverVariant } from '@/animations/variants';

interface CardProps extends HTMLMotionProps<"div"> {
  hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = true, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={hoverable ? (cardHoverVariant as any) : undefined}
        initial="initial"
        whileHover={hoverable ? "hover" : undefined}
        whileTap={hoverable ? "tap" : undefined}
        className={cn(
          'bg-white rounded-2xl p-5 shadow-sm border border-black/5 overflow-hidden',
          hoverable && 'cursor-pointer shadow-md transition-shadow duration-300',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
Card.displayName = 'Card';
