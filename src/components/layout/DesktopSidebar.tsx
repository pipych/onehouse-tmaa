import React from 'react';
import { Home as HomeIcon, Newspaper, BookMarked, Landmark, Library, Download, Users, ShieldAlert } from 'lucide-react';

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
        className={`bg-[#14171c]/80 backdrop-blur-xl border border-white/10 rounded-[36px] shadow-2xl flex flex-col items-center gap-6 relative transition-all duration-300 w-[64px] py-6 px-1`}
      >
        <button
          onClick={() => onTabChange('profile')}
          className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 ${
            activeTab === 'profile' ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-white'
          }`}
        >
          <HomeIcon size={22} />
          <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">
            Главная
          </span>
        </button>

        {seasonEnded ? (
          <button
            onClick={() => onTabChange('archive')}
            className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 ${
              activeTab === 'archive' ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-white'
            }`}
          >
            <Library size={22} />
            <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">
              Архив
            </span>
          </button>
        ) : (
          <>
            <button
              onClick={() => onTabChange('media')}
              className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 ${
                activeTab === 'media' ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-white'
              }`}
            >
              <Newspaper size={22} />
              <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">
                Медиа
              </span>
            </button>

            <button
              onClick={() => onTabChange('svod')}
              className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 ${
                activeTab === 'svod' ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-white'
              }`}
            >
              <BookMarked size={22} />
              <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">
                Свод
              </span>
            </button>

            <button
              onClick={() => onTabChange('treasury')}
              className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 ${
                activeTab === 'treasury' ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-white'
              }`}
            >
              <Landmark size={22} />
              <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">
                Казна
              </span>
            </button>

            <button
              onClick={() => onTabChange('archive')}
              className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 ${
                activeTab === 'archive' ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-white'
              }`}
            >
              <Library size={22} />
              <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">
                Архив
              </span>
            </button>
          </>
        )}

        <button
          onClick={() => onTabChange('onelaunch')}
          className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 ${
            activeTab === 'onelaunch' ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-white'
          }`}
        >
          <Download size={22} />
          <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">
            Лаунчер
          </span>
        </button>
      </nav>

      {/* Игроки */}
      {!seasonEnded && (
        <button
          onClick={() => onTabChange('players')}
          className={`group relative w-[64px] h-[64px] bg-[#14171c]/80 backdrop-blur-xl border rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 ${
            activeTab === 'players'
              ? 'border-[#c0ff00]/40 text-[#c0ff00]'
              : 'border-white/10 text-gray-500 hover:text-white hover:border-white/20'
          }`}
        >
          <Users size={22} />
          <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">
            Игроки
          </span>
        </button>
      )}

      {/* Админка */}
      {isAdmin && onAdminClick && (
        <button
          onClick={onAdminClick}
          className="group relative w-[64px] h-[64px] bg-[#14171c]/80 backdrop-blur-xl border border-red-500/20 text-red-400 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 hover:border-red-500/40 hover:text-red-300"
          title="Панель администратора"
        >
          <ShieldAlert size={22} />
          <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-red-500/20 rounded-full text-[11px] font-bold text-red-400 shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">
            Админ-панель
          </span>
        </button>
      )}
    </aside>
  );
}
