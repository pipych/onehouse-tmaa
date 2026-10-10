import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-full transition-all duration-150 select-none outline-none border-none ring-0 focus:outline-none focus:ring-0 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer';

    const variants = {
      primary:
        'bg-oneweb-accent text-oneweb-text-inverse hover:bg-oneweb-accent-hover shadow-oneweb-sm font-semibold',
      secondary:
        'bg-oneweb-surface-subtle text-oneweb-text-primary hover:bg-oneweb-surface-elevated',
      outline:
        'bg-transparent text-oneweb-text-primary border border-white/10 hover:bg-white/5 hover:border-white/20',
      ghost:
        'bg-transparent text-oneweb-text-secondary hover:text-oneweb-text-primary hover:bg-oneweb-surface-subtle',
      danger:
        'bg-oneweb-status-danger text-white hover:opacity-90 shadow-oneweb-sm',
    };

    const sizes = {
      sm: 'h-8 px-3.5 text-xs rounded-full gap-1.5',
      md: 'h-10 px-5 text-sm rounded-full gap-2',
      lg: 'h-12 px-6 text-base rounded-full gap-2.5',
    };

    return (
      <Comp
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4 shrink-0 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </Comp>
    );
  }
);

Button.displayName = 'Button';
