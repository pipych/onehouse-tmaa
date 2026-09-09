import React from 'react';
import { Home as HomeIcon, Newspaper, BookMarked, Landmark, Library, Download, Users } from 'lucide-react';

interface MobileTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  seasonEnded?: boolean;
}

export function MobileTabBar({
  activeTab,
  onTabChange,
  seasonEnded = false,
}: MobileTabBarProps) {
  return (
    <div className="flex items-center justify-center gap-2.5 w-full">
      {/* Главный плавающий пилл */}
      <nav
        className={`bg-[#14171c]/90 backdrop-blur-xl border border-white/10 py-3.5 px-3 rounded-full shadow-2xl transition-all duration-300 ${
          seasonEnded ? 'px-8' : 'flex-1'
        }`}
      >
        <div className={`flex items-center ${seasonEnded ? 'gap-8 justify-center' : 'w-full justify-around'}`}>
          <button
            onClick={() => onTabChange('profile')}
            className={`flex flex-col items-center justify-center transition-all duration-300 active:scale-90 ${
              activeTab === 'profile' ? 'text-[#c0ff00]' : 'text-gray-500'
            }`}
          >
            <HomeIcon size={20} />
            <span className="text-[9px] font-bold tracking-tight mt-0.5">Главная</span>
          </button>

          {seasonEnded ? (
            <button
              onClick={() => onTabChange('archive')}
              className={`flex flex-col items-center justify-center transition-all duration-300 active:scale-90 ${
                activeTab === 'archive' ? 'text-[#c0ff00]' : 'text-gray-500'
              }`}
            >
              <Library size={20} />
              <span className="text-[9px] font-bold tracking-tight mt-0.5">Архив</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => onTabChange('media')}
                className={`flex flex-col items-center justify-center transition-all duration-300 active:scale-90 ${
                  activeTab === 'media' ? 'text-[#c0ff00]' : 'text-gray-500'
                }`}
              >
                <Newspaper size={20} />
                <span className="text-[9px] font-bold tracking-tight mt-0.5">Медиа</span>
              </button>

              <button
                onClick={() => onTabChange('svod')}
                className={`flex flex-col items-center justify-center transition-all duration-300 active:scale-90 ${
                  activeTab === 'svod' ? 'text-[#c0ff00]' : 'text-gray-500'
                }`}
              >
                <BookMarked size={20} />
                <span className="text-[9px] font-bold tracking-tight mt-0.5">Свод</span>
              </button>

              <button
                onClick={() => onTabChange('treasury')}
                className={`flex flex-col items-center justify-center transition-all duration-300 active:scale-90 ${
                  activeTab === 'treasury' ? 'text-[#c0ff00]' : 'text-gray-500'
                }`}
              >
                <Landmark size={20} />
                <span className="text-[9px] font-bold tracking-tight mt-0.5">Казна</span>
              </button>

              <button
                onClick={() => onTabChange('archive')}
                className={`flex flex-col items-center justify-center transition-all duration-300 active:scale-90 ${
                  activeTab === 'archive' ? 'text-[#c0ff00]' : 'text-gray-500'
                }`}
              >
                <Library size={20} />
                <span className="text-[9px] font-bold tracking-tight mt-0.5">Архив</span>
              </button>
            </>
          )}

          <button
            onClick={() => onTabChange('onelaunch')}
            className={`flex flex-col items-center justify-center transition-all duration-300 active:scale-90 ${
              activeTab === 'onelaunch' ? 'text-[#c0ff00]' : 'text-gray-500'
            }`}
          >
            <Download size={20} />
            <span className="text-[9px] font-bold tracking-tight mt-0.5">Лаунчер</span>
          </button>
        </div>
      </nav>

      {/* Кружок Игроки справа */}
      {!seasonEnded && (
        <button
          onClick={() => onTabChange('players')}
          className={`w-[52px] h-[52px] shrink-0 bg-[#14171c]/90 backdrop-blur-xl border rounded-full shadow-2xl flex flex-col items-center justify-center transition-all duration-300 active:scale-90 ${
            activeTab === 'players'
              ? 'border-[#c0ff00]/40 text-[#c0ff00]'
              : 'border-white/10 text-gray-500 hover:text-white'
          }`}
        >
          <Users size={19} />
          <span className="text-[8px] font-bold tracking-tight mt-0.5">Игроки</span>
        </button>
      )}
    </div>
  );
}
