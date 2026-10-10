import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { OneIcon } from './ui/SFSymbol';
import { useIsMobile } from '../ui/utils/useIsMobile';
import { cn } from '../ui/utils/cn';

export interface SeasonSelectorProps {
  seasons: string[];
  selectedSeason: string;
  onSelectSeason: (season: string) => void;
  className?: string;
  triggerClassName?: string;
}

export const SeasonSelector: React.FC<SeasonSelectorProps> = ({
  seasons,
  selectedSeason,
  onSelectSeason,
  className,
  triggerClassName,
}) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Close desktop dropdown on click outside
  useEffect(() => {
    if (!open || isMobile) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, isMobile]);

  // Lock scroll on mobile when sheet is open
  useEffect(() => {
    if (!open || !isMobile) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, [open, isMobile]);

  const handleSelect = (season: string) => {
    onSelectSeason(season);
    setOpen(false);
  };

  return (
    <div className={cn('relative inline-block select-none', className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'bg-[#14171c] hover:bg-[#181c23] py-2 px-4 rounded-full flex items-center gap-2 text-xs font-bold text-white shadow-md active:scale-95 transition-all border-none sf-tap cursor-pointer',
          open && 'bg-[#181c23]',
          triggerClassName
        )}
        aria-label="Выбрать сезон"
      >
        <OneIcon name="inventory_2" size={15} className="text-[#c0ff00]" />
        <span>{selectedSeason}</span>
        <OneIcon
          name="expand_more"
          size={15}
          className={cn(
            'text-[#8e8e93] transition-transform duration-300',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* DESKTOP DROPDOWN */}
      {!isMobile && open && (
        <div className="absolute right-0 mt-2 bg-[#14171c] rounded-[24px] p-2 z-50 shadow-2xl min-w-[170px] flex flex-col gap-1 animate-fade-in border border-white/[0.04]">
          {seasons.map((season) => {
            const isSelected = selectedSeason === season;
            return (
              <button
                key={season}
                type="button"
                onClick={() => handleSelect(season)}
                className={cn(
                  'text-xs text-left px-3.5 py-2.5 rounded-full font-bold transition-all flex items-center justify-between cursor-pointer border-none',
                  isSelected
                    ? 'bg-[#1c222b] text-[#c0ff00]'
                    : 'text-[#8e8e93] hover:text-white hover:bg-white/5'
                )}
              >
                <span>{season}</span>
                {isSelected && <OneIcon name="check" size={14} className="text-[#c0ff00]" />}
              </button>
            );
          })}
        </div>
      )}

      {/* MOBILE BOTTOM SHEET */}
      {isMobile &&
        typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div className="fixed inset-0 z-[70] flex items-end">
                {/* Backdrop */}
                <motion.div
                  key="season-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setOpen(false)}
                  className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70]"
                  aria-hidden="true"
                />

                {/* Bottom Sheet Drawer */}
                <motion.div
                  key="season-sheet"
                  drag="y"
                  dragListener={false}
                  dragControls={dragControls}
                  dragConstraints={{ top: 0 }}
                  dragElastic={0.15}
                  onDragEnd={(_, info) => {
                    if (info.offset.y > 60 || info.velocity.y > 250) {
                      setOpen(false);
                    }
                  }}
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                  className="fixed inset-x-0 bottom-0 z-[75] flex flex-col bg-[#14171c] rounded-t-[32px] rounded-b-none border-none shadow-[0_-16px_50px_rgba(0,0,0,0.9)] max-h-[85dvh] select-none focus:outline-none"
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

                  {/* Sheet Header */}
                  <div className="px-6 pt-1 pb-3 text-left shrink-0">
                    <h4 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                      <OneIcon name="inventory_2" size={20} className="text-[#c0ff00]" />
                      Архив сезонов
                    </h4>
                    <p className="text-xs text-[#8e8e93] mt-0.5">
                      Выберите сезон для просмотра материалов
                    </p>
                  </div>

                  {/* Big Touch-Friendly Rows */}
                  <div className="p-4 pt-1 space-y-2.5 pb-[calc(96px+var(--tma-raw-bottom-inset,env(safe-area-inset-bottom,0px)))] overflow-y-auto no-scrollbar">
                    {seasons.map((season) => {
                      const isSelected = selectedSeason === season;
                      return (
                        <button
                          key={season}
                          type="button"
                          onClick={() => handleSelect(season)}
                          className={cn(
                            'w-full min-h-[62px] px-4 py-3 rounded-[22px] transition-all flex items-center justify-between text-left cursor-pointer border-none outline-none active:scale-[0.98] sf-tap',
                            isSelected
                              ? 'bg-[#c0ff00]/10 text-[#c0ff00]'
                              : 'bg-[#181c23] hover:bg-[#1c222b] active:bg-[#252c37] text-white'
                          )}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={cn(
                                'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors',
                                isSelected
                                  ? 'bg-[#c0ff00] text-black'
                                  : 'bg-[#1c222b] text-[#8e8e93]'
                              )}
                            >
                              <OneIcon name="inventory_2" size={22} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span
                                className={cn(
                                  'text-base font-bold truncate',
                                  isSelected ? 'text-[#c0ff00]' : 'text-white'
                                )}
                              >
                                {season}
                              </span>
                              <span className="text-xs text-[#8e8e93]">
                                {isSelected ? 'Текущий активный архив' : 'Перейти к материалам'}
                              </span>
                            </div>
                          </div>

                          {isSelected ? (
                            <div className="w-8 h-8 rounded-full bg-[#c0ff00]/20 flex items-center justify-center text-[#c0ff00] shrink-0">
                              <OneIcon name="check" size={20} />
                            </div>
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
    </div>
  );
};

export default SeasonSelector;
