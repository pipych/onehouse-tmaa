'use client';

import { useRouter } from 'next/navigation';
import { Library, Calendar, Newspaper, Users, Map, FileText, ArrowUpRight } from 'lucide-react';

interface Player {
  id: string;
  roles: string[];
}

interface ArchiveProps {
  currentUser: Player | null;
}

export default function Archive({ currentUser }: ArchiveProps) {
  const router = useRouter();

  return (
    <div className="space-y-4 w-full animate-fade-in">
      
      {/* Шапка раздела */}
      <div className="flex items-center justify-between w-full px-1">
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Library size={16} className="text-[#c0ff00]" />
          Архив прошлых сезонов
        </h2>
      </div>

      {/* НЕВИДИМАЯ СЕТКА ВИДЖЕТОВ (APPLE HIG STYLE) */}
      <div className="grid grid-cols-4 gap-3.5 w-full">
        
        {/* 1. ВИДЖЕТ: Хронология (Small 2x2) */}
        <div 
          onClick={() => router.push('/archive/timeline')}
          className="col-span-2 aspect-square bg-[#14171c]/90 backdrop-blur-xl rounded-[24px] border border-white/5 p-4 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:border-white/15 transition-all duration-300 shadow-xl"
        >
          <ArrowUpRight size={14} className="absolute top-4 right-4 text-gray-600 group-hover:text-[#c0ff00] transition-colors" />
          <div className="w-11 h-11 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-[#c0ff00] shrink-0">
            <Calendar size={20} />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-white tracking-wide">Хронология</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">История событий</p>
          </div>
        </div>

        {/* 2. ВИДЖЕТ: Архив Медиа / Статей (Small 2x2) */}
        <div 
          onClick={() => router.push('/archive/media')}
          className="col-span-2 aspect-square bg-[#14171c]/90 backdrop-blur-xl rounded-[24px] border border-white/5 p-4 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:border-white/15 transition-all duration-300 shadow-xl"
        >
          <ArrowUpRight size={14} className="absolute top-4 right-4 text-gray-600 group-hover:text-[#c0ff00] transition-colors" />
          <div className="w-11 h-11 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-[#c0ff00] shrink-0">
            <Newspaper size={20} />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-white tracking-wide">Статьи прессы</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Лента новостей</p>
          </div>
        </div>

        {/* 3. ВИДЖЕТ: Персонажи (Small 2x2) */}
        <div 
          onClick={() => router.push('/archive/characters')}
          className="col-span-2 aspect-square bg-[#14171c]/90 backdrop-blur-xl rounded-[24px] border border-white/5 p-4 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:border-white/15 transition-all duration-300 shadow-xl"
        >
          <ArrowUpRight size={14} className="absolute top-4 right-4 text-gray-600 group-hover:text-[#c0ff00] transition-colors" />
          <div className="w-11 h-11 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-[#c0ff00] shrink-0">
            <Users size={20} />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-white tracking-wide">Жители</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">РП Персонажи</p>
          </div>
        </div>

        {/* 4. ВИДЖЕТ: Карта мира (Small 2x2) */}
        <div 
          onClick={() => router.push('/archive/map')}
          className="col-span-2 aspect-square bg-[#14171c]/90 backdrop-blur-xl rounded-[24px] border border-white/5 p-4 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:border-white/20 transition-all duration-300 shadow-xl"
        >
          <ArrowUpRight size={14} className="absolute top-4 right-4 text-gray-600 group-hover:text-[#c0ff00] transition-colors" />
          <div className="w-11 h-11 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-[#c0ff00] shrink-0">
            <Map size={20} />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-white tracking-wide">Карты мира</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Рендеры миров</p>
          </div>
        </div>

        {/* 5. ВИДЖЕТ: Документы (Medium 4x2) */}
        <div 
          onClick={() => router.push('/archive/docs')}
          className="col-span-4 bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[24px] border border-white/5 shadow-2xl relative overflow-hidden flex items-center justify-between group cursor-pointer hover:border-white/10 transition-all duration-300 min-h-[90px]"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-[#c0ff00] shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-wide">Документация</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Конституции, указы и акты</p>
            </div>
          </div>
          <ArrowUpRight size={16} className="text-gray-600 group-hover:text-[#c0ff00] transition-colors mr-1" />
        </div>

      </div>
    </div>
  );
}
