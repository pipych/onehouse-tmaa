'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FolderArchive, ChevronDown, FileText, Scale, ShieldAlert, ChevronRight } from 'lucide-react';

export default function ArchiveDocsPage() {
  const router = useRouter();
  const [selectedSeason, setSelectedSeason] = useState<string>('Сезон 1');
  const [showSeasonSelector, setShowSeasonSelector] = useState(false);

  const seasons = ['Сезон 1', 'Сезон 2'];

  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-24 pb-32 antialiased">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
        
        {/* Навигация */}
        <div className="flex items-center justify-between w-full select-none">
          <button 
            onClick={() => router.push('/')} 
            className="w-12 h-12 flex items-center justify-center bg-[#14171c]/90 backdrop-blur-xl border border-white/10 rounded-full text-white shadow-2xl active:scale-90 transition-transform"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowSeasonSelector(!showSeasonSelector)}
              className="bg-[#14171c]/90 border border-white/15 py-2 px-4 rounded-full backdrop-blur-md flex items-center gap-2 text-xs font-bold text-gray-200 shadow-lg active:scale-95 transition-all"
            >
              <FolderArchive size={14} className="text-[#c0ff00]" />
              <span>{selectedSeason}</span>
              <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${showSeasonSelector ? 'rotate-180' : ''}`} />
            </button>

            {showSeasonSelector && (
              <div className="absolute right-0 mt-2 bg-[#14171c]/95 border border-white/10 rounded-2xl p-1.5 z-50 shadow-2xl min-w-[140px] flex flex-col gap-1 animate-fade-in backdrop-blur-xl">
                {seasons.map((season) => (
                  <button
                    key={season}
                    onClick={() => { setSelectedSeason(season); setShowSeasonSelector(false); }}
                    className={`text-xs text-left px-3 py-2.5 rounded-xl font-bold transition-all ${selectedSeason === season ? 'bg-[#c0ff00]/10 text-[#c0ff00]' : 'text-gray-400 hover:bg-white/5'}`}
                  >
                    {season}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 px-1">
          <FileText size={18} className="text-[#c0ff00]" />
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Архив официальных документов</h2>
        </div>

        {/* Список документов */}
        <div className="flex flex-col gap-2">
          
          <div className="bg-[#14171c]/90 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:border-white/10 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-2 bg-[#c0ff00]/10 rounded-xl text-[#c0ff00]"><Scale size={16} /></div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">Главная Конституция ({selectedSeason})</span>
                <span className="text-[10px] text-gray-500 font-medium">Основной свод законов и РП правил</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors shrink-0" />
          </div>

          <div className="bg-[#14171c]/90 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:border-white/10 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-2 bg-red-500/10 rounded-xl text-red-400"><ShieldAlert size={16} /></div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">Акт о капитуляции и мирный пакт</span>
                <span className="text-[10px] text-gray-500 font-medium">Договор по завершении войны коалиций</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors shrink-0" />
          </div>

        </div>

      </div>
    </div>
  );
}
