'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, FolderArchive, ChevronDown, Users, Search, RefreshCw, X } from 'lucide-react';

export default function ArchiveCharactersPage() {
  const router = useRouter();
  const [selectedSeason, setSelectedSeason] = useState<string>('Сезон 2');
  const [showSeasonSelector, setShowSeasonSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  const seasons = ['Сезон 1', 'Сезон 2'];

  function isDead(roles: string[]) {
    return roles ? roles.some(r => r.toLowerCase() === 'мёртв') : false;
  }

  useEffect(() => {
    if (selectedSeason === 'Сезон 1') {
      setCharacters([]);
      return;
    }

    async function fetchArchivedPlayers() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('characters')
          .select('*, player:players(tg_id, tg_username)')
          .eq('season', selectedSeason)
          .order('rp_name', { ascending: true });

        if (data && !error) {
          const filtered = data.filter(char => 
            char.rp_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            char.mc_nickname.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setCharacters(filtered);
        }
      } catch (e) {}
      setLoading(false);
    }

    fetchArchivedPlayers();
  }, [selectedSeason, searchQuery]);

  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-24 pb-32 antialiased">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
        
        <div className="flex items-center justify-between w-full select-none">
          <button onClick={() => router.push('/')} className="w-12 h-12 flex items-center justify-center bg-[#14171c]/90 backdrop-blur-xl border border-white/10 rounded-full text-white shadow-2xl active:scale-90 transition-transform"><ArrowLeft size={20} /></button>

          <div className="relative">
            <button onClick={() => setShowSeasonSelector(!showSeasonSelector)} className="bg-[#14171c]/90 border border-white/15 py-2 px-4 rounded-full backdrop-blur-md flex items-center gap-2 text-xs font-bold text-gray-200 shadow-lg active:scale-95 transition-all">
              <FolderArchive size={14} className="text-[#c0ff00]" />
              <span>{selectedSeason}</span>
              <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${showSeasonSelector ? 'rotate-180' : ''}`} />
            </button>

            {showSeasonSelector && (
              <div className="absolute right-0 mt-2 bg-[#14171c]/95 border border-white/10 rounded-2xl p-1.5 z-50 shadow-2xl min-w-[140px] flex flex-col gap-1 animate-fade-in backdrop-blur-xl">
                {seasons.map((season) => (
                  <button key={season} onClick={() => { setSelectedSeason(season); setShowSeasonSelector(false); }} className={`text-xs text-left px-3 py-2.5 rounded-xl font-bold transition-all ${selectedSeason === season ? 'bg-[#c0ff00]/10 text-[#c0ff00]' : 'text-gray-400 hover:bg-white/5'}`}>{season}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center bg-[#14171c]/90 border border-white/10 rounded-full px-4 py-3 w-full shadow-xl">
          <Search size={16} className="text-[#c0ff00] shrink-0" />
          <input type="text" placeholder="Поиск по архивным жителям..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm font-medium text-white ml-3 w-full placeholder:text-gray-600 focus:ring-0" />
        </div>

        <div className="flex items-center gap-2 px-1">
          <Users size={18} className="text-[#c0ff00]" />
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Персонажи игроков ({selectedSeason})</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {loading ? (
            <div className="col-span-full flex justify-center py-12"><RefreshCw className="animate-spin text-[#c0ff00]" size={24} /></div>
          ) : selectedSeason === 'Сезон 1' ? (
            <div className="col-span-full text-center py-12 text-xs font-mono text-gray-500 bg-[#14171c]/40 border border-white/5 rounded-[24px]">ПЕРВЫЙ СЕЗОН ПОКА ПУСТ</div>
          ) : characters.map(char => {
            const dead = isDead(char.roles);
            return (
              <div 
                key={char.id}
                onClick={() => setSelectedPlayer(char)}
                className={`p-4 rounded-[24px] border flex items-center space-x-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-md active:scale-[0.99] w-full border ${dead ? 'bg-[#0a0c0f] border-transparent opacity-60 grayscale-[50%]' : 'bg-[#14171c]/90 backdrop-blur-xl border-white/5 hover:border-white/20'}`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1c2026] border border-white/10 flex-shrink-0"><img src={char.avatar_url || 'https://via.placeholder.com/150'} alt="avatar" className="w-full h-full object-cover" /></div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-black truncate tracking-wide ${dead ? 'text-gray-500 line-through' : 'text-white'}`}>{char.rp_name}</div>
                  <div className="text-xs text-gray-400 truncate font-mono tracking-tight">{char.mc_nickname}</div>
                  <div className="text-[11px] text-gray-500 font-medium mt-0.5 truncate">🏛️ {char.party || 'Нет партии'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ОРИГИНАЛЬНОЕ МОДАЛЬНОЕ ОКНО ПРОФИЛЯ */}
      {selectedPlayer && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300" onClick={() => setSelectedPlayer(null)} />
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-32px)] max-w-md p-6 rounded-[32px] border border-white/10 shadow-2xl text-center space-y-5 animate-profile-grow overflow-visible ${isDead(selectedPlayer.roles) ? 'bg-[#0a0c0f]' : 'bg-[#14171c]'}`}>
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#c0ff00]/10 to-transparent pointer-events-none rounded-t-[32px]" />
            <button onClick={() => setSelectedPlayer(null)} className="absolute top-4 right-4 p-1.5 bg-white/5 border border-white/5 rounded-full text-gray-400 hover:text-white transition-all"><X size={14} /></button>

            <div className={`relative w-24 h-24 rounded-full overflow-hidden bg-[#1c2026] border-2 mx-auto shadow-lg ${isDead(selectedPlayer.roles) ? 'border-gray-600 opacity-60 grayscale' : 'border-[#c0ff00]'}`}>
              <img src={selectedPlayer.avatar_url || 'https://via.placeholder.com/150'} alt="avatar" className="w-full h-full object-cover" />
            </div>

            <div className="space-y-1">
              <h2 className={`text-2xl font-black tracking-wide break-all px-6 ${isDead(selectedPlayer.roles) ? 'text-gray-500 line-through' : 'text-white'}`}>{selectedPlayer.rp_name}</h2>
              <p className="text-sm text-gray-400 font-mono tracking-tight break-all">{selectedPlayer.mc_nickname}</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5 rounded-full text-xs font-medium mt-1 text-[#c0ff00]">
                <span>🏛️ Партия:</span><span className="font-bold">{selectedPlayer.party || 'Нет партии'}</span>
              </div>
            </div>

            <div className="w-full h-[1px] bg-white/5 my-2" />
            <div className="text-left space-y-2 w-full">
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold pl-1">Роли и звания</div>
              <div className="flex flex-wrap gap-2 items-center">
                {selectedPlayer.roles?.map((role: string, idx: number) => (
                  <span key={idx} className="text-xs font-bold py-1 px-3 rounded-full border bg-white/5 text-gray-300 border-white/10">
                    • {role.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
