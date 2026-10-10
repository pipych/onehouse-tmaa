import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { OneIcon } from '../ui/SFSymbol';
import { cn } from '../../ui/utils/cn';

export interface MobileTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  seasonEnded?: boolean;
  isPlayersActive?: boolean;
  className?: string;
}

interface TabItem {
  id: string;
  label: string;
  icon: string;
}

const MAX_MOBILE_ITEMS = 5;

export function MobileTabBar({
  activeTab,
  onTabChange,
  seasonEnded = false,
  isPlayersActive = false,
  className = '',
}: MobileTabBarProps) {
  // Main tabs (4 items) + Download tab (1 item) = exactly 5 items
  const mainTabs: TabItem[] = seasonEnded
    ? [
        { id: 'profile', label: 'Главная', icon: 'home' },
        { id: 'archive', label: 'Архив', icon: 'inventory_2' },
      ]
    : [
        { id: 'profile', label: 'Главная', icon: 'home' },
        { id: 'media', label: 'Медиа', icon: 'newspaper' },
        { id: 'svod', label: 'Свод', icon: 'description' },
        { id: 'players', label: 'Игроки', icon: 'group' },
      ];

  const currentActiveTab = isPlayersActive && activeTab !== 'profile' ? 'players' : activeTab;
  const isDownloadActive = activeTab === 'onelaunch';

  const navRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const [pillRect, setPillRect] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const updatePill = useCallback(() => {
    const activeEl = tabRefs.current[currentActiveTab];
    const navEl = navRef.current;
    if (activeEl && navEl) {
      const navBox = navEl.getBoundingClientRect();
      const activeBox = activeEl.getBoundingClientRect();
      setPillRect({
        left: activeBox.left - navBox.left,
        width: activeBox.width,
        ready: true,
      });
    } else {
      setPillRect((prev) => ({ ...prev, ready: false }));
    }
  }, [currentActiveTab]);

  useLayoutEffect(() => {
    updatePill();
  }, [updatePill]);

  useEffect(() => {
    updatePill();
    const navEl = navRef.current;
    if (!navEl) return;
    const ro = new ResizeObserver(() => {
      updatePill();
    });
    ro.observe(navEl);
    window.addEventListener('resize', updatePill);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updatePill);
    };
  }, [updatePill]);

  return (
    <div
      className={cn(
        'fixed bottom-2 pb-[var(--tma-raw-bottom-inset,env(safe-area-inset-bottom,0px))] left-3 right-3 sm:left-4 sm:right-4 z-[999999] flex items-center justify-center pointer-events-none select-none transition-all duration-300',
        className
      )}
    >
      <nav
        className={cn(
          'bg-[#14171c]/90 backdrop-blur-2xl border border-white/[0.04] p-1.5 rounded-full shadow-2xl relative flex items-center h-[70px] transition-all duration-300 w-full pointer-events-auto',
          seasonEnded ? 'max-w-[340px]' : 'max-w-md'
        )}
      >
        <div ref={navRef} className="relative flex items-center w-full h-full">
          {/* Animated Sliding Pill Indicator without border */}
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

          {/* Main navigation tabs (flex-1 evenly divided) */}
          <div className="flex items-center flex-1 h-full min-w-0">
            {mainTabs.map((tab) => {
              const isActive = currentActiveTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    'relative z-10 flex-1 h-full min-w-0 flex flex-col items-center justify-center rounded-full transition-all duration-200 active:scale-90 sf-tap px-1 group',
                    isActive ? 'text-[#c0ff00] font-bold' : 'text-[#8e8e93] hover:text-white'
                  )}
                  aria-label={tab.label}
                  role="tab"
                >
                  <div className="relative flex items-center justify-center transition-transform duration-150 active:scale-90 group-active:scale-90">
                    <OneIcon
                      name={tab.icon}
                      size={24}
                      className={cn(
                        'transition-all duration-300',
                        isActive ? 'text-[#c0ff00]' : 'text-[#8e8e93]'
                      )}
                    />
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

          {/* Subtle vertical divider before Download action */}
          <div className="w-px h-6 bg-white/[0.06] mx-1 shrink-0 pointer-events-none z-10" />

          {/* Download Launcher Tab (5th slot) */}
          <div className="shrink-0 h-full w-[80px] flex items-center justify-center">
            <button
              ref={(el) => {
                tabRefs.current['onelaunch'] = el;
              }}
              onClick={() => onTabChange('onelaunch')}
              className={cn(
                'relative z-10 w-full h-full flex flex-col items-center justify-center rounded-full transition-all duration-200 active:scale-90 sf-tap px-1 group',
                isDownloadActive ? 'text-[#c0ff00] font-bold' : 'text-[#8e8e93] hover:text-white'
              )}
              title="Скачать лаунчер OneLaunch"
              aria-label="Скачать"
              role="tab"
            >
              <div className="relative flex items-center justify-center transition-transform duration-150 active:scale-90 group-active:scale-90">
                <OneIcon
                  name="arrow_circle_down"
                  size={24}
                  className={cn(
                    'transition-all duration-300',
                    isDownloadActive ? 'text-[#c0ff00]' : 'text-[#8e8e93]'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] font-bold tracking-tight mt-1 whitespace-nowrap transition-colors duration-200 truncate max-w-full px-0.5',
                  isDownloadActive ? 'text-[#c0ff00]' : 'text-[#8e8e93]'
                )}
              >
                Скачать
              </span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
