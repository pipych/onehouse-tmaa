import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { OneIcon } from '../ui/SFSymbol';
import { AppLogo } from '../../ui/components/AppLogo';
import { cn } from '../../ui/utils/cn';

export interface DesktopNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  seasonEnded?: boolean;
  currentUser?: any;
  isAdmin?: boolean;
  onAdminClick?: () => void;
  onProfileClick?: () => void;
  className?: string;
}

export function DesktopNavbar({
  activeTab,
  onTabChange,
  seasonEnded = false,
  currentUser,
  isAdmin = false,
  onAdminClick,
  onProfileClick,
  className,
}: DesktopNavbarProps) {
  const tabs = seasonEnded
    ? [
        { id: 'profile', label: 'Главная', icon: 'home' },
        { id: 'archive', label: 'Архив', icon: 'inventory_2' },
      ]
    : [
        { id: 'profile', label: 'Главная', icon: 'home' },
        { id: 'media', label: 'Медиа', icon: 'newspaper' },
        { id: 'svod', label: 'Свод', icon: 'description' },
        { id: 'players', label: 'Игроки', icon: 'group' },
        { id: 'archive', label: 'Архив', icon: 'inventory_2' },
      ];

  const navRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const [pillRect, setPillRect] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const updatePill = useCallback(() => {
    const activeEl = tabRefs.current[activeTab];
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
      setPillRect((prev) => (prev.ready ? { ...prev, ready: false } : prev));
    }
  }, [activeTab]);

  useLayoutEffect(() => {
    updatePill();
  }, [updatePill, tabs.length]);

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
  }, [updatePill]);

  return (
    <header
      className={cn(
        'hidden md:block sticky top-0 z-40 w-full bg-[#090b0e]/90 backdrop-blur-2xl border-b border-white/[0.04] transition-all select-none',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Логотип слева */}
        <div
          onClick={() => onTabChange('profile')}
          className="shrink-0 flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <AppLogo className="w-6 h-6 text-[#c0ff00] group-hover:scale-105 transition-transform" />
          <span className="text-base font-black tracking-tight text-white">
            One<span className="text-[#c0ff00]">House</span>
          </span>
        </div>

        {/* Центр: Капсула вкладок со скользящим плоским стилем без свечения */}
        <nav className="flex-1 max-w-xl flex items-center justify-center min-w-0">
          <div
            ref={navRef}
            className="bg-[#14171c] p-1 rounded-full relative flex items-center gap-1 overflow-x-auto no-scrollbar shadow-lg max-w-full"
          >
            {/* Animated Sliding Pill Indicator */}
            <div
              className={cn(
                'absolute top-1 bottom-1 rounded-full transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] transform-gpu will-change-transform pointer-events-none z-0',
                pillRect.ready ? 'opacity-100' : 'opacity-0'
              )}
              style={{
                transform: `translate3d(${pillRect.left}px, 0, 0)`,
                width: `${pillRect.width}px`,
              }}
            >
              <div className="w-full h-full rounded-full bg-[#1c222b]" />
            </div>

            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    'relative z-10 px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold transition-colors duration-200 sf-tap whitespace-nowrap group',
                    isActive
                      ? 'text-[#c0ff00] font-black'
                      : 'text-[#8e8e93] hover:text-white'
                  )}
                  aria-selected={isActive}
                  role="tab"
                >
                  <OneIcon
                    name={tab.icon}
                    size={18}
                    className={cn(
                      'transition-colors duration-200',
                      isActive ? 'text-[#c0ff00]' : 'text-[#8e8e93] group-hover:text-white'
                    )}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Действия справа */}
        <div className="shrink-0 flex items-center gap-2.5">
          {/* Кнопка скачать лаунчер */}
          <button
            onClick={() => onTabChange('onelaunch')}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all sf-tap',
              activeTab === 'onelaunch'
                ? 'bg-[#c0ff00] text-[#090b0e] font-black'
                : 'bg-[#14171c] text-[#8e8e93] hover:text-white hover:bg-[#181c23]'
            )}
            title="Скачать лаунчер OneLaunch"
          >
            <OneIcon name="download" size={16} />
            <span>OneLaunch</span>
          </button>

          {/* Админ-кнопка */}
          {isAdmin && onAdminClick && (
            <button
              onClick={onAdminClick}
              className="w-9 h-9 rounded-full bg-[#14171c] text-[#8e8e93] hover:text-[#c0ff00] hover:bg-[#181c23] flex items-center justify-center transition-all sf-tap"
              title="Панель администратора"
            >
              <OneIcon name="admin_panel_settings" size={18} />
            </button>
          )}

          {/* Аватар пользователя */}
          {currentUser && (
            <button
              onClick={onProfileClick}
              className="w-9 h-9 rounded-full overflow-hidden bg-[#14171c] hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0"
              title="Мой профиль"
            >
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  className="w-full h-full object-cover"
                  alt="avatar"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <OneIcon name="person" size={18} className="text-[#8e8e93]" />
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
