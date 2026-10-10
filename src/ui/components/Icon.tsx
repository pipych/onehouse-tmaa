import React from 'react';
import { cn } from '../utils/cn';

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  fill?: boolean;
  size?: number | string;
  className?: string;
}

/**
 * Material Symbols Rounded Icon Component
 * Default fill variation is 1 as per One design system specification.
 * Automatically normalizes icon names to snake_case lowercase for reliable ligature rendering.
 */
export const Icon = React.forwardRef<HTMLSpanElement, IconProps>(
  ({ name, fill = true, size = 20, className, style, ...props }, ref) => {
    const cleanName = typeof name === 'string' ? name.trim().toLowerCase().replace(/[-\s]/g, '_') : '';

    const customStyle: React.CSSProperties = {
      fontSize: typeof size === 'number' ? `${size}px` : size,
      width: typeof size === 'number' ? `${size}px` : size,
      height: typeof size === 'number' ? `${size}px` : size,
      fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
      ...style,
    };

    return (
      <span
        ref={ref}
        className={cn('material-symbols-rounded select-none leading-none inline-flex items-center justify-center shrink-0', className)}
        style={customStyle}
        aria-hidden="true"
        {...props}
      >
        {cleanName}
      </span>
    );
  }
);

Icon.displayName = 'Icon';

/**
 * OneIcon alias for design system consistency
 */
export const OneIcon = Icon;
