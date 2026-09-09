import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
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
  const navRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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

  const effectivePillTab = isPlayersActive
    ? 'players'
    : mainTabs.some((t) => t.id === activeTab)
    ? activeTab
    : null;

  const isDownloadActive = activeTab === 'onelaunch';

  const [indicator, setIndicator] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    opacity: number;
  }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });

  const updateIndicator = () => {
    if (!effectivePillTab) {
      setIndicator((prev) => ({ ...prev, opacity: 0 }));
      return;
    }
    const targetEl = tabRefs.current[effectivePillTab];
    const navEl = navRef.current;
    if (targetEl && navEl) {
      const navRect = navEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      setIndicator({
        left: targetRect.left - navRect.left,
        top: targetRect.top - navRect.top,
        width: targetRect.width,
        height: targetRect.height,
        opacity: 1,
      });
    }
  };

  useLayoutEffect(() => {
    updateIndicator();
  }, [effectivePillTab, seasonEnded]);

  useEffect(() => {
    const raf = requestAnimationFrame(updateIndicator);
    window.addEventListener('resize', updateIndicator);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [effectivePillTab, seasonEnded]);

  return (
    <div className={`flex items-center justify-center gap-2.5 w-full select-none ${className}`}>
      {/* Главный плавающий пилл (Dock с капсулами) */}
      <nav
        ref={navRef}
        className={`bg-[#14171c]/90 backdrop-blur-2xl border border-white/10 p-1.5 rounded-full shadow-2xl relative flex items-center h-[58px] transition-all duration-300 ${
          seasonEnded ? 'w-[210px]' : 'flex-1 min-w-0'
        }`}
      >
        {/* Анимированная скользящая капсула (Active Pill Indicator) */}
        <div
          className="absolute rounded-full bg-[#007aff] shadow-[0_2px_16px_rgba(0,122,255,0.45)] pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{
            transform: `translate3d(${indicator.left}px, ${indicator.top}px, 0)`,
            width: `${indicator.width}px`,
            height: `${indicator.height}px`,
            opacity: indicator.opacity,
          }}
        />

        {/* Элементы навигации */}
        <div className="flex items-center w-full h-full relative z-10">
          {mainTabs.map((tab) => {
            const isActive = effectivePillTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex-1 h-full flex flex-col items-center justify-center rounded-full transition-all duration-200 active:scale-95 sf-tap ${
                  isActive ? 'text-white font-semibold' : 'text-[#8e8e93] hover:text-white'
                }`}
              >
                <SFSymbol
                  name={tab.icon}
                  size={20}
                  className={`transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-[#8e8e93]'
                  }`}
                />
                <span
                  className={`text-[9px] font-bold tracking-tight mt-0.5 whitespace-nowrap transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-[#8e8e93]'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Кружок Скачать справа — единая структура, размер и оформление с навбаром */}
      <div className="h-[58px] w-[58px] shrink-0 bg-[#14171c]/90 backdrop-blur-2xl border border-white/10 p-1.5 rounded-full shadow-2xl flex items-center justify-center relative">
        <button
          onClick={() => onTabChange('onelaunch')}
          className={`w-full h-full rounded-full flex flex-col items-center justify-center transition-all duration-300 active:scale-95 sf-tap relative z-10 ${
            isDownloadActive
              ? 'bg-[#007aff] text-white shadow-[0_2px_16px_rgba(0,122,255,0.45)] font-semibold'
              : 'text-[#8e8e93] hover:text-white'
          }`}
          title="Скачать лаунчер OneLaunch"
        >
          <SFSymbol
            name="arrow.down.circle.fill"
            size={20}
            className={`transition-colors duration-200 ${
              isDownloadActive ? 'text-white' : 'text-[#8e8e93]'
            }`}
          />
          <span
            className={`text-[9px] font-bold tracking-tight mt-0.5 whitespace-nowrap transition-colors duration-200 ${
              isDownloadActive ? 'text-white' : 'text-[#8e8e93]'
            }`}
          >
            Скачать
          </span>
        </button>
      </div>
    </div>
  );
}
