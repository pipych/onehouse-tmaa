import React from 'react';
import { cn } from '../utils/cn';
import { Icon } from './Icon';

export interface MobileActionBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Name of the Material Symbols Rounded icon (no text allowed) */
  icon: string;
  /** Visual variant: primary (One Lime) or surface (#181c23) */
  variant?: 'primary' | 'surface';
  /** Size of the icon in pixels (default 28) */
  iconSize?: number;
  /** Custom bottom offset class (default 'bottom-24') */
  bottomOffsetClass?: string;
  /** For showcase or simulated previews only: overrides md:hidden */
  forceVisible?: boolean;
}

/**
 * MobileActionBtn (FAB) - Floating Action Button for mobile interfaces.
 * - Strictly hidden on desktop (md:hidden)
 * - Fixed bottom right (above floating mobile bottom nav, bottom-24 right-4)
 * - Strict circular pill shape (w-14 h-14 rounded-full aspect-square)
 * - Contains ONLY an icon, never text
 */
export const MobileActionBtn = React.forwardRef<HTMLButtonElement, MobileActionBtnProps>(
  (
    {
      className,
      icon,
      variant = 'primary',
      iconSize = 28,
      bottomOffsetClass = 'bottom-24',
      forceVisible = false,
      disabled,
      type = 'button',
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary:
        'bg-oneweb-accent text-oneweb-text-inverse hover:bg-oneweb-accent-hover shadow-oneweb-lg border-none',
      surface:
        'bg-oneweb-surface-elevated text-oneweb-accent hover:bg-oneweb-surface-subtle shadow-oneweb-lg border border-white/[0.04]',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        aria-label={ariaLabel || icon}
        className={cn(
          // Visibility & Positioning
          !forceVisible && 'md:hidden',
          'fixed right-4 z-40',
          bottomOffsetClass,
          // Shape & Dimensions
          'w-14 h-14 rounded-full aspect-square',
          'flex items-center justify-center shrink-0',
          'transition-all duration-150 select-none outline-none ring-0 focus:outline-none focus:ring-0 cursor-pointer',
          'active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          className
        )}
        {...props}
      >
        <Icon name={icon} size={iconSize} fill={true} />
      </button>
    );
  }
);

MobileActionBtn.displayName = 'MobileActionBtn';

/** Alias for MobileActionBtn */
export const FAB = MobileActionBtn;
