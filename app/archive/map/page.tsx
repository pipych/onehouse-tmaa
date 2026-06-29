'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FolderArchive, ChevronDown, Map, Eye, Download } from 'lucide-react';

export default function ArchiveMapPage() {
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
          <Map size={18} className="text-[#c0ff00]" />
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Архивные карты мира</h2>
        </div>

        {/* Карточка карты */}
        <div className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden shadow-2xl flex flex-col">
          {/* Сюда рендерится превью-изображение карты из Supabase */}
          <div className="w-full aspect-video bg-black/40 flex flex-col items-center justify-center border-b border-white/5 relative group">
            <Map size={48} className="text-gray-700 group-hover:text-[#c0ff00] transition-colors duration-500" />
            <span className="text-[10px] text-gray-500 font-mono mt-2 uppercase tracking-wider">Карта-изображение {selectedSeason}</span>
          </div>

          <div className="p-5 space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-black text-white">Интерактивный 3D-рендер ({selectedSeason})</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Вы можете открыть полноценную трехмерную карту материка в браузере или скачать файл разметки мира World_Save для одиночной игры.
              </p>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 ui-pill-btn justify-center py-2.5 !bg-[#c0ff00] !text-black font-black"><Eye size={14}/><span>Открыть веб-карту</span></button>
              <button className="ui-pill-btn !py-2.5 !px-4 !bg-white/5"><Download size={14} className="text-gray-400"/></button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
