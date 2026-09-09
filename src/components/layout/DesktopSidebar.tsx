import React from 'react';
import { SFSymbol } from '../ui/SFSymbol';

interface DesktopSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  seasonEnded?: boolean;
  currentUser?: any;
  isAdmin?: boolean;
  onAdminClick?: () => void;
  onProfileClick?: () => void;
}

export function DesktopSidebar({
  activeTab,
  onTabChange,
  seasonEnded = false,
  currentUser,
  isAdmin = false,
  onAdminClick,
  onProfileClick,
}: DesktopSidebarProps) {
  return (
    <aside className="flex flex-col items-center gap-3">
      {/* Аватар пользователя */}
      {currentUser && (
        <button
          onClick={onProfileClick}
          className="group relative w-[64px] h-[64px] bg-[#14171c]/80 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center hover:border-[#c0ff00]/40 transition-all shadow-2xl hover:scale-105 z-50"
          title="Мой профиль"
        >
          <div className="w-[50px] h-[50px] rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#c0ff00]/50 transition-all">
            <img
              src={currentUser.avatar_url || ''}
              className="w-full h-full object-cover"
              alt="avatar"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </button>
      )}

      {/* Pill с вкладками */}
      <nav
        className="bg-[#14171c]/90 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-2xl flex flex-col items-center gap-3 relative transition-all duration-300 w-[68px] p-2"
      >
        <button
          onClick={() => onTabChange('profile')}
          className={`group relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 sf-tap ${
            activeTab === 'profile'
              ? 'bg-[#007aff] text-white shadow-[0_2px_14px_rgba(0,122,255,0.45)]'
              : 'text-[#8e8e93] hover:text-white hover:bg-white/5'
          }`}
        >
          <SFSymbol name="house.fill" size={22} />
          <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">
            Главная
          </span>
        </button>

        {seasonEnded ? (
          <button
            onClick={() => onTabChange('archive')}
            className={`group relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 sf-tap ${
              activeTab === 'archive'
                ? 'bg-[#007aff] text-white shadow-[0_2px_14px_rgba(0,122,255,0.45)]'
                : 'text-[#8e8e93] hover:text-white hover:bg-white/5'
            }`}
          >
            <SFSymbol name="archivebox.fill" size={22} />
            <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">
              Архив
            </span>
          </button>
        ) : (
          <>
            <button
              onClick={() => onTabChange('media')}
              className={`group relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 sf-tap ${
                activeTab === 'media'
                  ? 'bg-[#007aff] text-white shadow-[0_2px_14px_rgba(0,122,255,0.45)]'
                  : 'text-[#8e8e93] hover:text-white hover:bg-white/5'
              }`}
            >
              <SFSymbol name="newspaper.fill" size={22} />
              <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">
                Медиа
              </span>
            </button>

            <button
              onClick={() => onTabChange('svod')}
              className={`group relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 sf-tap ${
                activeTab === 'svod'
                  ? 'bg-[#007aff] text-white shadow-[0_2px_14px_rgba(0,122,255,0.45)]'
                  : 'text-[#8e8e93] hover:text-white hover:bg-white/5'
              }`}
            >
              <SFSymbol name="doc.text.fill" size={22} />
              <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">
                Свод
              </span>
            </button>

            <button
              onClick={() => onTabChange('treasury')}
              className={`group relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 sf-tap ${
                activeTab === 'treasury'
                  ? 'bg-[#007aff] text-white shadow-[0_2px_14px_rgba(0,122,255,0.45)]'
                  : 'text-[#8e8e93] hover:text-white hover:bg-white/5'
              }`}
            >
              <SFSymbol name="building.columns.fill" size={22} />
              <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">
                Казна
              </span>
            </button>

            <button
              onClick={() => onTabChange('players')}
              className={`group relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 sf-tap ${
                activeTab === 'players'
                  ? 'bg-[#007aff] text-white shadow-[0_2px_14px_rgba(0,122,255,0.45)]'
                  : 'text-[#8e8e93] hover:text-white hover:bg-white/5'
              }`}
            >
              <SFSymbol name="person.2.fill" size={22} />
              <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">
                Игроки
              </span>
            </button>
          </>
        )}
      </nav>

      {/* Кружок Скачать лаунчер */}
      <div className="w-[68px] h-[68px] bg-[#14171c]/90 backdrop-blur-2xl border border-white/10 p-2 rounded-full shadow-2xl flex items-center justify-center relative">
        <button
          onClick={() => onTabChange('onelaunch')}
          className={`group relative w-full h-full rounded-full flex items-center justify-center transition-all duration-300 sf-tap ${
            activeTab === 'onelaunch'
              ? 'bg-[#007aff] text-white shadow-[0_2px_14px_rgba(0,122,255,0.45)]'
              : 'text-[#8e8e93] hover:text-white hover:bg-white/5'
          }`}
          title="Скачать лаунчер OneLaunch"
        >
          <SFSymbol name="arrow.down.circle.fill" size={22} />
          <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">
            Скачать
          </span>
        </button>
      </div>

      {/* Админка */}
      {isAdmin && onAdminClick && (
        <div className="w-[68px] h-[68px] bg-[#14171c]/90 backdrop-blur-2xl border border-red-500/20 p-2 rounded-full shadow-2xl flex items-center justify-center relative">
          <button
            onClick={onAdminClick}
            className="group relative w-full h-full rounded-full flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all sf-tap"
            title="Панель администратора"
          >
            <SFSymbol name="shield.alert" size={22} />
            <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-red-500/20 rounded-full text-[11px] font-bold text-red-400 shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">
              Админ-панель
            </span>
          </button>
        </div>
      )}
    </aside>
  );
}
