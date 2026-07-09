'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import MediaBlog from '../components/MediaBlog';
import Archive from '../components/Archive';
import Treasury from '../components/Treasury';
import { getBalance } from '../lib/treasury';
import { addGuest, removeGuest, getGuests, isGuest } from '../lib/guests';
import { getSeasonState, endSeason, undoEndSeason, startNewSeason, restorePastSeason, deletePastSeason, getAllPastSeasons, getLastEndedSeason, seasonName, SeasonState, PastSeason } from '../lib/season';

import { 
  User, BookOpen, Users, Edit2, Check, X, ShieldAlert, UserPlus, ShieldCheck, Palette, Save,
  Bold, Italic, Strikethrough, Heading1, Heading2, AlignLeft, AlignCenter, Plus, Upload,
  Copy, Play, Square, Server, RefreshCw, Coins, Download, Library, ArrowLeft, Home as HomeIcon, Newspaper,
  Map as MapIcon, Search, ChevronUp, ChevronDown, Landmark, BookMarked, Flag, RotateCcw, Calendar,
  Swords, Skull, Crown
} from 'lucide-react';

const AnvilIcon = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7 10H6a4 4 0 0 1-4-4 1 1 0 0 1 1-1h4" />
    <path d="M7 5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1" />
    <path d="M17 10h1a4 4 0 0 0 4-4 1 1 0 0 0-1-1h-4" />
    <path d="M9 12v5" />
    <path d="M15 12v5" />
    <path d="M5 20a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3 1 1 0 0 1-1 1H6a1 1 0 0 1-1-1Z" />
  </svg>
);

function getBankSuffix(balance: number): string {
  if (balance >= 10000) return '10000';
  if (balance >= 5000) return '5000';
  if (balance >= 1000) return '1000';
  if (balance >= 300) return '300';
  if (balance >= 50) return '50';
  return '0';
}

// ============================================================
// ИНТЕРФЕЙСЫ (новая модель)
// ============================================================

/** Minecraft-профиль игрока (основная сущность) */
interface Player {
  id: string;
  mc_nickname: string;
  tg_id: number | null;
  tg_username: string;
  avatar_url: string;
}

/** Персонаж игрока в конкретном сезоне */
interface Character {
  id: string;
  player_id: string;
  rp_name: string;
  mc_nickname: string;
  avatar_url: string;
  roles: string[];
  party: string;
  season: string;
  status: string;
}

/** Объединённые данные для UI: профиль + активный персонаж (опционально) */
interface CombinedUser {
  player: Player;
  character: Character | null;
}

interface CustomRole {
  id?: string;
  name: string;
  color: string;
  canEditConstitution: boolean;
}

function SeasonPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-4 py-20 w-full animate-fade-in flex-grow">
      <Calendar size={48} className="text-gray-700" />
      <p className="text-lg font-bold text-gray-600">Новый сезон ещё не начался</p>
      <p className="text-xs text-gray-700 uppercase tracking-[0.2em]">Скоро...</p>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  
  const [tgUser, setTgUser] = useState<any>(null);
  const [dbUser, setDbUser] = useState<CombinedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'profile' | 'constitution' | 'players' | 'admin' | 'map' | 'media' | 'archive' | 'treasury' | 'svod'>('profile');
  const [activeSvodTab, setActiveSvodTab] = useState<'laws' | 'archive'>('laws');
  const [treasuryBalance, setTreasuryBalance] = useState<number>(0);
  const [characters, setCharacters] = useState<Character[]>([]);
  
  const [constitutionText, setConstitutionText] = useState('');
  const [commandmentsText, setCommandmentsText] = useState('');
  const [activeDocument, setActiveDocument] = useState<'none' | 'constitution' | 'commandments'>('none');
  const [isEditing, setIsEditing] = useState(false);
  
  const [newRpName, setNewRpName] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const [formats, setFormats] = useState({
    bold: false, italic: false, strikeThrough: false, h1: false, h2: false, justifyLeft: false, justifyCenter: false
  });

  const [isUploadingProfile, setLoadingProfile] = useState(false);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [isServerLoading, setIsServerLoading] = useState(false);
  const [serverActionLoading, setServerActionLoading] = useState(false);
  const [latestPosts, setLatestPosts] = useState<any[]>([]);
  
  const staticIp = "onehouse2.exaroton.me:15879";

  // Админка: создание нового игрока (Minecraft профиля)
  const [addMcNickname, setAddMcNickname] = useState('');
  const [addTgId, setAddTgId] = useState('');
  const [addTgUsername, setAddTgUsername] = useState('');
  const [addAvatarUrl, setAddAvatarUrl] = useState('');

  // Админка: создание персонажа для существующего игрока
  const [addCharMcNickname, setAddCharMcNickname] = useState('');
  const [addCharRpName, setAddCharRpName] = useState('');
  const [addCharParty, setAddCharParty] = useState('Нет партии');
  const [addCharRoles, setAddCharRoles] = useState<string[]>(['citizen']);
  const [addCharAvatarUrl, setAddCharAvatarUrl] = useState('');
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);

  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#c0ff00');
  const [newRolePerm, setNewRolePerm] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [guestTgId, setGuestTgId] = useState('');
  const [guestList, setGuestList] = useState<{ tg_id: number; created_at: string; added_by: string }[]>([]);
  const [guestLoading, setGuestLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [seasonEnded, setSeasonEnded] = useState(false);
  const [lastSeason, setLastSeason] = useState<PastSeason | null>(null);
  const [pastSeasons, setPastSeasons] = useState<PastSeason[]>([]);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [currentSeasonNum, setCurrentSeasonNum] = useState(2);
  const [seasonStartDate, setSeasonStartDate] = useState('2026-05-17');
  const [exarotonServerId, setExarotonServerId] = useState<string>('');
  const [newSeasonServerId, setNewSeasonServerId] = useState('');
  const [adminSubTab, setAdminSubTab] = useState<'players' | 'characters' | 'roles' | 'guests' | 'seasons'>('players');
  const currentSeasonName = `Сезон ${currentSeasonNum}`;

  const SEASON_START = useMemo(() => {
    const d = new Date(seasonStartDate + 'T00:00:00+03:00');
    return isNaN(d.getTime()) ? new Date('2026-05-17T00:00:00+03:00') : d;
  }, [seasonStartDate]);
  const seasonDays = useMemo(() => {
    const now = new Date();
    const diff = now.getTime() - SEASON_START.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }, [SEASON_START]);

  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Загрузка состояния сезона
  useEffect(() => {
    async function loadSeason() {
      const state = await getSeasonState();
      setCurrentSeasonNum(state.season_number);
      setSeasonStartDate(state.season_start_date);
      setExarotonServerId(state.exaroton_server_id || '');
      if (!state.is_active) {
        setSeasonEnded(true);
        const last = await getLastEndedSeason();
        if (last) setLastSeason(last);
      }
      const all = await getAllPastSeasons();
      setPastSeasons(all);
      loadConstitution(seasonName(state.season_number));
    }
    loadSeason();
  }, []);

  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  // ============================================================
  // АВТОРИЗАЦИЯ: проверка пользователя
  // ============================================================
  async function checkUserInDb(tgId: number) {
    try {
      // 1. Находим игрока по tg_id
      const { data: playerData } = await supabase
        .from('players')
        .select('*')
        .eq('tg_id', tgId)
        .limit(1);

      const player = playerData && playerData.length > 0 ? playerData[0] : null;

      if (!player) {
        // Проверяем гостевой доступ
        const guest = await isGuest(tgId);
        if (guest) {
          setDbUser({
            player: {
              id: 'guest_' + tgId,
              mc_nickname: 'Гость',
              tg_id: tgId,
              tg_username: tgUser?.username || 'guest',
              avatar_url: '',
            },
            character: {
              id: 'guest_char_' + tgId,
              player_id: 'guest_' + tgId,
              rp_name: 'Гость',
              mc_nickname: 'Гость',
              avatar_url: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23c0ff00" stroke-width="1.5"><circle cx="12" cy="8" r="4" fill="%23c0ff0015"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>'),
              roles: ['guest'],
              party: 'Нет партии',
              season: currentSeasonName,
              status: 'alive',
            }
          });
          loadRoles();
          loadCharacters();
          loadLatestPosts();
          setLoading(false);
          return;
        }
        setError(`Твой Telegram ID (${tgId}) не привязан ни к одному Minecraft-профилю. Обратись к администратору.`);
        setLoading(false);
        return;
      }

      // 2. Находим активного персонажа через RPC
      const { data: charId, error: rpcError } = await supabase.rpc('get_active_character', { p_player_id: player.id });

      if (rpcError) {
        setError(`Ошибка сервера: RPC get_active_character не существует. Выполни SQL-миграцию auth_rework_migration.sql в Supabase.`);
        setLoading(false);
        return;
      }

      if (!charId) {
        // Игрок есть, но персонажа в текущем сезоне нет — это нормально.
        // Админ создаст персонажа через админ-панель.
        setDbUser({ player, character: null });
        loadRoles();
        loadCharacters();
        loadConstitution();
        loadLatestPosts();
        setLoading(false);
        return;
      }

      // 3. Загружаем существующего персонажа
      const { data: charData } = await supabase
        .from('characters')
        .select('*')
        .eq('id', charId)
        .limit(1);

      const char = charData && charData.length > 0 ? charData[0] : null;

      if (!char) {
        setError(`Персонаж не найден.`);
        setLoading(false);
        return;
      }

      const character: Character = {
        id: char.id,
        player_id: char.player_id,
        rp_name: char.rp_name,
        mc_nickname: char.mc_nickname,
        avatar_url: char.avatar_url,
        roles: char.roles || [],
        party: char.party,
        season: char.season,
        status: char.status,
      };

      setDbUser({ player, character });
      setNewRpName(character.rp_name);
      setNewAvatarUrl(character.avatar_url);
      loadRoles();
      loadCharacters();
      loadConstitution();
      loadLatestPosts();
      setLoading(false);
    } catch (e: any) {
      setError(`Ошибка БД: ${e.message}`);
      setLoading(false);
    }
  }

  // ============================================================
  // ЗАГРУЗКА ДАННЫХ
  // ============================================================

  async function loadRoles() {
    const { data } = await supabase.from('roles').select('*').order('name');
    if (data) {
      setCustomRoles(data.map((r: any) => ({
        id: r.id,
        name: r.name,
        color: r.color,
        canEditConstitution: r.can_edit_constitution
      })));
    }
  }

  async function loadCharacters() {
    const { data } = await supabase
      .from('characters')
      .select('*')
      .eq('season', currentSeasonName)
      .order('rp_name', { ascending: true });
    if (data) {
      setCharacters(data as Character[]);
    } else {
      setCharacters([]);
    }
  }

  async function loadAllPlayers() {
    const { data } = await supabase
      .from('players')
      .select('*')
      .order('mc_nickname', { ascending: true });
    if (data) setAllPlayers(data as Player[]);
  }

  async function loadConstitution(seasonOverride?: string) {
    const season = seasonOverride || currentSeasonName;
    const { data } = await supabase.from('constitution').select('*').in('id', [1, 2]).eq('season', season);
    if (data && data.length > 0) {
      const constDoc = data.find((d: any) => d.id === 1);
      const cmdDoc = data.find((d: any) => d.id === 2);
      setConstitutionText(constDoc?.content || '');
      setCommandmentsText(cmdDoc?.content || '');
    } else {
      setConstitutionText('');
      setCommandmentsText('');
    }
  }

  async function loadLatestPosts() {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, author:characters(rp_name)')
        .eq('season', currentSeasonName)
        .order('created_at', { ascending: false })
        .range(0, 1);
      if (data && !error) setLatestPosts(data);
    } catch (e) {}
  }

  // ============================================================
  // АДМИНКА: управление игроками и персонажами
  // ============================================================

  async function handleCreatePlayer() {
    const mcNick = addMcNickname.trim();
    if (!mcNick) return;
    
    const tgIdNum = addTgId ? parseInt(addTgId) : null;
    
    const { data: existing } = await supabase.from('players').select('id').eq('mc_nickname', mcNick).limit(1);
    if (existing && existing.length > 0) {
      alert('Игрок с таким Minecraft-ником уже существует!');
      return;
    }

    if (tgIdNum) {
      const { data: tgExists } = await supabase.from('players').select('id').eq('tg_id', tgIdNum).limit(1);
      if (tgExists && tgExists.length > 0) {
        alert('Этот Telegram ID уже привязан к другому игроку!');
        return;
      }
    }

    const { error } = await supabase.from('players').insert({
      mc_nickname: mcNick,
      tg_id: tgIdNum,
      tg_username: addTgUsername || '',
      avatar_url: addAvatarUrl || '',
    });

    if (error) {
      alert(`Ошибка создания игрока: ${error.message}`);
      return;
    }

    setAddMcNickname('');
    setAddTgId('');
    setAddTgUsername('');
    setAddAvatarUrl('');
    loadAllPlayers();
  }

  async function handleCreateCharacter() {
    if (!addCharMcNickname.trim() || !addCharRpName.trim()) return;

    const { data: playerData } = await supabase
      .from('players')
      .select('id')
      .eq('mc_nickname', addCharMcNickname.trim())
      .limit(1);

    const player = playerData && playerData.length > 0 ? playerData[0] : null;
    if (!player) {
      alert('Игрок с таким Minecraft-ником не найден. Сначала создай профиль игрока.');
      return;
    }

    const { error } = await supabase.from('characters').insert({
      player_id: player.id,
      mc_nickname: addCharMcNickname.trim(),
      rp_name: addCharRpName.trim(),
      party: addCharParty || 'Нет партии',
      roles: addCharRoles,
      avatar_url: addCharAvatarUrl || '',
      season: currentSeasonName,
      status: 'alive',
    });

    if (error) {
      alert(`Ошибка создания персонажа: ${error.message}`);
      return;
    }

    setAddCharMcNickname('');
    setAddCharRpName('');
    setAddCharParty('Нет партии');
    setAddCharRoles(['citizen']);
    setAddCharAvatarUrl('');
    loadCharacters();
  }

  async function handleAddRoleToCharacter(roleName: string) {
    if (!selectedCharacter || selectedCharacter.roles.includes(roleName)) return;
    const updatedRoles = [...selectedCharacter.roles, roleName];
    const { error } = await supabase.from('characters').update({ roles: updatedRoles }).eq('id', selectedCharacter.id);
    if (!error) {
      const updated = { ...selectedCharacter, roles: updatedRoles };
      setSelectedCharacter(updated);
      setCharacters(characters.map(c => c.id === selectedCharacter.id ? updated : c));
      if (dbUser?.character?.id === selectedCharacter.id) {
        setDbUser({ ...dbUser, character: updated });
      }
      setShowRoleSelector(false);
    }
  }

  async function handleRemoveRoleFromCharacter(roleName: string) {
    if (!selectedCharacter) return;
    const updatedRoles = selectedCharacter.roles.filter(r => r !== roleName);
    const { error } = await supabase.from('characters').update({ roles: updatedRoles }).eq('id', selectedCharacter.id);
    if (!error) {
      const updated = { ...selectedCharacter, roles: updatedRoles };
      setSelectedCharacter(updated);
      setCharacters(characters.map(c => c.id === selectedCharacter.id ? updated : c));
      if (dbUser?.character?.id === selectedCharacter.id) {
        setDbUser({ ...dbUser, character: updated });
      }
    }
  }

  async function saveCharacterProfile() {
    if (!selectedCharacter || !newRpName.trim()) return;
    const { error } = await supabase.from('characters').update({ rp_name: newRpName, avatar_url: newAvatarUrl }).eq('id', selectedCharacter.id);
    if (!error) {
      const updated = { ...selectedCharacter, rp_name: newRpName, avatar_url: newAvatarUrl };
      setSelectedCharacter(updated);
      if (dbUser?.character?.id === selectedCharacter.id) {
        setDbUser({ ...dbUser, character: updated });
      }
      setIsEditingProfile(false);
      loadCharacters();
    } else {
      alert(`Ошибка: ${error.message}`);
    }
  }

  // ============================================================
  // РОЛИ И ДОКУМЕНТЫ
  // ============================================================

  async function handleCreateRole() {
    if (!newRoleName.trim()) return;
    const newRole = { name: newRoleName.toLowerCase(), color: newRoleColor, can_edit_constitution: newRolePerm };
    const { error } = await supabase.from('roles').insert([newRole]);
    if (!error) { setNewRoleName(''); setNewRolePerm(false); loadRoles(); }
    else alert(`Ошибка создания роли: ${error.message}`);
  }

  function handleRoleChange(id: string, field: string, value: any) {
    setCustomRoles(roles => roles.map(r => r.id === id ? { ...r, [field]: value } : r));
  }

  async function saveRoleToDb(role: CustomRole) {
    if (!role.id) return;
    await supabase.from('roles').update({ name: role.name, color: role.color, can_edit_constitution: role.canEditConstitution }).eq('id', role.id);
  }

  async function saveDocument() {
    if (!editorRef.current || activeDocument === 'none') return;
    const updatedContent = editorRef.current.innerHTML;
    const docId = activeDocument === 'constitution' ? 1 : 2;
    const { data: existing } = await supabase.from('constitution').select('id').eq('id', docId).eq('season', currentSeasonName).maybeSingle();
    
    if (existing) {
      const { error } = await supabase.from('constitution').update({ content: updatedContent }).eq('id', docId).eq('season', currentSeasonName);
      if (!error) {
        if (activeDocument === 'constitution') setConstitutionText(updatedContent);
        else setCommandmentsText(updatedContent);
        setIsEditing(false);
      } else { alert(`Ошибка: ${error.message}`); }
    } else {
      const { error } = await supabase.from('constitution').insert({ id: docId, content: updatedContent, season: currentSeasonName, title: docId === 1 ? 'Конституция' : 'Заповеди' });
      if (!error) {
        if (activeDocument === 'constitution') setConstitutionText(updatedContent);
        else setCommandmentsText(updatedContent);
        setIsEditing(false);
      } else { alert(`Ошибка: ${error.message}`); }
    }
  }

  // ============================================================
  // ГОСТИ
  // ============================================================

  async function handleAddGuest() {
    const tgId = parseInt(guestTgId);
    if (isNaN(tgId) || tgId <= 0) return;
    setGuestLoading(true);
    const ok = await addGuest(tgId, dbUser?.character?.rp_name || 'Админ');
    if (ok) { setGuestTgId(''); loadGuests(); }
    else alert('Ошибка добавления гостя');
    setGuestLoading(false);
  }

  async function handleRemoveGuest(tgId: number) {
    const ok = await removeGuest(tgId);
    if (ok) loadGuests();
    else alert('Ошибка удаления гостя');
  }

  async function loadGuests() {
    const list = await getGuests();
    setGuestList(list);
  }

  // ============================================================
  // СЕРВЕР EXAROTON
  // ============================================================

  async function fetchServerStatus() {
    setIsServerLoading(true);
    try {
      const url = exarotonServerId ? `/api/exaroton?serverId=${exarotonServerId}` : '/api/exaroton';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setServerInfo(data.data.server || data.data);
        setCredits(data.data.credits ?? null);
      }
    } catch (e) {} finally {
      setIsServerLoading(false);
    }
  }

  async function handleServerAction(action: 'start' | 'stop') {
    setServerActionLoading(true);
    try {
      const url = exarotonServerId ? `/api/exaroton?serverId=${exarotonServerId}` : '/api/exaroton';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) setTimeout(fetchServerStatus, 3000);
      else alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
    } catch (e) {
      alert('Ошибка соединения');
    } finally {
      setServerActionLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    if (typeof document !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    }
  }

  // ============================================================
  // СЕЗОНЫ
  // ============================================================

  async function refreshSeasons() {
    const state = await getSeasonState();
    setCurrentSeasonNum(state.season_number);
    setSeasonStartDate(state.season_start_date);
    setExarotonServerId(state.exaroton_server_id || '');
    const all = await getAllPastSeasons();
    setPastSeasons(all);
    loadConstitution(seasonName(state.season_number));
    if (state.is_active) {
      setSeasonEnded(false);
      setLastSeason(null);
    }
    loadCharacters();
  }

  async function handleEndSeason() {
    if (!confirm('Завершить текущий сезон? Вся информация будет скрыта.')) return;
    setSeasonLoading(true);
    const ok = await endSeason();
    if (ok) {
      setSeasonEnded(true);
      const last = await getLastEndedSeason();
      if (last) setLastSeason(last);
      refreshSeasons();
    } else {
      alert('Ошибка завершения сезона. Проверь, выполнен ли SQL в Supabase.');
    }
    setSeasonLoading(false);
  }

  async function handleUndoEndSeason() {
    if (!confirm('Отменить завершение сезона?')) return;
    setSeasonLoading(true);
    const ok = await undoEndSeason();
    if (ok) refreshSeasons();
    else alert('Ошибка отмены завершения');
    setSeasonLoading(false);
  }

  async function handleStartNewSeason() {
    const allPast = await getAllPastSeasons();
    const nextNum = (allPast.length > 0 ? Math.max(...allPast.map(s => s.season_number)) : currentSeasonNum) + 1;
    if (!confirm(`Начать новый сезон #${nextNum}? Текущий будет завершён и уйдёт в архив.`)) return;
    setSeasonLoading(true);
    const ok = await startNewSeason(newSeasonServerId || undefined);
    if (ok) {
      setSeasonEnded(false);
      setLastSeason(null);
      setNewSeasonServerId('');
      refreshSeasons();
    } else {
      alert('Ошибка создания нового сезона');
    }
    setSeasonLoading(false);
  }

  async function handleRestoreSeason(seasonId: number, seasonNum: number) {
    if (!confirm(`Восстановить сезон #${seasonNum} как активный?`)) return;
    setSeasonLoading(true);
    const ok = await restorePastSeason(seasonId);
    if (ok) refreshSeasons();
    else alert('Ошибка восстановления сезона');
    setSeasonLoading(false);
  }

  async function handleDeleteSeason(seasonId: number, seasonNum: number) {
    if (!confirm(`Удалить сезон #${seasonNum} навсегда? Это необратимо.`)) return;
    setSeasonLoading(true);
    const ok = await deletePastSeason(seasonId);
    if (ok) refreshSeasons();
    else alert('Ошибка удаления сезона');
    setSeasonLoading(false);
  }

  // ============================================================
  // ХЕЛПЕРЫ
  // ============================================================

  function getServerStatusText(statusCode: number) {
    switch(statusCode) {
      case 0: return { text: 'ОФФЛАЙН', color: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500/20' };
      case 1: return { text: 'ОНЛАЙН', color: 'text-[#c0ff00]', bg: 'bg-[#c0ff00]', border: 'border-[#c0ff00]/30' };
      case 2: return { text: 'ЗАПУСКАЕТСЯ...', color: 'text-yellow-400', bg: 'bg-yellow-400', border: 'border-yellow-400/20' };
      case 3: return { text: 'ОСТАНАВЛИВАЕТСЯ...', color: 'text-orange-400', bg: 'bg-orange-400', border: 'border-orange-400/20' };
      case 4: return { text: 'ПЕРЕЗАГРУЗКА...', color: 'text-blue-400', bg: 'bg-blue-400', border: 'border-blue-400/20' };
      default: return { text: 'ЗАГРУЗКА...', color: 'text-gray-400', bg: 'bg-gray-400', border: 'border-gray-500/20' };
    }
  }

  function getRoleColor(roleName: string) {
    const found = customRoles.find(cr => cr.name.toLowerCase() === roleName.toLowerCase());
    return found ? found.color : '#888888';
  }

  function isDead(roles: string[]) {
    return roles ? roles.some(r => r.toLowerCase() === 'мёртв') : false;
  }

  function isAdminUser(): boolean {
    return dbUser?.character?.roles?.some(r => ['admin', 'админ'].includes(r.toLowerCase())) || false;
  }

  function canEditConstitution(): boolean {
    return dbUser?.character?.roles?.some(r => {
      const found = customRoles.find(cr => cr.name.toLowerCase() === r.toLowerCase());
      return found ? found.canEditConstitution : false;
    }) || false;
  }

  const isAdmin = isAdminUser();
  const showToolbar = isEditing && (activeTab === 'constitution' || activeTab === 'svod') && activeDocument !== 'none' && !selectedCharacter;

  function getHighlightedHtml(html: string, query: string): string {
    if (!query.trim()) return html;
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
    if (terms.length === 0) return html;
    let result = html;
    for (const term of terms) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      let pattern: string;
      if (term.length <= 4) { pattern = escaped; }
      else {
        const stemLen = Math.max(3, term.length - 2);
        const stem = term.slice(0, stemLen);
        const stemEscaped = stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pattern = `${escaped}|\\b${stemEscaped}[а-яёa-z]*\\b`;
      }
      const regex = new RegExp(`(>[^<]*?)(${pattern})([^>]*?<)`, 'gi');
      result = result.replace(regex, (_, before, found, after) => {
        return before + `<mark class="search-hl" style="background:#c0ff00;color:#000;border-radius:2px;padding:0 2px;">${found}</mark>` + after;
      });
    }
    return result;
  }

  const highlightedHtml = useMemo(() => {
    const docText = activeDocument === 'constitution' ? constitutionText : commandmentsText;
    if (!searchQuery.trim()) return docText;
    return getHighlightedHtml(docText, searchQuery);
  }, [searchQuery, activeDocument, constitutionText, commandmentsText]);

  function navigateSearch(direction: 'next' | 'prev') {
    if (!viewRef.current) return;
    const marks = viewRef.current.querySelectorAll('mark.search-hl');
    if (marks.length === 0) return;
    marks.forEach(m => { (m as HTMLElement).style.outline = 'none'; });
    const newIdx = direction === 'next'
      ? Math.min(activeMatchIndex + 1, marks.length - 1)
      : Math.max(activeMatchIndex - 1, 0);
    setActiveMatchIndex(newIdx);
    const active = marks[newIdx] as HTMLElement;
    active.style.outline = '2px solid #fff';
    active.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  useEffect(() => {
    if (!viewRef.current) { setTotalMatches(0); setActiveMatchIndex(0); return; }
    const t = setTimeout(() => {
      const marks = viewRef.current?.querySelectorAll('mark.search-hl');
      setTotalMatches(marks?.length || 0);
      if (marks && marks.length > 0) {
        setActiveMatchIndex(0);
        (marks[0] as HTMLElement).style.outline = '2px solid #fff';
      } else { setActiveMatchIndex(0); }
    }, 50);
    return () => clearTimeout(t);
  }, [highlightedHtml]);

  function checkFormatting() {
    if (typeof document === 'undefined') return;
    try {
      const formatBlock = document.queryCommandValue('formatBlock')?.toLowerCase() || '';
      setFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        h1: formatBlock.includes('h1'),
        h2: formatBlock.includes('h2'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
      });
    } catch (e) {}
  }

  function execEditorCommand(command: string, value: string = '') {
    if (typeof document !== 'undefined') {
      if (command === 'formatBlock') {
        const currentBlock = document.queryCommandValue('formatBlock')?.toLowerCase() || '';
        const valLower = value.toLowerCase();
        if ((valLower === 'h1' && currentBlock.includes('h1')) || (valLower === 'h2' && currentBlock.includes('h2'))) {
          document.execCommand(command, false, 'P');
        } else {
          document.execCommand(command, false, value);
        }
      } else {
        document.execCommand(command, false, value);
      }
      if (editorRef.current) editorRef.current.focus();
      setTimeout(checkFormatting, 50);
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>, setUrlCallback: (url: string) => void, setLoadingState: (loading: boolean) => void) {
    try {
      setLoadingState(true);
      const file = event.target.files?.[0];
      if (!file) return;
      const blob = await new Promise<Blob>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
          const img = new Image();
          img.src = e.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas Error'));
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((b) => b ? resolve(b) : reject(new Error('WebP Error')), 'image/webp', 0.85);
          };
        };
      });
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.webp`;
      const { error } = await supabase.storage.from('avatars').upload(fileName, blob, { contentType: 'image/webp' });
      if (error) return alert(`Ошибка загрузки: ${error.message}`);
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      if (urlData) setUrlCallback(urlData.publicUrl);
    } catch (e: any) {
      alert(`Сбой при загрузке: ${e.message}`);
    } finally { 
      setLoadingState(false); 
    }
  }

  function handleTabChange(tab: 'profile' | 'constitution' | 'players' | 'admin' | 'map' | 'media' | 'archive' | 'treasury' | 'svod') {
    setSelectedCharacter(null);
    setIsEditingProfile(false);
    setShowRoleSelector(false);
    setActiveTab(tab);
    setActiveDocument('none');
    setIsEditing(false);
    setSearchQuery('');
    if (tab === 'profile') loadLatestPosts();
    if (tab === 'admin') { loadGuests(); loadAllPlayers(); loadCharacters(); }
  }

  const sortedCharacters = characters
    .filter((c) => c.player_id !== dbUser?.player.id)
    .sort((a, b) => {
      const aDead = isDead(a.roles); const bDead = isDead(b.roles);
      if (aDead && !bDead) return 1;
      if (!aDead && bDead) return -1;
      return a.rp_name.localeCompare(b.rp_name);
    });

  // ============================================================
  // EFFECTS
  // ============================================================

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.initDataUnsafe?.user?.id) {
      tg.ready();
      tg.expand();
      if (typeof tg.requestFullscreen === 'function') tg.requestFullscreen();
      if (typeof tg.setHeaderColor === 'function') tg.setHeaderColor('#090b0e');
      if (typeof tg.setBackgroundColor === 'function') tg.setBackgroundColor('#090b0e');
      setTgUser(tg.initDataUnsafe.user);
      checkUserInDb(tg.initDataUnsafe.user.id);

      const startParam = tg.initDataUnsafe?.start_param;
      if (startParam && startParam.startsWith('article_')) {
        const articleId = startParam.replace('article_', '');
        if (articleId) router.push(`/media/${articleId}`);
      }
    } else {
      setError('Пожалуйста, откройте приложение внутри Telegram.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'profile') {
      fetchServerStatus();
      const intervalId = setInterval(() => fetchServerStatus(), 360000);
      return () => clearInterval(intervalId);
    }
  }, [activeTab, exarotonServerId]);

  useEffect(() => {
    if (isEditing && editorRef.current) {
      editorRef.current.innerHTML = activeDocument === 'constitution' ? constitutionText : commandmentsText;
    }
  }, [isEditing, activeDocument]);

  useEffect(() => {
    getBalance(currentSeasonName).then(b => setTreasuryBalance(isNaN(b) ? 0 : b));
  }, [currentSeasonName]);

  useEffect(() => {
    if (activeTab === 'admin') loadGuests();
  }, [activeTab]);

  // ============================================================
  // РЕНДЕР: ЗАГРУЗКА / ОШИБКА
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090b0e] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="animate-spin text-[#c0ff00]" size={36} />
        <span className="text-xs text-gray-500 font-mono font-bold uppercase tracking-widest animate-pulse">Загрузка интерфейса...</span>
      </div>
    );
  }

  if (error) {
    return <div className="min-h-screen bg-[#090b0e] text-red-400 flex items-center justify-center font-mono text-xs p-4 text-center">{error}</div>;
  }

  if (!dbUser) return null;

  const currentDocText = activeDocument === 'constitution' ? constitutionText : commandmentsText;

  // ============================================================
  // РЕНДЕР: ОСНОВНОЙ UI
  // ============================================================

  return (
    <div className="min-h-screen text-white pb-32 md:pb-8 antialiased selection:bg-[#c0ff00] selection:text-black transition-colors duration-300 w-full max-w-full relative z-0 flex flex-col">
      
      <div className="fixed inset-0 bg-[#090b0e] -z-10 md:hidden" />
      <div className="fixed inset-0 -z-10 hidden md:block bg-[#090b0e]">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover">
          <source src="/bg-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#090b0e]/85 backdrop-blur-[2px]" />
      </div>

      {/* Модальный оверлей */}
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${selectedCharacter ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => { setSelectedCharacter(null); setIsEditingProfile(false); setShowRoleSelector(false); }} />

      {/* Тулбар редактора */}
      <div className="fixed top-[96px] left-4 right-4 md:left-40 md:right-12 z-40 max-w-md md:max-w-7xl mx-auto flex items-center justify-end gap-2 pointer-events-none">
        <div className={`transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden flex items-center justify-center ${showToolbar ? 'w-10 opacity-100 scale-100 translate-x-0' : 'w-0 opacity-0 scale-50 -translate-x-8 pointer-events-none'}`}>
          <button onClick={saveDocument} className="pointer-events-auto bg-[#c0ff00] text-black w-10 h-10 rounded-full shadow-lg flex items-center justify-center flex-shrink-0 hover:scale-105 active:scale-95 transition-transform">
            <Save size={16} />
          </button>
        </div>
      </div>

      <div className={`fixed z-50 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center justify-center pointer-events-none ${showToolbar ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-12 md:-translate-y-4'} bottom-2 left-2 right-2 md:bottom-auto md:top-[96px] md:left-1/2 md:-translate-x-1/2 md:w-auto`}>
        <div className="p-1.5 bg-[#14171c]/95 border border-white/10 rounded-2xl md:rounded-full shadow-2xl backdrop-blur-md flex items-center gap-1 pointer-events-auto w-full md:w-auto overflow-x-auto no-scrollbar justify-start md:justify-center">
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('bold')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 flex-shrink-0 ${formats.bold ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Bold size={14}/></button>
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('italic')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 flex-shrink-0 ${formats.italic ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Italic size={14}/></button>
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('strikeThrough')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 flex-shrink-0 ${formats.strikeThrough ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Strikethrough size={14}/></button>
          <div className="w-[1px] h-3.5 bg-white/10 mx-0.5 flex-shrink-0" />
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('formatBlock', 'H1')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 flex-shrink-0 ${formats.h1 ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Heading1 size={14}/></button>
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('formatBlock', 'H2')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 flex-shrink-0 ${formats.h2 ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Heading2 size={14}/></button>
          <div className="w-[1px] h-3.5 bg-white/10 mx-0.5 flex-shrink-0" />
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('justifyLeft')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 flex-shrink-0 ${formats.justifyLeft ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><AlignLeft size={14}/></button>
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('justifyCenter')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 flex-shrink-0 ${formats.justifyCenter ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><AlignCenter size={14}/></button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* МОДАЛЬНОЕ ОКНО ПЕРСОНАЖА */}
      {/* ================================================================ */}
      {selectedCharacter && (
        <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-32px)] max-w-md p-6 rounded-[32px] border border-white/10 shadow-2xl text-center space-y-5 animate-profile-grow overflow-visible transition-colors duration-300 ${isDead(selectedCharacter.roles) ? 'bg-[#050608]' : 'bg-[#14171c]'}`}>
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#c0ff00]/10 to-transparent pointer-events-none rounded-t-[32px]" />
          <button onClick={() => { setSelectedCharacter(null); setIsEditingProfile(false); setShowRoleSelector(false); }} className="absolute top-4 right-4 p-1.5 bg-white/5 border border-white/5 rounded-full text-gray-400 hover:text-white active:scale-90 transition-all z-10"><X size={14} /></button>

          {((selectedCharacter.id === dbUser?.character?.id && !isDead(selectedCharacter.roles)) || isAdmin) && !isEditingProfile && (
            <button onClick={() => { setNewRpName(selectedCharacter.rp_name); setNewAvatarUrl(selectedCharacter.avatar_url || ''); setIsEditingProfile(true); }} className="absolute top-4 left-4 p-2 bg-white/5 border border-white/5 rounded-full text-gray-400 hover:text-[#c0ff00] active:scale-90 transition-all z-10"><Edit2 size={14} /></button>
          )}

          <div className={`relative w-24 h-24 rounded-full overflow-hidden bg-[#1c2026] border-2 mx-auto shadow-lg transition-all duration-300 ${isDead(selectedCharacter.roles) ? 'border-gray-600 opacity-60 grayscale' : 'border-[#c0ff00]'}`}>
            <img src={isEditingProfile ? newAvatarUrl : (selectedCharacter.avatar_url || 'https://via.placeholder.com/150')} alt="avatar" className="w-full h-full object-cover" />
          </div>

          <div className="space-y-2 w-full">
            {isEditingProfile ? (
              <div className="space-y-3 max-w-xs mx-auto w-full animate-fade-in">
                <input type="text" placeholder="Имя персонажа" value={newRpName} onChange={(e) => setNewRpName(e.target.value)} className="ui-input text-center font-bold" />
                <label className="ui-pill-btn w-full justify-center !bg-white/5 !border-white/10 hover:!border-[#c0ff00]/40 cursor-pointer py-2.5 relative overflow-hidden">
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => handleFileUpload(e, setNewAvatarUrl, setLoadingProfile)} disabled={isUploadingProfile} />
                  <Upload size={14} className={isUploadingProfile ? "animate-bounce" : ""} />
                  <span className="font-medium text-xs">{isUploadingProfile ? 'Грузим...' : 'Загрузить аватар'}</span>
                </label>
                <button onClick={saveCharacterProfile} disabled={isUploadingProfile} className="ui-pill-btn w-full justify-center !bg-[#c0ff00] !text-black font-bold py-2.5 mt-2"><Save size={14} /><span>Сохранить</span></button>
              </div>
            ) : (
              <div className="w-full space-y-1">
                <h2 className={`text-2xl font-black tracking-wide break-all px-6 transition-all duration-300 ${isDead(selectedCharacter.roles) ? 'text-gray-500 line-through' : 'text-white'}`}>{selectedCharacter.rp_name}</h2>
                <p className="text-sm text-gray-400 font-mono tracking-tight">{selectedCharacter.mc_nickname}</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5 rounded-full text-xs font-medium mt-1 text-[#c0ff00]">
                  <span>🏛️ Партия:</span><span className="font-bold">{selectedCharacter.party || 'Нет партии'}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">{selectedCharacter.season}</p>
              </div>
            )}
          </div>

          <div className="w-full h-[1px] bg-white/5 my-2" />
          <div className="text-left space-y-2 w-full">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold pl-1">Роли персонажа</div>
            <div className="flex flex-wrap gap-2 items-center">
              {selectedCharacter.roles?.map((role, idx) => (
                <span 
                  key={idx} 
                  className="text-xs font-bold py-1 rounded-full border transition-all flex items-center gap-1.5 px-3" 
                  style={{ backgroundColor: `${getRoleColor(role)}15`, color: getRoleColor(role), borderColor: `${getRoleColor(role)}30` }}
                >
                  <span>• {role.toUpperCase()}</span>
                  {isAdmin && <button onClick={() => handleRemoveRoleFromCharacter(role)} className="opacity-60 hover:opacity-100 hover:bg-white/10 rounded-full p-1 transition-all"><X size={10} /></button>}
                </span>
              ))}
              {isAdmin && (
                <div className="relative inline-block">
                  <button onClick={() => setShowRoleSelector(!showRoleSelector)} className="flex items-center justify-center w-6 h-6 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/40 transition-all shadow-sm"><Plus size={14} /></button>
                  {showRoleSelector && (
                    <div className="absolute bottom-full left-0 mb-2 bg-[#14171c]/95 border border-white/10 rounded-2xl p-2 z-50 shadow-2xl min-w-[150px] flex flex-col gap-1 backdrop-blur-xl">
                      {customRoles.filter(cr => !selectedCharacter.roles?.includes(cr.name)).map((cr, idx) => (
                        <button key={idx} onClick={() => handleAddRoleToCharacter(cr.name)} className="text-xs text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-2" style={{color: cr.color}}><span className="w-2 h-2 rounded-full" style={{backgroundColor: cr.color}}/>{cr.name.toUpperCase()}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* Информация о профиле (Minecraft) */}
          <div className="w-full h-[1px] bg-white/5 my-2" />
          <div className="text-left space-y-1 w-full">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider pl-1">Minecraft-профиль</div>
            <div className="flex items-center gap-2 pl-1">
              <Swords size={14} className="text-gray-500" />
              <span className="text-sm font-mono font-bold text-gray-300">{dbUser?.player.mc_nickname}</span>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ОСНОВНОЙ КОНТЕНТ */}
      {/* ================================================================ */}
      <main className="p-4 pt-36 pb-24 md:p-12 md:pl-[140px] md:pr-8 max-w-md md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto transition-all duration-300 w-full flex-grow flex flex-col animate-fade-in">
        
        {/* --- ПРОФИЛЬ --- */}
        {activeTab === 'profile' && (
          <>
          {seasonEnded ? (
            <div className="flex flex-col items-center justify-center text-center gap-6 pt-4 pb-12 w-full select-none animate-fade-in flex-grow">
              <img src="/OneAppLogo.gif" alt="OneApp Logo" className="w-40 h-40 object-contain opacity-80" />
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-wide">
                  OneHouse <span className="text-[#c0ff00]">#{lastSeason?.season_number || 2}</span> завершён
                </h2>
                <p className="text-base text-gray-400 font-medium">
                  Он продлился <span className="text-white font-bold">{lastSeason?.days_count || '—'}</span> дней
                </p>
              </div>
              <button onClick={() => { setActiveSvodTab('archive'); handleTabChange('svod'); }} className="bg-[#14171c]/90 border border-white/10 rounded-full px-6 py-2.5 flex items-center gap-2 hover:border-[#c0ff00]/30 hover:text-[#c0ff00] transition-all active:scale-95 shadow-lg">
                <Library size={16} />
                <span className="text-sm font-bold">Архив сезонов</span>
              </button>
              {isAdmin && (
                <button onClick={() => handleTabChange('admin')} className="mt-2 bg-[#14171c]/70 border border-white/5 rounded-full px-4 py-2 flex items-center gap-1.5 text-gray-500 hover:text-[#c0ff00] hover:border-[#c0ff00]/20 transition-all active:scale-95">
                  <ShieldAlert size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Админ</span>
                </button>
              )}
              <p className="text-[10px] text-gray-700 font-medium uppercase tracking-[0.2em] mt-8">Скоро...</p>
            </div>
          ) : (
          <div className="space-y-6 w-full">
            <div className="flex flex-col items-center text-center gap-3 pt-2 pb-6 w-full select-none relative">
              {isAdmin && (
                <button onClick={() => handleTabChange('admin')} className="absolute top-2 right-0 w-10 h-10 rounded-full bg-[#14171c]/95 border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#c0ff00] hover:border-[#c0ff00]/30 active:scale-90 transition-all z-10" title="Админ-панель">
                  <ShieldAlert size={20} />
                </button>
              )}
              <img src="/OneAppLogo.gif" alt="OneApp Logo" className="w-40 h-40 object-contain" />
              <div className="min-h-[72px] md:min-h-[88px] flex items-center justify-center">
                {showWelcome ? (
                  <h3 className="flex flex-col items-center gap-1.5 animate-fade-in">
                    <span className="text-base md:text-xl font-black text-white tracking-wide leading-tight animate-welcome-glow">Добро пожаловать в One App</span>
                    <span className="text-[#c0ff00] text-xl md:text-3xl font-black">{dbUser?.character?.rp_name || dbUser?.player.mc_nickname}</span>
                  </h3>
                ) : (
                  <h3 className="flex flex-col items-center gap-1 animate-fade-in">
                    <span className="text-[#c0ff00] text-4xl md:text-5xl font-black tabular-nums tracking-tight">{seasonDays}</span>
                    <span className="text-sm md:text-base font-bold text-gray-400 tracking-wide">дней с начала сезона</span>
                  </h3>
                )}
              </div>
            </div>

            {/* Виджеты */}
            <div className="grid grid-cols-4 gap-4 w-full">
              {/* Конституция */}
              <div onClick={() => { setActiveSvodTab('laws'); setActiveDocument('constitution'); handleTabChange('svod'); }} className="col-span-2 md:col-span-1 aspect-square bg-[#14171c]/90 backdrop-blur-xl rounded-[24px] border border-white/5 p-4 md:p-5 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:border-[#c0ff00]/30 transition-all duration-300 shadow-xl">
                <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-all duration-500 bg-right-bottom bg-no-repeat bg-[length:90px] md:bg-[length:180px]" style={{ backgroundImage: "url('/1000024917.png')", imageRendering: "pixelated" }} />
                <div className="w-11 h-11 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-[#c0ff00] shrink-0"><BookOpen size={20} /></div>
                <div className="space-y-0.5 relative z-10">
                  <h3 className="text-sm md:text-base font-black text-white tracking-wide">Конституция</h3>
                  <p className="text-[10px] text-[#c0ff00] font-bold uppercase tracking-wider">РП Законы</p>
                </div>
              </div>

              {/* Казна */}
              <div onClick={() => handleTabChange('treasury')} className="col-span-2 md:col-span-1 aspect-square bg-[#14171c]/90 backdrop-blur-xl rounded-[24px] border border-white/5 p-4 md:p-5 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:border-[#c0ff00]/30 transition-all duration-300 shadow-xl">
                <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-all duration-500 bg-right-bottom bg-no-repeat bg-[length:120px] md:bg-[length:200px]" style={{ backgroundImage: `url('/bank-${getBankSuffix(treasuryBalance)}.webp')` }} />
                <div className="w-11 h-11 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-[#c0ff00] shrink-0"><Landmark size={20} /></div>
                <div className="space-y-0.5 relative z-10">
                  <h3 className="text-sm md:text-base font-black text-white tracking-wide">Казна</h3>
                  <p className="text-[10px] text-[#c0ff00] font-bold uppercase tracking-wider">{treasuryBalance.toLocaleString('ru-RU')} SPR</p>
                </div>
              </div>

              {/* Последние публикации */}
              <div className="col-span-4 md:col-span-2 bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[24px] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col justify-between gap-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Newspaper size={16} className="text-[#c0ff00]" />
                    <div className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Последние публикации</div>
                  </div>
                  <button onClick={() => handleTabChange('media')} className="text-[11px] font-bold text-[#c0ff00] hover:underline">Все статьи</button>
                </div>
                <div className="grid grid-cols-2 gap-2.5 h-full">
                  {latestPosts.map((post, idx) => (
                    <div key={post.id} onClick={() => router.push(`/media/${post.id}`)} className="bg-black/20 border border-white/5 p-4 rounded-2xl cursor-pointer hover:border-white/10 transition-all duration-300 flex flex-col justify-between gap-3 group min-w-0 relative">
                      {idx === 0 && (
                        <div className="absolute top-2 right-2 bg-[#c0ff00]/10 text-[#c0ff00] border border-[#c0ff00]/30 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md tracking-wide shadow-sm z-10">New</div>
                      )}
                      <span className="font-bold text-xs text-white group-hover:text-[#c0ff00] transition-colors line-clamp-2 break-words leading-snug pr-7">{post.title}</span>
                      <span className="text-[10px] text-gray-500 font-medium truncate">{post.author?.rp_name || 'Неизвестный'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Статус сервера */}
              <div className="col-span-4 md:col-span-2 bg-[#14171c]/90 backdrop-blur-xl p-4 rounded-[24px] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col justify-between gap-3">
                <button onClick={fetchServerStatus} className={`absolute top-4 right-4 p-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all active:scale-90 z-20 ${isServerLoading ? 'animate-spin' : ''}`}><RefreshCw size={14}/></button>
                {serverInfo && <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-20 rounded-full pointer-events-none transition-colors duration-700 ${getServerStatusText(serverInfo.status).bg}`} />}
                
                <div className="relative z-10 flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Server size={20} className={getServerStatusText(serverInfo?.status || 0).color} />
                    <div className={`text-sm md:text-base font-black tracking-wider uppercase ${serverInfo ? getServerStatusText(serverInfo.status).color : 'text-gray-400'}`}>{serverInfo ? getServerStatusText(serverInfo.status).text : 'ЗАГРУЗКА...'}</div>
                  </div>
                  {serverInfo?.status === 1 && <div className="bg-black/30 border border-white/5 px-2 py-0.5 rounded-lg text-[10px] font-bold text-gray-400">Online: <span className="text-[#c0ff00] font-mono">{serverInfo.players.count}/{serverInfo.players.max}</span></div>}
                </div>

                <div className="space-y-2 w-full relative z-10">
                  <div className="bg-black/20 border border-white/5 p-2.5 rounded-xl flex items-center justify-between group">
                    <div className="min-w-0 flex-1">
                      <div className="text-[8px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">IP СЕРВЕРА</div>
                      <div className="font-mono text-sm text-gray-200 truncate">{staticIp}</div>
                    </div>
                    <button onClick={() => copyToClipboard(staticIp)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-[#c0ff00] transition-colors shrink-0 ml-2"><Copy size={14}/></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/20 border border-white/5 p-2 rounded-xl flex items-center justify-between group">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 bg-white/5 rounded-md text-gray-400"><AnvilIcon size={14} /></div>
                        <div className="min-w-0">
                          <div className="text-[8px] text-gray-500 font-bold uppercase">Версия</div>
                          <div className="font-bold text-xs text-white truncate">1.20.1</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-black/20 border border-white/5 p-2 rounded-xl flex items-center justify-between group">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 bg-white/5 rounded-md text-gray-400"><Coins size={14} /></div>
                        <div className="min-w-0">
                          <div className="text-[8px] text-gray-500 font-bold uppercase">Кредиты</div>
                          <div className="font-bold text-xs text-white truncate">{credits !== null ? credits : '—'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleServerAction('start')} disabled={serverActionLoading || serverInfo?.status === 1} className="flex-1 bg-[#c0ff00]/10 border border-[#c0ff00]/30 text-[#c0ff00] text-[11px] font-black uppercase py-2 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-[#c0ff00]/20 disabled:opacity-30 disabled:cursor-not-allowed"><Play size={14} /><span>Запустить</span></button>
                    <button onClick={() => handleServerAction('stop')} disabled={serverActionLoading || serverInfo?.status === 0} className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-black uppercase py-2 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed"><Square size={14} /><span>Выключить</span></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
          </>
        )}

        {/* --- АДМИН-ПАНЕЛЬ --- */}
        {activeTab === 'admin' && (
          <div className="space-y-6 w-full">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white flex items-center gap-2"><ShieldAlert size={20} className="text-[#c0ff00]" /> Админ-панель</h2>
              <button onClick={() => handleTabChange('profile')} className="text-xs text-gray-400 hover:text-white">← На главную</button>
            </div>

            {/* Под-табы админки */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {(['players', 'characters', 'roles', 'guests', 'seasons'] as const).map(tab => (
                <button key={tab} onClick={() => setAdminSubTab(tab)} className={`text-xs font-bold uppercase px-4 py-2 rounded-full whitespace-nowrap transition-all ${adminSubTab === tab ? 'bg-[#c0ff00]/20 text-[#c0ff00] border border-[#c0ff00]/30' : 'bg-white/5 text-gray-400 border border-white/5'}`}>
                  {tab === 'players' && 'Профили'}
                  {tab === 'characters' && 'Персонажи'}
                  {tab === 'roles' && 'Роли'}
                  {tab === 'guests' && 'Гости'}
                  {tab === 'seasons' && 'Сезоны'}
                </button>
              ))}
            </div>

            {/* --- Профили игроков (Minecraft) --- */}
            {adminSubTab === 'players' && (
              <div className="space-y-4">
                <div className="bg-[#14171c]/90 border border-white/5 p-5 rounded-2xl space-y-3">
                  <h3 className="text-sm font-black text-gray-300 uppercase tracking-wider">Создать Minecraft-профиль</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Minecraft ник *" value={addMcNickname} onChange={(e) => setAddMcNickname(e.target.value)} className="ui-input" />
                    <input type="text" placeholder="Telegram ID" value={addTgId} onChange={(e) => setAddTgId(e.target.value)} className="ui-input" />
                    <input type="text" placeholder="Telegram username" value={addTgUsername} onChange={(e) => setAddTgUsername(e.target.value)} className="ui-input" />
                    <input type="text" placeholder="URL аватара" value={addAvatarUrl} onChange={(e) => setAddAvatarUrl(e.target.value)} className="ui-input" />
                  </div>
                  <button onClick={handleCreatePlayer} className="ui-pill-btn w-full justify-center !bg-[#c0ff00] !text-black font-bold"><UserPlus size={14} /><span>Создать профиль</span></button>
                </div>

                <div className="bg-[#14171c]/90 border border-white/5 p-5 rounded-2xl">
                  <h3 className="text-sm font-black text-gray-300 uppercase tracking-wider mb-3">Все Minecraft-профили ({allPlayers.length})</h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {allPlayers.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-black/20 border border-white/5 p-3 rounded-xl">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[#1c2026] border border-white/10 overflow-hidden flex-shrink-0">
                            {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : <Swords size={14} className="m-auto text-gray-600" />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">{p.mc_nickname}</div>
                            <div className="text-[10px] text-gray-500">{p.tg_id ? `TG: ${p.tg_id}` : 'Без привязки TG'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {allPlayers.length === 0 && <p className="text-xs text-gray-500 text-center py-4">Нет профилей</p>}
                  </div>
                </div>
              </div>
            )}

            {/* --- Персонажи --- */}
            {adminSubTab === 'characters' && (
              <div className="space-y-4">
                <div className="bg-[#14171c]/90 border border-white/5 p-5 rounded-2xl space-y-3">
                  <h3 className="text-sm font-black text-gray-300 uppercase tracking-wider">Создать персонажа для сезона</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Minecraft ник игрока *" value={addCharMcNickname} onChange={(e) => setAddCharMcNickname(e.target.value)} className="ui-input" />
                    <input type="text" placeholder="RP-имя персонажа *" value={addCharRpName} onChange={(e) => setAddCharRpName(e.target.value)} className="ui-input" />
                    <input type="text" placeholder="Партия" value={addCharParty} onChange={(e) => setAddCharParty(e.target.value)} className="ui-input" />
                    <input type="text" placeholder="URL аватара" value={addCharAvatarUrl} onChange={(e) => setAddCharAvatarUrl(e.target.value)} className="ui-input" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Роли персонажа</div>
                    <div className="flex flex-wrap gap-2">
                      {customRoles.map(cr => (
                        <button key={cr.name} onClick={() => {
                          setAddCharRoles(prev => prev.includes(cr.name) ? prev.filter(r => r !== cr.name) : [...prev, cr.name]);
                        }} className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${addCharRoles.includes(cr.name) ? 'border-current' : 'border-white/10 opacity-40'}`} style={{ color: cr.color, backgroundColor: addCharRoles.includes(cr.name) ? `${cr.color}20` : 'transparent' }}>
                          {cr.name.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleCreateCharacter} className="ui-pill-btn w-full justify-center !bg-[#c0ff00] !text-black font-bold"><Plus size={14} /><span>Создать персонажа</span></button>
                </div>

                <div className="bg-[#14171c]/90 border border-white/5 p-5 rounded-2xl">
                  <h3 className="text-sm font-black text-gray-300 uppercase tracking-wider mb-3">Персонажи сезона ({characters.length})</h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {characters.map(c => (
                      <div key={c.id} className="flex items-center justify-between bg-black/20 border border-white/5 p-3 rounded-xl">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[#1c2026] border border-white/10 overflow-hidden flex-shrink-0">
                            {c.avatar_url ? <img src={c.avatar_url} className="w-full h-full object-cover" /> : <User size={14} className="m-auto text-gray-600" />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">{c.rp_name}</div>
                            <div className="text-[10px] text-gray-500">{c.mc_nickname} · {c.party}</div>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {c.roles?.slice(0, 3).map((r, i) => (
                            <span key={i} className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${getRoleColor(r)}20`, color: getRoleColor(r) }}>{r}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {characters.length === 0 && <p className="text-xs text-gray-500 text-center py-4">Нет персонажей</p>}
                  </div>
                </div>
              </div>
            )}

            {/* --- Роли --- */}
            {adminSubTab === 'roles' && (
              <div className="space-y-4">
                <div className="bg-[#14171c]/90 border border-white/5 p-5 rounded-2xl space-y-3">
                  <h3 className="text-sm font-black text-gray-300 uppercase tracking-wider">Создать роль</h3>
                  <div className="flex gap-2 items-end">
                    <input type="text" placeholder="Название роли" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} className="ui-input flex-1" />
                    <input type="color" value={newRoleColor} onChange={(e) => setNewRoleColor(e.target.value)} className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer" />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-400">
                    <input type="checkbox" checked={newRolePerm} onChange={(e) => setNewRolePerm(e.target.checked)} className="accent-[#c0ff00]" />
                    Может редактировать конституцию
                  </label>
                  <button onClick={handleCreateRole} className="ui-pill-btn w-full justify-center !bg-[#c0ff00] !text-black font-bold"><Plus size={14} /><span>Создать роль</span></button>
                </div>

                <div className="bg-[#14171c]/90 border border-white/5 p-5 rounded-2xl">
                  <h3 className="text-sm font-black text-gray-300 uppercase tracking-wider mb-3">Все роли</h3>
                  <div className="space-y-2">
                    {customRoles.map(role => (
                      <div key={role.id} className="flex items-center gap-3 bg-black/20 border border-white/5 p-3 rounded-xl">
                        <input type="color" value={role.color} onChange={(e) => handleRoleChange(role.id!, 'color', e.target.value)} onBlur={() => saveRoleToDb(role)} className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer flex-shrink-0" />
                        <input type="text" value={role.name} onChange={(e) => handleRoleChange(role.id!, 'name', e.target.value)} onBlur={() => saveRoleToDb(role)} className="bg-transparent text-sm font-bold flex-1 min-w-0" style={{ color: role.color }} />
                        <label className="flex items-center gap-1 text-[10px] text-gray-500 flex-shrink-0">
                          <input type="checkbox" checked={role.canEditConstitution} onChange={(e) => { handleRoleChange(role.id!, 'canEditConstitution', e.target.checked); saveRoleToDb({...role, canEditConstitution: e.target.checked}); }} className="accent-[#c0ff00]" />
                          Конст.
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* --- Гости --- */}
            {adminSubTab === 'guests' && (
              <div className="space-y-4">
                <div className="bg-[#14171c]/90 border border-white/5 p-5 rounded-2xl space-y-3">
                  <h3 className="text-sm font-black text-gray-300 uppercase tracking-wider">Добавить гостя</h3>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Telegram ID" value={guestTgId} onChange={(e) => setGuestTgId(e.target.value)} className="ui-input flex-1" />
                    <button onClick={handleAddGuest} disabled={guestLoading} className="ui-pill-btn !bg-[#c0ff00] !text-black font-bold"><Plus size={14} /></button>
                  </div>
                </div>
                <div className="bg-[#14171c]/90 border border-white/5 p-5 rounded-2xl">
                  <h3 className="text-sm font-black text-gray-300 uppercase tracking-wider mb-3">Гости ({guestList.length})</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {guestList.map(g => (
                      <div key={g.tg_id} className="flex items-center justify-between bg-black/20 border border-white/5 p-3 rounded-xl">
                        <div>
                          <div className="text-sm font-bold text-white">TG: {g.tg_id}</div>
                          <div className="text-[10px] text-gray-500">Добавил: {g.added_by}</div>
                        </div>
                        <button onClick={() => handleRemoveGuest(g.tg_id)} className="p-1.5 bg-red-500/10 text-red-400 rounded-full hover:bg-red-500/20"><X size={14} /></button>
                      </div>
                    ))}
                    {guestList.length === 0 && <p className="text-xs text-gray-500 text-center py-4">Нет гостей</p>}
                  </div>
                </div>
              </div>
            )}

            {/* --- Сезоны --- */}
            {adminSubTab === 'seasons' && (
              <div className="space-y-4">
                <div className="bg-[#14171c]/90 border border-white/5 p-5 rounded-2xl space-y-3">
                  <h3 className="text-sm font-black text-gray-300 uppercase tracking-wider">Управление сезонами</h3>
                  <div className="text-sm text-gray-400">Текущий: <span className="text-[#c0ff00] font-bold">{currentSeasonName}</span> {seasonEnded ? '(завершён)' : '(активен)'}</div>
                  {!seasonEnded && (
                    <button onClick={handleEndSeason} disabled={seasonLoading} className="ui-pill-btn w-full justify-center !bg-red-500/10 !border-red-500/30 !text-red-400 font-bold">
                      <Square size={14} /><span>Завершить сезон</span>
                    </button>
                  )}
                  {seasonEnded && (
                    <>
                      <button onClick={handleUndoEndSeason} disabled={seasonLoading} className="ui-pill-btn w-full justify-center !bg-[#c0ff00]/10 !border-[#c0ff00]/30 !text-[#c0ff00] font-bold">
                        <RotateCcw size={14} /><span>Отменить завершение</span>
                      </button>
                      <div className="space-y-2">
                        <input type="text" placeholder="ID сервера Exaroton (для нового)" value={newSeasonServerId} onChange={(e) => setNewSeasonServerId(e.target.value)} className="ui-input" />
                        <button onClick={handleStartNewSeason} disabled={seasonLoading} className="ui-pill-btn w-full justify-center !bg-[#c0ff00] !text-black font-bold">
                          <Play size={14} /><span>Начать новый сезон</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <div className="bg-[#14171c]/90 border border-white/5 p-5 rounded-2xl">
                  <h3 className="text-sm font-black text-gray-300 uppercase tracking-wider mb-3">Архив сезонов</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {pastSeasons.map(s => (
                      <div key={s.id} className="flex items-center justify-between bg-black/20 border border-white/5 p-3 rounded-xl">
                        <div>
                          <div className="text-sm font-bold text-white">Сезон #{s.season_number}</div>
                          <div className="text-[10px] text-gray-500">{s.start_date} → {s.end_date} · {s.days_count} дн.</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleRestoreSeason(s.id, s.season_number)} className="p-1.5 bg-[#c0ff00]/10 text-[#c0ff00] rounded-full hover:bg-[#c0ff00]/20"><RotateCcw size={14} /></button>
                          <button onClick={() => handleDeleteSeason(s.id, s.season_number)} className="p-1.5 bg-red-500/10 text-red-400 rounded-full hover:bg-red-500/20"><X size={14} /></button>
                        </div>
                      </div>
                    ))}
                    {pastSeasons.length === 0 && <p className="text-xs text-gray-500 text-center py-4">Нет завершённых сезонов</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- ИГРОКИ --- */}
        {activeTab === 'players' && (
          <div className="space-y-4 w-full">
            <h2 className="text-xl font-black text-white flex items-center gap-2"><Users size={20} className="text-[#c0ff00]" /> Игроки сезона</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sortedCharacters.map(c => (
                <div key={c.id} onClick={() => setSelectedCharacter(c)} className={`bg-[#14171c]/90 border rounded-2xl p-4 cursor-pointer transition-all hover:border-[#c0ff00]/20 active:scale-[0.98] ${isDead(c.roles) ? 'border-gray-700/30 opacity-60' : 'border-white/5'}`}>
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${isDead(c.roles) ? 'border-gray-600 grayscale' : 'border-[#c0ff00]/30'}`}>
                      <img src={c.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 w-full">
                      <div className={`text-sm font-bold truncate ${isDead(c.roles) ? 'text-gray-500 line-through' : 'text-white'}`}>{c.rp_name}</div>
                      <div className="text-[10px] text-gray-500 truncate">{c.mc_nickname}</div>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {c.roles?.slice(0, 3).map((r, i) => (
                        <span key={i} className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${getRoleColor(r)}20`, color: getRoleColor(r) }}>{r}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {sortedCharacters.length === 0 && <p className="text-xs text-gray-500 text-center py-8">Нет игроков в этом сезоне</p>}
          </div>
        )}

        {/* --- СВОД (Конституция + Заповеди) --- */}
        {activeTab === 'svod' && (
          <div className="space-y-6 w-full">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                {activeSvodTab === 'laws' ? <><BookOpen size={20} className="text-[#c0ff00]" /> Свод законов</> : <><Library size={20} className="text-[#c0ff00]" /> Архив сезонов</>}
              </h2>
              <div className="flex gap-2">
                <button onClick={() => { setActiveSvodTab('laws'); setActiveDocument('constitution'); setIsEditing(false); }} className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${activeSvodTab === 'laws' ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'bg-white/5 text-gray-400'}`}>Законы</button>
                <button onClick={() => { setActiveSvodTab('archive'); setActiveDocument('none'); }} className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${activeSvodTab === 'archive' ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'bg-white/5 text-gray-400'}`}>Архив</button>
              </div>
            </div>

            {activeSvodTab === 'laws' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button onClick={() => setActiveDocument('constitution')} className={`text-xs font-bold px-4 py-2 rounded-full transition-all ${activeDocument === 'constitution' ? 'bg-[#c0ff00]/20 text-[#c0ff00] border border-[#c0ff00]/30' : 'bg-white/5 text-gray-400'}`}>📜 Конституция</button>
                  <button onClick={() => setActiveDocument('commandments')} className={`text-xs font-bold px-4 py-2 rounded-full transition-all ${activeDocument === 'commandments' ? 'bg-[#c0ff00]/20 text-[#c0ff00] border border-[#c0ff00]/30' : 'bg-white/5 text-gray-400'}`}>⚔️ Заповеди</button>
                </div>

                {activeDocument !== 'none' && (
                  <div className="bg-[#14171c]/90 border border-white/5 p-5 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-black text-white">{activeDocument === 'constitution' ? 'Конституция' : 'Заповеди'}</h3>
                      <div className="flex items-center gap-2">
                        {/* Поиск */}
                        <div className="relative">
                          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input type="text" placeholder="Поиск..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-black/20 border border-white/5 rounded-full py-1.5 pl-8 pr-3 text-xs w-32 md:w-48" />
                          {totalMatches > 0 && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                              <span className="text-[10px] text-gray-500">{activeMatchIndex + 1}/{totalMatches}</span>
                              <button onClick={() => navigateSearch('prev')} className="p-0.5"><ChevronUp size={12} /></button>
                              <button onClick={() => navigateSearch('next')} className="p-0.5"><ChevronDown size={12} /></button>
                            </div>
                          )}
                        </div>
                        {(isAdmin || canEditConstitution()) && (
                          <button onClick={() => setIsEditing(!isEditing)} className="p-1.5 bg-white/5 rounded-full text-gray-400 hover:text-[#c0ff00]">
                            {isEditing ? <X size={14} /> : <Edit2 size={14} />}
                          </button>
                        )}
                      </div>
                    </div>
                    {isEditing ? (
                      <div ref={editorRef} contentEditable suppressContentEditableWarning data-placeholder="Начни писать..." className="prose min-h-[200px] bg-black/20 border border-white/5 rounded-xl p-4 text-sm outline-none focus:border-[#c0ff00]/30 transition-all" onKeyUp={checkFormatting} onMouseUp={checkFormatting} />
                    ) : (
                      <div ref={viewRef} className="prose text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: highlightedHtml || '<p class="text-gray-500 italic">Документ пуст</p>' }} />
                    )}
                  </div>
                )}
              </div>
            )}

            {activeSvodTab === 'archive' && (
              <div className="space-y-4">
                {pastSeasons.map(s => (
                  <div key={s.id} className="bg-[#14171c]/90 border border-white/5 p-5 rounded-2xl">
                    <h3 className="text-sm font-black text-white">Сезон #{s.season_number}</h3>
                    <p className="text-[10px] text-gray-500 mt-1">{s.start_date} → {s.end_date} · {s.days_count} дней</p>
                  </div>
                ))}
                {pastSeasons.length === 0 && <p className="text-xs text-gray-500 text-center py-8">Архив пуст</p>}
              </div>
            )}
          </div>
        )}

        {/* --- МЕДИА, КАЗНА, АРХИВ (передаём управление компонентам) --- */}
        {activeTab === 'media' && (
          <MediaBlog 
            currentUser={dbUser?.character ? { id: dbUser.character.id, player_id: dbUser.player.id, tg_id: dbUser.player.tg_id || 0, tg_username: dbUser.player.tg_username, mc_nickname: dbUser.player.mc_nickname, rp_name: dbUser.character.rp_name, avatar_url: dbUser.character.avatar_url, roles: dbUser.character.roles } : null}
            onProfileClick={(p) => {
              const found = characters.find(c => c.id === p.id);
              if (found) setSelectedCharacter(found);
            }}
            isCreatingPost={isCreatingPost}
            setIsCreatingPost={setIsCreatingPost}
            seasonName={currentSeasonName}
          />
        )}
        {activeTab === 'treasury' && (
          <Treasury currentUser={dbUser?.character ? { id: dbUser.character.id, tg_id: dbUser.player.tg_id || 0, tg_username: dbUser.player.tg_username, mc_nickname: dbUser.player.mc_nickname, rp_name: dbUser.character.rp_name, avatar_url: dbUser.character.avatar_url, roles: dbUser.character.roles } : null} />
        )}
        {activeTab === 'archive' && (
          <Archive currentUser={dbUser?.character ? { id: dbUser.character.id, roles: dbUser.character.roles } : null} />
        )}
        {activeTab === 'map' && <div className="flex items-center justify-center py-20 text-gray-500 text-sm">Карта в разработке</div>}

      </main>

      {/* ================================================================ */}
      {/* НИЖНЯЯ НАВИГАЦИЯ (мобильная) */}
      {/* ================================================================ */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#14171c]/95 backdrop-blur-xl border-t border-white/5 p-4 md:hidden z-50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button onClick={() => handleTabChange('profile')} className={`flex flex-col items-center transition-all duration-300 ${activeTab === 'profile' ? 'text-[#c0ff00]' : 'text-gray-500'}`}>
            <HomeIcon size={22} />
            <span className="text-[10px] font-bold mt-1">Главная</span>
          </button>
          {seasonEnded ? (
            <button onClick={() => handleTabChange('archive')} className={`flex flex-col items-center transition-all duration-300 ${activeTab === 'archive' ? 'text-[#c0ff00]' : 'text-gray-500'}`}>
              <Library size={22} />
              <span className="text-[10px] font-bold mt-1">Архив</span>
            </button>
          ) : (
            <>
              <button onClick={() => handleTabChange('media')} className={`flex flex-col items-center transition-all duration-300 ${activeTab === 'media' ? 'text-[#c0ff00]' : 'text-gray-500'}`}>
                <Newspaper size={22} />
                <span className="text-[10px] font-bold mt-1">Медиа</span>
              </button>
              <button onClick={() => handleTabChange('svod')} className={`flex flex-col items-center transition-all duration-300 ${activeTab === 'svod' ? 'text-[#c0ff00]' : 'text-gray-500'}`}>
                <BookMarked size={22} />
                <span className="text-[10px] font-bold mt-1">Свод</span>
              </button>
              <button onClick={() => handleTabChange('treasury')} className={`flex flex-col items-center transition-all duration-300 ${activeTab === 'treasury' ? 'text-[#c0ff00]' : 'text-gray-500'}`}>
                <Landmark size={22} />
                <span className="text-[10px] font-bold mt-1">Казна</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Кнопка Игроки (плавающая) */}
      {!seasonEnded && (
        <button onClick={() => handleTabChange('players')} className={`fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 w-[68px] h-[68px] bg-[#14171c]/90 backdrop-blur-xl border rounded-full flex flex-col items-center justify-center gap-1 shadow-2xl transition-all active:scale-90 ${activeTab === 'players' || selectedCharacter ? 'border-[#c0ff00]/40 text-[#c0ff00]' : 'border-white/10 text-gray-500'}`}>
          <Users size={22} />
          <span className="text-[10px] font-bold">Игроки</span>
        </button>
      )}

      {/* FAB создания статьи */}
      {activeTab === 'media' && !seasonEnded && dbUser?.character && !dbUser.character.roles?.includes('guest') && (
        <button onClick={() => router.push('/media/editor')} className="md:hidden fixed bottom-28 right-4 w-14 h-14 bg-[#c0ff00] text-black rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-90 z-50">
          <Plus size={28} />
        </button>
      )}

      <style jsx global>{`
        .prose, .prose * { word-break: break-word !important; overflow-wrap: break-word !important; max-w-full !important; white-space: pre-wrap !important; }
        .prose h1, [contenteditable] h1 { font-size: 1.25rem !important; font-weight: 800 !important; color: #ffffff !important; margin-top: 1.2rem !important; margin-bottom: 0.5rem !important; line-height: 1.2 !important; }
        .prose h2, [contenteditable] h2 { font-size: 1.1rem !important; font-weight: 800 !important; color: #c0ff00 !important; margin-top: 1rem !important; margin-bottom: 0.4rem !important; line-height: 1.2 !important; }
        .prose p { margin-bottom: 0.75rem; color: #d1d5db !important; }
        [contenteditable]:empty:before { content: attr(data-placeholder); color: #4b5563; cursor: text; }
        .ui-input { width: 100%; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 10px 14px; font-size: 13px; color: white; outline: none; transition: all 0.2s; }
        .ui-input:focus { border-color: rgba(192,255,0,0.3); }
        .ui-pill-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 9999px; font-size: 13px; font-weight: 700; transition: all 0.2s; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; cursor: pointer; }
        .ui-pill-btn:hover { border-color: rgba(192,255,0,0.3); }
        .ui-pill-btn:active { transform: scale(0.96); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes animate-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: animate-fade-in 0.4s ease-out; }
        @keyframes animate-profile-grow { from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
        .animate-profile-grow { animation: animate-profile-grow 0.3s ease-out; }
        @keyframes animate-welcome-glow { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .animate-welcome-glow { animation: animate-welcome-glow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
