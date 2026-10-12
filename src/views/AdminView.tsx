import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { supabase } from '../lib/supabase';
import { addGuest, removeGuest, getGuests } from '../lib/guests';
import { OneIcon } from '../ui/components/Icon';
import { Button } from '../ui/components/Button';
import { cn } from '../ui/utils/cn';

// --- Helpers ---
function convertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas Error'));
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('WebP Conversion Error'));
        }, 'image/webp', 0.85);
      };
    };
  });
}

async function uploadFile(
  event: React.ChangeEvent<HTMLInputElement>,
  setUrl: (url: string) => void,
  setLoading: (v: boolean) => void
) {
  try {
    setLoading(true);
    const file = event.target.files?.[0];
    if (!file) return;
    const webpBlob = await convertToWebP(file);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.webp`;
    const { error } = await supabase.storage.from('avatars').upload(fileName, webpBlob, { contentType: 'image/webp' });
    if (error) return alert('Ошибка загрузки: ' + error.message);
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    if (urlData) setUrl(urlData.publicUrl);
  } catch (e: any) {
    alert('Сбой при загрузке: ' + e.message);
  } finally {
    setLoading(false);
  }
}

function isBrightColor(hex: string): boolean {
  if (!hex || !hex.startsWith('#')) return false;
  const c = hex.substring(1);
  const rgb = parseInt(c, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 140;
}

// --- Types ---
type MainTab = 'home' | 'players' | 'server';
type PlayersSubTab = 'profiles' | 'characters' | 'professions' | 'roles' | 'guests';

export default function AdminPage() {
  const navigate = useNavigate();
  const { showBackButton, hideBackButton } = useTelegram();

  // Telegram back button integration
  useEffect(() => {
    if (showBackButton) showBackButton(() => navigate('/'));
    return () => {
      if (hideBackButton) hideBackButton();
    };
  }, [showBackButton, hideBackButton, navigate]);

  // --- Tabs ---
  const [mainTab, setMainTab] = useState<MainTab>('home');
  const [playersSubTab, setPlayersSubTab] = useState<PlayersSubTab>('profiles');

  // --- Search filters ---
  const [profileSearch, setProfileSearch] = useState('');
  const [charSearch, setCharSearch] = useState('');

  // --- Season state ---
  const [seasonEnded, setSeasonEnded] = useState(false);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [currentSeasonNum, setCurrentSeasonNum] = useState(2);
  const [currentSeasonName, setCurrentSeasonName] = useState('Сезон 2');
  const [pastSeasons, setPastSeasons] = useState<any[]>([]);

  // --- Data ---
  const [professions, setProfessions] = useState<any[]>([]);
  const [customRoles, setCustomRoles] = useState<any[]>([]);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [guestList, setGuestList] = useState<any[]>([]);

  // --- Form: Profiles ---
  const [addMcNickname, setAddMcNickname] = useState('');
  const [addTgId, setAddTgId] = useState('');
  const [addTgUsername, setAddTgUsername] = useState('');
  const [addAvatarUrl, setAddAvatarUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editPlayerData, setEditPlayerData] = useState({
    mc_nickname: '',
    tg_id: '',
    tg_username: '',
    avatar_url: '',
    tg_id_2: '',
    roles: [] as string[],
  });

  // --- Form: Characters ---
  const [addRpName, setAddRpName] = useState('');
  const [addParty, setAddParty] = useState('');
  const [addProfessions, setAddProfessions] = useState<string[]>([]);
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [editCharData, setEditCharData] = useState({
    rp_name: '',
    party: 'Нет партии',
    avatar_url: '',
    professions: [] as string[],
  });

  // --- Form: Roles ---
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#c0ff00');
  const [newRolePerm, setNewRolePerm] = useState(false);

  // --- Form: Professions ---
  const [newProfessionName, setNewProfessionName] = useState('');
  const [newProfessionColor, setNewProfessionColor] = useState('#c0ff00');

  // --- Form: Guests ---
  const [guestTgId, setGuestTgId] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);

  // --- Helper: Profession color ---
  const getProfessionColor = (name: string) => {
    const found = professions.find((p) => p.name.toLowerCase() === name.toLowerCase());
    return found ? found.color : '#8e8e93';
  };

  // --- Load season state ---
  const loadSeasonState = async () => {
    const { getSeasonState, getAllPastSeasons } = await import('../lib/season');
    const state = await getSeasonState();
    setCurrentSeasonNum(state.season_number);
    setCurrentSeasonName('Сезон ' + state.season_number);
    setSeasonEnded(!state.is_active);
    const all = await getAllPastSeasons();
    setPastSeasons(all);
  };

  // --- Data loading ---
  const loadAllPlayersData = async () => {
    const { data } = await supabase.from('players').select('*').order('mc_nickname');
    if (data) setAllPlayers(data);
  };

  const loadPlayersData = async () => {
    const { data } = await supabase
      .from('characters')
      .select('*')
      .eq('season', currentSeasonName)
      .order('rp_name');
    if (data) setPlayers(data);
  };

  const loadProfessionsData = async () => {
    const { data } = await supabase.from('professions').select('*').order('name');
    if (data) setProfessions(data);
  };

  const loadCustomRoles = async () => {
    const { data } = await supabase.from('roles').select('*').order('name');
    if (data) setCustomRoles(data);
  };

  const loadGuestsData = async () => {
    const guests = await getGuests();
    setGuestList(guests || []);
  };

  useEffect(() => {
    loadSeasonState();
    loadAllPlayersData();
    loadPlayersData();
    loadProfessionsData();
    loadCustomRoles();
    loadGuestsData();
  }, []);

  useEffect(() => {
    loadPlayersData();
  }, [currentSeasonName]);

  // --- Season operations ---
  const handleEndSeason = async () => {
    if (!confirm('Завершить текущий сезон? Вся информация будет скрыта.')) return;
    setSeasonLoading(true);
    const { endSeason } = await import('../lib/season');
    const ok = await endSeason();
    if (ok) {
      setSeasonEnded(true);
      loadSeasonState();
      loadPlayersData();
    } else {
      alert('Ошибка завершения сезона.');
    }
    setSeasonLoading(false);
  };

  const handleUndoEndSeason = async () => {
    if (!confirm('Отменить завершение сезона?')) return;
    setSeasonLoading(true);
    const { undoEndSeason } = await import('../lib/season');
    const ok = await undoEndSeason();
    if (ok) {
      setSeasonEnded(false);
      loadSeasonState();
    } else {
      alert('Ошибка отмены завершения');
    }
    setSeasonLoading(false);
  };

  const handleStartNewSeason = async () => {
    const nextNum =
      (pastSeasons.length > 0 ? Math.max(...pastSeasons.map((s) => s.season_number)) : currentSeasonNum) + 1;
    if (!confirm('Начать новый сезон #' + nextNum + '?')) return;
    setSeasonLoading(true);
    const { startNewSeason } = await import('../lib/season');
    const ok = await startNewSeason();
    if (ok) {
      setSeasonEnded(false);
      loadSeasonState();
      loadPlayersData();
    } else {
      alert('Ошибка создания нового сезона');
    }
    setSeasonLoading(false);
  };

  const handleRestoreSeason = async (id: number, num: number) => {
    if (!confirm('Восстановить сезон #' + num + '?')) return;
    setSeasonLoading(true);
    const { restorePastSeason } = await import('../lib/season');
    const ok = await restorePastSeason(id);
    if (ok) {
      setSeasonEnded(false);
      loadSeasonState();
    } else {
      alert('Ошибка восстановления сезона');
    }
    setSeasonLoading(false);
  };

  const handleDeleteSeason = async (id: number, num: number) => {
    if (!confirm('Удалить сезон #' + num + ' навсегда?')) return;
    setSeasonLoading(true);
    const { deletePastSeason } = await import('../lib/season');
    const ok = await deletePastSeason(id);
    if (ok) loadSeasonState();
    else alert('Ошибка удаления сезона');
    setSeasonLoading(false);
  };

  // --- Role operations ---
  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    const { error } = await supabase.from('roles').insert({
      name: newRoleName.toLowerCase(),
      color: newRoleColor,
      can_edit_constitution: newRolePerm,
    });
    if (error) {
      alert('Ошибка: ' + error.message);
      return;
    }
    setNewRoleName('');
    loadCustomRoles();
  };

  // --- Guest operations ---
  const handleAddGuest = async () => {
    const tgId = parseInt(guestTgId);
    if (!tgId) return;
    setGuestLoading(true);
    const ok = await addGuest(tgId, 'Админ');
    if (ok) {
      setGuestTgId('');
      loadGuestsData();
    } else {
      alert('Ошибка добавления гостя');
    }
    setGuestLoading(false);
  };

  const handleRemoveGuest = async (tgId: number) => {
    const ok = await removeGuest(tgId);
    if (ok) loadGuestsData();
    else alert('Ошибка удаления гостя');
  };

  // --- Filtered lists for instant search ---
  const filteredProfiles = useMemo(() => {
    if (!profileSearch.trim()) return allPlayers;
    const q = profileSearch.toLowerCase();
    return allPlayers.filter(
      (p) =>
        p.mc_nickname?.toLowerCase().includes(q) ||
        p.tg_username?.toLowerCase().includes(q) ||
        String(p.tg_id || '').includes(q) ||
        String(p.tg_id_2 || '').includes(q)
    );
  }, [allPlayers, profileSearch]);

  const filteredCharacters = useMemo(() => {
    if (!charSearch.trim()) return players;
    const q = charSearch.toLowerCase();
    return players.filter(
      (c) =>
        c.rp_name?.toLowerCase().includes(q) ||
        c.mc_nickname?.toLowerCase().includes(q) ||
        c.party?.toLowerCase().includes(q)
    );
  }, [players, charSearch]);

  // ===================================================================
  // RENDER
  // ===================================================================
  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-tma-safe md:pt-8 pb-32 antialiased selection:bg-[#c0ff00]/30 selection:text-white">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">

        {/* --- Top Navigation Header --- */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-11 h-11 flex items-center justify-center bg-[#14171c] hover:bg-[#181c23] rounded-full text-white shadow-lg active:scale-95 transition-all border-none cursor-pointer sf-tap shrink-0"
              aria-label="Вернуться назад"
            >
              <OneIcon name="arrow_back" size={20} />
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#c0ff00]/10 flex items-center justify-center shrink-0">
                <OneIcon name="admin_panel_settings" size={20} className="text-[#c0ff00]" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-black text-white tracking-tight truncate leading-tight">
                  Админ-панель
                </h1>
                <p className="text-xs text-[#8e8e93] font-medium leading-none">
                  Управление OneHouse
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Tab Switcher (Prominent Pill Bar) */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-[#14171c] shadow-xl shrink-0">
            {(
              [
                { key: 'home' as const, label: 'Главная', icon: 'dashboard' },
                { key: 'players' as const, label: 'Игроки', icon: 'group' },
                { key: 'server' as const, label: 'Сервер', icon: 'dns' },
              ] as const
            ).map((t) => {
              const isActive = mainTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setMainTab(t.key)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer border-none outline-none select-none active:scale-95 sf-tap',
                    isActive
                      ? 'bg-[#1c222b] text-[#c0ff00] shadow-md shadow-black/40'
                      : 'text-[#8e8e93] hover:text-white hover:bg-white/[0.04]'
                  )}
                >
                  <OneIcon
                    name={t.icon}
                    size={16}
                    className={isActive ? 'text-[#c0ff00]' : 'text-[#8e8e93]'}
                  />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </nav>
        </header>

        {/* ============================================================= */}
        {/* TAB 1: ГЛАВНАЯ (BENTO DASHBOARD)                               */}
        {/* ============================================================= */}
        {mainTab === 'home' && (
          <div className="space-y-6 animate-fade-in">
            {/* Bento Grid Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Card 1: Игроки */}
              <div
                onClick={() => {
                  setMainTab('players');
                  setPlayersSubTab('profiles');
                }}
                className="bg-[#14171c] hover:bg-[#181c23] p-5 rounded-[28px] shadow-xl cursor-pointer transition-all duration-200 active:scale-[0.98] flex flex-col justify-between min-h-[140px] group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#8e8e93] uppercase tracking-wider">
                    Игроки
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#181c23] group-hover:bg-[#1c222b] flex items-center justify-center transition-colors">
                    <OneIcon name="group" size={18} className="text-[#c0ff00]" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white tracking-tight">
                    {allPlayers.length}
                  </div>
                  <div className="text-xs text-[#8e8e93] font-medium mt-0.5">
                    Minecraft профилей
                  </div>
                </div>
              </div>

              {/* Card 2: Персонажи сезона */}
              <div
                onClick={() => {
                  setMainTab('players');
                  setPlayersSubTab('characters');
                }}
                className="bg-[#14171c] hover:bg-[#181c23] p-5 rounded-[28px] shadow-xl cursor-pointer transition-all duration-200 active:scale-[0.98] flex flex-col justify-between min-h-[140px] group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#8e8e93] uppercase tracking-wider">
                    Персонажи
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#181c23] group-hover:bg-[#1c222b] flex items-center justify-center transition-colors">
                    <OneIcon name="badge" size={18} className="text-[#c0ff00]" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white tracking-tight">
                    {players.length}
                  </div>
                  <div className="text-xs text-[#8e8e93] font-medium mt-0.5">
                    {currentSeasonName}
                  </div>
                </div>
              </div>

              {/* Card 3: Сервер / Сезон */}
              <div
                onClick={() => setMainTab('server')}
                className="bg-[#14171c] hover:bg-[#181c23] p-5 rounded-[28px] shadow-xl cursor-pointer transition-all duration-200 active:scale-[0.98] flex flex-col justify-between min-h-[140px] group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#8e8e93] uppercase tracking-wider">
                    Сезон
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#181c23] group-hover:bg-[#1c222b] flex items-center justify-center transition-colors">
                    <OneIcon
                      name="dns"
                      size={18}
                      className={seasonEnded ? 'text-red-400' : 'text-[#c0ff00]'}
                    />
                  </div>
                </div>
                <div>
                  <div
                    className={cn(
                      'text-xl font-black tracking-tight truncate',
                      seasonEnded ? 'text-red-400' : 'text-white'
                    )}
                  >
                    {seasonEnded ? 'Завершён' : 'Активен'}
                  </div>
                  <div className="text-xs text-[#8e8e93] font-medium mt-0.5">
                    {currentSeasonName}
                  </div>
                </div>
              </div>

              {/* Card 4: Роли & Профессии */}
              <div
                onClick={() => {
                  setMainTab('players');
                  setPlayersSubTab('roles');
                }}
                className="bg-[#14171c] hover:bg-[#181c23] p-5 rounded-[28px] shadow-xl cursor-pointer transition-all duration-200 active:scale-[0.98] flex flex-col justify-between min-h-[140px] group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#8e8e93] uppercase tracking-wider">
                    Конфигурация
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#181c23] group-hover:bg-[#1c222b] flex items-center justify-center transition-colors">
                    <OneIcon name="verified_user" size={18} className="text-[#c0ff00]" />
                  </div>
                </div>
                <div>
                  <div className="text-xl font-black text-white tracking-tight">
                    {customRoles.length} ролей
                  </div>
                  <div className="text-xs text-[#8e8e93] font-medium mt-0.5">
                    {professions.length} профессий
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-[#14171c] p-6 rounded-[28px] shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#8e8e93] uppercase tracking-wider pl-1">
                <OneIcon name="bolt" size={16} className="text-[#c0ff00]" />
                <span>Быстрые действия</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    setMainTab('players');
                    setPlayersSubTab('profiles');
                  }}
                  className="w-full justify-start pl-4"
                  leftIcon={<OneIcon name="person_add" size={18} className="text-[#c0ff00]" />}
                >
                  Создать профиль
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    setMainTab('players');
                    setPlayersSubTab('characters');
                  }}
                  className="w-full justify-start pl-4"
                  leftIcon={<OneIcon name="badge" size={18} className="text-[#c0ff00]" />}
                >
                  Создать персонажа
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setMainTab('server')}
                  className="w-full justify-start pl-4"
                  leftIcon={<OneIcon name="calendar_today" size={18} className="text-[#c0ff00]" />}
                >
                  Управление сезонами
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: ИГРОКИ (PLAYERS MANAGEMENT)                             */}
        {/* ============================================================= */}
        {mainTab === 'players' && (
          <div className="space-y-6 animate-fade-in">
            {/* Horizontal Sub-tabs Switcher */}
            <div className="bg-[#14171c] p-1.5 rounded-full flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-lg">
              {(
                [
                  { key: 'profiles' as const, label: 'Профили', icon: 'person' },
                  { key: 'characters' as const, label: 'Персонажи', icon: 'group' },
                  { key: 'professions' as const, label: 'Профессии', icon: 'build' },
                  { key: 'roles' as const, label: 'Роли', icon: 'verified_user' },
                  { key: 'guests' as const, label: 'Гости', icon: 'person_add' },
                ] as const
              ).map((tab) => {
                const isActive = playersSubTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setPlayersSubTab(tab.key)}
                    className={cn(
                      'text-xs font-bold uppercase px-4 py-2.5 rounded-full whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer border-none outline-none select-none active:scale-95 sf-tap',
                      isActive
                        ? 'bg-[#1c222b] text-[#c0ff00] shadow-sm'
                        : 'text-[#8e8e93] hover:text-white hover:bg-white/[0.04]'
                    )}
                  >
                    <OneIcon
                      name={tab.icon}
                      size={15}
                      className={isActive ? 'text-[#c0ff00]' : 'text-[#8e8e93]'}
                    />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* --- SUBTAB 2.1: ПРОФИЛИ --- */}
            {playersSubTab === 'profiles' && (
              <div className="space-y-5">
                {/* Create Profile Card */}
                <div className="bg-[#14171c] p-6 rounded-[28px] space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                    <div className="w-7 h-7 rounded-full bg-[#c0ff00]/10 flex items-center justify-center">
                      <OneIcon name="person_add" size={16} className="text-[#c0ff00]" />
                    </div>
                    <span>Создать Minecraft-профиль</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Minecraft ник *"
                      value={addMcNickname}
                      onChange={(e) => setAddMcNickname(e.target.value)}
                      className="w-full bg-[#181c23] hover:bg-[#1c222b] focus:bg-[#1c222b] rounded-full px-5 py-3 text-sm text-white placeholder-[#8e8e93] border-none outline-none transition-colors"
                    />
                    <input
                      type="number"
                      placeholder="Telegram ID"
                      value={addTgId}
                      onChange={(e) => setAddTgId(e.target.value)}
                      className="w-full bg-[#181c23] hover:bg-[#1c222b] focus:bg-[#1c222b] rounded-full px-5 py-3 text-sm text-white placeholder-[#8e8e93] border-none outline-none transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="Telegram Username"
                      value={addTgUsername}
                      onChange={(e) => setAddTgUsername(e.target.value)}
                      className="w-full bg-[#181c23] hover:bg-[#1c222b] focus:bg-[#1c222b] rounded-full px-5 py-3 text-sm text-white placeholder-[#8e8e93] border-none outline-none transition-colors"
                    />
                    <label className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-[#181c23] hover:bg-[#1c222b] text-white text-sm font-bold cursor-pointer transition-colors active:scale-[0.98] select-none border-none relative overflow-hidden">
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => uploadFile(e, setAddAvatarUrl, setIsUploading)}
                      />
                      <OneIcon
                        name={isUploading ? 'sync' : addAvatarUrl ? 'check_circle' : 'upload'}
                        size={18}
                        className={
                          isUploading
                            ? 'animate-spin text-[#c0ff00]'
                            : addAvatarUrl
                            ? 'text-[#c0ff00]'
                            : 'text-[#8e8e93]'
                        }
                      />
                      <span className="truncate text-xs font-semibold text-[#8e8e93]">
                        {isUploading
                          ? 'Загрузка аватара...'
                          : addAvatarUrl
                          ? 'Аватар выбран'
                          : 'Загрузить аватар'}
                      </span>
                    </label>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={async () => {
                      const mcNick = addMcNickname.trim();
                      if (!mcNick) return alert('Введите Minecraft ник');
                      const tgIdNum = addTgId ? parseInt(addTgId) : null;
                      const { data: existing } = await supabase
                        .from('players')
                        .select('id')
                        .eq('mc_nickname', mcNick)
                        .limit(1);
                      if (existing && existing.length > 0) {
                        return alert('Игрок с таким ником уже существует!');
                      }
                      if (tgIdNum) {
                        const { data: tgExists } = await supabase
                          .from('players')
                          .select('id')
                          .eq('tg_id', tgIdNum)
                          .limit(1);
                        if (tgExists && tgExists.length > 0) {
                          return alert('Этот Telegram ID уже привязан!');
                        }
                      }
                      const { error } = await supabase.from('players').insert({
                        mc_nickname: mcNick,
                        tg_id: tgIdNum,
                        tg_username: addTgUsername || '',
                        avatar_url: addAvatarUrl || '',
                      });
                      if (error) {
                        alert('Ошибка: ' + error.message);
                        return;
                      }
                      setAddMcNickname('');
                      setAddTgId('');
                      setAddTgUsername('');
                      setAddAvatarUrl('');
                      loadAllPlayersData();
                    }}
                    className="w-full justify-center"
                    leftIcon={<OneIcon name="check" size={18} />}
                  >
                    Создать профиль
                  </Button>
                </div>

                {/* Profiles List Card */}
                <div className="bg-[#14171c] p-6 rounded-[28px] shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                      <OneIcon name="group" size={18} className="text-[#c0ff00]" />
                      <span>Все профили ({allPlayers.length})</span>
                    </div>

                    {/* Instant Search Bar */}
                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        placeholder="Поиск по нику или TG..."
                        value={profileSearch}
                        onChange={(e) => setProfileSearch(e.target.value)}
                        className="w-full bg-[#181c23] hover:bg-[#1c222b] focus:bg-[#1c222b] rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder-[#8e8e93] border-none outline-none transition-colors"
                      />
                      <OneIcon
                        name="search"
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8e93] pointer-events-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[550px] overflow-y-auto overscroll-contain no-scrollbar">
                    {filteredProfiles.map((p: any) => (
                      <div key={p.id}>
                        {editingPlayerId === p.id ? (
                          /* Edit Profile Container */
                          <div className="bg-[#181c23] p-4 sm:p-5 rounded-[24px] space-y-3.5 shadow-md">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <input
                                type="text"
                                placeholder="Minecraft ник"
                                value={editPlayerData.mc_nickname}
                                onChange={(e) =>
                                  setEditPlayerData((prev) => ({
                                    ...prev,
                                    mc_nickname: e.target.value,
                                  }))
                                }
                                className="w-full bg-[#14171c] rounded-full px-4 py-2.5 text-xs text-white placeholder-[#8e8e93] border-none outline-none"
                              />
                              <input
                                type="number"
                                placeholder="Telegram ID"
                                value={editPlayerData.tg_id}
                                onChange={(e) =>
                                  setEditPlayerData((prev) => ({
                                    ...prev,
                                    tg_id: e.target.value,
                                  }))
                                }
                                className="w-full bg-[#14171c] rounded-full px-4 py-2.5 text-xs text-white placeholder-[#8e8e93] border-none outline-none"
                              />
                              <input
                                type="number"
                                placeholder="Второй Telegram ID"
                                value={editPlayerData.tg_id_2}
                                onChange={(e) =>
                                  setEditPlayerData((prev) => ({
                                    ...prev,
                                    tg_id_2: e.target.value,
                                  }))
                                }
                                className="w-full bg-[#14171c] rounded-full px-4 py-2.5 text-xs text-white placeholder-[#8e8e93] border-none outline-none"
                              />
                              <input
                                type="text"
                                placeholder="TG Username"
                                value={editPlayerData.tg_username}
                                onChange={(e) =>
                                  setEditPlayerData((prev) => ({
                                    ...prev,
                                    tg_username: e.target.value,
                                  }))
                                }
                                className="w-full bg-[#14171c] rounded-full px-4 py-2.5 text-xs text-white placeholder-[#8e8e93] border-none outline-none"
                              />
                            </div>

                            <label className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#14171c] text-white text-xs font-semibold cursor-pointer relative overflow-hidden">
                              <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) =>
                                  uploadFile(
                                    e,
                                    (url) =>
                                      setEditPlayerData((prev) => ({
                                        ...prev,
                                        avatar_url: url,
                                      })),
                                    setIsUploading
                                  )
                                }
                              />
                              <OneIcon
                                name="upload"
                                size={15}
                                className={isUploading ? 'animate-spin text-[#c0ff00]' : 'text-[#8e8e93]'}
                              />
                              <span className="text-[#8e8e93] truncate">
                                {editPlayerData.avatar_url ? 'Аватар загружен (заменить)' : 'Загрузить аватар'}
                              </span>
                            </label>

                            {/* Roles Selection */}
                            <div className="space-y-1.5">
                              <div className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-wider pl-1">
                                Роли игрока
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {customRoles.map((role) => {
                                  const hasRole = editPlayerData.roles?.includes(role.name);
                                  return (
                                    <button
                                      key={role.id}
                                      type="button"
                                      onClick={() => {
                                        setEditPlayerData((prev) => ({
                                          ...prev,
                                          roles: hasRole
                                            ? prev.roles.filter((r) => r !== role.name)
                                            : [...prev.roles, role.name],
                                        }));
                                      }}
                                      className={cn(
                                        'text-[10px] font-bold px-3 py-1 rounded-full transition-all border-none cursor-pointer active:scale-95',
                                        hasRole
                                          ? 'text-[#c0ff00] bg-[#c0ff00]/15'
                                          : 'bg-[#14171c] text-[#8e8e93] hover:text-white'
                                      )}
                                      style={hasRole ? { color: role.color, backgroundColor: `${role.color}20` } : {}}
                                    >
                                      {role.name.toUpperCase()}
                                    </button>
                                  );
                                })}
                                {customRoles.length === 0 && (
                                  <span className="text-xs text-[#8e8e93] pl-1">Нет доступных ролей</span>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 pt-1">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={async () => {
                                  const payload = {
                                    ...editPlayerData,
                                    tg_id: editPlayerData.tg_id ? parseInt(editPlayerData.tg_id) : null,
                                    tg_id_2: editPlayerData.tg_id_2 ? parseInt(editPlayerData.tg_id_2) : null,
                                    roles: editPlayerData.roles,
                                  };
                                  const { error } = await supabase
                                    .from('players')
                                    .update(payload)
                                    .eq('id', p.id);
                                  if (error) {
                                    alert('Ошибка: ' + error.message);
                                    return;
                                  }
                                  setEditingPlayerId(null);
                                  loadAllPlayersData();
                                }}
                                className="flex-1 justify-center"
                                leftIcon={<OneIcon name="save" size={14} />}
                              >
                                Сохранить
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setEditingPlayerId(null)}
                                className="px-4"
                              >
                                <OneIcon name="close" size={16} />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          /* Normal Profile Row */
                          <div className="flex items-center justify-between bg-[#181c23] hover:bg-[#1c222b] p-3 sm:p-3.5 rounded-[20px] transition-colors group select-none">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-[#14171c] overflow-hidden shrink-0 flex items-center justify-center">
                                {p.avatar_url ? (
                                  <img
                                    src={p.avatar_url}
                                    alt={p.mc_nickname}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <OneIcon name="person" size={18} className="text-[#8e8e93]" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-bold text-white truncate">
                                  {p.mc_nickname}
                                </div>
                                <div className="text-[11px] text-[#8e8e93] font-mono truncate">
                                  {p.tg_id ? `TG: ${p.tg_id}` : 'Без TG'}{' '}
                                  {p.tg_username ? `@${p.tg_username}` : ''}
                                  {p.tg_id_2 ? ` | TG2: ${p.tg_id_2}` : ''}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingPlayerId(p.id);
                                setEditPlayerData({
                                  mc_nickname: p.mc_nickname,
                                  tg_id: p.tg_id?.toString() || '',
                                  tg_username: p.tg_username || '',
                                  avatar_url: p.avatar_url || '',
                                  tg_id_2: p.tg_id_2?.toString() || '',
                                  roles: p.roles || [],
                                });
                              }}
                              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-[#8e8e93] hover:text-[#c0ff00] transition-all border-none cursor-pointer shrink-0 ml-2"
                              aria-label="Редактировать профиль"
                            >
                              <OneIcon name="edit" size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {filteredProfiles.length === 0 && (
                      <p className="text-xs text-[#8e8e93] text-center py-6">
                        Профили не найдены
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* --- SUBTAB 2.2: ПЕРСОНАЖИ --- */}
            {playersSubTab === 'characters' && (
              <div className="space-y-5">
                {/* Create Character Card */}
                <div className="bg-[#14171c] p-6 rounded-[28px] space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                    <div className="w-7 h-7 rounded-full bg-[#c0ff00]/10 flex items-center justify-center">
                      <OneIcon name="badge" size={16} className="text-[#c0ff00]" />
                    </div>
                    <span>Создать персонажа для {currentSeasonName}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Minecraft ник игрока *"
                      value={addMcNickname}
                      onChange={(e) => setAddMcNickname(e.target.value)}
                      className="w-full bg-[#181c23] hover:bg-[#1c222b] focus:bg-[#1c222b] rounded-full px-5 py-3 text-sm text-white placeholder-[#8e8e93] border-none outline-none transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="RP-имя персонажа *"
                      value={addRpName}
                      onChange={(e) => setAddRpName(e.target.value)}
                      className="w-full bg-[#181c23] hover:bg-[#1c222b] focus:bg-[#1c222b] rounded-full px-5 py-3 text-sm text-white placeholder-[#8e8e93] border-none outline-none transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="Партия"
                      value={addParty}
                      onChange={(e) => setAddParty(e.target.value)}
                      className="w-full bg-[#181c23] hover:bg-[#1c222b] focus:bg-[#1c222b] rounded-full px-5 py-3 text-sm text-white placeholder-[#8e8e93] border-none outline-none transition-colors"
                    />
                    <label className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-[#181c23] hover:bg-[#1c222b] text-white text-sm font-bold cursor-pointer transition-colors active:scale-[0.98] select-none border-none relative overflow-hidden">
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => uploadFile(e, setAddAvatarUrl, setIsUploading)}
                      />
                      <OneIcon
                        name={isUploading ? 'sync' : addAvatarUrl ? 'check_circle' : 'upload'}
                        size={18}
                        className={
                          isUploading
                            ? 'animate-spin text-[#c0ff00]'
                            : addAvatarUrl
                            ? 'text-[#c0ff00]'
                            : 'text-[#8e8e93]'
                        }
                      />
                      <span className="truncate text-xs font-semibold text-[#8e8e93]">
                        {isUploading
                          ? 'Загрузка аватара...'
                          : addAvatarUrl
                          ? 'Аватар выбран'
                          : 'Загрузить аватар'}
                      </span>
                    </label>
                  </div>

                  {/* Professions selector */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-wider pl-1">
                      Профессии персонажа
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {professions.map((prof) => {
                        const isSelected = addProfessions.includes(prof.name);
                        return (
                          <button
                            key={prof.name}
                            type="button"
                            onClick={() => {
                              setAddProfessions((prev) =>
                                prev.includes(prof.name)
                                  ? prev.filter((r) => r !== prof.name)
                                  : [...prev, prof.name]
                              );
                            }}
                            className={cn(
                              'text-xs font-bold px-3 py-1.5 rounded-full transition-all border-none cursor-pointer active:scale-95',
                              isSelected
                                ? 'shadow-sm'
                                : 'bg-[#181c23] text-[#8e8e93] hover:text-white'
                            )}
                            style={
                              isSelected
                                ? { color: prof.color, backgroundColor: `${prof.color}25` }
                                : {}
                            }
                          >
                            {prof.name.toUpperCase()}
                          </button>
                        );
                      })}
                      {professions.length === 0 && (
                        <span className="text-xs text-[#8e8e93]">Нет доступных профессий</span>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={async () => {
                      if (!addMcNickname.trim() || !addRpName.trim()) {
                        return alert('Заполните ник и RP-имя');
                      }
                      const { data: playerData } = await supabase
                        .from('players')
                        .select('id')
                        .eq('mc_nickname', addMcNickname.trim())
                        .limit(1);
                      const player = playerData && playerData.length > 0 ? playerData[0] : null;
                      if (!player) {
                        return alert('Игрок не найден. Сначала создай профиль игрока.');
                      }
                      const { data: existingChars } = await supabase
                        .from('characters')
                        .select('professions')
                        .eq('player_id', player.id)
                        .order('created_at', { ascending: false })
                        .limit(1);
                      const inheritedProfs = existingChars?.[0]?.professions || [];
                      const finalProfs =
                        addProfessions.length > 0
                          ? Array.from(new Set([...inheritedProfs, ...addProfessions]))
                          : inheritedProfs;
                      const { error } = await supabase.from('characters').insert({
                        player_id: player.id,
                        mc_nickname: addMcNickname.trim(),
                        rp_name: addRpName.trim(),
                        party: addParty || 'Нет партии',
                        professions: finalProfs,
                        avatar_url: addAvatarUrl || '',
                        season: currentSeasonName,
                        status: 'alive',
                      });
                      if (error) {
                        alert('Ошибка: ' + error.message);
                        return;
                      }
                      setAddMcNickname('');
                      setAddRpName('');
                      setAddParty('');
                      setAddProfessions([]);
                      setAddAvatarUrl('');
                      loadPlayersData();
                    }}
                    className="w-full justify-center"
                    leftIcon={<OneIcon name="add" size={18} />}
                  >
                    Создать персонажа
                  </Button>
                </div>

                {/* Season Characters List Card */}
                <div className="bg-[#14171c] p-6 rounded-[28px] shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                      <OneIcon name="badge" size={18} className="text-[#c0ff00]" />
                      <span>Персонажи {currentSeasonName} ({players.length})</span>
                    </div>

                    {/* Instant Search Bar */}
                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        placeholder="Поиск по RP-имени или нику..."
                        value={charSearch}
                        onChange={(e) => setCharSearch(e.target.value)}
                        className="w-full bg-[#181c23] hover:bg-[#1c222b] focus:bg-[#1c222b] rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder-[#8e8e93] border-none outline-none transition-colors"
                      />
                      <OneIcon
                        name="search"
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8e93] pointer-events-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[550px] overflow-y-auto overscroll-contain no-scrollbar">
                    {filteredCharacters.map((c: any) => (
                      <div key={c.id}>
                        {editingCharId === c.id ? (
                          /* Edit Character Container */
                          <div className="bg-[#181c23] p-4 sm:p-5 rounded-[24px] space-y-3.5 shadow-md">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <input
                                type="text"
                                placeholder="RP-имя"
                                value={editCharData.rp_name}
                                onChange={(e) =>
                                  setEditCharData((prev) => ({
                                    ...prev,
                                    rp_name: e.target.value,
                                  }))
                                }
                                className="w-full bg-[#14171c] rounded-full px-4 py-2.5 text-xs text-white placeholder-[#8e8e93] border-none outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Партия"
                                value={editCharData.party}
                                onChange={(e) =>
                                  setEditCharData((prev) => ({
                                    ...prev,
                                    party: e.target.value,
                                  }))
                                }
                                className="w-full bg-[#14171c] rounded-full px-4 py-2.5 text-xs text-white placeholder-[#8e8e93] border-none outline-none"
                              />
                            </div>

                            <label className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#14171c] text-white text-xs font-semibold cursor-pointer relative overflow-hidden">
                              <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) =>
                                  uploadFile(
                                    e,
                                    (url) =>
                                      setEditCharData((prev) => ({
                                        ...prev,
                                        avatar_url: url,
                                      })),
                                    setIsUploading
                                  )
                                }
                              />
                              <OneIcon
                                name="upload"
                                size={15}
                                className={isUploading ? 'animate-spin text-[#c0ff00]' : 'text-[#8e8e93]'}
                              />
                              <span className="text-[#8e8e93] truncate">
                                {editCharData.avatar_url ? 'Аватар загружен (заменить)' : 'Загрузить аватар'}
                              </span>
                            </label>

                            <div className="space-y-1.5">
                              <div className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-wider pl-1">
                                Профессии
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {professions.map((prof) => {
                                  const isSelected = editCharData.professions?.includes(prof.name);
                                  return (
                                    <button
                                      key={prof.name}
                                      type="button"
                                      onClick={() => {
                                        setEditCharData((prev) => ({
                                          ...prev,
                                          professions: isSelected
                                            ? prev.professions.filter((r) => r !== prof.name)
                                            : [...prev.professions, prof.name],
                                        }));
                                      }}
                                      className={cn(
                                        'text-[10px] font-bold px-3 py-1 rounded-full transition-all border-none cursor-pointer active:scale-95',
                                        isSelected
                                          ? 'shadow-sm'
                                          : 'bg-[#14171c] text-[#8e8e93] hover:text-white'
                                      )}
                                      style={
                                        isSelected
                                          ? { color: prof.color, backgroundColor: `${prof.color}25` }
                                          : {}
                                      }
                                    >
                                      {prof.name.toUpperCase()}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="flex gap-2 pt-1">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={async () => {
                                  const { error } = await supabase
                                    .from('characters')
                                    .update({
                                      rp_name: editCharData.rp_name,
                                      party: editCharData.party,
                                      avatar_url: editCharData.avatar_url,
                                      professions: editCharData.professions,
                                    })
                                    .eq('id', c.id);
                                  if (error) {
                                    alert('Ошибка: ' + error.message);
                                    return;
                                  }
                                  setEditingCharId(null);
                                  loadPlayersData();
                                }}
                                className="flex-1 justify-center"
                                leftIcon={<OneIcon name="save" size={14} />}
                              >
                                Сохранить
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setEditingCharId(null)}
                                className="px-4"
                              >
                                <OneIcon name="close" size={16} />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          /* Normal Character Row */
                          <div className="flex items-center justify-between bg-[#181c23] hover:bg-[#1c222b] p-3 sm:p-3.5 rounded-[20px] transition-colors group select-none">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-[#14171c] overflow-hidden shrink-0 flex items-center justify-center">
                                {c.avatar_url ? (
                                  <img
                                    src={c.avatar_url}
                                    alt={c.rp_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <OneIcon name="person" size={18} className="text-[#8e8e93]" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-bold text-white truncate">
                                  {c.rp_name}
                                </div>
                                <div className="text-[11px] text-[#8e8e93] font-mono truncate">
                                  {c.mc_nickname} · {c.party}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              {/* Professions Badges */}
                              <div className="hidden sm:flex gap-1">
                                {c.professions?.slice(0, 2).map((p: string, i: number) => {
                                  const col = getProfessionColor(p);
                                  return (
                                    <span
                                      key={i}
                                      className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                                      style={{
                                        backgroundColor: `${col}20`,
                                        color: col,
                                      }}
                                    >
                                      {p}
                                    </span>
                                  );
                                })}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCharId(c.id);
                                  setEditCharData({
                                    rp_name: c.rp_name,
                                    party: c.party || 'Нет партии',
                                    avatar_url: c.avatar_url || '',
                                    professions: c.professions || [],
                                  });
                                }}
                                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center text-[#8e8e93] hover:text-[#c0ff00] transition-all border-none cursor-pointer"
                                aria-label="Редактировать персонажа"
                              >
                                <OneIcon name="edit" size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!confirm(`Удалить персонажа ${c.rp_name}?`)) return;
                                  const { error } = await supabase
                                    .from('characters')
                                    .delete()
                                    .eq('id', c.id);
                                  if (!error) loadPlayersData();
                                  else alert('Ошибка удаления: ' + error.message);
                                }}
                                className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/10 active:scale-95 flex items-center justify-center text-[#8e8e93] hover:text-red-400 transition-all border-none cursor-pointer"
                                aria-label="Удалить персонажа"
                              >
                                <OneIcon name="delete" size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {filteredCharacters.length === 0 && (
                      <p className="text-xs text-[#8e8e93] text-center py-6">
                        Персонажи не найдены
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* --- SUBTAB 2.3: ПРОФЕССИИ --- */}
            {playersSubTab === 'professions' && (
              <div className="space-y-5">
                {/* Create Profession Card */}
                <div className="bg-[#14171c] p-6 rounded-[28px] space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                    <div className="w-7 h-7 rounded-full bg-[#c0ff00]/10 flex items-center justify-center">
                      <OneIcon name="build" size={16} className="text-[#c0ff00]" />
                    </div>
                    <span>Создать профессию</span>
                  </div>

                  <div className="flex gap-2.5 items-center">
                    <input
                      type="text"
                      placeholder="Название профессии"
                      value={newProfessionName}
                      onChange={(e) => setNewProfessionName(e.target.value)}
                      className="flex-1 bg-[#181c23] hover:bg-[#1c222b] focus:bg-[#1c222b] rounded-full px-5 py-3 text-sm text-white placeholder-[#8e8e93] border-none outline-none transition-colors"
                    />
                    {/* OneWebUI Color Swatch Picker */}
                    <label
                      className="relative w-11 h-11 rounded-full shrink-0 cursor-pointer shadow-sm active:scale-95 transition-transform flex items-center justify-center overflow-hidden border-none"
                      style={{ backgroundColor: newProfessionColor }}
                    >
                      <input
                        type="color"
                        value={newProfessionColor}
                        onChange={(e) => setNewProfessionColor(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <OneIcon
                        name="palette"
                        size={18}
                        className={isBrightColor(newProfessionColor) ? 'text-black/80' : 'text-white/90'}
                      />
                    </label>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={async () => {
                      if (!newProfessionName.trim()) return;
                      const { error } = await supabase.from('professions').insert({
                        name: newProfessionName.toLowerCase(),
                        color: newProfessionColor,
                      });
                      if (!error) {
                        setNewProfessionName('');
                        loadProfessionsData();
                      } else {
                        alert('Ошибка создания профессии: ' + error.message);
                      }
                    }}
                    className="w-full justify-center"
                    leftIcon={<OneIcon name="add" size={18} />}
                  >
                    Создать профессию
                  </Button>
                </div>

                {/* All Professions List */}
                <div className="bg-[#14171c] p-6 rounded-[28px] shadow-xl space-y-4">
                  <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                    <OneIcon name="build" size={18} className="text-[#c0ff00]" />
                    <span>Все профессии ({professions.length})</span>
                  </div>

                  <div className="space-y-2">
                    {professions.map((prof) => (
                      <div
                        key={prof.id}
                        className="flex items-center gap-3 bg-[#181c23] hover:bg-[#1c222b] p-3 rounded-[20px] transition-colors"
                      >
                        <label
                          className="relative w-9 h-9 rounded-full shrink-0 cursor-pointer shadow-sm active:scale-95 transition-transform flex items-center justify-center overflow-hidden"
                          style={{ backgroundColor: prof.color }}
                        >
                          <input
                            type="color"
                            value={prof.color}
                            onChange={(e) => {
                              setProfessions((ps) =>
                                ps.map((p) => (p.id === prof.id ? { ...p, color: e.target.value } : p))
                              );
                            }}
                            onBlur={async () => {
                              if (!prof.id) return;
                              await supabase
                                .from('professions')
                                .update({ color: prof.color })
                                .eq('id', prof.id);
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <OneIcon
                            name="palette"
                            size={14}
                            className={isBrightColor(prof.color) ? 'text-black/80' : 'text-white/90'}
                          />
                        </label>
                        <input
                          type="text"
                          value={prof.name}
                          onChange={(e) => {
                            setProfessions((ps) =>
                              ps.map((p) => (p.id === prof.id ? { ...p, name: e.target.value } : p))
                            );
                          }}
                          onBlur={async () => {
                            if (!prof.id) return;
                            await supabase
                              .from('professions')
                              .update({ name: prof.name })
                              .eq('id', prof.id);
                          }}
                          className="bg-transparent text-sm font-bold flex-1 min-w-0 border-none outline-none"
                          style={{ color: prof.color }}
                        />
                      </div>
                    ))}
                    {professions.length === 0 && (
                      <p className="text-xs text-[#8e8e93] text-center py-6">
                        Нет созданных профессий
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* --- SUBTAB 2.4: РОЛИ --- */}
            {playersSubTab === 'roles' && (
              <div className="space-y-5">
                {/* Create Role Card */}
                <div className="bg-[#14171c] p-6 rounded-[28px] space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                    <div className="w-7 h-7 rounded-full bg-[#c0ff00]/10 flex items-center justify-center">
                      <OneIcon name="verified_user" size={16} className="text-[#c0ff00]" />
                    </div>
                    <span>Создать роль</span>
                  </div>

                  <div className="flex gap-2.5 items-center">
                    <input
                      type="text"
                      placeholder="Название роли"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      className="flex-1 bg-[#181c23] hover:bg-[#1c222b] focus:bg-[#1c222b] rounded-full px-5 py-3 text-sm text-white placeholder-[#8e8e93] border-none outline-none transition-colors"
                    />
                    <label
                      className="relative w-11 h-11 rounded-full shrink-0 cursor-pointer shadow-sm active:scale-95 transition-transform flex items-center justify-center overflow-hidden border-none"
                      style={{ backgroundColor: newRoleColor }}
                    >
                      <input
                        type="color"
                        value={newRoleColor}
                        onChange={(e) => setNewRoleColor(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <OneIcon
                        name="palette"
                        size={18}
                        className={isBrightColor(newRoleColor) ? 'text-black/80' : 'text-white/90'}
                      />
                    </label>
                  </div>

                  <label className="flex items-center gap-2.5 text-xs font-semibold text-[#8e8e93] cursor-pointer select-none pl-1">
                    <input
                      type="checkbox"
                      checked={newRolePerm}
                      onChange={(e) => setNewRolePerm(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#c0ff00] cursor-pointer"
                    />
                    <span>Может редактировать конституцию</span>
                  </label>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleCreateRole}
                    className="w-full justify-center"
                    leftIcon={<OneIcon name="add" size={18} />}
                  >
                    Создать роль
                  </Button>
                </div>

                {/* All Roles List */}
                <div className="bg-[#14171c] p-6 rounded-[28px] shadow-xl space-y-4">
                  <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                    <OneIcon name="verified_user" size={18} className="text-[#c0ff00]" />
                    <span>Все роли ({customRoles.length})</span>
                  </div>

                  <div className="space-y-2">
                    {customRoles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center gap-3 bg-[#181c23] hover:bg-[#1c222b] p-3 rounded-[20px] transition-colors"
                      >
                        <label
                          className="relative w-9 h-9 rounded-full shrink-0 cursor-pointer shadow-sm active:scale-95 transition-transform flex items-center justify-center overflow-hidden"
                          style={{ backgroundColor: role.color }}
                        >
                          <input
                            type="color"
                            value={role.color}
                            onChange={(e) => {
                              setCustomRoles((prev) =>
                                prev.map((r) => (r.id === role.id ? { ...r, color: e.target.value } : r))
                              );
                            }}
                            onBlur={async () => {
                              if (!role.id) return;
                              await supabase
                                .from('roles')
                                .update({ color: role.color })
                                .eq('id', role.id);
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <OneIcon
                            name="palette"
                            size={14}
                            className={isBrightColor(role.color) ? 'text-black/80' : 'text-white/90'}
                          />
                        </label>
                        <input
                          type="text"
                          value={role.name}
                          onChange={(e) => {
                            setCustomRoles((prev) =>
                              prev.map((r) => (r.id === role.id ? { ...r, name: e.target.value } : r))
                            );
                          }}
                          onBlur={async () => {
                            if (!role.id) return;
                            await supabase
                              .from('roles')
                              .update({ name: role.name, can_edit_constitution: role.canEditConstitution })
                              .eq('id', role.id);
                          }}
                          className="bg-transparent text-sm font-bold flex-1 min-w-0 border-none outline-none"
                          style={{ color: role.color }}
                        />
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#8e8e93] shrink-0 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={role.canEditConstitution}
                            onChange={(e) => {
                              setCustomRoles((prev) =>
                                prev.map((r) =>
                                  r.id === role.id ? { ...r, canEditConstitution: e.target.checked } : r
                                )
                              );
                            }}
                            onBlur={async () => {
                              await supabase
                                .from('roles')
                                .update({ can_edit_constitution: role.canEditConstitution })
                                .eq('id', role.id);
                            }}
                            className="w-3.5 h-3.5 rounded accent-[#c0ff00] cursor-pointer"
                          />
                          <span>Конст.</span>
                        </label>
                      </div>
                    ))}
                    {customRoles.length === 0 && (
                      <p className="text-xs text-[#8e8e93] text-center py-6">
                        Нет созданных ролей
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* --- SUBTAB 2.5: ГОСТИ --- */}
            {playersSubTab === 'guests' && (
              <div className="space-y-5">
                <div className="bg-[#14171c] p-6 rounded-[28px] space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                    <div className="w-7 h-7 rounded-full bg-[#c0ff00]/10 flex items-center justify-center">
                      <OneIcon name="person" size={16} className="text-[#c0ff00]" />
                    </div>
                    <span>Добавить гостя по Telegram ID</span>
                  </div>

                  <div className="flex gap-2.5">
                    <input
                      type="number"
                      placeholder="Telegram ID гостя"
                      value={guestTgId}
                      onChange={(e) => setGuestTgId(e.target.value)}
                      className="flex-1 bg-[#181c23] hover:bg-[#1c222b] focus:bg-[#1c222b] rounded-full px-5 py-3 text-sm text-white placeholder-[#8e8e93] border-none outline-none transition-colors"
                    />
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleAddGuest}
                      disabled={guestLoading || !guestTgId}
                      className="px-6 shrink-0"
                      leftIcon={<OneIcon name="add" size={18} />}
                    >
                      Добавить
                    </Button>
                  </div>

                  {guestList.length > 0 && (
                    <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar pt-2">
                      {guestList.map((g) => (
                        <div
                          key={g.tg_id}
                          className="flex items-center justify-between p-3.5 bg-[#181c23] hover:bg-[#1c222b] rounded-[18px] text-xs transition-colors"
                        >
                          <div>
                            <span className="text-white font-bold font-mono">ID: {g.tg_id}</span>
                            <span className="text-[#8e8e93] ml-2.5 text-[11px]">
                              {new Date(g.created_at).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveGuest(g.tg_id)}
                            className="w-7 h-7 rounded-full bg-white/5 hover:bg-red-500/15 text-[#8e8e93] hover:text-red-400 active:scale-95 transition-all flex items-center justify-center border-none cursor-pointer"
                            aria-label="Удалить гостя"
                          >
                            <OneIcon name="close" size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {guestList.length === 0 && (
                    <p className="text-xs text-[#8e8e93] text-center py-4">
                      Список гостей пуст
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 3: СЕРВЕР (SEASONS MANAGEMENT)                             */}
        {/* ============================================================= */}
        {mainTab === 'server' && (
          <div className="space-y-6 animate-fade-in">
            {/* Season Status Bento Card */}
            <div className="bg-[#14171c] p-6 rounded-[28px] space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                <div className="w-7 h-7 rounded-full bg-[#c0ff00]/10 flex items-center justify-center">
                  <OneIcon name="calendar_today" size={16} className="text-[#c0ff00]" />
                </div>
                <span>Управление сезонами</span>
              </div>

              {/* Status Plate */}
              <div className="bg-[#181c23] p-4 rounded-[20px] flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#8e8e93] font-medium">Текущий сезон</div>
                  <div className="text-lg font-black text-white">{currentSeasonName}</div>
                </div>
                <span
                  className={cn(
                    'px-3.5 py-1 rounded-full text-xs font-bold',
                    seasonEnded
                      ? 'bg-red-500/15 text-red-400'
                      : 'bg-[#c0ff00]/15 text-[#c0ff00]'
                  )}
                >
                  {seasonEnded ? 'Завершён' : 'Активен'}
                </span>
              </div>

              {/* Action Buttons */}
              {!seasonEnded && (
                <Button
                  variant="danger"
                  size="lg"
                  onClick={handleEndSeason}
                  disabled={seasonLoading}
                  className="w-full justify-center"
                  leftIcon={<OneIcon name="flag" size={18} />}
                >
                  Завершить сезон
                </Button>
              )}

              {seasonEnded && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleUndoEndSeason}
                    disabled={seasonLoading}
                    className="flex-1 justify-center"
                    leftIcon={<OneIcon name="replay" size={18} className="text-[#c0ff00]" />}
                  >
                    Восстановить сезон
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => handleStartNewSeason()}
                    disabled={seasonLoading}
                    className="flex-1 justify-center"
                    leftIcon={<OneIcon name="play_arrow" size={18} />}
                  >
                    Начать новый сезон
                  </Button>
                </div>
              )}
            </div>

            {/* Past Seasons Archive Bento Card */}
            {pastSeasons.length > 0 && (
              <div className="bg-[#14171c] p-6 rounded-[28px] shadow-xl space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                  <OneIcon name="inventory_2" size={18} className="text-[#c0ff00]" />
                  <span>Архив прошлых сезонов</span>
                </div>

                <div className="space-y-2">
                  {pastSeasons.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3.5 bg-[#181c23] hover:bg-[#1c222b] rounded-[20px] transition-colors"
                    >
                      <div>
                        <span className="text-white font-bold text-sm">
                          Сезон #{s.season_number}
                        </span>
                        <span className="text-[#8e8e93] text-xs ml-2.5">
                          {s.days_count} дн.
                        </span>
                        <span className="text-[#8e8e93]/70 text-[11px] ml-2">
                          · {new Date(s.end_date).toLocaleDateString('ru-RU')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRestoreSeason(s.id, s.season_number)}
                          disabled={seasonLoading}
                          className="w-8 h-8 rounded-full bg-[#c0ff00]/15 hover:bg-[#c0ff00]/25 text-[#c0ff00] active:scale-95 transition-all flex items-center justify-center border-none cursor-pointer disabled:opacity-30"
                          title="Восстановить"
                          aria-label="Восстановить"
                        >
                          <OneIcon name="replay" size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSeason(s.id, s.season_number)}
                          disabled={seasonLoading}
                          className="w-8 h-8 rounded-full bg-red-500/15 hover:bg-red-500/25 text-red-400 active:scale-95 transition-all flex items-center justify-center border-none cursor-pointer disabled:opacity-30"
                          title="Удалить"
                          aria-label="Удалить"
                        >
                          <OneIcon name="delete" size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ============================================================= */}
      {/* MOBILE BOTTOM TAB BAR                                          */}
      {/* ============================================================= */}
      <div className="md:hidden fixed bottom-2 pb-[var(--tma-raw-bottom-inset,env(safe-area-inset-bottom,0px))] left-3 right-3 sm:left-4 sm:right-4 z-[100] flex items-center justify-center pointer-events-none select-none">
        <nav className="bg-[#14171c]/90 backdrop-blur-2xl p-1.5 rounded-full shadow-2xl relative flex items-center h-[64px] max-w-sm w-full pointer-events-auto border-none">
          <div className="flex items-center w-full h-full gap-1">
            {(
              [
                { key: 'home' as const, label: 'Главная', icon: 'dashboard' },
                { key: 'players' as const, label: 'Игроки', icon: 'group' },
                { key: 'server' as const, label: 'Сервер', icon: 'dns' },
              ] as const
            ).map((tab) => {
              const isActive = mainTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setMainTab(tab.key)}
                  className={cn(
                    'relative z-10 flex-1 h-full flex flex-col items-center justify-center rounded-full transition-[color,background-color,transform] duration-200 active:scale-95 sf-tap px-1 border-none cursor-pointer select-none',
                    isActive
                      ? 'bg-[#252c37] text-[#c0ff00] font-bold shadow-md shadow-black/40'
                      : 'text-[#8e8e93] hover:text-white'
                  )}
                  aria-label={tab.label}
                  role="tab"
                >
                  <OneIcon
                    name={tab.icon}
                    size={22}
                    className={cn(
                      'transition-colors duration-200',
                      isActive ? 'text-[#c0ff00]' : 'text-[#8e8e93]'
                    )}
                  />
                  <span
                    className={cn(
                      'text-[10px] font-bold tracking-tight mt-0.5 whitespace-nowrap transition-colors duration-200',
                      isActive ? 'text-[#c0ff00]' : 'text-[#8e8e93]'
                    )}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

    </div>
  );
}
