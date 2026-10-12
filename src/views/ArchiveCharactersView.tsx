import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { supabase } from '../lib/supabase';
import { getSeasonState, getAllPastSeasons, seasonName } from '../lib/season';
import Avatar from '../components/Avatar';
import { ArrowLeft, Users, Search, RefreshCw, X, Skull, Swords } from '../components/ui/SFSymbol';
import SeasonSelector from '../components/SeasonSelector';
import { UserProfileOverlay } from '../components/UserProfileOverlay';

export default function ArchiveCharactersPage() {
  const navigate = useNavigate();
  const { showBackButton, hideBackButton } = useTelegram();
  const [selectedSeason, setSelectedSeason] = useState<string>('Сезон 2');
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

          <SeasonSelector
            seasons={seasons}
            selectedSeason={selectedSeason}
            onSelectSeason={setSelectedSeason}
          />
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

      {/* Модальное окно персонажа / профиля */}
      <UserProfileOverlay
        open={Boolean(selectedPlayer)}
        onClose={() => setSelectedPlayer(null)}
        character={selectedPlayer}
        allCharacters={characters}
        onSelectCharacter={(char) => setSelectedPlayer(char)}
      />
    </div>
  );
}
