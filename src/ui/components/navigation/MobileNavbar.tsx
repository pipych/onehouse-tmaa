import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { cn } from '../../utils/cn';
import { Icon } from '../Icon';
import { MobileNavbarProps } from './types';

const MAX_MOBILE_ITEMS = 5;

/**
 * MobileNavbar (Mobile Bottom TabBar) - Direct transfer from OneHouse architecture.
 * - Strict Pill Capsule shape (rounded-full)
 * - Translucent Glass surface (bg-[#14171c]/90 backdrop-blur-2xl border border-white/[0.04])
 * - Sliding active pill indicator with cubic-bezier transition
 * - Hard limit: STRICTLY MAXIMUM 5 ITEMS (enforces ergonomic thumb reach)
 * - Safe area inset & perfect vertical clearance for MobileActionBtn (FAB at bottom-24)
 */
export const MobileNavbar: React.FC<MobileNavbarProps> = ({
  items,
  activeId,
  onChange,
  className,
  isStatic = false,
  maxWidthClass = 'max-w-md',
  extraAction,
}) => {
  // Safe slice to prevent breaking layout under any circumstances
  const displayItems = items.slice(0, MAX_MOBILE_ITEMS);

  // Dev-mode check enforcing maximum 5 items rule
  useEffect(() => {
    if (items.length > MAX_MOBILE_ITEMS) {
      console.warn(
        `[OneWebUI MobileNavbar]: MobileNavbar supports a maximum of 5 items for finger ergonomics and optimal spacing. Received ${items.length} items. Only the first 5 will be displayed on mobile.`
      );
    }
  }, [items.length]);

  const navRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const [pillRect, setPillRect] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const updatePill = useCallback(() => {
    const activeEl = tabRefs.current[activeId];
    const navEl = navRef.current;
    if (activeEl && navEl) {
      const navBox = navEl.getBoundingClientRect();
      const activeBox = activeEl.getBoundingClientRect();
      const left = activeBox.left - navBox.left;
      const width = activeBox.width;
      setPillRect((prev) => {
        if (
          prev.ready &&
          Math.abs(prev.left - left) < 0.5 &&
          Math.abs(prev.width - width) < 0.5
        ) {
          return prev;
        }
        return { left, width, ready: true };
      });
    } else {
      setPillRect((prev) => {
        if (!prev.ready) return prev;
        return { ...prev, ready: false };
      });
    }
  }, [activeId]);

  useLayoutEffect(() => {
    updatePill();
  }, [activeId, displayItems.length, extraAction?.id]);

  useEffect(() => {
    updatePill();
    const navEl = navRef.current;
    if (!navEl || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      updatePill();
    });
    ro.observe(navEl);
    window.addEventListener('resize', updatePill);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updatePill);
    };
  }, [activeId, displayItems.length, extraAction?.id]);

  return (
    <div
      className={cn(
        isStatic
          ? 'w-full'
          : 'fixed bottom-2 pb-[var(--tma-raw-bottom-inset,env(safe-area-inset-bottom,0px))] left-3 right-3 sm:left-4 sm:right-4 z-[999999] flex items-center justify-center pointer-events-none transition-all duration-300',
        className
      )}
    >
      <nav
        className={cn(
          'bg-[#14171c]/90 backdrop-blur-2xl border border-white/[0.04] p-1.5 rounded-full shadow-2xl relative flex items-center h-[70px] select-none w-full pointer-events-auto transition-all duration-300',
          maxWidthClass
        )}
      >
        <div ref={navRef} className="relative flex items-center w-full h-full">
          {/* Animated Sliding Pill Indicator (Solid background without border) */}
          <div
            className={cn(
              'absolute top-0 bottom-0 rounded-full transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none z-0',
              pillRect.ready ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              transform: `translate3d(${pillRect.left}px, 0, 0)`,
              width: `${pillRect.width}px`,
            }}
          >
            <div className="w-full h-full rounded-full bg-[#252c37]" />
          </div>

          {/* Main Navigation Items (Equally distributed flex columns) */}
          <div className="flex items-center flex-1 h-full min-w-0">
            {displayItems.map((tab) => {
              const isActive = activeId === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  onClick={() => onChange(tab.id)}
                  disabled={tab.disabled}
                  className={cn(
                    'relative z-10 flex-1 h-full min-w-0 flex flex-col items-center justify-center rounded-full transition-all duration-200 active:scale-90 sf-tap px-1 group',
                    isActive ? 'text-[#c0ff00] font-bold' : 'text-[#8e8e93] hover:text-white',
                    tab.disabled && 'opacity-35 cursor-not-allowed pointer-events-none'
                  )}
                  aria-label={tab.label}
                  aria-selected={isActive}
                  role="tab"
                >
                  <div className="relative flex items-center justify-center transition-transform duration-150 active:scale-90 group-active:scale-90">
                    <Icon
                      name={tab.icon}
                      size={24}
                      className={cn(
                        'transition-all duration-300',
                        isActive ? 'text-[#c0ff00]' : 'text-[#8e8e93]'
                      )}
                    />
                    {tab.badge !== undefined && (
                      <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#c0ff00] text-[#090b0e] text-[10px] font-black flex items-center justify-center leading-none shadow-sm">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-bold tracking-tight mt-1 whitespace-nowrap transition-colors duration-200 truncate max-w-full px-0.5',
                      isActive ? 'text-[#c0ff00]' : 'text-[#8e8e93]'
                    )}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Optional Extra Action Slot with OneHouse Divider (e.g. Download or Custom) */}
          {extraAction && (
            <>
              <div className="w-px h-6 bg-white/10 mx-1 shrink-0 pointer-events-none z-10" />
              <div className="shrink-0 h-full w-[76px] flex items-center justify-center">
                <button
                  ref={(el) => {
                    tabRefs.current[extraAction.id] = el;
                  }}
                  onClick={() => {
                    if (extraAction.onClick) extraAction.onClick();
                    onChange(extraAction.id);
                  }}
                  className={cn(
                    'relative z-10 w-full h-full flex flex-col items-center justify-center rounded-full transition-all duration-200 active:scale-90 sf-tap px-1 group',
                    activeId === extraAction.id
                      ? 'text-[#c0ff00] font-bold'
                      : 'text-[#8e8e93] hover:text-white'
                  )}
                  title={extraAction.label}
                  aria-label={extraAction.label}
                  role="tab"
                >
                  <div className="relative flex items-center justify-center transition-transform duration-150 active:scale-90 group-active:scale-90">
                    <Icon
                      name={extraAction.icon}
                      size={24}
                      className={cn(
                        'transition-all duration-300',
                        activeId === extraAction.id
                          ? 'text-[#c0ff00]'
                          : 'text-[#8e8e93]'
                      )}
                    />
                    {extraAction.badge !== undefined && (
                      <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#c0ff00] text-[#090b0e] text-[10px] font-black flex items-center justify-center leading-none">
                        {extraAction.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-bold tracking-tight mt-1 whitespace-nowrap transition-colors duration-200 truncate max-w-full px-0.5',
                      activeId === extraAction.id ? 'text-[#c0ff00]' : 'text-[#8e8e93]'
                    )}
                  >
                    {extraAction.label}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </nav>
    </div>
  );
};
