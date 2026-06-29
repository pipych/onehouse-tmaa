'use client';

import { useState } from 'react';
import { 
  Library, Calendar, Image as ImageIcon, Users, Map, FileText, 
  Plus, Upload, Trash2, ChevronDown, FolderArchive, Clock 
} from 'lucide-react';

interface Player {
  id: string;
  roles: string[];
}

interface ArchiveProps {
  currentUser: Player | null;
}

export default function Archive({ currentUser }: ArchiveProps) {
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'media' | 'characters' | 'map' | 'docs'>('timeline');
  const [selectedSeason, setSelectedSeason] = useState<string>('Сезон 1');
  const [showSeasonSelector, setShowSeasonSelector] = useState(false);

  // Проверка прав: админ или пользователь с ролью "редактор"
  const isEditor = currentUser?.roles?.some(r => 
    ['admin', 'редактор', 'editor'].includes(r.toLowerCase())
  ) || false;

  const seasons = ['Сезон 1', 'Сезон 2'];

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-3xl mx-auto px-2">
      
      {/* Шапка архива и селектор Сезонов */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full select-none border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <Library size={24} className="text-[#c0ff00]" />
          <h2 className="text-xl md:text-2xl font-black text-white tracking-wide">Архив серверов</h2>
        </div>

        {/* Выпадающий список сезонов (Apple HIG Style) */}
        <div className="relative">
          <button 
            onClick={() => setShowSeasonSelector(!showSeasonSelector)}
            className="ui-pill-btn !py-2 !px-4 flex items-center gap-2 !bg-[#14171c] hover:!border-[#c0ff00]/40"
          >
            <FolderArchive size={14} className="text-[#c0ff00]" />
            <span>{selectedSeason}</span>
            <ChevronDown size={14} className={`text-gray-500 transition-transform ${showSeasonSelector ? 'rotate-180' : ''}`} />
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

      {/* Горизонтальное меню подвкладок (Идентично iOS Сетке) */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 w-full border-b border-white/5">
        <button onClick={() => setActiveSubTab('timeline')} className={`ui-pill-btn whitespace-nowrap !py-1.5 !px-3.5 !text-[11px] ${activeSubTab === 'timeline' ? '!bg-[#c0ff00] !text-black' : ''}`}><Calendar size={12}/>Хронология</button>
        <button onClick={() => setActiveSubTab('media')} className={`ui-pill-btn whitespace-nowrap !py-1.5 !px-3.5 !text-[11px] ${activeSubTab === 'media' ? '!bg-[#c0ff00] !text-black' : ''}`}><ImageIcon size={12}/>Медиа</button>
        <button onClick={() => setActiveSubTab('characters')} className={`ui-pill-btn whitespace-nowrap !py-1.5 !px-3.5 !text-[11px] ${activeSubTab === 'characters' ? '!bg-[#c0ff00] !text-black' : ''}`}><Users size={12}/>Персонажи</button>
        <button onClick={() => setActiveSubTab('map')} className={`ui-pill-btn whitespace-nowrap !py-1.5 !px-3.5 !text-[11px] ${activeSubTab === 'map' ? '!bg-[#c0ff00] !text-black' : ''}`}><Map size={12}/>Карта мира</button>
        <button onClick={() => setActiveSubTab('docs')} className={`ui-pill-btn whitespace-nowrap !py-1.5 !px-3.5 !text-[11px] ${activeSubTab === 'docs' ? '!bg-[#c0ff00] !text-black' : ''}`}><FileText size={12}/>Документы</button>
      </div>

      {/* ПАНЕЛЬ РЕДАКТОРА: Отображается только для админов и редакторов */}
      {isEditor && (
        <div className="p-4 bg-[#c0ff00]/5 border border-[#c0ff00]/20 rounded-2xl flex items-center justify-between animate-fade-in">
          <div className="text-xs font-medium text-gray-300">Режим редактора архива активен ✅</div>
          <button className="ui-pill-btn !py-1.5 !px-3 !bg-[#c0ff00] !text-black font-black !text-[10px] uppercase tracking-wider"><Plus size={12}/>Добавить запись</button>
        </div>
      )}

      {/* КОНТЕНТ ПОДВКЛАДОК */}
      <div className="w-full pt-2">
        
        {/* Хронология */}
        {activeSubTab === 'timeline' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-[#14171c]/90 border border-white/5 p-5 rounded-[24px] space-y-4 shadow-xl">
              <div className="flex gap-3 items-start border-l border-white/10 pl-4 relative">
                <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#c0ff00] shadow-[0_0_10px_rgba(192,255,0,0.5)]" />
                <div className="space-y-1">
                  <div className="text-[10px] font-bold font-mono text-[#c0ff00] uppercase tracking-wider flex items-center gap-1"><Clock size={10}/> 12.10.2025</div>
                  <h4 className="font-bold text-sm text-white">Великое основание города</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">В этот день игроки заложили первые блоки центральной ратуши {selectedSeason}.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Медиа галерея */}
        {activeSubTab === 'media' && (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            <div className="bg-[#14171c]/90 border border-white/5 rounded-2xl overflow-hidden shadow-lg group relative aspect-video bg-black/40 flex items-center justify-center">
              <ImageIcon size={24} className="text-gray-700 group-hover:text-[#c0ff00] transition-colors" />
              <div className="absolute bottom-2 left-2 right-2 text-[10px] text-gray-400 truncate bg-black/60 p-1.5 rounded-lg backdrop-blur-sm">Скриншот финала.png</div>
            </div>
          </div>
        )}

        {/* Персонажи */}
        {activeSubTab === 'characters' && (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            <div className="bg-[#14171c]/90 border border-white/5 p-4 rounded-2xl flex items-center gap-3 shadow-md">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">Илон Дик</div>
                <div className="text-[10px] text-gray-500 truncate font-mono">Глава синдиката</div>
              </div>
            </div>
          </div>
        )}

        {/* Карта мира */}
        {activeSubTab === 'map' && (
          <div className="bg-[#14171c]/90 border border-white/5 p-6 rounded-[24px] text-center space-y-3 shadow-xl animate-fade-in">
            <Map size={24} className="text-gray-500 mx-auto" />
            <div className="text-xs font-bold text-white">Рендер карты для {selectedSeason}</div>
            <p className="text-[11px] text-gray-400 max-w-xs mx-auto">Ссылка на архивную выгрузку карты или статическое 3D-изображение материка.</p>
          </div>
        )}

        {/* Документы */}
        {activeSubTab === 'docs' && (
          <div className="space-y-2 animate-fade-in">
            <div className="bg-[#14171c]/90 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:border-white/10 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={16} className="text-gray-500" />
                <span className="text-xs font-bold text-white truncate">Старая Конституция (Редакция от сентября)</span>
              </div>
              <span className="text-[10px] font-bold font-mono text-gray-600">HTML</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
