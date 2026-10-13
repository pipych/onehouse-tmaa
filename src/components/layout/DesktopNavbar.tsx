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
  defaultCollapsed?: boolean;
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
  defaultCollapsed = false,
}: DesktopNavbarProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('onedash_sidebar_collapsed');
      if (saved !== null) return saved === 'true';
    } catch {}
    return defaultCollapsed;
  });

  const toggleExpand = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('onedash_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

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

  const [pillRect, setPillRect] = useState<{ top: number; height: number; ready: boolean }>({
    top: 0,
    height: 0,
    ready: false,
  });

  const updatePill = useCallback(() => {
    const activeEl = tabRefs.current[activeTab];
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
      setPillRect((prev) => (prev.ready ? { ...prev, ready: false } : prev));
    }
  }, [activeTab]);

  useLayoutEffect(() => {
    updatePill();
  }, [updatePill, tabs.length, isCollapsed]);

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
    <aside
      className={cn(
        'hidden md:flex sticky top-0 h-screen shrink-0 p-3 sm:p-4 flex-col justify-start select-none z-40 transition-all duration-300',
        className
      )}
    >
      {/* 1. Блок над навбаром: Логотип и название OneHouse */}
      <div
        onClick={() => onTabChange('profile')}
        className={cn(
          'flex items-center h-10 mb-3 transition-all duration-300 cursor-pointer group',
          isCollapsed ? 'justify-center w-[68px]' : 'justify-start w-[220px] pl-[18px] pr-3'
        )}
        style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <AppLogo className="w-6 h-6 text-[#c0ff00] shrink-0 group-hover:scale-105 transition-transform" />
          {!isCollapsed && (
            <span className="text-base font-black tracking-tight text-white whitespace-nowrap animate-fade-in">
              One<span className="text-[#c0ff00]">House</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Плавающий вертикальный пилл навбара OneDash (1:1 со showcase) */}
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
          className={cn(
            'h-9 w-full rounded-full flex items-center text-[#8e8e93] hover:text-white hover:bg-white/5 transition-all sf-tap group mb-1.5 active:scale-95 relative',
            isCollapsed ? 'justify-center px-0' : 'justify-start pl-3 pr-2'
          )}
          style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
          title={isCollapsed ? 'Развернуть' : 'Свернуть'}
        >
          <div className="w-6 h-6 flex items-center justify-center shrink-0 transition-transform duration-150 active:scale-90 group-active:scale-90">
            <OneIcon
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

        {/* Область вкладок со скользящей активной капсулой */}
        <div ref={navRef} className="relative flex flex-col gap-1 w-full min-w-0">
          {/* Скользящая активная капсула (Flat, No Glow) */}
          <div
            className={cn(
              'absolute left-0 right-0 rounded-full transition-[transform,height,opacity] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] transform-gpu will-change-transform pointer-events-none z-0',
              pillRect.ready ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              transform: `translate3d(0, ${pillRect.top}px, 0)`,
              height: `${pillRect.height}px`,
            }}
          >
            <div className="w-full h-full rounded-full bg-[#1c222b]" />
          </div>

          {/* Вкладки навигации */}
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
                  'relative z-10 h-[50px] w-full rounded-full flex items-center transition-[color,opacity] duration-200 sf-tap group active:scale-95',
                  isCollapsed ? 'justify-center px-0' : 'justify-start pl-3',
                  isActive ? 'text-[#c0ff00] font-bold' : 'text-[#8e8e93] hover:text-white'
                )}
                style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
                aria-label={tab.label}
                aria-selected={isActive}
                role="tab"
              >
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <OneIcon
                    name={tab.icon}
                    size={22}
                    className={cn(
                      'transition-colors duration-200',
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

          {/* Кнопка скачать лаунчер (OneLaunch) */}
          <button
            ref={(el) => {
              tabRefs.current['onelaunch'] = el;
            }}
            onClick={() => onTabChange('onelaunch')}
            className={cn(
              'relative z-10 h-[50px] w-full rounded-full flex items-center transition-[color,opacity] duration-200 sf-tap group active:scale-95',
              isCollapsed ? 'justify-center px-0' : 'justify-start pl-3',
              activeTab === 'onelaunch' ? 'text-[#c0ff00] font-bold' : 'text-[#8e8e93] hover:text-white'
            )}
            style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
            aria-label="OneLaunch"
            role="tab"
          >
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <OneIcon
                name="download"
                size={22}
                className={cn(
                  'transition-colors duration-200',
                  activeTab === 'onelaunch' ? 'text-[#c0ff00]' : 'text-[#8e8e93] group-hover:text-white'
                )}
              />
            </div>
            {!isCollapsed && (
              <span
                className={cn(
                  'text-sm font-bold tracking-tight ml-3 whitespace-nowrap text-left transition-colors duration-200 truncate',
                  activeTab === 'onelaunch' ? 'text-[#c0ff00]' : 'text-white/80 group-hover:text-white'
                )}
              >
                OneLaunch
              </span>
            )}
            {isCollapsed && (
              <div className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#171b22]/95 backdrop-blur-xl border border-white/10 text-white text-xs font-bold shadow-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 whitespace-nowrap z-50">
                <span className={activeTab === 'onelaunch' ? 'text-[#c0ff00]' : 'text-white'}>
                  OneLaunch
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Разделитель перед системными кнопками (админ / профиль) */}
        {(isAdmin || currentUser) && (
          <div className="w-full h-px bg-white/5 my-1.5 shrink-0" />
        )}

        {/* Админ-кнопка */}
        {isAdmin && onAdminClick && (
          <button
            onClick={onAdminClick}
            className={cn(
              'relative z-10 h-10 w-full rounded-full flex items-center transition-[color,background] duration-200 sf-tap group active:scale-95 text-[#8e8e93] hover:text-[#c0ff00] hover:bg-white/5',
              isCollapsed ? 'justify-center px-0' : 'justify-start pl-3'
            )}
            style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
            title="Панель администратора"
          >
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <OneIcon
                name="admin_panel_settings"
                size={20}
                className="text-[#8e8e93] group-hover:text-[#c0ff00] transition-colors"
              />
            </div>
            {!isCollapsed && (
              <span className="text-xs font-bold tracking-tight ml-3 whitespace-nowrap text-left truncate">
                Админ-панель
              </span>
            )}
            {isCollapsed && (
              <div className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#171b22]/95 backdrop-blur-xl border border-white/10 text-white text-xs font-bold shadow-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 whitespace-nowrap z-50">
                <span>Админ-панель</span>
              </div>
            )}
          </button>
        )}

        {/* Кнопка профиля пользователя */}
        {currentUser && (
          <button
            onClick={onProfileClick}
            className={cn(
              'relative z-10 h-11 w-full rounded-full flex items-center transition-[color,background] duration-200 sf-tap group active:scale-95 text-white hover:bg-white/5 mt-0.5',
              isCollapsed ? 'justify-center px-0' : 'justify-start pl-2 pr-2'
            )}
            style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
            title="Мой профиль"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#181c23] shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
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
            </div>
            {!isCollapsed && (
              <span className="text-xs font-bold tracking-tight ml-2.5 whitespace-nowrap text-left truncate text-white/90 group-hover:text-white">
                {currentUser.rp_name || currentUser.username || 'Мой профиль'}
              </span>
            )}
            {isCollapsed && (
              <div className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#171b22]/95 backdrop-blur-xl border border-white/10 text-white text-xs font-bold shadow-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 whitespace-nowrap z-50">
                <span>{currentUser.rp_name || currentUser.username || 'Мой профиль'}</span>
              </div>
            )}
          </button>
        )}
      </nav>
    </aside>
  );
}
