import React, { useState, useEffect } from 'react';
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
  const activeIndex = mainTabs.findIndex((t) => t.id === currentActiveTab);
  const [prevIndex, setPrevIndex] = useState(activeIndex >= 0 ? activeIndex : 0);

  useEffect(() => {
    if (activeIndex >= 0) {
      setPrevIndex(activeIndex);
    }
  }, [activeIndex]);

  const displayIndex = activeIndex >= 0 ? activeIndex : prevIndex;
  const isPillActive = activeIndex >= 0;
  const isDownloadActive = activeTab === 'onelaunch';

  return (
    <div className={`flex items-center justify-center gap-2 w-full select-none ${className}`}>
      {/* Главный плавающий пилл (Dock с капсулами) */}
      <nav
        className={`bg-[#14171c]/95 backdrop-blur-2xl border border-white/10 p-1.5 rounded-full shadow-2xl relative flex items-center h-[58px] transition-all duration-300 ${
          seasonEnded ? 'w-[210px]' : 'flex-1 min-w-0'
        }`}
      >
        <div className="relative flex items-center w-full h-full">
          {/* Анимированная скользящая капсула (Active Pill Indicator) в темно-серой палитре */}
          <div
            className="absolute top-0 bottom-0 rounded-full transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none z-0"
            style={{
              width: `${100 / mainTabs.length}%`,
              transform: `translate3d(${displayIndex * 100}%, 0, 0)`,
              opacity: isPillActive ? 1 : 0,
            }}
          >
            <div className="w-full h-full rounded-full bg-[#252c37] border border-white/15 shadow-md shadow-black/50" />
          </div>

          {/* Элементы навигации */}
          {mainTabs.map((tab, idx) => {
            const isActive = activeIndex === idx;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative z-10 flex-1 h-full flex flex-col items-center justify-center rounded-full transition-all duration-200 active:scale-95 sf-tap ${
                  isActive ? 'text-white font-bold' : 'text-[#8e8e93] hover:text-white'
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

      {/* Кружок Скачать справа — единая структура, размер и оформление в темно-серой палитре */}
      <div className="h-[58px] w-[58px] shrink-0 bg-[#14171c]/95 backdrop-blur-2xl border border-white/10 p-1.5 rounded-full shadow-2xl flex items-center justify-center relative">
        <button
          onClick={() => onTabChange('onelaunch')}
          className={`w-full h-full rounded-full flex flex-col items-center justify-center transition-all duration-300 active:scale-95 sf-tap relative z-10 ${
            isDownloadActive
              ? 'bg-[#252c37] border border-white/15 text-white shadow-md shadow-black/50 font-bold'
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
