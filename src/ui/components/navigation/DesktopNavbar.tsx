import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { cn } from '../../utils/cn';
import { Icon } from '../Icon';
import { AppLogo } from '../AppLogo';
import { DesktopNavbarProps } from './types';

/**
 * DesktopNavbar - Direct 1:1 transfer from OneDash architecture.
 * - Vertical floating dock navbar with OneDash branding
 * - Collapse / Expand toggle button (68px icon dock vs 220px expanded)
 * - Animated sliding vertical pill indicator (cubic-bezier)
 * - Micro-animations: tactile tap/click feedback (active:scale-95 and active:scale-90 for icons)
 * - STRICTLY NO GLOW: flat solid #c0ff00 active color without drop-shadow, blur or glow
 */
export const DesktopNavbar: React.FC<DesktopNavbarProps> = ({
  items,
  activeId,
  onChange,
  logo,
  title = 'OneDash',
  className,
  isStatic = false,
  isCollapsed: controlledCollapsed,
  defaultCollapsed = false,
  onToggleCollapse,
}) => {
  // Local or controlled collapse state
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('onedash_sidebar_collapsed');
      if (saved !== null) return saved === 'true';
    } catch {}
    return defaultCollapsed;
  });

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const toggleExpand = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('onedash_sidebar_collapsed', String(next));
        } catch {}
        return next;
      });
    }
  };

  const navRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const [pillRect, setPillRect] = useState<{ top: number; height: number; ready: boolean }>({
    top: 0,
    height: 0,
    ready: false,
  });

  const updatePill = useCallback(() => {
    const activeEl = tabRefs.current[activeId];
    const navEl = navRef.current;
    if (activeEl && navEl) {
      const navBox = navEl.getBoundingClientRect();
      const activeBox = activeEl.getBoundingClientRect();
      const top = activeBox.top - navBox.top;
      const height = activeBox.height;
      setPillRect((prev) => {
        if (
          prev.ready &&
          Math.abs(prev.top - top) < 0.5 &&
          Math.abs(prev.height - height) < 0.5
        ) {
          return prev;
        }
        return { top, height, ready: true };
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
  }, [activeId, isCollapsed, items.length]);

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
  }, [activeId, isCollapsed, items.length]);

  return (
    <aside
      className={cn(
        isStatic ? 'relative h-auto' : 'sticky top-0 h-screen',
        'shrink-0 p-3 sm:p-4 flex flex-col justify-start select-none z-40',
        className
      )}
    >
      {/* 1. Блок над навбаром: Логотип и белое название OneDash */}
      <div
        className={cn(
          'flex items-center h-10 mb-3 transition-all duration-300',
          isCollapsed ? 'justify-center w-[68px]' : 'justify-start w-[220px] pl-[18px] pr-3'
        )}
        style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {logo || <AppLogo className="w-6 h-6 text-[#c0ff00] shrink-0" />}

          {!isCollapsed && (
            <span className="text-base font-black tracking-tight text-white whitespace-nowrap animate-fade-in">
              {title}
            </span>
          )}
        </div>
      </div>

      {/* 2. Плавающий вертикальный пилл навбара OneDash */}
      <nav
        className={cn(
          'bg-[#14171c]/95 backdrop-blur-2xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.8)] border border-white/5 relative flex flex-col items-stretch transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]',
          isCollapsed ? 'w-[68px] rounded-[34px]' : 'w-[220px] rounded-[28px]'
        )}
      >
        {/* Кнопка сворачивания в самом верху навбара */}
        <button
          type="button"
          onClick={toggleExpand}
          style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
          className={cn(
            'h-9 w-full rounded-full flex items-center text-[#8e8e93] hover:text-white hover:bg-white/5 transition-all sf-tap group mb-1.5 active:scale-95',
            isCollapsed ? 'justify-center px-0' : '!justify-start justify-start pl-3 pr-2'
          )}
          title={isCollapsed ? 'Развернуть' : 'Свернуть'}
        >
          <div className="w-6 h-6 flex items-center justify-center shrink-0 transition-transform duration-150 active:scale-90 group-active:scale-90">
            <Icon
              name={isCollapsed ? 'left_panel_open' : 'left_panel_close'}
              size={20}
              className="text-[#8e8e93] group-hover:text-white transition-colors"
            />
          </div>
          {!isCollapsed && (
            <span className="text-xs font-semibold tracking-tight ml-3 whitespace-nowrap text-left text-[#8e8e93] group-hover:text-white transition-colors">
              Свернуть
            </span>
          )}
          {isCollapsed && (
            <div className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#171b22]/95 backdrop-blur-xl border border-white/10 text-white text-xs font-bold shadow-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 whitespace-nowrap z-50">
              <span className="text-[#8e8e93]">Развернуть</span>
            </div>
          )}
        </button>

        {/* Область вкладок со скользящей активной капсулой OneDash */}
        <div ref={navRef} className="relative flex flex-col gap-1 w-full min-w-0">
          {/* Скользящая активная капсула (Flat, No Glow) */}
          <div
            className={cn(
              'absolute left-0 right-0 rounded-full transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none z-0',
              pillRect.ready ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              transform: `translate3d(0, ${pillRect.top}px, 0)`,
              height: `${pillRect.height}px`,
            }}
          >
            <div className="w-full h-full rounded-full bg-[#252c37]" />
          </div>

          {/* Вкладки: иконка и текст выровнены строго по левой стороне */}
          {items.map((tab) => {
            const isActive = activeId === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                onClick={() => onChange(tab.id)}
                disabled={tab.disabled}
                style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
                className={cn(
                  'relative z-10 h-[50px] w-full rounded-full flex items-center transition-all duration-200 sf-tap group active:scale-95',
                  isCollapsed ? 'justify-center px-0' : '!justify-start justify-start pl-3',
                  isActive ? 'text-[#c0ff00] font-bold' : 'text-[#8e8e93] hover:text-white',
                  tab.disabled && 'opacity-35 cursor-not-allowed pointer-events-none'
                )}
                aria-label={tab.label}
                aria-selected={isActive}
                role="tab"
              >
                {/* Иконка с микроанимацией тактильного сжатия при клике */}
                <div className="w-6 h-6 flex items-center justify-center shrink-0 transition-transform duration-150 active:scale-90 group-active:scale-90">
                  <Icon
                    name={tab.icon}
                    size={22}
                    className={cn(
                      'transition-all duration-300',
                      isActive ? 'text-[#c0ff00]' : 'text-[#8e8e93] group-hover:text-white'
                    )}
                  />
                </div>

                {!isCollapsed && (
                  <span
                    className={cn(
                      'text-sm font-bold tracking-tight ml-3 whitespace-nowrap text-left transition-colors duration-200 truncate',
                      isActive ? 'text-[#c0ff00]' : 'text-white/80 group-hover:text-white'
                    )}
                  >
                    {tab.label}
                  </span>
                )}

                {/* Badge */}
                {tab.badge !== undefined && !isCollapsed && (
                  <span className="ml-auto mr-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#c0ff00]/15 text-[#c0ff00] leading-none">
                    {tab.badge}
                  </span>
                )}

                {/* Всплывающая подсказка в свернутом виде */}
                {isCollapsed && (
                  <div className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#171b22]/95 backdrop-blur-xl border border-white/10 text-white text-xs font-bold shadow-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 whitespace-nowrap z-50">
                    <span className={isActive ? 'text-[#c0ff00]' : 'text-white'}>
                      {tab.label}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </aside>
  );
};
