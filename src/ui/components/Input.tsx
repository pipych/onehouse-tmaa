import React, { useState } from 'react';
import { cn } from '../utils/cn';
import { Icon, OneIcon } from './Icon';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: string | React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightAction?: React.ReactNode;
  rightActionIcon?: string;
  onRightAction?: () => void;
  clearable?: boolean;
  onClear?: () => void;
  size?: 'sm' | 'md' | 'lg';
  surface?: 'base' | 'card' | 'elevated' | 'modal';
  variant?: 'base' | 'card' | 'elevated';
}

/**
 * OneWebUI Input
 * - Strict Pill Shape (rounded-full)
 * - Contrasting underlay:
 *   * On base canvas (#090b0e) -> surface="base" -> bg-[#14171c]
 *   * Inside cards / modals (#14171c) -> surface="card" | "elevated" -> bg-[#181c23]
 * - Strictly zero borders, zero rings (border-none outline-none ring-0 focus:ring-0 focus:outline-none)
 * - Right actions are STRICTLY round icon buttons (w-8 h-8 rounded-full aspect-square) at absolute right-2
 * - Fixed padding: pl-11 with left icon, pr-12 with right action (prevents text overlap)
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      helperText,
      error,
      icon,
      leftIcon,
      rightIcon,
      rightAction,
      rightActionIcon,
      onRightAction,
      clearable,
      onClear,
      disabled,
      id,
      size = 'md',
      surface,
      variant,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || React.useId();
    const isPassword = type === 'password';
    const computedType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const sizeStyles = {
      sm: 'h-10 text-xs',
      md: 'h-11 md:h-12 text-sm font-medium',
      lg: 'h-13 md:h-14 text-base font-medium',
    };

    // Determine surface contrast underlay
    const activeSurface = surface || variant || 'base';
    const surfaceStyles = {
      base: 'bg-[#14171c]',
      card: 'bg-[#181c23]',
      elevated: 'bg-[#181c23]',
      modal: 'bg-[#181c23]',
    };
    const bgClass = surfaceStyles[activeSurface] || 'bg-[#14171c]';

    const effectiveLeftIcon = icon || leftIcon;
    const hasLeftIcon = Boolean(effectiveLeftIcon);

    const hasClearAction = Boolean(clearable && Boolean(props.value) && onClear);
    const hasCustomAction = Boolean(rightActionIcon || rightAction);
    const hasRightElement = Boolean(hasCustomAction || hasClearAction || rightIcon || isPassword);

    return (
      <div className="w-full flex flex-col space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-[#8e8e93] select-none px-3"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {/* Centered Left Icon */}
          {hasLeftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center text-[#8e8e93] z-10">
              {typeof effectiveLeftIcon === 'string' ? (
                <OneIcon name={effectiveLeftIcon} size={20} />
              ) : React.isValidElement(effectiveLeftIcon) ? (
                React.cloneElement(
                  effectiveLeftIcon as React.ReactElement<{ size?: number; className?: string }>,
                  {
                    size: 20,
                    className: cn(
                      'text-[#8e8e93]',
                      (effectiveLeftIcon as React.ReactElement<{ className?: string }>).props?.className
                    ),
                  }
                )
              ) : (
                effectiveLeftIcon
              )}
            </div>
          )}

          {/* Capsule Text Input */}
          <input
            id={inputId}
            ref={ref}
            type={computedType}
            disabled={disabled}
            className={cn(
              'w-full rounded-full text-white font-medium',
              bgClass,
              'placeholder:text-[#8e8e93] border-none outline-none focus:outline-none focus:ring-0 ring-0',
              'transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              hasLeftIcon ? 'pl-11' : 'pl-4',
              hasRightElement ? 'pr-12' : 'pr-4',
              sizeStyles[size],
              className
            )}
            {...props}
          />

          {/* Right Action: Strictly a round icon button (w-8 h-8 rounded-full aspect-square) */}
          {isPassword ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full aspect-square flex items-center justify-center text-[#8e8e93] hover:text-white hover:bg-white/10 active:scale-95 transition-all focus:outline-none cursor-pointer z-10"
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            >
              <OneIcon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
            </button>
          ) : rightActionIcon ? (
            <button
              type="button"
              onClick={onRightAction}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full aspect-square flex items-center justify-center text-[#8e8e93] hover:text-white hover:bg-white/10 active:scale-95 transition-all focus:outline-none cursor-pointer z-10"
              aria-label="Действие ввода"
            >
              <OneIcon name={rightActionIcon} size={18} />
            </button>
          ) : hasClearAction ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={onClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full aspect-square flex items-center justify-center text-[#8e8e93] hover:text-white hover:bg-white/10 active:scale-95 transition-all focus:outline-none cursor-pointer z-10"
              aria-label="Очистить поле"
            >
              <OneIcon name="close" size={18} />
            </button>
          ) : rightAction ? (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center z-10">
              {React.isValidElement(rightAction) &&
              (rightAction.props as { className?: string })?.className?.includes('rounded-full') ? (
                rightAction
              ) : (
                <div className="w-8 h-8 rounded-full aspect-square flex items-center justify-center">
                  {rightAction}
                </div>
              )}
            </div>
          ) : rightIcon ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center text-[#8e8e93] z-10">
              {typeof rightIcon === 'string' ? (
                <OneIcon name={rightIcon} size={18} />
              ) : React.isValidElement(rightIcon) ? (
                React.cloneElement(
                  rightIcon as React.ReactElement<{ size?: number; className?: string }>,
                  {
                    size: 18,
                    className: cn(
                      'text-[#8e8e93]',
                      (rightIcon as React.ReactElement<{ className?: string }>).props?.className
                    ),
                  }
                )
              ) : (
                rightIcon
              )}
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="text-xs text-red-400 font-medium flex items-center gap-1.5 px-3">
            <OneIcon name="error" size={16} />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-[#8e8e93] px-3">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface SearchInputProps
  extends Omit<InputProps, 'type' | 'leftIcon' | 'icon' | 'rightActionIcon'> {
  onClear?: () => void;
  onSubmit?: () => void;
}

/**
 * SearchInput - Specialized pill search field with centered 20px search icon and round right actions
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      placeholder = 'Поиск...',
      value,
      onClear,
      onSubmit,
      rightAction,
      rightIcon,
      surface = 'base',
      ...props
    },
    ref
  ) => {
    const hasValue = Boolean(value);

    return (
      <Input
        ref={ref}
        type="text"
        placeholder={placeholder}
        value={value}
        icon="search"
        surface={surface}
        rightAction={
          rightAction ? (
            rightAction
          ) : hasValue && onClear ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={onClear}
              className="w-8 h-8 rounded-full aspect-square flex items-center justify-center text-[#8e8e93] hover:text-white hover:bg-white/10 active:scale-95 transition-all focus:outline-none cursor-pointer"
              aria-label="Очистить поиск"
            >
              <OneIcon name="close" size={18} />
            </button>
          ) : onSubmit ? (
            <button
              type="button"
              onClick={onSubmit}
              className="w-8 h-8 rounded-full aspect-square flex items-center justify-center text-[#8e8e93] hover:text-white hover:bg-white/10 active:scale-95 transition-all focus:outline-none cursor-pointer"
              aria-label="Найти"
            >
              <OneIcon name="arrow_forward" size={18} />
            </button>
          ) : (
            rightIcon
          )
        }
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';
