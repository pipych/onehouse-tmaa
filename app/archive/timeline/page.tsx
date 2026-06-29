'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FolderArchive, ChevronDown, Calendar, Clock } from 'lucide-react';

export default function ArchiveTimelinePage() {
  const router = useRouter();
  const [selectedSeason, setSelectedSeason] = useState<string>('Сезон 1');
  const [showSeasonSelector, setShowSeasonSelector] = useState(false);

  const seasons = ['Сезон 1', 'Сезон 2', 'Сезон 3'];

  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-24 pb-32 antialiased">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
        
        {/* Верхняя навигационная панель */}
        <div className="flex items-center justify-between w-full select-none">
          <button 
            onClick={() => router.push('/')} 
            className="w-12 h-12 flex items-center justify-center bg-[#14171c]/90 backdrop-blur-xl border border-white/10 rounded-full text-white shadow-2xl active:scale-90 transition-transform"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Селектор сезонов Apple Style */}
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

        {/* Контентная архивный блок карточки */}
        <div className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 shadow-2xl space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Calendar size={18} className="text-[#c0ff00]" />
            <h2 className="text-base font-black uppercase tracking-wider text-white">Хронология событий</h2>
          </div>

          {/* Пример вывода данных (сюда завяжешь фетч по выбранному селектором сезону) */}
          <div className="space-y-4">
            <div className="flex gap-4 items-start border-l border-white/10 pl-4 relative">
              <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#c0ff00] shadow-[0_0_10px_rgba(192,255,0,0.4)]" />
              <div className="space-y-1">
                <div className="text-[10px] font-bold font-mono text-[#c0ff00] uppercase tracking-wider flex items-center gap-1">
                  <Clock size={10}/> 12.10.2025
                </div>
                <h4 className="font-bold text-sm text-white">Запуск {selectedSeason}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">Официальное открытие и начало глобальной стройки.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
