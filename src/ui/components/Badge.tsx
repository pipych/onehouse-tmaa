import React from 'react';
import { cn } from '../utils/cn';

export type BadgeVariant =
  | 'lime'
  | 'neutral'
  | 'danger'
  | 'warning'
  // Backward compatibility aliases
  | 'accent'
  | 'default'
  | 'success';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Whether to show the active indicator dot (defaults to true as per OneWebUI spec) */
  dot?: boolean;
}

/**
 * OneWebUI Badge Component
 * - Strict Pill Shape (rounded-full)
 * - STRICTLY NO BORDERS (no border, no ring)
 * - Translucent background (~10-15%) of the active color
 * - Indicator dot (w-1.5 h-1.5 rounded-full) matching the text color
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'lime', size = 'md', dot = true, children, ...props }, ref) => {
    // Normalizing aliases
    const normalizedVariant: 'lime' | 'neutral' | 'danger' | 'warning' =
      variant === 'accent' || variant === 'success'
        ? 'lime'
        : variant === 'default'
        ? 'neutral'
        : variant;

    const variantStyles = {
      lime: {
        container: 'bg-[#c0ff00]/10 text-[#c0ff00]',
        dot: 'bg-[#c0ff00]',
      },
      neutral: {
        container: 'bg-white/5 text-[#8e8e93]',
        dot: 'bg-[#8e8e93]',
      },
      danger: {
        container: 'bg-red-500/10 text-red-500',
        dot: 'bg-red-500',
      },
      warning: {
        container: 'bg-amber-500/10 text-amber-500',
        dot: 'bg-amber-500',
      },
    };

    const currentStyle = variantStyles[normalizedVariant] || variantStyles.lime;

    return (
      <span
        ref={ref}
        className={cn(
          'rounded-full inline-flex items-center gap-1.5 select-none tracking-normal leading-none font-medium',
          size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
          currentStyle.container,
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn('w-1.5 h-1.5 rounded-full inline-block shrink-0', currentStyle.dot)}
            aria-hidden="true"
          />
        )}
        <span>{children}</span>
      </span>
    );
  }
);

Badge.displayName = 'Badge';
