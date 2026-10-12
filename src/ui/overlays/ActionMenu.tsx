import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { OneIcon } from '../components/Icon';
import { useIsMobile } from '../utils/useIsMobile';

export interface DrawerItemProps {
  label: string;
  description?: string;
  icon?: string;
  leftElement?: React.ReactNode;
  isActive?: boolean;
  danger?: boolean;
  disabled?: boolean;
  badge?: string | number;
  rightAction?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * DrawerItem - Individual row in a mobile Drawer / Bottom Sheet
 * Strictly formatted according to Small Bento Widget anatomy (Rule 6):
 * - Container: horizontal plate `w-full flex items-center p-3.5 md:p-4 rounded-[20px] md:rounded-[24px]`
 * - Left: rounded square shape `w-11 h-11 md:w-12 h-12 rounded-[16px]` with 22-24px icon or custom element
 * - Center: vertical text stack (bold title + explanatory description)
 * - Right: checkmark if active, chevron if submenu/link, or badge
 * - Tactile feedback: `active:bg-white/[0.08] active:scale-[0.99] transition-all`
 */
export const DrawerItem: React.FC<DrawerItemProps> = ({
  label,
  description,
  icon,
  leftElement,
  isActive = false,
  danger = false,
  disabled = false,
  badge,
  rightAction,
  onClick,
  className,
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'w-full flex items-center p-3.5 md:p-4 rounded-[20px] md:rounded-[24px] bg-[#181c23] hover:bg-white/[0.06] active:bg-white/[0.08] active:scale-[0.99] transition-all text-left cursor-pointer border-none outline-none select-none',
        disabled && 'opacity-40 pointer-events-none',
        className
      )}
    >
      {/* 1. Left: Rounded square shape with icon or custom element */}
      {leftElement ? (
        <div className="w-11 h-11 md:w-12 h-12 rounded-[16px] overflow-hidden flex items-center justify-center shrink-0 border-none">
          {leftElement}
        </div>
      ) : icon ? (
        <div
          className={cn(
            'w-11 h-11 md:w-12 h-12 rounded-[16px] flex items-center justify-center shrink-0 border-none transition-colors',
            danger
              ? 'bg-red-500/15 text-red-400'
              : isActive
              ? 'bg-[#14171c] text-[#c0ff00]'
              : 'bg-[#14171c] text-[#8e8e93]'
          )}
        >
          <OneIcon name={icon} size={24} />
        </div>
      ) : null}

      {/* 2. Center: Vertical text stack */}
      <div className={cn('flex flex-col items-start flex-1 min-w-0', (icon || leftElement) && 'ml-3.5')}>
        <span
          className={cn(
            'text-white font-bold text-sm md:text-base leading-snug truncate',
            danger && 'text-red-400'
          )}
        >
          {label}
        </span>
        {description && (
          <span className="text-[#8e8e93] text-xs leading-tight mt-0.5 truncate">
            {description}
          </span>
        )}
      </div>

      {/* 3. Right: Indicator or action */}
      {rightAction !== undefined ? (
        <div className="shrink-0 ml-2">{rightAction}</div>
      ) : isActive ? (
        <OneIcon name="check" size={20} className="text-[#c0ff00] shrink-0 ml-2" />
      ) : badge !== undefined ? (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/5 text-[#8e8e93] shrink-0 ml-2">
          {badge}
        </span>
      ) : (
        <OneIcon name="chevron_right" size={20} className="text-[#8e8e93] shrink-0 ml-2" />
      )}
    </button>
  );
};

export interface ActionMenuItem {
  id?: string;
  label: string;
  description?: string;
  icon?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  badge?: string | number;
  separator?: boolean;
  isActive?: boolean;
}

export interface ActionMenuProps {
  items: ActionMenuItem[];
  trigger?: React.ReactNode;
  icon?: string;
  title?: string;
  description?: string;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  className?: string;
  selectedId?: string;
  onSelect?: (id: string) => void;
}

/**
 * ActionMenu - Adaptive dropdown / action sheet component
 * - Desktop: Classic floating dropdown anchored to trigger with rounded-[20px] bg-[#181c23]
 * - Mobile: Dropdowns do NOT exist. Automatically transforms into a native-feeling Bottom Sheet
 *   with items styled as Small Bento Widgets (rounded square icon shape, title + description, status indicator).
 */
export const ActionMenu: React.FC<ActionMenuProps> = ({
  items,
  trigger,
  icon = 'more_vert',
  title = 'Действия',
  description,
  align = 'end',
  sideOffset = 6,
  className,
  selectedId,
  onSelect,
}) => {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll when mobile bottom sheet is open
  useEffect(() => {
    if (!mobileOpen || !isMobile) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, [mobileOpen, isMobile]);

  // Default Three-dots round icon button trigger
  const defaultTrigger = (
    <button
      type="button"
      className="w-9 h-9 rounded-full aspect-square flex items-center justify-center text-[#8e8e93] hover:text-white hover:bg-white/10 active:scale-95 transition-all focus:outline-none cursor-pointer sf-tap border-none"
      aria-label="Открыть меню действий"
    >
      <OneIcon name={icon} size={20} />
    </button>
  );

  const activeTrigger = trigger || defaultTrigger;

  if (isMobile) {
    return (
      <>
        {/* Mobile Trigger wraps with click to open bottom sheet */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setMobileOpen(true);
          }}
          className="inline-flex cursor-pointer"
        >
          {activeTrigger}
        </div>

        {/* Mobile Bottom Sheet Overlay */}
        {typeof document !== 'undefined' &&
          createPortal(
            <AnimatePresence>
              {mobileOpen && (
                <div className="fixed inset-0 z-50 flex items-end">
                  {/* Backdrop */}
                  <motion.div
                    key="action-menu-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    aria-hidden="true"
                  />

                  {/* Bottom Sheet Drawer */}
                  <motion.div
                    key="action-menu-sheet"
                    drag="y"
                    dragConstraints={{ top: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(_, info) => {
                      if (info.offset.y > 60 || info.velocity.y > 250) {
                        setMobileOpen(false);
                      }
                    }}
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                    className={cn(
                      'fixed inset-x-0 bottom-0 z-50 flex flex-col bg-[#14171c] rounded-t-[32px] rounded-b-none border-none shadow-[0_-12px_48px_rgba(0,0,0,0.85)] max-h-[85vh] select-none focus:outline-none',
                      className
                    )}
                    role="dialog"
                    aria-modal="true"
                  >
                    {/* Top Swipe Handle */}
                    <div className="w-12 h-1 rounded-full bg-white/20 mx-auto mt-3 mb-2 shrink-0 touch-none cursor-grab active:cursor-grabbing" />

                    {/* Header info */}
                    {(title || description) && (
                      <div className="px-6 pt-2 pb-2 text-left">
                        {title && (
                          <h4 className="text-base font-bold text-white tracking-tight">
                            {title}
                          </h4>
                        )}
                        {description && (
                          <p className="text-xs text-[#8e8e93] mt-0.5">{description}</p>
                        )}
                      </div>
                    )}

                    {/* Mobile Touch Rows formatted as Small Bento Widgets */}
                    <div className="p-4 pt-1 flex flex-col gap-2.5 pb-[calc(104px+var(--tma-raw-bottom-inset,env(safe-area-inset-bottom,0px)))] overflow-y-auto no-scrollbar">
                      {items.map((item, idx) => {
                        if (item.separator) {
                          return <div key={`sep-${idx}`} className="my-1.5 h-px bg-white/5" />;
                        }

                        const isItemActive =
                          item.isActive || (selectedId !== undefined && item.id === selectedId);

                        return (
                          <DrawerItem
                            key={item.id || `item-${idx}`}
                            label={item.label}
                            description={item.description}
                            icon={item.icon}
                            isActive={isItemActive}
                            danger={item.danger}
                            disabled={item.disabled}
                            badge={item.badge}
                            onClick={() => {
                              setMobileOpen(false);
                              if (item.id && onSelect) {
                                onSelect(item.id);
                              }
                              item.onClick?.();
                            }}
                          />
                        );
                      })}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body
          )}
      </>
    );
  }

  // DESKTOP: Radix UI Dropdown Menu
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>{activeTrigger}</DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align={align}
          sideOffset={sideOffset}
          className={cn(
            'z-50 min-w-[220px] overflow-hidden rounded-[20px]',
            'bg-[#181c23] p-1.5 text-white shadow-[0_16px_48px_rgba(0,0,0,0.85)] border-none select-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            className
          )}
        >
          {items.map((item, idx) => {
            if (item.separator) {
              return (
                <DropdownMenuPrimitive.Separator
                  key={`sep-${idx}`}
                  className="my-1 h-px bg-white/5"
                />
              );
            }

            const isItemActive =
              item.isActive || (selectedId !== undefined && item.id === selectedId);

            return (
              <DropdownMenuPrimitive.Item
                key={item.id || `item-${idx}`}
                disabled={item.disabled}
                onClick={() => {
                  if (item.id && onSelect) {
                    onSelect(item.id);
                  }
                  item.onClick?.();
                }}
                className={cn(
                  'relative flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm font-medium outline-none transition-colors cursor-pointer select-none',
                  item.danger
                    ? 'text-red-400 hover:bg-red-500/10 focus:bg-red-500/10'
                    : isItemActive
                    ? 'text-[#c0ff00] bg-[#1c222b]'
                    : 'text-[#8e8e93] hover:text-white hover:bg-[#1c222b] focus:text-white focus:bg-[#1c222b]',
                  item.disabled && 'pointer-events-none opacity-40'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.icon && (
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                        item.danger
                          ? 'bg-red-500/15 text-red-400'
                          : isItemActive
                          ? 'bg-[#14171c] text-[#c0ff00]'
                          : 'bg-[#14171c] text-[#8e8e93]'
                      )}
                    >
                      <OneIcon name={item.icon} size={16} />
                    </div>
                  )}
                  <div className="flex flex-col items-start min-w-0">
                    <span
                      className={cn(
                        'truncate text-sm font-semibold',
                        isItemActive
                          ? 'text-white'
                          : item.danger
                          ? 'text-red-400'
                          : 'text-white'
                      )}
                    >
                      {item.label}
                    </span>
                    {item.description && (
                      <span className="text-[11px] text-[#8e8e93] leading-tight truncate">
                        {item.description}
                      </span>
                    )}
                  </div>
                </div>

                {isItemActive ? (
                  <OneIcon name="check" size={18} className="text-[#c0ff00] shrink-0 ml-2" />
                ) : item.badge !== undefined ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/5 text-[#8e8e93] ml-2">
                    {item.badge}
                  </span>
                ) : null}
              </DropdownMenuPrimitive.Item>
            );
          })}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
};

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  badge?: string | number;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  title?: string;
  description?: string;
  className?: string;
  triggerClassName?: string;
}

/**
 * Select - Adaptive selector component
 * - Mobile: opens Bottom Sheet with touch-friendly Small Bento Widget rows and #c0ff00 checkmarks
 * - Desktop: opens compact Radix dropdown menu anchored to pill trigger
 */
export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Выберите...',
  title = 'Выбор',
  description,
  className,
  triggerClassName,
}) => {
  const currentOption = options.find((opt) => opt.value === value);

  return (
    <ActionMenu
      title={title}
      description={description}
      selectedId={value}
      onSelect={onChange}
      className={className}
      items={options.map((opt) => ({
        id: opt.value,
        label: opt.label,
        description: opt.description,
        icon: opt.icon,
        badge: opt.badge,
        isActive: opt.value === value,
        onClick: () => onChange(opt.value),
      }))}
      trigger={
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#14171c] hover:bg-[#181c23] active:scale-95 text-white font-bold text-sm transition-all border-none cursor-pointer select-none sf-tap',
            triggerClassName
          )}
        >
          {currentOption?.icon && (
            <OneIcon name={currentOption.icon} size={18} className="text-[#c0ff00]" />
          )}
          <span className="truncate">{currentOption ? currentOption.label : placeholder}</span>
          <OneIcon name="expand_more" size={18} className="text-[#8e8e93] ml-1 shrink-0" />
        </button>
      }
    />
  );
};
