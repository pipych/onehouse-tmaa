import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { cn } from '../utils/cn';
import { OneIcon } from '../components/Icon';
import { useIsMobile } from '../utils/useIsMobile';

export interface ActionMenuItem {
  id?: string;
  label: string;
  icon?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  badge?: string | number;
  separator?: boolean;
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
}

/**
 * ActionMenu - Adaptive dropdown / action sheet component
 * - Desktop: Classic floating dropdown anchored to trigger with rounded-[20px] bg-[#181c23]
 * - Mobile: Dropdowns do NOT exist. Automatically transforms into a native-feeling Bottom Sheet
 *   with large touch-friendly rows, swipe-down gesture, and clearance above the floating MobileNavbar.
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
}) => {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const dragControls = useDragControls();

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
      className="w-9 h-9 rounded-full aspect-square flex items-center justify-center text-[#8e8e93] hover:text-white hover:bg-white/10 active:scale-95 transition-all focus:outline-none cursor-pointer sf-tap"
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
                <div className="fixed inset-0 z-[70] flex items-end">
                  {/* Backdrop */}
                  <motion.div
                    key="action-menu-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
                    aria-hidden="true"
                  />

                  {/* Bottom Sheet Drawer */}
                  <motion.div
                    key="action-menu-sheet"
                    drag="y"
                    dragListener={false}
                    dragControls={dragControls}
                    dragConstraints={{ top: 0 }}
                    dragElastic={0.15}
                    onDragEnd={(_, info) => {
                      if (info.offset.y > 60 || info.velocity.y > 250) {
                        setMobileOpen(false);
                      }
                    }}
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                    className={cn(
                      'fixed inset-x-0 bottom-0 z-[75] flex flex-col bg-[#14171c] rounded-t-[32px] rounded-b-none border-none shadow-[0_-16px_50px_rgba(0,0,0,0.9)] max-h-[85dvh] select-none focus:outline-none',
                      className
                    )}
                    role="dialog"
                    aria-modal="true"
                  >
                    {/* Swipe Handle Area */}
                    <div
                      onPointerDown={(e) => dragControls.start(e)}
                      className="w-full pt-3.5 pb-2 cursor-grab active:cursor-grabbing touch-none flex flex-col items-center shrink-0"
                    >
                      <div className="w-12 h-1.5 rounded-full bg-white/25" />
                    </div>

                    {/* Header info */}
                    {(title || description) && (
                      <div className="px-6 pt-1 pb-3 text-left shrink-0">
                        {title && (
                          <h4 className="text-lg font-black text-white tracking-tight">
                            {title}
                          </h4>
                        )}
                        {description && (
                          <p className="text-xs text-[#8e8e93] mt-0.5">{description}</p>
                        )}
                      </div>
                    )}

                    {/* Mobile Touch Rows - Big, prominent OneWebUI buttons */}
                    <div className="p-4 pt-1 space-y-2.5 pb-[calc(96px+var(--tma-raw-bottom-inset,env(safe-area-inset-bottom,0px)))] overflow-y-auto no-scrollbar">
                      {items.map((item, idx) => {
                        if (item.separator) {
                          return <div key={`sep-${idx}`} className="my-2 h-px bg-white/5" />;
                        }

                        return (
                          <button
                            key={item.id || `item-${idx}`}
                            type="button"
                            disabled={item.disabled}
                            onClick={() => {
                              setMobileOpen(false);
                              item.onClick?.();
                            }}
                            className={cn(
                              'w-full min-h-[58px] px-4 py-3 rounded-[22px] bg-[#181c23] hover:bg-[#1c222b] active:bg-[#252c37] active:scale-[0.98] transition-all flex items-center justify-between text-left cursor-pointer border-none outline-none sf-tap',
                              item.disabled && 'opacity-40 pointer-events-none'
                            )}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              {item.icon && (
                                <div
                                  className={cn(
                                    'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors',
                                    item.danger
                                      ? 'bg-red-500/15 text-red-400'
                                      : 'bg-[#1c222b] text-[#8e8e93]'
                                  )}
                                >
                                  <OneIcon name={item.icon} size={22} />
                                </div>
                              )}
                              <span
                                className={cn(
                                  'text-base font-bold truncate',
                                  item.danger ? 'text-red-400' : 'text-white'
                                )}
                              >
                                {item.label}
                              </span>
                            </div>

                            {item.badge !== undefined ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/5 text-[#8e8e93]">
                                {item.badge}
                              </span>
                            ) : (
                              <OneIcon
                                name="chevron_right"
                                size={20}
                                className="text-white/20 shrink-0"
                              />
                            )}
                          </button>
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
            'z-50 min-w-[200px] overflow-hidden rounded-[20px]',
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

            return (
              <DropdownMenuPrimitive.Item
                key={item.id || `item-${idx}`}
                disabled={item.disabled}
                onClick={item.onClick}
                className={cn(
                  'relative flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium outline-none transition-colors cursor-pointer select-none',
                  item.danger
                    ? 'text-red-400 hover:bg-red-500/10 focus:bg-red-500/10'
                    : 'text-[#8e8e93] hover:text-white hover:bg-[#1c222b] focus:text-white focus:bg-[#1c222b]',
                  item.disabled && 'pointer-events-none opacity-40'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.icon && (
                    <OneIcon
                      name={item.icon}
                      size={18}
                      className={item.danger ? 'text-red-400' : 'text-[#8e8e93]'}
                    />
                  )}
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/5 text-[#8e8e93]">
                    {item.badge}
                  </span>
                )}
              </DropdownMenuPrimitive.Item>
            );
          })}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
};
