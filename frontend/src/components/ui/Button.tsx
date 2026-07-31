import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { buttonTapVariant } from '../../animations/variants';

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'ref'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-lg';
    
    const variants = {
      primary: 'bg-saffron text-white hover:bg-saffron/90 focus:ring-saffron/50 shadow-md shadow-saffron/20',
      secondary: 'bg-golden text-darkBrown hover:bg-golden/90 focus:ring-golden/50',
      outline: 'border-2 border-saffron/20 text-saffron hover:bg-saffron/10 focus:ring-saffron/50',
      ghost: 'text-darkBrown hover:bg-black/5 focus:ring-black/10',
      icon: 'p-2 rounded-full hover:bg-black/5 text-darkBrown focus:ring-black/10',
    };

    const sizes = {
      sm: 'h-9 px-4 text-sm',
      md: 'h-11 px-6 text-base',
      lg: 'h-14 px-8 text-lg',
      icon: 'h-11 w-11',
    };

    return (
      <motion.button
        ref={ref}
        variants={buttonTapVariant}
        whileHover={disabled ? {} : 'hover'}
        whileTap={disabled ? {} : 'tap'}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children as any}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';
