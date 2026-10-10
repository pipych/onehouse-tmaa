import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OneIcon } from './ui/SFSymbol';
import { Badge } from '../ui/components/Badge';

interface Player {
  id: string;
  roles: string[];
}

interface ArchiveProps {
  currentUser: Player | null;
}

export default function Archive({ currentUser: _currentUser }: ArchiveProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-5 w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto animate-fade-in select-none">
      <div className="flex items-center justify-between w-full px-1">
        <h2 className="text-xs font-black text-[#8e8e93] uppercase tracking-widest flex items-center gap-2">
          <OneIcon name="inventory_2" size={16} className="text-[#c0ff00]" />
          Архив прошлых сезонов
        </h2>
      </div>

      <div className="grid grid-cols-4 gap-3.5 w-full">
        {/* 1. ВИДЖЕТ: Хронология */}
        <div 
          onClick={() => navigate('/archive/timeline')}
          className="col-span-2 aspect-square bg-[#14171c] rounded-[28px] p-4 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:bg-[#181c23] transition-all duration-200 shadow-xl active:scale-[0.98] border-none"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-10 h-10 rounded-[14px] bg-[#181c23] flex items-center justify-center text-[#c0ff00] shrink-0 group-hover:scale-105 transition-transform">
              <OneIcon name="calendar_today" size={20} />
            </div>
            <OneIcon name="north_east" size={18} className="text-[#8e8e93]/50 group-hover:text-[#c0ff00] transition-colors" />
          </div>
          <div className="mt-auto text-left space-y-0.5">
            <h3 className="text-sm font-black text-white tracking-wide">Хронология</h3>
            <p className="text-[10px] text-[#8e8e93] font-bold uppercase tracking-wider">История событий</p>
          </div>
        </div>

        {/* 2. ВИДЖЕТ: Архив Прессы */}
        <div 
          onClick={() => navigate('/archive/media')}
          className="col-span-2 aspect-square bg-[#14171c] rounded-[28px] p-4 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:bg-[#181c23] transition-all duration-200 shadow-xl active:scale-[0.98] border-none"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-10 h-10 rounded-[14px] bg-[#181c23] flex items-center justify-center text-[#c0ff00] shrink-0 group-hover:scale-105 transition-transform">
              <OneIcon name="newspaper" size={20} />
            </div>
            <OneIcon name="north_east" size={18} className="text-[#8e8e93]/50 group-hover:text-[#c0ff00] transition-colors" />
          </div>
          <div className="mt-auto text-left space-y-0.5">
            <h3 className="text-sm font-black text-white tracking-wide">Статьи прессы</h3>
            <p className="text-[10px] text-[#8e8e93] font-bold uppercase tracking-wider">Лента новостей</p>
          </div>
        </div>

        {/* 3. ВИДЖЕТ: Персонажи */}
        <div 
          onClick={() => navigate('/archive/characters')}
          className="col-span-2 aspect-square bg-[#14171c] rounded-[28px] p-4 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:bg-[#181c23] transition-all duration-200 shadow-xl active:scale-[0.98] border-none"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-10 h-10 rounded-[14px] bg-[#181c23] flex items-center justify-center text-[#c0ff00] shrink-0 group-hover:scale-105 transition-transform">
              <OneIcon name="group" size={20} />
            </div>
            <OneIcon name="north_east" size={18} className="text-[#8e8e93]/50 group-hover:text-[#c0ff00] transition-colors" />
          </div>
          <div className="mt-auto text-left space-y-0.5">
            <h3 className="text-sm font-black text-white tracking-wide">Жители</h3>
            <p className="text-[10px] text-[#8e8e93] font-bold uppercase tracking-wider">РП Персонажи</p>
          </div>
        </div>

        {/* 4. ВИДЖЕТ: Документация */}
        <div 
          onClick={() => navigate('/archive/docs')}
          className="col-span-2 aspect-square bg-[#14171c] rounded-[28px] p-4 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:bg-[#181c23] transition-all duration-200 shadow-xl active:scale-[0.98] border-none"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-10 h-10 rounded-[14px] bg-[#181c23] flex items-center justify-center text-[#c0ff00] shrink-0 group-hover:scale-105 transition-transform">
              <OneIcon name="description" size={20} />
            </div>
            <OneIcon name="north_east" size={18} className="text-[#8e8e93]/50 group-hover:text-[#c0ff00] transition-colors" />
          </div>
          <div className="mt-auto text-left space-y-0.5">
            <h3 className="text-sm font-black text-white tracking-wide">Документация</h3>
            <p className="text-[10px] text-[#8e8e93] font-bold uppercase tracking-wider">Законы и пакты</p>
          </div>
        </div>

        {/* 5. ВИДЖЕТ: Карта мира */}
        <div 
          onClick={() => navigate('/archive/map')}
          className="col-span-4 bg-[#14171c] p-4 sm:p-5 rounded-[28px] shadow-2xl relative overflow-hidden flex items-center justify-between group cursor-pointer hover:bg-[#181c23] transition-all duration-200 min-h-[84px] active:scale-[0.99] border-none"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-[14px] bg-[#181c23] flex items-center justify-center text-[#c0ff00] shrink-0 group-hover:scale-105 transition-transform">
              <OneIcon name="map" size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black text-white tracking-wide">Карты миров</h3>
              <p className="text-[10px] text-[#8e8e93] font-bold uppercase tracking-wider">Рендеры миров прошлых лет</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 mr-1">
            <Badge variant="lime" size="sm">Soon</Badge>
            <OneIcon name="north_east" size={18} className="text-[#8e8e93]/50 group-hover:text-[#c0ff00] transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}
