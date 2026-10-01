import React from 'react';
import { cn } from '@utils/cn';

export interface IconTextProps extends React.HTMLAttributes<HTMLElement> {
  icon?: React.ReactNode;
  children?: React.ReactNode;
  text?: React.ReactNode;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  align?: 'center' | 'start' | 'baseline';
  gap?: string;
  iconPosition?: 'left' | 'right';
  as?: React.ElementType;
}

export const IconText: React.FC<IconTextProps> = ({
  icon,
  children,
  text,
  className = '',
  iconClassName = '',
  textClassName = '',
  align = 'center',
  gap = 'gap-2.5',
  iconPosition = 'left',
  as: Component = 'div',
  ...props
}) => {
  const content = children ?? text;

  const alignClass = align === 'start' ? 'items-start' : align === 'baseline' ? 'items-baseline' : 'items-center';

  const iconElement = icon && (
    <span className={cn('inline-flex items-center justify-center shrink-0 icon-wrapper', iconClassName)}>{icon}</span>
  );

  const textElement = content !== undefined && content !== null && (
    <span className={cn('min-w-0', textClassName)}>{content}</span>
  );

  return (
    <Component className={cn('inline-flex', alignClass, gap, className)} {...props}>
      {iconPosition === 'left' ? (
        <>
          {iconElement}
          {textElement}
        </>
      ) : (
        <>
          {textElement}
          {iconElement}
        </>
      )}
    </Component>
  );
};
