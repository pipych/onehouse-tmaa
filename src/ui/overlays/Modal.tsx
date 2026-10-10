import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { OneIcon } from '../components/Icon';
import { useIsMobile } from '../utils/useIsMobile';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /**
   * If true (or if cancel actions are provided in footer), the top-right cross icon on desktop is strictly hidden.
   * If false, displays the close cross aligned to top-6 right-6.
   * On mobile, the close cross is NEVER displayed under any circumstances.
   */
  hasCancelAction?: boolean;
  maxWidth?: string;
  className?: string;
}

/**
 * OneWebUI Unified Overlay (Modal / Drawer)
 * - Desktop: Centered modal (fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2), rounded-[32px], bg-[#14171c]
 *   * If hasCancelAction: top-right cross is strictly hidden.
 *   * If no cancel action: top-right close cross with OneIcon name="close" at top-6 right-6.
 * - Mobile: Bottom Sheet (Drawer) sliding from bottom (rounded-t-[32px]), swipe-down to dismiss,
 *   touch handle bar, strictly NO close cross, and pb-28 offset to prevent overlap with MobileNavbar.
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  hasCancelAction = false,
  maxWidth = 'max-w-lg',
  className,
}) => {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // Escape key listener for desktop & accessible devices
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with blur & smooth fade */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Device-Specific Presentation */}
          {isMobile ? (
            /* MOBILE: Bottom Sheet / Drawer */
            <motion.div
              key="modal-drawer"
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 75 || info.velocity.y > 300) {
                  onClose();
                }
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className={cn(
                'fixed inset-x-0 bottom-0 z-50 flex flex-col bg-[#14171c] rounded-t-[32px] rounded-b-none border-none shadow-[0_-12px_48px_rgba(0,0,0,0.85)] focus:outline-none max-h-[85vh] select-none',
                className
              )}
              role="dialog"
              aria-modal="true"
            >
              {/* Top Swipe Indicator (Handle Bar) */}
              <div className="w-12 h-1 rounded-full bg-white/20 mx-auto mt-3 mb-2 shrink-0 touch-none cursor-grab active:cursor-grabbing" />

              {/* Mobile Content Area with pb-28 safe clearance above floating MobileNavbar */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-2 pb-28 space-y-4">
                {(title || description) && (
                  <div className="space-y-1.5 text-left mb-2">
                    {title && (
                      <h3 className="text-xl font-bold tracking-tight text-white leading-snug">
                        {title}
                      </h3>
                    )}
                    {description && (
                      <p className="text-xs sm:text-sm text-[#8e8e93] leading-relaxed">
                        {description}
                      </p>
                    )}
                  </div>
                )}

                {/* Body Content */}
                {children && <div className="text-sm text-[#8e8e93]">{children}</div>}

                {/* Footer Actions */}
                {footer && (
                  <div className="pt-3 flex flex-col gap-2 mt-4">
                    {footer}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* DESKTOP: Centered Floating Modal */
            <motion.div
              key="modal-desktop"
              initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-48%' }}
              animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
              exit={{ opacity: 0, scale: 0.95, x: '-50%', y: '-48%' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'fixed left-1/2 top-1/2 z-50 w-full',
                maxWidth,
                'bg-[#14171c] p-6 sm:p-7 rounded-[32px] border-none shadow-[0_20px_60px_rgba(0,0,0,0.9)] focus:outline-none select-none max-h-[90vh] overflow-y-auto no-scrollbar',
                className
              )}
              role="dialog"
              aria-modal="true"
            >
              {/* Optional Desktop Close Cross: strictly hidden if hasCancelAction is true */}
              {!hasCancelAction && (
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-6 right-6 w-9 h-9 rounded-full flex items-center justify-center text-[#8e8e93] hover:text-white hover:bg-white/10 active:scale-95 transition-all focus:outline-none cursor-pointer sf-tap z-10"
                  aria-label="Закрыть модальное окно"
                >
                  <OneIcon name="close" size={20} />
                </button>
              )}

              {/* Title & Description */}
              {(title || description) && (
                <div className="space-y-1.5 text-left pr-8 mb-4">
                  {title && (
                    <h3 className="text-xl font-bold tracking-tight text-white leading-snug">
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p className="text-sm text-[#8e8e93] leading-relaxed">{description}</p>
                  )}
                </div>
              )}

              {/* Body Content */}
              {children && <div className="text-sm text-[#8e8e93] mb-5">{children}</div>}

              {/* Footer Actions */}
              {footer && (
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/5">
                  {footer}
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

/**
 * Drawer alias for mobile-first bottom sheet overlay
 */
export const Drawer = Modal;
export type DrawerProps = ModalProps;
