'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FolderArchive, ChevronDown, Users, Search, Shield, Info } from 'lucide-react';

interface ArchivedCharacter {
  id: string;
  rp_name: string;
  mc_nickname: string;
  party: string;
  roles: string[];
  avatar_url: string;
  season: string;
}

export default function ArchiveCharactersPage() {
  const router = useRouter();
  const [selectedSeason, setSelectedSeason] = useState<string>('Сезон 1');
  const [showSeasonSelector, setShowSeasonSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [characters, setCharacters] = useState<ArchivedCharacter[]>([]);

  const seasons = ['Сезон 1', 'Сезон 2'];

  useEffect(() => {
    // Мок-данные для карточек персонажей прошлых сезонов
    const mockCharacters: ArchivedCharacter[] = [
      {
        id: 'char-1',
        rp_name: 'Илон Дик',
        mc_nickname: 'ElonDeek',
        party: 'Синдикат Капитал',
        roles: ['Мэр', 'Основатель'],
        avatar_url: 'https://via.placeholder.com/150',
        season: 'Сезон 1'
      },
      {
        id: 'char-2',
        rp_name: 'Джеймс Сантьяго',
        mc_nickname: 'Santiago_99',
        party: 'Либералы',
        roles: ['Судья'],
        avatar_url: 'https://via.placeholder.com/150',
        season: 'Сезон 1'
      },
      {
        id: 'char-3',
        rp_name: 'Алекс Вульф',
        mc_nickname: 'WolfMc',
        party: 'Нет партии',
        roles: ['Гражданин'],
        avatar_url: 'https://via.placeholder.com/150',
        season: 'Сезон 2'
      }
    ];

    const filtered = mockCharacters.filter(
      char => char.season === selectedSeason &&
      (char.rp_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       char.mc_nickname.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setCharacters(filtered);
  }, [selectedSeason, searchQuery]);

  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-24 pb-32 antialiased">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
        
        {/* Панель навигации */}
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

        {/* Строка поиска */}
        <div className="flex items-center bg-[#14171c]/90 border border-white/10 rounded-full px-4 py-3 w-full shadow-xl">
          <Search size={16} className="text-[#c0ff00] shrink-0" />
          <input 
            type="text" 
            placeholder="Поиск по архивным жителям..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-medium text-white ml-3 w-full placeholder:text-gray-600 focus:ring-0" 
          />
        </div>

        <div className="flex items-center gap-2 px-1">
          <Users size={18} className="text-[#c0ff00]" />
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Персонажи игроков ({selectedSeason})</h2>
        </div>

        {/* Сетка персонажей */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {characters.map(char => (
            <div 
              key={char.id}
              className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 p-4 rounded-[24px] flex items-center gap-4 shadow-xl"
            >
              <img src={char.avatar_url} className="w-12 h-12 rounded-full border border-white/10 object-cover bg-black/30" alt="avatar" />
              <div className="min-w-0 flex-1 space-y-0.5">
                <h4 className="font-black text-sm text-white truncate">{char.rp_name}</h4>
                <p className="text-[11px] font-mono text-gray-500 truncate">{char.mc_nickname}</p>
                <p className="text-[10px] font-medium text-gray-400 truncate">🏛️ {char.party}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {char.roles.map((role, i) => (
                    <span key={i} className="text-[8px] uppercase font-black px-1.5 py-0.5 bg-white/5 border border-white/10 text-gray-400 rounded">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {characters.length === 0 && (
            <div className="col-span-full text-center py-12 text-xs font-mono text-gray-500 bg-[#14171c]/40 border border-white/5 rounded-[24px]">
              НИКОГО НЕ НАЙДЕНО
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
