import React from 'react';
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
          className="shrink-0 flex items-center gap-2.5 cursor-pointer group"
        >
          <AppLogo className="w-6 h-6 text-[#c0ff00] group-hover:scale-105 transition-transform" />
          <span className="text-base font-black tracking-tight text-white">
            One<span className="text-[#c0ff00]">House</span>
          </span>
        </div>

        {/* Центр: Капсула вкладок со скользящим плоским стилем без свечения */}
        <nav className="flex-1 max-w-xl flex items-center justify-center min-w-0">
          <div className="bg-[#14171c] p-1 rounded-full flex items-center gap-1 overflow-x-auto no-scrollbar shadow-lg max-w-full">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    'relative px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold transition-all duration-200 sf-tap whitespace-nowrap',
                    isActive
                      ? 'bg-[#1c222b] text-[#c0ff00] font-black'
                      : 'text-[#8e8e93] hover:text-white hover:bg-white/5'
                  )}
                >
                  <OneIcon
                    name={tab.icon}
                    size={18}
                    className={isActive ? 'text-[#c0ff00]' : 'text-[#8e8e93]'}
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
                ? 'bg-[#c0ff00] text-[#090b0e]'
                : 'bg-[#14171c] text-white hover:bg-[#181c23]'
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
              className="w-9 h-9 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-all sf-tap"
              title="Панель администратора"
            >
              <OneIcon name="gpp_bad" size={18} />
            </button>
          )}

          {/* Аватар пользователя */}
          {currentUser && (
            <button
              onClick={onProfileClick}
              className="w-9 h-9 rounded-full overflow-hidden bg-[#181c23] hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0"
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
