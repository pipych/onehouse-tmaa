import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { SFSymbol } from '../ui/SFSymbol';

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

export function MobileTabBar({
  activeTab,
  onTabChange,
  seasonEnded = false,
  isPlayersActive = false,
  className = '',
}: MobileTabBarProps) {
  const mainTabs: TabItem[] = seasonEnded
    ? [
        { id: 'profile', label: 'Главная', icon: 'house.fill' },
        { id: 'archive', label: 'Архив', icon: 'archivebox.fill' },
      ]
    : [
        { id: 'profile', label: 'Главная', icon: 'house.fill' },
        { id: 'media', label: 'Медиа', icon: 'newspaper.fill' },
        { id: 'svod', label: 'Свод', icon: 'doc.text.fill' },
        { id: 'treasury', label: 'Казна', icon: 'building.columns.fill' },
        { id: 'players', label: 'Игроки', icon: 'person.2.fill' },
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
    <div className={`flex items-center justify-center w-full select-none ${className}`}>
      {/* Главный плавающий пилл (Dock с табами и разделом Скачать) */}
      <nav
        className={`bg-[#14171c]/95 backdrop-blur-2xl border border-white/10 p-1.5 rounded-full shadow-2xl relative flex items-center h-[70px] transition-all duration-300 w-full ${
          seasonEnded ? 'max-w-[340px]' : 'max-w-md'
        }`}
      >
        <div ref={navRef} className="relative flex items-center w-full h-full">
          {/* Анимированная скользящая капсула (Active Pill Indicator) БЕЗ ОБВОДКИ */}
          <div
            className={`absolute top-0 bottom-0 rounded-full transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none z-0 ${
              pillRect.ready ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: `translate3d(${pillRect.left}px, 0, 0)`,
              width: `${pillRect.width}px`,
            }}
          >
            <div className="w-full h-full rounded-full bg-[#252c37] sf-pill-glow" />
          </div>

          {/* Основные вкладки */}
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
                  className={`relative z-10 flex-1 h-full flex flex-col items-center justify-center rounded-full transition-all duration-200 active:scale-95 sf-tap ${
                    isActive ? 'text-[#c0ff00] font-bold' : 'text-[#8e8e93] hover:text-white'
                  }`}
                >
                  <SFSymbol
                    name={tab.icon}
                    size={26}
                    className={`transition-all duration-300 ${
                      isActive ? 'sf-glow-green' : 'text-[#8e8e93]'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-bold tracking-tight mt-1 whitespace-nowrap transition-colors duration-200 ${
                      isActive ? 'text-[#c0ff00]' : 'text-[#8e8e93]'
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Тонкий вертикальный разделитель */}
          <div className="w-px h-6 bg-white/10 mx-1 shrink-0 pointer-events-none z-10" />

          {/* Раздел Скачать — форма широкого пила, шейп переезжает сюда плавно */}
          <div className="shrink-0 h-full w-[86px] flex items-center justify-center">
            <button
              ref={(el) => {
                tabRefs.current['onelaunch'] = el;
              }}
              onClick={() => onTabChange('onelaunch')}
              className={`relative z-10 w-full h-full flex flex-col items-center justify-center rounded-full transition-all duration-200 active:scale-95 sf-tap ${
                isDownloadActive ? 'text-[#c0ff00] font-bold' : 'text-[#8e8e93] hover:text-white'
              }`}
              title="Скачать лаунчер OneLaunch"
            >
              <SFSymbol
                name="arrow.down.circle.fill"
                size={26}
                className={`transition-all duration-300 ${
                  isDownloadActive ? 'sf-glow-green' : 'text-[#8e8e93]'
                }`}
              />
              <span
                className={`text-[10px] font-bold tracking-tight mt-1 whitespace-nowrap transition-colors duration-200 ${
                  isDownloadActive ? 'text-[#c0ff00]' : 'text-[#8e8e93]'
                }`}
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
