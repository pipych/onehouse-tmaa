import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { supabase } from '../lib/supabase';
import { getSeasonState, getAllPastSeasons, seasonName } from '../lib/season';
import Avatar from '../components/Avatar';
import { ArrowLeft, FolderArchive, ChevronDown, Users, Search, RefreshCw, X, Skull, Swords } from '../components/ui/SFSymbol';

export default function ArchiveCharactersPage() {
  const navigate = useNavigate();
  const { showBackButton, hideBackButton } = useTelegram();
  const [selectedSeason, setSelectedSeason] = useState<string>('Сезон 2');
  const [showSeasonSelector, setShowSeasonSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [playerChars, setPlayerChars] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<string[]>(['Сезон 2']);

  function isDead(char: any) {
    if (!char) return false;
    const profs = char.professions || [];
    return profs.some((p: string) => p.toLowerCase() === 'мёртв') || char.status === 'dead';
  }

  useEffect(() => {
    async function loadSeasons() {
      const state = await getSeasonState();
      const past = await getAllPastSeasons();
      const nums = new Set<number>();
      nums.add(state.season_number);
      past.forEach(s => nums.add(s.season_number));
      const list = Array.from(nums).sort((a, b) => b - a).map(n => seasonName(n));
      setSeasons(list);
      if (list.length > 0) setSelectedSeason(list[0]);
    }
    loadSeasons();
  }, []);

  async function loadPlayerChars(playerId: string) {
    const { data } = await supabase
      .from('characters')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false });
    if (data) setPlayerChars(data);
  }

  useEffect(() => {
    async function fetchArchivedPlayers() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('characters')
          .select('*, player:players(tg_id, tg_username)')
          .eq('season', selectedSeason)
          .order('rp_name', { ascending: true });

        if (data && !error) {
          const filtered = data.filter((char: any) => 
            !searchQuery || char.rp_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            char.mc_nickname.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setCharacters(filtered);
        }
      } catch (e) {}
      setLoading(false);
    }

    fetchArchivedPlayers();
  }, [selectedSeason, searchQuery]);

  function renderChar(char: any) {
    const dead = isDead(char);
    return (
      <div 
        key={char.id}
        onClick={() => { loadPlayerChars(char.player_id); setSelectedPlayer(char); }}
        className={`p-4 rounded-[28px] flex items-center space-x-4 cursor-pointer shadow-md active:scale-[0.98] transition-transform w-full cv-card gpu-layer ${dead ? 'bg-[#090b0e] hover:bg-[#14171c] opacity-60 grayscale-[50%]' : 'bg-[#14171c] hover:bg-[#181c23]'}`}
      >
        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#181c23] flex-shrink-0"><img src={char.avatar_url || ''} alt="avatar" loading="lazy" decoding="async" className="w-full h-full object-cover" /></div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-black truncate tracking-wide ${dead ? 'text-[#8e8e93] line-through' : 'text-white'}`}>{char.rp_name}</div>
          <div className="text-xs text-[#8e8e93] truncate font-mono tracking-tight">{char.mc_nickname}</div>
          <div className="text-[11px] text-[#8e8e93] font-medium mt-0.5 truncate">🏛️ {char.party || 'Нет партии'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-tma-safe md:pt-8 pb-32 antialiased">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
        
        <div className="flex items-center justify-between w-full select-none">
          <button onClick={() => navigate('/')} className="w-10 h-10 flex items-center justify-center bg-[#14171c] rounded-full text-white shadow-lg active:scale-90 transition-transform"><ArrowLeft size={18} /></button>

          <div className="relative">
            <button onClick={() => setShowSeasonSelector(!showSeasonSelector)} className="bg-[#14171c] py-2 px-4 rounded-full flex items-center gap-2 text-xs font-bold text-white shadow-md active:scale-95 transition-all">
              <FolderArchive size={14} className="text-[#c0ff00]" />
              <span>{selectedSeason}</span>
              <ChevronDown size={14} className={`text-[#8e8e93] transition-transform duration-300 ${showSeasonSelector ? 'rotate-180' : ''}`} />
            </button>

            {showSeasonSelector && (
              <div className="absolute right-0 mt-2 bg-[#14171c] rounded-[24px] p-2 z-50 shadow-2xl min-w-[140px] flex flex-col gap-1 animate-fade-in">
                {seasons.map((season) => (
                  <button key={season} onClick={() => { setSelectedSeason(season); setShowSeasonSelector(false); }} className={`text-xs text-left px-3 py-2 rounded-full font-bold transition-all ${selectedSeason === season ? 'bg-[#1c222b] text-[#c0ff00]' : 'text-[#8e8e93] hover:text-white hover:bg-white/5'}`}>{season}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center bg-[#14171c] rounded-full px-4 py-3 w-full shadow-lg">
          <Search size={18} className="text-[#8e8e93] shrink-0" />
          <input type="text" placeholder="Поиск персонажей..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm font-medium text-white ml-3 w-full placeholder:text-[#8e8e93] focus:ring-0" />
        </div>

        <div className="flex items-center gap-2 px-1">
          <Users size={18} className="text-[#c0ff00]" />
          <h2 className="text-sm font-black uppercase tracking-widest text-[#8e8e93]">Персонажи ({selectedSeason})</h2>
        </div>

        {loading ? (
          <div className="col-span-full flex justify-center py-12"><RefreshCw className="animate-spin text-[#c0ff00]" size={24} /></div>
        ) : characters.length === 0 ? (
          <div className="col-span-full text-center py-12 text-xs font-mono text-[#8e8e93] bg-[#14171c] rounded-[28px]">ПЕРСОНАЖЕЙ НЕ НАЙДЕНО</div>
        ) : (
          <>
            {/* Живые */}
            {characters.filter(c => !isDead(c)).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 px-1"><Swords size={14} className="text-[#c0ff00]" /><span className="text-xs text-[#8e8e93] uppercase tracking-wider font-semibold">Живые ({characters.filter(c => !isDead(c)).length})</span></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {characters.filter(c => !isDead(c)).map(char => renderChar(char))}
                </div>
              </div>
            )}
            {/* Мёртвые */}
            {characters.filter(c => isDead(c)).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 px-1"><Skull size={14} className="text-[#8e8e93]" /><span className="text-xs text-[#8e8e93] uppercase tracking-wider font-semibold">Мёртвые ({characters.filter(c => isDead(c)).length})</span></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {characters.filter(c => isDead(c)).map(char => renderChar(char))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Модальное окно персонажа */}
      {selectedPlayer && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300" onClick={() => { setSelectedPlayer(null); setPlayerChars([]); }} />
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-32px)] max-w-md p-6 rounded-[32px] shadow-2xl text-center space-y-5 animate-profile-grow overflow-visible ${isDead(selectedPlayer) ? 'bg-[#090b0e]' : 'bg-[#14171c]'}`}>
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#c0ff00]/10 to-transparent pointer-events-none rounded-t-[32px]" />
            <button onClick={() => { setSelectedPlayer(null); setPlayerChars([]); }} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#181c23] flex items-center justify-center text-[#8e8e93] hover:text-white transition-all"><X size={14} /></button>

            <div className={`relative w-24 h-24 rounded-full overflow-hidden bg-[#181c23] mx-auto shadow-lg ${isDead(selectedPlayer) ? 'opacity-60 grayscale' : ''}`}>
              <img src={selectedPlayer.avatar_url || ''} alt="avatar" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </div>

            <div className="space-y-1">
              <h2 className={`text-2xl font-black tracking-wide break-all px-6 ${isDead(selectedPlayer) ? 'text-[#8e8e93] line-through' : 'text-white'}`}>{selectedPlayer.rp_name}</h2>
              <p className="text-sm text-[#8e8e93] font-mono tracking-tight break-all">{selectedPlayer.mc_nickname}</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#181c23] rounded-full text-xs font-medium mt-1 text-[#c0ff00]">
                <span>🏛️ Партия:</span><span className="font-bold">{selectedPlayer.party || 'Нет партии'}</span>
              </div>
              <p className="text-[10px] text-[#8e8e93]">{selectedPlayer.season}</p>
            </div>

            <div className="text-left space-y-2 w-full pt-1">
              <div className="text-xs text-[#8e8e93] uppercase tracking-wider font-semibold pl-1">Роли</div>
              <div className="flex flex-wrap gap-2 items-center">
                {selectedPlayer.roles?.map((role: string, idx: number) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 text-xs font-bold py-1 px-3 rounded-full bg-white/5 text-[#8e8e93]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8e8e93] shrink-0" />
                    <span>{role.toUpperCase()}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Все персонажи игрока */}
            {playerChars.length > 0 && (
              <div className="text-left space-y-2 w-full pt-2">
                <div className="text-xs text-[#8e8e93] uppercase tracking-wider font-semibold pl-1">Персонажи</div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {playerChars.map((pc: any) => (
                    <div key={pc.id} className={`flex items-center gap-2 p-2.5 rounded-2xl ${isDead(pc) ? 'bg-[#090b0e] opacity-60' : 'bg-[#181c23]'}`}>
                      <div className={`w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-[#14171c] ${isDead(pc) ? 'grayscale' : ''}`}>
                        {pc.avatar_url ? <img src={pc.avatar_url} loading="lazy" decoding="async" className="w-full h-full object-cover" /> : <Users size={14} className="m-auto text-[#8e8e93]" />}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className={`text-xs font-bold truncate ${isDead(pc) ? 'text-[#8e8e93] line-through' : 'text-white'}`}>{pc.rp_name}</div>
                        <div className="text-[9px] text-[#8e8e93]">{pc.season} · {pc.party || 'Нет партии'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
