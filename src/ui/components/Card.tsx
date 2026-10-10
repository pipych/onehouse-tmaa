import React from 'react';
import { cn } from '../utils/cn';
import { Icon } from './Icon';

export type CardVariant = 'default' | 'elevated' | 'glass';
export type CornerIconPosition = 'top-right' | 'top-left' | 'static';
export type CornerIconVariant =
  | 'contrast'
  | 'surface'
  | 'elevated'
  | 'dark'
  | 'dock'
  | 'accent'
  | 'accent-solid';
export type CornerIconColor = 'white' | 'accent' | 'muted';
export type CornerIconSize = 'sm' | 'md' | 'lg';

export interface CardCornerIconProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Name of the Material Symbols Rounded icon or custom ReactNode */
  icon?: string | React.ReactNode;
  /** Position of the shape relative to the card */
  position?: CornerIconPosition;
  /** Background shape variant (strictly contrasts with the card background) */
  variant?: CornerIconVariant;
  /** Color of the icon inside the shape */
  color?: CornerIconColor;
  /** Size of the square shape (sm: 40px, md: 48px, lg: 56px) */
  size?: CornerIconSize;
  /** Outer card variant to compute automated contrast */
  parentCardVariant?: CardVariant;
  /** Optional click handler */
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * CardCornerIcon (Shape) - Standardized corner icon container for cards and bento tiles.
 * - Strict square aspect ratio (aspect-square)
 * - Concentric corner radius matching the card's rounded-[28px]
 * - Strictly contrasting background surface (never blends with card)
 * - STRICTLY NO BORDERS (border-none, ring-0)
 * - Centered icon (white #ffffff, accent #c0ff00, or muted)
 */
export const CardCornerIcon = React.forwardRef<HTMLDivElement, CardCornerIconProps>(
  (
    {
      icon,
      position = 'top-right',
      variant = 'contrast',
      color,
      size = 'md',
      parentCardVariant = 'default',
      className,
      onClick,
      children,
      ...props
    },
    ref
  ) => {
    // 1. Resolve contrast background color
    const getBgColor = () => {
      switch (variant) {
        case 'surface':
          return 'bg-[#14171c]';
        case 'elevated':
          return 'bg-[#181c23]';
        case 'dark':
          return 'bg-[#090b0e]';
        case 'dock':
          return 'bg-[#252c37]';
        case 'accent':
          return 'bg-[#c0ff00]/15';
        case 'accent-solid':
          return 'bg-[#c0ff00]';
        case 'contrast':
        default:
          // Contrast logic: ensure the shape never blends into the card background
          if (parentCardVariant === 'elevated') {
            return 'bg-[#14171c]'; // card is #181c23 -> shape is darker #14171c
          }
          if (parentCardVariant === 'glass') {
            return 'bg-[#14171c]/90';
          }
          // Default card is #14171c -> shape is elevated #181c23
          return 'bg-[#181c23]';
      }
    };

    // 2. Resolve default icon color based on background variant
    const resolvedColor =
      color || (variant === 'accent-solid' ? 'muted' : variant === 'accent' ? 'accent' : 'white');

    const getTextColor = () => {
      if (variant === 'accent-solid') return 'text-[#090b0e]';
      switch (resolvedColor) {
        case 'accent':
          return 'text-[#c0ff00]';
        case 'muted':
          return 'text-[#8e8e93]';
        case 'white':
        default:
          return 'text-white';
      }
    };

    // 3. Resolve sizing and concentric radius
    const sizeClasses = {
      sm: {
        shape: 'w-10 h-10', // 40px
        iconSize: 20,
        radius:
          position === 'top-right'
            ? 'rounded-[16px] rounded-tr-[22px]'
            : position === 'top-left'
            ? 'rounded-[16px] rounded-tl-[22px]'
            : 'rounded-[16px]',
      },
      md: {
        shape: 'w-12 h-12', // 48px
        iconSize: 24,
        radius:
          position === 'top-right'
            ? 'rounded-[18px] rounded-tr-[24px]'
            : position === 'top-left'
            ? 'rounded-[18px] rounded-tl-[24px]'
            : 'rounded-[20px]',
      },
      lg: {
        shape: 'w-14 h-14', // 56px
        iconSize: 28,
        radius:
          position === 'top-right'
            ? 'rounded-[20px] rounded-tr-[26px]'
            : position === 'top-left'
            ? 'rounded-[20px] rounded-tl-[26px]'
            : 'rounded-[22px]',
      },
    }[size];

    // 4. Resolve positioning
    const positionClass = {
      'top-right': 'absolute top-4 right-4 z-10',
      'top-left': 'absolute top-4 left-4 z-10',
      static: 'relative',
    }[position];

    const isClickable = Boolean(onClick);

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          'aspect-square flex items-center justify-center shrink-0 select-none border-none ring-0 outline-none transition-all duration-200',
          sizeClasses.shape,
          sizeClasses.radius,
          positionClass,
          getBgColor(),
          getTextColor(),
          isClickable && 'cursor-pointer sf-tap active:scale-95 hover:brightness-110',
          className
        )}
        {...props}
      >
        {typeof icon === 'string' ? (
          <Icon name={icon} size={sizeClasses.iconSize} fill={true} />
        ) : (
          icon || children
        )}
      </div>
    );
  }
);
CardCornerIcon.displayName = 'CardCornerIcon';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  /** Name of the Material Symbols icon or custom node to place in the corner shape */
  icon?: string | React.ReactNode;
  /** Corner position of the icon shape */
  iconPosition?: CornerIconPosition;
  /** Background variant of the corner shape (strictly contrasting with card) */
  iconVariant?: CornerIconVariant;
  /** Icon color (white #ffffff, accent #c0ff00, or muted) */
  iconColor?: CornerIconColor;
  /** Size of the corner square shape (sm: 40px, md: 48px, lg: 56px) */
  iconShapeSize?: CornerIconSize;
  /** Additional classes for the corner icon shape */
  iconClassName?: string;
  /** Optional click handler for the corner icon shape */
  onIconClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      icon,
      iconPosition = 'top-right',
      iconVariant = 'contrast',
      iconColor,
      iconShapeSize = 'md',
      iconClassName,
      onIconClick,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: 'bg-oneweb-surface shadow-oneweb-sm',
      elevated: 'bg-oneweb-surface-elevated shadow-oneweb-md',
      glass: 'bg-oneweb-surface-glass backdrop-blur-md border border-white/[0.04] shadow-oneweb-lg',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-[28px] transition-all duration-200 text-oneweb-text-primary overflow-hidden',
          variants[variant],
          className
        )}
        {...props}
      >
        {/* Built-in corner icon shape if provided */}
        {icon && (
          <CardCornerIcon
            icon={icon}
            position={iconPosition}
            variant={iconVariant}
            color={iconColor}
            size={iconShapeSize}
            parentCardVariant={variant}
            className={iconClassName}
            onClick={onIconClick}
          />
        )}
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds clearance for a corner icon (prevents title text collision) */
  hasCornerIcon?: boolean | 'left' | 'right';
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, hasCornerIcon, ...props }, ref) => {
    const clearanceClass =
      hasCornerIcon === 'right' || hasCornerIcon === true
        ? 'pr-14'
        : hasCornerIcon === 'left'
        ? 'pl-14'
        : '';

    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 p-5', clearanceClass, className)}
        {...props}
      />
    );
  }
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold leading-tight tracking-tight text-oneweb-text-primary', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-oneweb-text-secondary', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5 pt-0 text-sm text-oneweb-text-secondary', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-5 pt-0 mt-3', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

/**
 * BentoCard - Pre-composed bento grid tile with built-in corner icon support.
 */
export interface BentoCardProps extends Omit<CardProps, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
}

export const BentoCard = React.forwardRef<HTMLDivElement, BentoCardProps>(
  (
    {
      title,
      description,
      badge,
      footer,
      children,
      icon,
      iconPosition = 'top-right',
      iconVariant = 'contrast',
      iconColor,
      iconShapeSize = 'md',
      className,
      ...props
    },
    ref
  ) => {
    return (
      <Card
        ref={ref}
        icon={icon}
        iconPosition={iconPosition}
        iconVariant={iconVariant}
        iconColor={iconColor}
        iconShapeSize={iconShapeSize}
        className={cn('flex flex-col justify-between p-6', className)}
        {...props}
      >
        <div className="space-y-2">
          {badge && <div className="mb-2">{badge}</div>}
          {title && (
            <CardTitle className={cn(icon && iconPosition === 'top-right' ? 'pr-12' : '')}>
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className={cn(icon && iconPosition === 'top-right' ? 'pr-12' : '')}>
              {description}
            </CardDescription>
          )}
          {children && <div className="pt-2">{children}</div>}
        </div>
        {footer && <div className="pt-4 mt-auto">{footer}</div>}
      </Card>
    );
  }
);
BentoCard.displayName = 'BentoCard';
