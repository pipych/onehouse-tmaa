'use client';



// =========================================================================

// 1. НАСТРОЙКИ NEXT.JS И СИСТЕМНЫЕ ИМПОРТЫ

// =========================================================================

export const dynamic = 'force-dynamic';



import { useEffect, useState, useRef, useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { supabase } from '../lib/supabase';

import MediaBlog from '../components/MediaBlog';

import Archive from '../components/Archive';

import OneLaunchContent from '../components/OneLaunch';

import Treasury from '../components/Treasury';

import Avatar from '../components/Avatar';

import { getBalance } from '../lib/treasury';

import { addGuest, removeGuest, getGuests, isGuest } from '../lib/guests';

import { getSeasonState, endSeason, undoEndSeason, startNewSeason, restorePastSeason, deletePastSeason, getAllPastSeasons, getLastEndedSeason, seasonName, SeasonState, PastSeason } from '../lib/season';



import { 

  User, BookOpen, Users, Edit2, Check, X, ShieldAlert, UserPlus, ShieldCheck, Palette, Save,

  Bold, Italic, Strikethrough, Heading1, Heading2, AlignLeft, AlignCenter, Plus, Upload,

  Copy, Play, Square, Server, RefreshCw, Coins, Download, Library, ArrowLeft, Home as HomeIcon, Newspaper,

  Map as MapIcon, Search, ChevronUp, ChevronDown, Landmark, BookMarked, Flag, RotateCcw, Calendar,

  Swords, Skull, Trash2, Send

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



interface Player {

  id: string;

  player_id: string;

  tg_id: number;

  tg_username: string;

  mc_nickname: string;

  rp_name: string;

  avatar_url: string;

  roles: string[];

  professions?: string[];

  party?: string;

  season?: string;

  status?: string;

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



// =========================================================================

// 2. ГЛАВНЫЙ КОМПОНЕНТ СТРАНИЦЫ

// =========================================================================

export default function Home() {

  const router = useRouter();

  

  const [tgUser, setTgUser] = useState<any>(null); 

  const [dbUser, setDbUser] = useState<Player | null>(null); 

  const [loading, setLoading] = useState(true); 

  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'notTelegram' | 'notWhitelisted' | null>(null); 

  

  const [activeTab, setActiveTab] = useState<'profile' | 'constitution' | 'players' | 'admin' | 'map' | 'media' | 'archive' | 'treasury' | 'svod' | 'onelaunch'>('profile');

  const [activeSvodTab, setActiveSvodTab] = useState<'laws' | 'archive'>('laws');

  const [treasuryBalance, setTreasuryBalance] = useState<number>(0);

  const [players, setPlayers] = useState<Player[]>([]); 

  

  const [constitutionText, setConstitutionText] = useState('');

  const [commandmentsText, setCommandmentsText] = useState('');

  const [activeDocument, setActiveDocument] = useState<'none' | 'constitution' | 'commandments'>('none');

  const [isEditing, setIsEditing] = useState(false);

  

  const [newRpName, setNewRpName] = useState('');

  const [newAvatarUrl, setNewAvatarUrl] = useState('');

  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [selectedCharacter, setSelectedCharacter] = useState<Player | null>(null); 

  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showPlayerRoleMenu, setShowPlayerRoleMenu] = useState(false); 
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [characterMenuOpen, setCharacterMenuOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState(false); 



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



  const [addTgId, setAddTgId] = useState('');

  const [addTgUsername, setAddTgUsername] = useState('');

  const [addMcNickname, setAddMcNickname] = useState('');

  const [addRpName, setAddRpName] = useState('');

  const [addAvatarUrl, setAddAvatarUrl] = useState('');

  const [addParty, setAddParty] = useState('');

  const [addRoles, setAddRoles] = useState<string[]>(['citizen']);

  const [addProfessions, setAddProfessions] = useState<string[]>([]);



  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);

  const [newRoleName, setNewRoleName] = useState('');

  const [newRoleColor, setNewRoleColor] = useState('#c0ff00');

  const [newRolePerm, setNewRolePerm] = useState(false);

  const [professions, setProfessions] = useState<CustomRole[]>([]);

  const [newProfessionName, setNewProfessionName] = useState('');

  const [newProfessionColor, setNewProfessionColor] = useState('#c0ff00');

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

  const [adminSubTab, setAdminSubTab] = useState<'players' | 'characters' | 'roles' | 'professions' | 'guests' | 'seasons'>('players');

  const [playersSubTab, setPlayersSubTab] = useState<'characters' | 'players'>('characters');

  const [allPlayers, setAllPlayers] = useState<any[]>([]);

  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);

  const [editPlayerData, setEditPlayerData] = useState({ mc_nickname: '', tg_id: '', tg_username: '', avatar_url: '' });

  const [editingCharId, setEditingCharId] = useState<string | null>(null);

  const [editCharData, setEditCharData] = useState({ rp_name: '', party: 'Нет партии', avatar_url: '', professions: [] as string[] });

  const [isUploadingAdminAvatar, setIsUploadingAdminAvatar] = useState(false);

  const [playerCharacters, setPlayerCharacters] = useState<any[]>([]);

  const currentSeasonName = `Сезон ${currentSeasonNum}`;



  // Динамический старт сезона из БД

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

      // Загружаем конституцию/заповеди для актуального сезона

      loadConstitution(seasonName(state.season_number));

    }

    loadSeason();

  }, []);



  async function handleEndSeason() {

    if (!confirm('Завершить текущий сезон? Вся информация будет скрыта.')) return;

    setSeasonLoading(true);

    try {

      const ok = await endSeason();

      if (ok) {

        setSeasonEnded(true);

        const last = await getLastEndedSeason();

        if (last) setLastSeason(last);

        refreshSeasons();

        loadPlayers();

      } else {

        alert('Ошибка завершения сезона. Проверь, выполнен ли SQL из supabase/season_migration.sql в Supabase.');

      }

    } catch (e: any) {

      alert('Ошибка завершения сезона: ' + (e.message || 'неизвестно'));

    }

    setSeasonLoading(false);

  }



  async function handleUndoEndSeason() {

    if (!confirm('Отменить завершение сезона? Данные будут восстановлены.')) return;

    setSeasonLoading(true);

    const ok = await undoEndSeason();

    if (ok) {

      setSeasonEnded(false);

      refreshSeasons();

    } else {

      alert('Ошибка отмены завершения');

    }

    setSeasonLoading(false);

  }



  async function refreshSeasons() {

    const state = await getSeasonState();

    setCurrentSeasonNum(state.season_number);

    setSeasonStartDate(state.season_start_date);

    setExarotonServerId(state.exaroton_server_id || '');

    const all = await getAllPastSeasons();

    setPastSeasons(all);

    loadConstitution(seasonName(state.season_number));

  }



  async function handleStartNewSeason() {

    const nextNum = (pastSeasons.length > 0 ? Math.max(...pastSeasons.map(s => s.season_number)) : currentSeasonNum) + 1;

    const serverMsg = seasonEnded ? '' : '\nТекущий сезон будет завершён и уйдёт в архив.';

    if (!confirm(`Начать новый сезон #${nextNum}?${serverMsg}`)) return;

    setSeasonLoading(true);

    const ok = await startNewSeason(newSeasonServerId || undefined);

    if (ok) {

      setSeasonEnded(false);

      setLastSeason(null);

      setNewSeasonServerId('');

      refreshSeasons();

      loadPlayers();

    } else {

      alert('Ошибка создания нового сезона');

    }

    setSeasonLoading(false);

  }



  async function handleRestoreSeason(seasonId: number, seasonNum: number) {

    if (!confirm(`Восстановить сезон #${seasonNum} как активный? Текущий активный сезон (если есть) будет завершён.`)) return;

    setSeasonLoading(true);

    const ok = await restorePastSeason(seasonId);

    if (ok) {

      setSeasonEnded(false);

      setLastSeason(null);

      refreshSeasons();

    } else {

      alert('Ошибка восстановления сезона');

    }

    setSeasonLoading(false);

  }



  async function handleDeleteSeason(seasonId: number, seasonNum: number) {

    if (!confirm(`Удалить сезон #${seasonNum} навсегда? Это действие необратимо.`)) return;

    setSeasonLoading(true);

    const ok = await deletePastSeason(seasonId);

    if (ok) {

      refreshSeasons();

    } else {

      alert('Ошибка удаления сезона');

    }

    setSeasonLoading(false);

  }



  const editorRef = useRef<HTMLDivElement>(null);

  const viewRef = useRef<HTMLDivElement>(null);



  const currentDocText = activeDocument === 'constitution' ? constitutionText : commandmentsText;

  const isAdmin = dbUser?.roles?.some(r => ['admin', 'админ'].includes(r.toLowerCase())) || false;



  const canEditConstitution = dbUser?.roles?.some(r => {

    const found = customRoles.find(cr => cr.name.toLowerCase() === r.toLowerCase());

    return found ? found.canEditConstitution : false;

  }) || false;



  const showToolbar = isEditing && (activeTab === 'constitution' || activeTab === 'svod') && activeDocument !== 'none' && !selectedCharacter;



  function handleTabChange(tab: 'profile' | 'constitution' | 'players' | 'admin' | 'map' | 'media' | 'archive' | 'treasury' | 'svod' | 'onelaunch') {

    setSelectedCharacter(null); 
    setSelectedProfile(null); 

    setIsEditingProfile(false); 

    setShowRoleSelector(false); 

    setActiveTab(tab);

    setActiveDocument('none'); 

    setIsEditing(false);

    setSearchQuery('');

    if (tab === 'profile') loadLatestPosts();

    if (tab === 'admin') { loadGuests(); loadAllPlayers(); loadPlayers(); loadProfessions(); }

    if (tab === 'players') { loadAllPlayers(); loadPlayers(); }

  }



  function getServerStatusText(statusCode: number) {

    switch(statusCode) {

      case 0: return { text: 'ОФФЛАЙН', color: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500/20' };

      case 1: return { text: 'ОНЛАЙН', color: 'text-[#c0ff00]', bg: 'bg-[#c0ff00]', border: 'border-[#c0ff00]/30' };

      case 2: return { text: 'ЗАПУСКАЕТСЯ...', color: 'text-yellow-400', bg: 'bg-yellow-400', border: 'border-yellow-400/20' };

      case 3: return { text: 'ОСТАНАВЛИВАЕТСЯ...', color: 'text-orange-400', bg: 'bg-orange-400', border: 'border-orange-400/20' };

      case 4: return { text: 'ПЕРЕЗАГРУЗКА...', color: 'text-blue-400', bg: 'bg-blue-400', border: 'border-blue-400/20' };

      default: return { text: 'ЗАГРУЗКА ДАННЫХ', color: 'text-gray-400', bg: 'bg-gray-400', border: 'border-gray-500/20' };

    }

  }

  

  const sortedPlayers = players

    .filter((player) => player.tg_id !== dbUser?.tg_id)

    .sort((a, b) => {

      const aDead = isDead(a); const bDead = isDead(b);

      if (aDead && !bDead) return 1;

      if (!aDead && bDead) return -1;

      return a.rp_name.localeCompare(b.rp_name);

    });



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



  function getProfessionColor(profName: string) {

    const found = professions.find(p => p.name.toLowerCase() === profName.toLowerCase());

    return found ? found.color : '#888888';

  }



  function getRoleColor(roleName: string) {

    const found = customRoles.find(cr => cr.name.toLowerCase() === roleName.toLowerCase());

    return found ? found.color : '#888888';

  }



  function isDead(input: any) {

    if (!input) return false;

    // If passed just an array (e.g. roles), treat it as professions array
    if (Array.isArray(input)) return input.some((x: string) => x.toLowerCase() === 'мёртв');

    // Full player/character object: check professions and status
    const profs = input.professions || [];
    return profs.some((p: string) => p.toLowerCase() === 'мёртв') || input.status === 'dead';

  }



  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>, setUrlCallback: (url: string) => void, setLoadingState: (loading: boolean) => void) {

    try {

      setLoadingState(true);

      const file = event.target.files?.[0];

      if (!file) return;

      const webpBlob = await convertToWebP(file);

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.webp`;

      const { error } = await supabase.storage.from('avatars').upload(fileName, webpBlob, { contentType: 'image/webp' });

      if (error) return alert(`Ошибка загрузки: ${error.message}`);

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

      if (urlData) setUrlCallback(urlData.publicUrl);

    } catch (e: any) {

      alert(`Сбой при загрузке: ${e.message}`);

    } finally { 

      setLoadingState(false); 

    }

  }



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

    } catch (e) {

      console.error(e);

    } finally {

      setIsServerLoading(false);

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



  // =================== УМНЫЙ ПОИСК ПО ДОКУМЕНТАМ ===================

  function getHighlightedHtml(html: string, query: string): string {

    if (!query.trim()) return html;

    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);

    if (terms.length === 0) return html;

    let result = html;

    for (const term of terms) {

      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Строим паттерн: точное совпадение + префиксный поиск словоформ

      let pattern: string;

      if (term.length <= 4) {

        // Короткие слова: только точное совпадение

        pattern = escaped;

      } else {

        // Длинные слова: точное + корень (N-2 символов) + любые окончания

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

      } else {

        setActiveMatchIndex(0);

      }

    }, 50);

    return () => clearTimeout(t);

  }, [highlightedHtml]);



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



  async function checkUserInDb(tgId: number) {

    try {

      const { data: playerData } = await supabase

        .from('players')

        .select('*')

        .eq('tg_id', tgId)

        .limit(1);



      const player = playerData && playerData.length > 0 ? playerData[0] : null;



      if (!player) {

        const guest = await isGuest(tgId);

        if (guest) {

          setDbUser({

            id: 'guest_' + tgId,

            player_id: '',

            tg_id: tgId,

            tg_username: tgUser?.username || 'guest',

            mc_nickname: 'Гость',

            rp_name: 'Гость',

            avatar_url: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23c0ff00" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4" fill="%23c0ff0015"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>'),

            roles: ['guest'],

          });

          loadRoles();

        loadProfessions();

          loadPlayers();

          loadLatestPosts();

          setLoading(false);

          return;

        }

        setErrorType('notWhitelisted');

        setLoading(false);

        return;

      }



      // RPC: получаем персонажа для текущего сезона

      const { data: charId, error: rpcError } = await supabase.rpc('get_active_character', { p_player_id: player.id });



      if (rpcError) {

        setError(`Ошибка сервера: RPC get_active_character не существует. Выполни auth_rework_migration.sql в Supabase.`);

        setLoading(false);

        return;

      }



      if (!charId) {

        // Игрок есть, персонажа в текущем сезоне нет — проверяем роли на профиле игрока

        const isAdminAnyway = (player.roles || []).some((r: string) => ['admin', 'админ'].includes(r.toLowerCase()));

        

        setDbUser({

          id: player.id,

          player_id: player.id,

          tg_id: player.tg_id,

          tg_username: player.tg_username || '',

          mc_nickname: player.mc_nickname,

          rp_name: player.mc_nickname,

          avatar_url: player.avatar_url || '',

          roles: isAdminAnyway ? ['admin'] : [],

          party: 'Нет партии',

          season: currentSeasonName,

          status: 'alive',

        });

        setNewRpName('');

        setNewAvatarUrl('');

        loadRoles();

        loadProfessions();

        loadPlayers();

        loadConstitution();

        loadLatestPosts();

        setLoading(false);

        return;

      }



      // Загружаем персонажа (роли теперь на characters)

      const { data: charData } = await supabase

        .from('characters')

        .select('*')

        .eq('id', charId)

        .limit(1);



      const character = charData && charData.length > 0 ? charData[0] : null;



      if (!character) {

        setError(`Персонаж не найден.`);

        setLoading(false);

        return;

      }



      const combined: Player = {

        id: character.id,

        player_id: player.id,

        tg_id: player.tg_id,

        tg_username: player.tg_username || '',

        mc_nickname: character.mc_nickname || player.mc_nickname,

        rp_name: character.rp_name,

        avatar_url: character.avatar_url || '',

        roles: player.roles || [],

        party: character.party || 'Нет партии',

        season: character.season,

        status: character.status,

      };



      setDbUser(combined);

      setNewRpName(character.rp_name);

      setNewAvatarUrl(character.avatar_url);

      loadRoles();

        loadProfessions();

      loadPlayers();

      loadConstitution();

      loadLatestPosts();

      setLoading(false);

    } catch (e: any) {

      setError(`Ошибка БД: ${e.message}`);

      setLoading(false);

    }

  }



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



  async function loadProfessions() {

    const { data } = await supabase.from('professions').select('*').order('name');

    if (data) setProfessions(data.map((p: any) => ({ id: p.id, name: p.name, color: p.color, canEditConstitution: false })));

  }



  async function loadPlayers() {

    const { data } = await supabase

      .from('characters')

      .select('*, player:players(tg_id, tg_username, avatar_url, roles)')

      .eq('season', currentSeasonName)

      .order('rp_name', { ascending: true });

    if (data) {

      const mapped: Player[] = data.map((c: any) => ({

        id: c.id,

        player_id: c.player_id,

        tg_id: c.player?.tg_id,

        tg_username: c.player?.tg_username,

        mc_nickname: c.mc_nickname,

        rp_name: c.rp_name,

        avatar_url: c.avatar_url || c.player?.avatar_url,

        roles: c.player?.roles || [],

        professions: c.professions || [],

        party: c.party,

        season: c.season,

        status: c.status,

      }));

      setPlayers(mapped);

    } else {

      setPlayers([]);

    }

  }



  async function loadAllPlayers() {

    const { data } = await supabase

      .from('players')

      .select('*')

      .order('mc_nickname', { ascending: true });

    if (data) setAllPlayers(data);

  }



  async function loadPlayerCharacters(playerId: string) {

    const { data } = await supabase

      .from('characters')

      .select('*')

      .eq('player_id', playerId)

      .eq('season', currentSeasonName)

      .order('created_at', { ascending: false });

    if (data) setPlayerCharacters(data);

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



  async function saveDocument() {

    if (!editorRef.current || activeDocument === 'none') return;

    const updatedContent = editorRef.current.innerHTML;

    const docId = activeDocument === 'constitution' ? 1 : 2;



    // Проверяем, есть ли уже документ для этого сезона

    const { data: existing } = await supabase.from('constitution').select('id').eq('id', docId).eq('season', currentSeasonName).maybeSingle();

    

    if (existing) {

      // Обновляем существующий

      const { error } = await supabase.from('constitution').update({ content: updatedContent }).eq('id', docId).eq('season', currentSeasonName);

      if (!error) {

        if (activeDocument === 'constitution') setConstitutionText(updatedContent);

        else setCommandmentsText(updatedContent);

        setIsEditing(false);

      } else {

        alert(`Ошибка: ${error.message}`);

      }

    } else {

      // Вставляем новый для этого сезона

      const { error } = await supabase.from('constitution').insert({ id: docId, content: updatedContent, season: currentSeasonName, title: docId === 1 ? 'Конституция' : 'Заповеди' });

      if (!error) {

        if (activeDocument === 'constitution') setConstitutionText(updatedContent);

        else setCommandmentsText(updatedContent);

        setIsEditing(false);

      } else {

        alert(`Ошибка: ${error.message}`);

      }

    }

  }



  async function saveProfileData() {

    if (!selectedCharacter || !newRpName.trim()) return;

    const { error = null } = await supabase.from('characters').update({ rp_name: newRpName, avatar_url: newAvatarUrl }).eq('id', selectedCharacter.id); 

    if (!error) {

      const updatedUser = { ...selectedCharacter, rp_name: newRpName, avatar_url: newAvatarUrl };

      setSelectedCharacter(updatedUser);

      if (dbUser?.id === selectedCharacter.id) setDbUser(updatedUser);

      setIsEditingProfile(false);

      loadPlayers();

    } else {

      alert(`Ошибка: ${error.message}`);

    }

  }



  async function handleAddPlayer() {

    const tgIdNum = parseInt(addTgId);

    if (isNaN(tgIdNum) || !addRpName.trim() || !addMcNickname.trim()) return;

    

    // 1. Создаём или находим игрока (Minecraft-профиль)

    const { data: existingPlayers } = await supabase.from('players').select('id').eq('tg_id', tgIdNum).limit(1);

    const existingPlayer = existingPlayers && existingPlayers.length > 0 ? existingPlayers[0] : null;

    let playerId = existingPlayer?.id;

    

    if (existingPlayer) {

      await supabase.from('players').update({ roles: addRoles }).eq('id', existingPlayer.id);

    }

    

    if (!playerId) {

      const { data: newPlayers, error: playerError } = await supabase.from('players').insert({

        mc_nickname: addMcNickname,

        tg_id: tgIdNum,

        tg_username: addTgUsername || 'unknown',

        avatar_url: addAvatarUrl || '',

        roles: addRoles,

      }).select();

      if (playerError) { alert(`Ошибка создания игрока: ${playerError.message}`); return; }

      playerId = newPlayers?.[0]?.id;

    }



    // 2. Создаём персонажа с профессиями

    const { error } = await supabase.from('characters').insert({

      player_id: playerId,

      mc_nickname: addMcNickname,

      rp_name: addRpName,

      avatar_url: addAvatarUrl || '',

      party: addParty || 'Нет партии',

      professions: addRoles,

      season: currentSeasonName,

    });

    if (error) alert(`Ошибка создания персонажа: ${error.message}`);

    else { setAddTgId(''); setAddTgUsername(''); setAddMcNickname(''); setAddRpName(''); setAddAvatarUrl(''); setAddParty(''); loadPlayers(); }

  }



  async function handleCreateRole() {

    if (!newRoleName.trim()) return;

    const newRole = { name: newRoleName.toLowerCase(), color: newRoleColor, can_edit_constitution: newRolePerm };

    const { error = null } = await supabase.from('roles').insert([newRole]);

    if (!error) { setNewRoleName(''); setNewRolePerm(false); loadRoles();

        loadProfessions(); }

    else alert(`Ошибка создания роли`);

  }



  function handleRoleChange(id: string, field: string, value: any) {

    setCustomRoles(roles => roles.map(r => r.id === id ? { ...r, [field]: value } : r));

  }



  async function saveRoleToDb(role: CustomRole) {

    if (!role.id) return;

    await supabase.from('roles').update({ name: role.name, color: role.color, can_edit_constitution: role.canEditConstitution }).eq('id', role.id);

  }



  async function handleAddGuest() {

    const tgId = parseInt(guestTgId);

    if (isNaN(tgId) || tgId <= 0) return;

    setGuestLoading(true);

    const ok = await addGuest(tgId, dbUser?.rp_name || 'Админ');

    if (ok) {

      setGuestTgId('');

      loadGuests();

    } else {

      alert('Ошибка добавления гостя');

    }

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



  async function handleAddRoleToUser(roleName: string) {

    if (!selectedCharacter || selectedCharacter.roles.includes(roleName)) return;

    const updatedRoles = [...selectedCharacter.roles, roleName];

    const updatedPlayer = { ...selectedCharacter, roles: updatedRoles };

    // Роли теперь на players (Minecraft-профиль)

    const { error } = await supabase.from('players').update({ roles: updatedRoles }).eq('id', selectedCharacter.player_id);

    if (!error) {

      setSelectedCharacter(updatedPlayer); setPlayers(players.map(p => p.id === selectedCharacter.id ? updatedPlayer : p));

      if (dbUser?.id === selectedCharacter.id) setDbUser(updatedPlayer);

      setShowRoleSelector(false);

    }

  }



  async function handleRemoveRoleFromUser(roleName: string) {

    if (!selectedCharacter) return;

    const updatedRoles = selectedCharacter.roles.filter(r => r !== roleName);

    const updatedPlayer = { ...selectedCharacter, roles: updatedRoles };

    // Роли теперь на players (Minecraft-профиль)

    const { error = null } = await supabase.from('players').update({ roles: updatedRoles }).eq('id', selectedCharacter.player_id);

    if (!error) {

      setSelectedCharacter(updatedPlayer); setPlayers(players.map(p => p.id === selectedCharacter.id ? updatedPlayer : p));

      if (dbUser?.id === selectedCharacter.id) setDbUser(updatedPlayer);

    }

  }



  async function handleAddRoleToProfile(roleName: string) {

    if (!selectedProfile || (selectedProfile.roles || []).includes(roleName)) return;

    const updatedRoles = [...(selectedProfile.roles || []), roleName];

    const updatedProfile = { ...selectedProfile, roles: updatedRoles };

    const { error } = await supabase.from('players').update({ roles: updatedRoles }).eq('id', selectedProfile.player_id || selectedProfile.id);

    if (!error) {

      setSelectedProfile(updatedProfile);

      loadAllPlayers();

      loadPlayers();

    }

  }



  async function handleRemoveRoleFromProfile(roleName: string) {

    if (!selectedProfile) return;

    const updatedRoles = (selectedProfile.roles || []).filter(r => r !== roleName);

    const updatedProfile = { ...selectedProfile, roles: updatedRoles };

    const { error = null } = await supabase.from('players').update({ roles: updatedRoles }).eq('id', selectedProfile.player_id || selectedProfile.id);

    if (!error) {

      setSelectedProfile(updatedProfile);

      loadAllPlayers();

      loadPlayers();

    }

  }



  async function deleteCharacter(charId: string, rpName: string) {

    if (!confirm(`Удалить персонажа «${rpName}» навсегда? Это нельзя отменить.`)) return;

    const { error } = await supabase.from('characters').delete().eq('id', charId);

    if (error) { alert(`Ошибка: ${error.message}`); return; }

    setSelectedCharacter(null);

    setEditingCharId(null);

    loadPlayers();

    loadAllPlayers();

  }



  async function handleAddProfessionToChar(professionName: string) {

    if (!selectedCharacter || (selectedCharacter.professions || []).includes(professionName)) return;

    const updatedProfessions = [...(selectedCharacter.professions || []), professionName];

    const updatedPlayer = { ...selectedCharacter, professions: updatedProfessions };

    const { error } = await supabase.from('characters').update({ professions: updatedProfessions }).eq('id', selectedCharacter.id);

    if (!error) {

      setSelectedCharacter(updatedPlayer); setPlayers(players.map(p => p.id === selectedCharacter.id ? updatedPlayer : p));

    }

  }



  async function handleRemoveProfessionFromChar(professionName: string) {

    if (!selectedCharacter) return;

    const updatedProfessions = (selectedCharacter.professions || []).filter(p => p !== professionName);

    const updatedPlayer = { ...selectedCharacter, professions: updatedProfessions };

    const { error } = await supabase.from('characters').update({ professions: updatedProfessions }).eq('id', selectedCharacter.id);

    if (!error) {

      setSelectedCharacter(updatedPlayer); setPlayers(players.map(p => p.id === selectedCharacter.id ? updatedPlayer : p));

    }

  }

  async function killCharacter() {
    if (!selectedCharacter || !confirm('Убить персонажа?')) return;
    const updatedProfs = [...(selectedCharacter.professions || []).filter(p => p !== 'мёртв'), 'мёртв'];
    await supabase.from('characters').update({ professions: updatedProfs, status: 'dead' }).eq('id', selectedCharacter.id);
    const updated = { ...selectedCharacter, professions: updatedProfs, status: 'dead' };
    setSelectedCharacter(updated);
    setPlayers(players.map(p => p.id === selectedCharacter.id ? updated : p));
  }



  async function handleCreateProfession() {

    if (!newProfessionName.trim()) return;

    const { error } = await supabase.from('professions').insert({ name: newProfessionName.toLowerCase(), color: newProfessionColor });

    if (!error) { setNewProfessionName(''); loadProfessions(); }

    else alert(`Ошибка: ${error.message}`);

  }



  async function saveProfessionToDb(profession: CustomRole) {

    if (!profession.id) return;

    await supabase.from('professions').update({ name: profession.name, color: profession.color }).eq('id', profession.id);

  }



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



      // Deep link: обработка start_param

      const startParam = tg.initDataUnsafe?.start_param;

      if (startParam && startParam.startsWith('article_')) {

        const articleId = startParam.replace('article_', '');

        if (articleId) router.push(`/media/${articleId}`);

      }

    } else {

      setErrorType('notTelegram');

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



  // Загрузка баланса казны для виджета

  useEffect(() => {

    getBalance(currentSeasonName).then(b => setTreasuryBalance(isNaN(b) ? 0 : b));

  }, [currentSeasonName]);



  // Загрузка списка гостей при входе в админку

  useEffect(() => {

    if (activeTab === 'admin') loadGuests();

  }, [activeTab]);



  if (loading) {

    return (

      <div className="min-h-screen bg-[#090b0e] flex flex-col items-center justify-center gap-4">

        <RefreshCw className="animate-spin text-[#c0ff00]" size={36} />

        <span className="text-xs text-gray-500 font-mono font-bold uppercase tracking-widest animate-pulse">Загрузка интерфейса...</span>

      </div>

    );

  }



  if (errorType) {

    if (errorType === 'notTelegram') {

      return (

        <div className="min-h-screen bg-[#090b0e] flex flex-col items-center justify-center gap-6 p-6">

          <img src="/errorAuthIcon.webp" alt="Error" className="w-40 h-40 object-contain" />

          <h1 className="text-2xl font-black text-center" style={{ color: '#ef4444' }}>Зайди в приложение через телеграм!</h1>

          <a

            href="https://t.me/onehserver_bot"

            target="_blank"

            rel="noopener noreferrer"

            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95"

            style={{ backgroundColor: '#0088cc' }}

          >

            <Send size={18} />

            <span>Telegram</span>

          </a>

        </div>

      );

    }



    if (errorType === 'notWhitelisted') {

      return (

        <div className="min-h-screen bg-[#090b0e] flex flex-col items-center justify-center gap-6 p-6">

          <img src="/errorAuthIcon.webp" alt="Error" className="w-40 h-40 object-contain" />

          <h1 className="text-2xl font-black text-center" style={{ color: '#ef4444' }}>Тебе сюда нельзя!</h1>

        </div>

      );

    }

  }



  if (error) {

    return <div className="min-h-screen bg-[#090b0e] text-red-400 flex items-center justify-center font-mono text-xs p-4 text-center">{error}</div>;

  }



  return (

    <div className="min-h-screen text-white pb-32 md:pb-8 antialiased selection:bg-[#c0ff00] selection:text-black transition-colors duration-300 w-full max-w-full relative z-0 flex flex-col">

      

      <div className="fixed inset-0 bg-[#090b0e] -z-10 md:hidden" />

      <div className="fixed inset-0 -z-10 hidden md:block bg-[#090b0e]">

        <video autoPlay loop muted playsInline className="w-full h-full object-cover">

          <source src="/bg-video.mp4" type="video/mp4" />

        </video>

        <div className="absolute inset-0 bg-[#090b0e]/85 backdrop-blur-[2px]" />

      </div>



      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${(selectedCharacter || selectedProfile) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => { setSelectedCharacter(null); setSelectedProfile(null); setIsEditingProfile(false); setShowRoleSelector(false); }} />



      {/* ПЛАВАЮЩИЙ ТУЛБАР ТЕКСТОВОГО РЕДАКТОРА */}

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



      {/* МОДАЛЬНОЕ ОКНО ПРОФИЛЯ */}

      {selectedCharacter && (

        <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-32px)] max-w-md p-6 rounded-[32px] border border-white/10 shadow-2xl text-center space-y-5 animate-profile-grow overflow-visible transition-colors duration-300 ${isDead(selectedCharacter) ? 'bg-[#050608]' : 'bg-[#14171c]'}`}>

          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#c0ff00]/10 to-transparent pointer-events-none rounded-t-[32px]" />

          <button onClick={() => { setSelectedCharacter(null); setIsEditingProfile(false); setShowRoleSelector(false); setCharacterMenuOpen(false); setPlayerCharacters([]); }} className="absolute top-4 right-4 p-1.5 bg-white/5 border border-white/5 rounded-full text-gray-400 hover:text-white active:scale-90 transition-all z-10"><X size={14} /></button>

          {/* ... menu */}
          {isAdmin && !isEditingProfile && (
            <div className="absolute top-4 right-12 z-20">
              <button onClick={() => setCharacterMenuOpen(!characterMenuOpen)} className="p-1.5 bg-white/5 border border-white/5 rounded-full text-gray-400 hover:text-white active:scale-90 transition-all z-10">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
              </button>
              {characterMenuOpen && (
                <div className="absolute top-full right-0 mt-1 bg-[#14171c]/95 border border-white/10 rounded-2xl p-1.5 shadow-2xl min-w-[160px] flex flex-col backdrop-blur-xl">
                  <button onClick={() => { setNewRpName(selectedCharacter.rp_name); setNewAvatarUrl(selectedCharacter.avatar_url || ''); setIsEditingProfile(true); setCharacterMenuOpen(false); }} className="text-xs text-left px-3 py-2 rounded-xl font-bold transition-all hover:bg-white/5 flex items-center gap-2 text-white">
                    <Edit2 size={12} /> Редактировать
                  </button>
                  <button onClick={() => { killCharacter(); setCharacterMenuOpen(false); }} className="text-xs text-left px-3 py-2 rounded-xl font-bold transition-all hover:bg-white/5 flex items-center gap-2 text-red-400">
                    <Skull size={12} /> Убить
                  </button>
                </div>
              )}
            </div>
          )}



          <div className={`relative w-24 h-24 rounded-full overflow-hidden bg-[#1c2026] border-2 mx-auto shadow-lg transition-all duration-300 ${isDead(selectedCharacter) ? 'border-gray-600 opacity-60 grayscale' : 'border-[#c0ff00]'}`}>

            <img src={isEditingProfile ? newAvatarUrl : (selectedCharacter.avatar_url || '')} alt="avatar" className="w-full h-full object-cover" />

          </div>



          <div className="space-y-2 w-full">

            {isEditingProfile ? (

              <div className="space-y-3 max-w-xs mx-auto w-full animate-fade-in">

                <input type="text" placeholder="Имя профиля" value={newRpName} onChange={(e) => setNewRpName(e.target.value)} className="ui-input text-center font-bold" />

                <label className="ui-pill-btn w-full justify-center !bg-white/5 !border-white/10 hover:!border-[#c0ff00]/40 cursor-pointer py-2.5 relative overflow-hidden">

                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => handleFileUpload(e, setNewAvatarUrl, setLoadingProfile)} disabled={isUploadingProfile} />

                  <Upload size={14} className={isUploadingProfile ? "animate-bounce" : ""} />

                  <span className="font-medium text-xs">{isUploadingProfile ? 'Грузим...' : 'Загрузить из галереи'}</span>

                </label>

                <button onClick={saveProfileData} disabled={isUploadingProfile} className="ui-pill-btn w-full justify-center !bg-[#c0ff00] !text-black font-bold py-2.5 mt-2"><Save size={14} /><span>Сохранить всё</span></button>

              </div>

            ) : (

              <div className="w-full space-y-1">

                <h2 className={`text-2xl font-black tracking-wide break-all px-6 transition-all duration-300 ${isDead(selectedCharacter) ? 'text-gray-500 line-through' : 'text-white'}`}>{selectedCharacter.rp_name}{isDead(selectedCharacter) && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 ml-2 align-middle inline-block">мёртв</span>}</h2>

                <p className="text-sm text-gray-400 font-mono tracking-tight break-all">{selectedCharacter.mc_nickname}</p>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5 rounded-full text-xs font-medium mt-1 text-[#c0ff00]">

                  <span>🏛️ Партия:</span><span className="font-bold">{selectedCharacter.party || 'Нет партии'}</span>

                </div>

              </div>

            )}

          </div>



          <div className="w-full h-[1px] bg-white/5 my-2" />

          {/* Профессии персонажа */}

          <div className="text-left space-y-2 w-full">

            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold pl-1">Профессии</div>

            <div className="flex flex-wrap gap-2 items-center">

              {(selectedCharacter.professions || []).filter(p => p.toLowerCase() !== 'мёртв').map((p: string, idx: number) => (

                <span key={idx} className="text-xs font-bold py-1 rounded-full border transition-all flex items-center gap-1.5 px-3" style={{ backgroundColor: `${getProfessionColor(p)}15`, color: getProfessionColor(p), borderColor: `${getProfessionColor(p)}30` }}>

                  <span>• {p.toUpperCase()}</span>

                  {isAdmin && <button onClick={() => handleRemoveProfessionFromChar(p)} className="opacity-60 hover:opacity-100 hover:bg-white/10 rounded-full p-1 transition-all"><X size={10} /></button>}

                </span>

              ))}

              {isAdmin && (

                <div className="relative inline-block">

                  <button onClick={() => setShowRoleSelector(!showRoleSelector)} className="flex items-center justify-center w-6 h-6 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/40 transition-all shadow-sm"><Plus size={14} /></button>

                  {showRoleSelector && (

                    <div className="absolute bottom-full left-0 mb-2 bg-[#14171c]/95 border border-white/10 rounded-2xl p-2 z-50 shadow-2xl min-w-[150px] flex flex-col gap-1 backdrop-blur-xl">

                      {professions.filter(prof => !(selectedCharacter.professions || []).includes(prof.name)).map((prof, idx) => (

                        <button key={idx} onClick={() => handleAddProfessionToChar(prof.name)} className="text-xs text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-2" style={{color: prof.color}}><span className="w-2 h-2 rounded-full" style={{backgroundColor: prof.color}}/>{prof.name.toUpperCase()}</button>

                      ))}

                      {professions.filter(prof => !(selectedCharacter.professions || []).includes(prof.name)).length === 0 && <span className="text-xs text-gray-500 px-3 py-2">Все профессии назначены</span>}

                    </div>

                  )}

                </div>

              )}

            </div>

          </div>



          {/* Персонажи игрока */}

          {playerCharacters.length > 0 && (

            <>

              <div className="w-full h-[1px] bg-white/5 my-2" />

              <div className="text-left space-y-2 w-full">

                <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold pl-1">Персонажи</div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto">

                  {playerCharacters.map((pc: any) => (

                    <div key={pc.id} className={`flex items-center gap-2 p-2 rounded-xl border text-left ${pc.status === 'dead' || pc.professions?.some((r: string) => r.toLowerCase() === 'мёртв') ? 'bg-[#050608] border-gray-800/30 opacity-60' : 'bg-black/20 border-white/5'}`}>

                      <div className={`w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border ${pc.status === 'dead' || pc.professions?.some((r: string) => r.toLowerCase() === 'мёртв') ? 'border-gray-600 grayscale' : 'border-white/10'}`}>

                        {pc.avatar_url ? <img src={pc.avatar_url} className="w-full h-full object-cover" /> : <User size={14} className="m-auto text-gray-600" />}

                      </div>

                      <div className="min-w-0 flex-1">

                        <div className={`text-xs font-bold truncate ${pc.status === 'dead' || pc.professions?.some((r: string) => r.toLowerCase() === 'мёртв') ? 'text-gray-500 line-through' : 'text-white'}`}>{pc.rp_name}</div>

                        <div className="text-[9px] text-gray-500">{pc.season} · {pc.party || 'Нет партии'}</div>

                      </div>

                      <div className="flex gap-0.5 flex-shrink-0">

                        {pc.professions?.some((r: string) => r.toLowerCase() === 'мёртв') && (

                          <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">мёртв</span>

                        )}

                      </div>

                    </div>

                  ))}

                </div>

              </div>

            </>

          )}

        </div>

      )}

      {/* МОДАЛЬНОЕ ОКНО ПРОФИЛЯ ИГРОКА */}
      {selectedProfile && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-32px)] max-w-md p-6 rounded-[32px] border border-white/10 shadow-2xl text-center space-y-5 animate-profile-grow overflow-visible transition-colors duration-300 bg-[#14171c]">
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#c0ff00]/10 to-transparent pointer-events-none rounded-t-[32px]" />
          <button onClick={() => { setSelectedProfile(null); setShowPlayerRoleMenu(false); setPlayerCharacters([]); }} className="absolute top-4 right-4 p-1.5 bg-white/5 border border-white/5 rounded-full text-gray-400 hover:text-white active:scale-90 transition-all z-10"><X size={14} /></button>

          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-[#1c2026] border-2 border-[#c0ff00] mx-auto shadow-lg">
            {selectedProfile.avatar_url ? <img src={selectedProfile.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <User size={36} className="m-auto text-gray-600" />}
          </div>

          <div className="w-full space-y-1">
            <h2 className="text-2xl font-black tracking-wide break-all px-6 text-white">{selectedProfile.mc_nickname}</h2>
          </div>

          <div className="w-full h-[1px] bg-white/5 my-2" />
          <div className="text-left space-y-2 w-full">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold pl-1">Роли</div>
            <div className="flex flex-wrap gap-2 items-center">
              {(selectedProfile.roles || []).map((role: string, idx: number) => (
                <span key={idx} className="text-xs font-bold py-1 rounded-full border transition-all flex items-center gap-1.5 px-3" style={{ backgroundColor: `${getRoleColor(role)}15`, color: getRoleColor(role), borderColor: `${getRoleColor(role)}30` }}>
                  <span>• {role.toUpperCase()}</span>
                  {isAdmin && <button onClick={() => handleRemoveRoleFromProfile(role)} className="opacity-60 hover:opacity-100 hover:bg-white/10 rounded-full p-1 transition-all"><X size={10} /></button>}
                </span>
              ))}
              {(selectedProfile.roles || []).length === 0 && <span className="text-xs text-gray-500">Нет ролей</span>}
              {isAdmin && (
                <div className="relative inline-block">
                  <button onClick={() => setShowPlayerRoleMenu(!showPlayerRoleMenu)} className="flex items-center justify-center w-6 h-6 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/40 transition-all shadow-sm"><Plus size={14} /></button>
                  {showPlayerRoleMenu && (
                    <div className="absolute bottom-full left-0 mb-2 bg-[#14171c]/95 border border-white/10 rounded-2xl p-2 z-50 shadow-2xl min-w-[150px] flex flex-col gap-1 backdrop-blur-xl">
                      {customRoles.filter(cr => !(selectedProfile.roles || []).includes(cr.name)).map((role, idx) => (
                        <button key={idx} onClick={() => { handleAddRoleToProfile(role.name); setShowPlayerRoleMenu(false); }} className="text-xs text-left px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-2" style={{color: role.color}}><span className="w-2 h-2 rounded-full" style={{backgroundColor: role.color}}/>{role.name.toUpperCase()}</button>
                      ))}
                      {customRoles.filter(cr => !(selectedProfile.roles || []).includes(cr.name)).length === 0 && <span className="text-xs text-gray-500 px-3 py-2">Все роли назначены</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {playerCharacters.length > 0 && (
            <>
              <div className="w-full h-[1px] bg-white/5 my-2" />
              <div className="text-left space-y-2 w-full">
                <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold pl-1">Персонажи</div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {playerCharacters.map((pc: any) => (
                    <div key={pc.id} className={`flex items-center gap-2 p-2 rounded-xl border text-left ${pc.status === 'dead' || pc.professions?.some((r: string) => r.toLowerCase() === 'мёртв') ? 'bg-[#050608] border-gray-800/30 opacity-60' : 'bg-black/20 border-white/5'}`}>
                      <div className={`w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border ${pc.status === 'dead' || pc.professions?.some((r: string) => r.toLowerCase() === 'мёртв') ? 'border-gray-600 grayscale' : 'border-white/10'}`}>
                        {pc.avatar_url ? <img src={pc.avatar_url} className="w-full h-full object-cover" /> : <User size={14} className="m-auto text-gray-600" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-bold truncate ${pc.status === 'dead' || pc.professions?.some((r: string) => r.toLowerCase() === 'мёртв') ? 'text-gray-500 line-through' : 'text-white'}`}>{pc.rp_name}</div>
                        <div className="text-[9px] text-gray-500">{pc.season} · {pc.party || 'Нет партии'}</div>
                      </div>
                      {(pc.status === 'dead' || pc.professions?.some((r: string) => r.toLowerCase() === 'мёртв')) && (
                        <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 flex-shrink-0">мёртв</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}



      {/* ОСНОВНОЙ КОНТЕНТНЫЙ БЛОК */}

      <main className="p-4 pt-36 pb-24 md:p-12 md:pl-[140px] md:pr-8 max-w-md md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto transition-all duration-300 w-full flex-grow flex flex-col animate-fade-in">

        {activeTab === 'profile' && (

          <>

          {seasonEnded ? (

            /* СЕЗОН ЗАВЕРШЁН — ГЛАВНАЯ */

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

              <button

                onClick={() => { setActiveSvodTab('archive'); handleTabChange('svod'); }}

                className="bg-[#14171c]/90 border border-white/10 rounded-full px-6 py-2.5 flex items-center gap-2 hover:border-[#c0ff00]/30 hover:text-[#c0ff00] transition-all active:scale-95 shadow-lg"

              >

                <Library size={16} />

                <span className="text-sm font-bold">Архив сезонов</span>

              </button>

              {/* Админ-доступ */}

              {isAdmin && (

                <button

                  onClick={() => handleTabChange('admin')}

                  className="mt-2 bg-[#14171c]/70 border border-white/5 rounded-full px-4 py-2 flex items-center gap-1.5 text-gray-500 hover:text-[#c0ff00] hover:border-[#c0ff00]/20 transition-all active:scale-95"

                >

                  <ShieldAlert size={14} />

                  <span className="text-[10px] font-bold uppercase tracking-wider">Админ</span>

                </button>

              )}

              <p className="text-[10px] text-gray-700 font-medium uppercase tracking-[0.2em] mt-8">Скоро...</p>

            </div>

          ) : (

          <div className="space-y-6 w-full">

            <div className="flex flex-col items-center text-center gap-3 pt-2 pb-6 w-full select-none relative">

              {/* Админ-кнопка */}

              {isAdmin && (

                <button

                  onClick={() => handleTabChange('admin')}

                  className="absolute top-2 right-0 w-10 h-10 rounded-full bg-[#14171c]/95 border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#c0ff00] hover:border-[#c0ff00]/30 active:scale-90 transition-all z-10"

                  title="Админ-панель"

                >

                  <ShieldAlert size={20} />

                </button>

              )}

              <img src="/OneAppLogo.gif" alt="OneApp Logo" className="w-40 h-40 object-contain" />

              {/* Приветствие / Счётчик сезона */}

              <div className="min-h-[72px] md:min-h-[88px] flex items-center justify-center">

                {showWelcome ? (

                  <h3 className="flex flex-col items-center gap-1.5 animate-fade-in">

                    <span className="text-base md:text-xl font-black text-white tracking-wide leading-tight animate-welcome-glow">

                      Добро пожаловать в One App

                    </span>

                    <span className="text-[#c0ff00] text-xl md:text-3xl font-black">{dbUser?.rp_name || 'Житель'}</span>

                  </h3>

                ) : (

                  <h3 className="flex flex-col items-center gap-1 animate-fade-in">

                    <span className="text-[#c0ff00] text-4xl md:text-5xl font-black tabular-nums tracking-tight">{seasonDays}</span>

                    <span className="text-sm md:text-base font-bold text-gray-400 tracking-wide">дней с начала сезона</span>

                  </h3>

                )}

              </div>

            </div>



            <div className="grid grid-cols-4 gap-4 w-full">

              {/* 1. ВИДЖЕТ КОНСТИТУЦИИ */}

              <div 

                onClick={() => { setActiveSvodTab('laws'); setActiveDocument('constitution'); handleTabChange('svod'); }}

                className="col-span-2 md:col-span-1 aspect-square bg-[#14171c]/90 backdrop-blur-xl rounded-[24px] border border-white/5 p-4 md:p-5 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:border-[#c0ff00]/30 transition-all duration-300 shadow-xl"

              >

                <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-all duration-500 bg-right-bottom bg-no-repeat bg-[length:90px] md:bg-[length:180px]" style={{ backgroundImage: "url('/1000024917.png')", imageRendering: "pixelated" }} />

                <div className="w-11 h-11 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-[#c0ff00] shrink-0"><BookOpen size={20} /></div>

                <div className="space-y-0.5 relative z-10">

                  <h3 className="text-sm md:text-base font-black text-white tracking-wide">Конституция</h3>

                  <p className="text-[10px] text-[#c0ff00] font-bold uppercase tracking-wider">РП Законы</p>

                </div>

              </div>



              {/* 2. ВИДЖЕТ КАЗНЫ */}

              <div 

                onClick={() => handleTabChange('treasury')}

                className="col-span-2 md:col-span-1 aspect-square bg-[#14171c]/90 backdrop-blur-xl rounded-[24px] border border-white/5 p-4 md:p-5 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:border-[#c0ff00]/30 transition-all duration-300 shadow-xl"

              >

                <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-all duration-500 bg-right-bottom bg-no-repeat bg-[length:120px] md:bg-[length:200px]" style={{ backgroundImage: `url('/bank-${getBankSuffix(treasuryBalance)}.webp')` }} />

                <div className="w-11 h-11 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-[#c0ff00] shrink-0"><Landmark size={20} /></div>

                <div className="space-y-0.5 relative z-10">

                  <h3 className="text-sm md:text-base font-black text-white tracking-wide">Казна</h3>

                  <p className="text-[10px] text-[#c0ff00] font-bold uppercase tracking-wider">{treasuryBalance.toLocaleString('ru-RU')} SPR</p>

                </div>

              </div>



              {/* 3. ВИДЖЕТ ПОСЛЕДНИХ НОВОСТЕЙ СЕРВЕРА */}

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



              {/* 4. ВИДЖЕТ СТАТУСА СЕРВЕРА */}

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

                      <a href="https://maven.minecraftforge.net/net/minecraftforge/forge/1.20.1-47.4.20/forge-1.20.1-47.4.20-installer.jar" target="_blank" rel="noopener noreferrer" className="w-6 h-6 bg-white/5 hover:bg-[#c0ff00] text-gray-400 hover:text-black rounded-lg flex items-center justify-center transition-all shrink-0"><Download size={12} /></a>

                    </div>

                    {credits !== null && (

                      <div className="bg-black/20 border border-white/5 p-2 rounded-xl flex items-center gap-2 group">

                        <div className="p-1 bg-[#c0ff00]/10 rounded-md text-[#c0ff00]"><Coins size={14} /></div>

                        <div className="min-w-0">

                          <div className="text-[8px] text-gray-500 font-bold uppercase">{credits.toFixed(0)} КР.</div>

                          <div className="font-mono text-[11px] text-[#c0ff00] truncate font-bold">{Math.floor(credits / 7)}ч {Math.floor(((credits % 7) / 7) * 60)}м</div>

                        </div>

                      </div>

                    )}

                  </div>

                </div>



                <div className="flex gap-2 relative z-10 w-full mt-1">

                  <button onClick={() => handleServerAction('start')} disabled={serverActionLoading || (serverInfo && serverInfo.status !== 0)} className="flex-1 h-10 rounded-xl bg-[#c0ff00]/10 border border-[#c0ff00]/20 hover:border-[#c0ff00]/40 text-[#c0ff00] text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-20"><Play size={12} />ВКЛЮЧИТЬ</button>

                  <button onClick={() => handleServerAction('stop')} disabled={serverActionLoading || (serverInfo && serverInfo.status === 0)} className="flex-1 h-10 rounded-xl bg-red-500/10 border border-red-500/20 hover:border-red-500/40 text-red-400 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-20"><Square size={12} />ВЫКЛЮЧИТЬ</button>

                </div>

              </div>



              {/* 5. АРХИВ СЕЗОНОВ */}

              <div 

                onClick={() => { setActiveSvodTab('archive'); handleTabChange('svod'); }}

                className="col-span-2 md:col-span-1 aspect-square bg-[#14171c]/90 backdrop-blur-xl rounded-[24px] border border-white/5 p-4 md:p-5 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:border-[#c0ff00]/30 transition-all duration-300 shadow-xl"

              >

                <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-all duration-500 bg-right-bottom bg-no-repeat bg-[length:90px] md:bg-[length:180px]" style={{ backgroundImage: "url('/ArchiveIcon.webp')" }} />

                <div className="w-11 h-11 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-[#c0ff00] shrink-0"><Library size={20} /></div>

                <div className="space-y-0.5 relative z-10">

                  <h3 className="text-sm md:text-base font-black text-white tracking-wide">Архив</h3>

                  <p className="text-[10px] text-[#c0ff00] font-bold uppercase tracking-wider">Прошлые сезоны</p>

                </div>

              </div>



            </div>

          </div>

          )}

          </>

        )}



        {activeTab === 'svod' && (

          <>

          {seasonEnded ? (

            /* СВОД ПРИ ЗАВЕРШЁННОМ СЕЗОНЕ: законы скрыты, архив работает */

            <div className="space-y-4 animate-fade-in w-full">

              <div className="flex items-center justify-between w-full border-b border-white/5 pb-3">

                <h2 className="text-lg md:text-xl font-black text-[#c0ff00] tracking-wide flex items-center gap-2"><BookMarked size={20} />Свод данных</h2>

              </div>

              <div className="flex gap-3 pb-4">

                <button

                  onClick={() => setActiveSvodTab('laws')}

                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${

                    activeSvodTab === 'laws'

                      ? 'bg-[#c0ff00]/15 text-[#c0ff00] border border-[#c0ff00]/30'

                      : 'bg-[#14171c]/90 text-gray-400 border border-white/5 hover:border-white/10'

                  }`}

                >

                  <BookOpen size={16} className="inline mr-2" />

                  Законы

                </button>

                <button

                  onClick={() => setActiveSvodTab('archive')}

                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${

                    activeSvodTab === 'archive'

                      ? 'bg-[#c0ff00]/15 text-[#c0ff00] border border-[#c0ff00]/30'

                      : 'bg-[#14171c]/90 text-gray-400 border border-white/5 hover:border-white/10'

                  }`}

                >

                  <Library size={16} className="inline mr-2" />

                  Архив

                </button>

              </div>

              {activeSvodTab === 'laws' ? (

                <SeasonPlaceholder />

              ) : (

                <Archive currentUser={dbUser} />

              )}

            </div>

          ) : (

          <div className="space-y-4 animate-fade-in w-full">

            {/* Заголовок */}

            <div className="flex items-center justify-between w-full border-b border-white/5 pb-3">

              <h2 className="text-lg md:text-xl font-black text-[#c0ff00] tracking-wide flex items-center gap-2"><BookMarked size={20} />Свод данных</h2>

            </div>



            {/* Под-вкладки */}

            <div className="flex gap-3 pb-4">

              <button

                onClick={() => { setActiveSvodTab('laws'); setActiveDocument('none'); setIsEditing(false); }}

                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${

                  activeSvodTab === 'laws'

                    ? 'bg-[#c0ff00]/15 text-[#c0ff00] border border-[#c0ff00]/30'

                    : 'bg-[#14171c]/90 text-gray-400 border border-white/5 hover:border-white/10'

                }`}

              >

                <BookOpen size={16} className="inline mr-2" />

                Законы

              </button>

              <button

                onClick={() => setActiveSvodTab('archive')}

                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${

                  activeSvodTab === 'archive'

                    ? 'bg-[#c0ff00]/15 text-[#c0ff00] border border-[#c0ff00]/30'

                    : 'bg-[#14171c]/90 text-gray-400 border border-white/5 hover:border-white/10'

                }`}

              >

                <Library size={16} className="inline mr-2" />

                Архив

              </button>

            </div>



            {/* Контент под-вкладки */}

            {activeSvodTab === 'laws' ? (

              <>

                {activeDocument !== 'none' && canEditConstitution && !isEditing && <button onClick={() => setIsEditing(true)} className="fixed bottom-28 right-4 md:top-24 md:right-8 w-14 h-14 bg-[#14171c] border border-[#c0ff00]/25 rounded-full flex items-center justify-center text-gray-500 hover:text-[#c0ff00] hover:border-[#c0ff00]/50 active:scale-90 transition-all z-50 shadow-2xl"><Edit2 size={22} /></button>}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start w-full flex-grow mt-2">

                  <div className="flex flex-col gap-5 md:col-span-1 w-full">

                    <div onClick={() => { setActiveDocument('constitution'); setIsEditing(false); setSearchQuery(''); }} className={`p-6 rounded-[28px] border transition-all cursor-pointer relative overflow-hidden min-h-[110px] flex items-center group ${activeDocument === 'constitution' ? 'bg-[#c0ff00]/10 border-[#c0ff00]/30 text-[#c0ff00]' : 'bg-[#14171c]/90 border-white/5 text-white hover:border-white/15'}`}>

                      <div className="absolute right-0 top-0 bottom-0 w-[45%] opacity-15 group-hover:opacity-25 transition-all duration-500 bg-no-repeat bg-cover bg-right" style={{ backgroundImage: "url('/1000024917.png')", imageRendering: "pixelated" }} />

                      <h3 className="font-black text-lg relative z-10">Конституция</h3>

                    </div>

                    <div onClick={() => { setActiveDocument('commandments'); setIsEditing(false); setSearchQuery(''); }} className={`p-6 rounded-[28px] border transition-all cursor-pointer relative overflow-hidden min-h-[110px] flex items-center group ${activeDocument === 'commandments' ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'bg-[#14171c]/90 border-white/5 text-white hover:border-white/15'}`}>

                      <div className="absolute right-0 top-0 bottom-0 w-[45%] opacity-15 group-hover:opacity-25 transition-all duration-500 bg-no-repeat bg-cover bg-right" style={{ backgroundImage: "url('/zapovedi.gif')" }} />

                      <h3 className="font-black text-lg relative z-10">Заповеди дома</h3>

                    </div>

                  </div>

                  <div className="md:col-span-2 w-full">

                    {activeDocument === 'none' ? (

                      <div className="bg-[#14171c]/30 border border-white/5 rounded-[28px] p-12 text-center text-gray-600 font-mono text-xs flex flex-col items-center justify-center min-h-[400px]"><BookOpen size={36} className="text-gray-700 mb-3" /><span>ВЫБЕРИТЕ ДОКУМЕНТ ИЗ СПИСКА СЛЕВА</span></div>

                    ) : (

                      <div className="space-y-4 w-full">

                        {!isEditing && (

                          <div className="flex items-center gap-2 bg-[#14171c]/90 border border-white/10 rounded-full px-4 py-2.5 sticky top-24 z-20 backdrop-blur-md shadow-lg mb-4">

                            <Search size={16} className="text-gray-500 shrink-0" />

                            <input 

                              type="text" 

                              placeholder="Поиск по документу…" 

                              value={searchQuery} 

                              onChange={e => setSearchQuery(e.target.value)}

                              className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-500 min-w-0"

                            />

                            {totalMatches > 0 && (

                              <span className="text-xs font-mono font-bold text-[#c0ff00] shrink-0 tabular-nums">{activeMatchIndex + 1}/{totalMatches}</span>

                            )}

                            {totalMatches > 0 && (

                              <>

                                <button onClick={() => navigateSearch('prev')} className="p-1 text-gray-400 hover:text-white transition-colors active:scale-75"><ChevronUp size={16} /></button>

                                <button onClick={() => navigateSearch('next')} className="p-1 text-gray-400 hover:text-white transition-colors active:scale-75"><ChevronDown size={16} /></button>

                              </>

                            )}

                            {searchQuery && (

                              <button onClick={() => setSearchQuery('')} className="p-1 text-gray-500 hover:text-white transition-colors active:scale-75"><X size={14} /></button>

                            )}

                          </div>

                        )}

                        {isEditing ? <div ref={editorRef} contentEditable className="w-full min-h-[500px] bg-[#14171c]/90 border border-white/5 rounded-[28px] p-5 text-base text-gray-200 focus:outline-none shadow-inner prose prose-invert max-w-none pb-20" /> : <div ref={viewRef} className="bg-[#14171c]/90 border border-white/5 p-5 rounded-[28px] text-base leading-relaxed text-gray-300 prose prose-invert shadow-md break-words w-full" dangerouslySetInnerHTML={{ __html: highlightedHtml }} />}

                      </div>

                    )}

                  </div>

                </div>

              </>

            ) : (

              <Archive currentUser={dbUser} />

            )}

          </div>

          )}

          </>

        )}



        {activeTab === 'archive' && <Archive currentUser={dbUser} />}

        {activeTab === 'treasury' && (seasonEnded ? <SeasonPlaceholder /> : <Treasury currentUser={dbUser} />)}

        {activeTab === 'onelaunch' && <OneLaunchContent />}

        {activeTab === 'media' && <div className="w-full space-y-6"><MediaBlog currentUser={dbUser} onProfileClick={setSelectedCharacter} isCreatingPost={isCreatingPost} setIsCreatingPost={setIsCreatingPost} seasonName={currentSeasonName} /></div>}



        {activeTab === 'players' && (

          <>

          {seasonEnded ? (

            <SeasonPlaceholder />

          ) : (

          <div className="space-y-6 animate-fade-in w-full">

            <h2 className="text-lg md:text-xl font-black text-white tracking-wide flex items-center gap-2 px-1"><Users size={20} className="text-[#c0ff00]" />Игроки</h2>



            {/* Саб-табы */}

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">

              {(['characters', 'players'] as const).map(tab => (

                <button key={tab} onClick={() => setPlayersSubTab(tab)} className={`text-xs font-bold uppercase px-4 py-2 rounded-full whitespace-nowrap transition-all ${playersSubTab === tab ? 'bg-[#c0ff00]/20 text-[#c0ff00] border border-[#c0ff00]/30' : 'bg-white/5 text-gray-400 border border-white/5'}`}>

                  {tab === 'characters' && 'Персонажи'}

                  {tab === 'players' && 'Игроки'}

                </button>

              ))}

            </div>



            {/* --- Персонажи --- */}

            {playersSubTab === 'characters' && (

              <>

                {/* Мой персонаж */}

                {dbUser && (

                  <div className="space-y-2 w-full md:max-w-sm">

                    <div className="text-xs text-[#c0ff00] uppercase tracking-wider font-extrabold pl-1">Мой персонаж</div>

                    <div onClick={() => { setIsEditingProfile(false); setSelectedCharacter(dbUser); }} className={`p-4 rounded-[28px] border flex items-center space-x-4 transition-all duration-300 cursor-pointer shadow-xl w-full active:scale-95 ${isDead(dbUser) ? 'bg-[#050608] border-[#111316] grayscale' : 'bg-[#14171c]/90 border-[#c0ff00]/40'}`}>

                      <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-[#1c2026] border-2 border-[#c0ff00]"><img src={dbUser.avatar_url || ''} alt="avatar" className="w-full h-full object-cover" /></div>

                      <div className="flex-1 min-w-0">

                        <span className="text-base font-black truncate tracking-wide text-[#c0ff00]">{dbUser.rp_name}</span>

                        <div className="text-xs text-gray-400 truncate font-mono">{dbUser.mc_nickname}</div>

                        <div className="text-[11px] text-gray-400 font-medium mt-0.5 truncate">🏛️ {dbUser.party || 'Нет партии'}</div>

                        <div className="flex flex-wrap gap-1 mt-1.5">

                          {dbUser.roles?.map((role, i) => (

                            <span key={i} className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded border" style={{ backgroundColor: `${getRoleColor(role)}10`, color: getRoleColor(role), borderColor: `${getRoleColor(role)}20` }}>{role}</span>

                          ))}

                        </div>

                      </div>

                    </div>

                  </div>

                )}



                {/* Живые персонажи */}

                {(() => {

                  const alive = sortedPlayers.filter(p => !isDead(p));

                  if (alive.length === 0) return null;

                  return (

                    <div className="space-y-3 w-full">

                      <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold pl-1 flex items-center gap-1.5"><Swords size={14} className="text-[#c0ff00]" />Живые ({alive.length})</div>

                      <div className="grid grid-cols-1 gap-3 w-full md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                        {alive.map((player) => (

                          <div key={player.id} onClick={() => { setIsEditingProfile(false); loadPlayerCharacters(player.player_id); setSelectedCharacter(player); }} className="p-4 rounded-[28px] flex items-center space-x-4 transition-all duration-300 hover:scale-[1.03] cursor-pointer shadow-md w-full border bg-[#14171c]/90 border-white/5 hover:border-white/20">

                            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1c2026] border border-white/10 flex-shrink-0"><img src={player.avatar_url || ''} alt="avatar" className="w-full h-full object-cover" /></div>

                            <div className="flex-1 min-w-0">

                              <div className="text-sm font-black truncate tracking-wide text-white">{player.rp_name}</div>

                              <div className="text-xs text-gray-400 truncate font-mono">{player.mc_nickname}</div>

                              <div className="text-[11px] text-gray-500 font-medium mt-0.5 truncate">🏛️ {player.party || 'Нет партии'}</div>

                              <div className="flex flex-wrap gap-1 mt-1.5">

                                {player.roles?.map((role, i) => (

                                  <span key={i} className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded border" style={{ backgroundColor: `${getRoleColor(role)}10`, color: getRoleColor(role), borderColor: `${getRoleColor(role)}20` }}>{role}</span>

                                ))}

                              </div>

                            </div>

                          </div>

                        ))}

                      </div>

                    </div>

                  );

                })()}



                {/* Мёртвые персонажи */}

                {(() => {

                  const dead = sortedPlayers.filter(p => isDead(p));

                  if (dead.length === 0) return null;

                  return (

                    <div className="space-y-3 w-full">

                      <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold pl-1 flex items-center gap-1.5"><Skull size={14} />Мёртвые ({dead.length})</div>

                      <div className="grid grid-cols-1 gap-3 w-full md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                        {dead.map((player) => (

                          <div key={player.id} onClick={() => { setIsEditingProfile(false); loadPlayerCharacters(player.player_id); setSelectedCharacter(player); }} className="p-4 rounded-[28px] flex items-center space-x-4 transition-all duration-300 hover:scale-[1.03] cursor-pointer shadow-md w-full border bg-[#050608] border-[#111316] grayscale">

                            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1c2026] border border-gray-700 flex-shrink-0"><img src={player.avatar_url || ''} alt="avatar" className="w-full h-full object-cover" /></div>

                            <div className="flex-1 min-w-0">

                              <div className="text-sm font-black truncate tracking-wide text-gray-500 line-through">{player.rp_name}</div>

                              <div className="text-xs text-gray-600 truncate font-mono">{player.mc_nickname}</div>

                            </div>

                          </div>

                        ))}

                      </div>

                    </div>

                  );

                })()}

              </>

            )}



            {/* --- Игроки (профили) --- */}

            {playersSubTab === 'players' && (

              <div className="space-y-3 w-full">

                <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold pl-1">Minecraft-профили</div>

                <div className="grid grid-cols-1 gap-3 w-full md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                  {allPlayers.map((p: any) => (

                    <div key={p.id} onClick={async () => {

                      await loadPlayerCharacters(p.id);

                      const char = players.find(c => c.player_id === p.id);

                      setSelectedProfile(char || { id: p.id, player_id: p.id, rp_name: p.mc_nickname, mc_nickname: p.mc_nickname, avatar_url: p.avatar_url || '', roles: p.roles || [], party: 'Нет партии' } as any);

                    }} className="p-4 rounded-[28px] flex items-center space-x-4 transition-all duration-300 hover:scale-[1.03] cursor-pointer shadow-md w-full border bg-[#14171c]/90 border-white/5 hover:border-white/20">

                      <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1c2026] border border-white/10 flex-shrink-0 flex items-center justify-center">

                        {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : <User size={20} className="text-gray-600" />}

                      </div>

                      <div className="flex-1 min-w-0">

                        <div className="text-sm font-black truncate tracking-wide text-white">{p.mc_nickname}</div>

                      </div>

                    </div>

                  ))}

                  {allPlayers.length === 0 && <p className="col-span-full text-xs text-gray-500 text-center py-8">Нет профилей</p>}

                </div>

              </div>

            )}

          </div>

          )}

          </>

        )}



        {activeTab === 'admin' && isAdmin && (

          <div className="space-y-6 animate-fade-in w-full">

            <div className="flex items-center justify-between">

              <h2 className="text-xl font-black text-white flex items-center gap-2"><ShieldAlert size={20} className="text-[#c0ff00]" /> Админ-панель</h2>

            </div>



            {/* Саб-табы */}

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">

              {(['players', 'characters', 'roles', 'professions', 'guests', 'seasons'] as const).map(tab => (

                <button key={tab} onClick={() => setAdminSubTab(tab)} className={`text-xs font-bold uppercase px-4 py-2 rounded-full whitespace-nowrap transition-all ${adminSubTab === tab ? 'bg-[#c0ff00]/20 text-[#c0ff00] border border-[#c0ff00]/30' : 'bg-white/5 text-gray-400 border border-white/5'}`}>

                  {tab === 'players' && 'Профили'}

                  {tab === 'characters' && 'Персонажи'}

                  {tab === 'roles' && 'Роли'}

                  {tab === 'professions' && 'Профессии'}

                  {tab === 'guests' && 'Гости'}

                  {tab === 'seasons' && 'Сезоны'}

                </button>

              ))}

            </div>



            {/* --- Профили игроков --- */}

            {adminSubTab === 'players' && (

              <div className="space-y-4">

                <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">

                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider"><UserPlus size={16} /><span>Создать Minecraft-профиль</span></div>

                  <div className="grid grid-cols-2 gap-3">

                    <input type="text" placeholder="Minecraft ник *" value={addMcNickname} onChange={e => setAddMcNickname(e.target.value)} className="ui-input"/>

                    <input type="number" placeholder="Telegram ID" value={addTgId} onChange={e => setAddTgId(e.target.value)} className="ui-input"/>

                    <input type="text" placeholder="Telegram Username" value={addTgUsername} onChange={e => setAddTgUsername(e.target.value)} className="ui-input"/>

                    <label className="ui-input flex items-center gap-2 cursor-pointer overflow-hidden relative">

                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, setAddAvatarUrl, setIsUploadingAdminAvatar)} />

                      <Upload size={14} className={isUploadingAdminAvatar ? 'animate-bounce' : ''} />

                      <span className="text-xs text-gray-500 truncate">{isUploadingAdminAvatar ? 'Загрузка...' : addAvatarUrl ? 'Аватар выбран' : 'Загрузить аватар'}</span>

                    </label>

                  </div>

                  <button onClick={async () => {

                    const mcNick = addMcNickname.trim();

                    if (!mcNick) return;

                    const tgIdNum = addTgId ? parseInt(addTgId) : null;

                    const { data: existing } = await supabase.from('players').select('id').eq('mc_nickname', mcNick).limit(1);

                    if (existing && existing.length > 0) { alert('Игрок с таким ником уже существует!'); return; }

                    if (tgIdNum) {

                      const { data: tgExists } = await supabase.from('players').select('id').eq('tg_id', tgIdNum).limit(1);

                      if (tgExists && tgExists.length > 0) { alert('Этот Telegram ID уже привязан!'); return; }

                    }

                    const { error } = await supabase.from('players').insert({ mc_nickname: mcNick, tg_id: tgIdNum, tg_username: addTgUsername || '', avatar_url: addAvatarUrl || '' });

                    if (error) { alert(`Ошибка: ${error.message}`); return; }

                    setAddMcNickname(''); setAddTgId(''); setAddTgUsername(''); setAddAvatarUrl('');

                    loadAllPlayers();

                  }} className="ui-pill-btn w-full justify-center py-3"><Check size={16} /><span>Создать профиль</span></button>

                </div>



                <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 shadow-xl">

                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider mb-3"><Users size={16} /><span>Все профили ({allPlayers.length})</span></div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto">

                    {allPlayers.map((p: any) => (

                      <div key={p.id}>

                        {editingPlayerId === p.id ? (

                          <div className="bg-black/30 border border-[#c0ff00]/20 p-3 rounded-xl space-y-2">

                            <div className="grid grid-cols-2 gap-2">

                              <input type="text" placeholder="Minecraft ник" value={editPlayerData.mc_nickname} onChange={e => setEditPlayerData(prev => ({...prev, mc_nickname: e.target.value}))} className="ui-input text-xs" />

                              <input type="number" placeholder="Telegram ID" value={editPlayerData.tg_id} onChange={e => setEditPlayerData(prev => ({...prev, tg_id: e.target.value}))} className="ui-input text-xs" />

                              <input type="text" placeholder="TG Username" value={editPlayerData.tg_username} onChange={e => setEditPlayerData(prev => ({...prev, tg_username: e.target.value}))} className="ui-input text-xs" />

                              <label className="ui-input flex items-center gap-2 cursor-pointer overflow-hidden relative">

                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, (url) => setEditPlayerData(prev => ({...prev, avatar_url: url})), setIsUploadingAdminAvatar)} />

                                <Upload size={12} className={isUploadingAdminAvatar ? 'animate-bounce' : ''} />

                                <span className="text-[10px] text-gray-500 truncate">{editPlayerData.avatar_url ? '✓ Аватар' : 'Аватар'}</span>

                              </label>

                            </div>

                            <div className="flex gap-2">

                              <button onClick={async () => {

                                const { error } = await supabase.from('players').update(editPlayerData).eq('id', p.id);

                                if (error) { alert(`Ошибка: ${error.message}`); return; }

                                setEditingPlayerId(null);

                                loadAllPlayers();

                              }} className="ui-pill-btn flex-1 justify-center !bg-[#c0ff00] !text-black text-xs py-1.5"><Save size={12} /><span>Сохранить</span></button>

                              <button onClick={() => setEditingPlayerId(null)} className="ui-pill-btn px-4 !bg-white/5 text-xs py-1.5"><X size={12} /></button>

                            </div>

                          </div>

                        ) : (

                          <div className="flex items-center justify-between bg-black/20 border border-white/5 p-3 rounded-xl group">

                            <div className="flex items-center gap-3 min-w-0">

                              <div className="w-9 h-9 rounded-full bg-[#1c2026] border border-white/10 overflow-hidden flex-shrink-0">

                                {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : <User size={14} className="m-auto text-gray-600" />}

                              </div>

                              <div className="min-w-0">

                                <div className="text-sm font-bold text-white truncate">{p.mc_nickname}</div>

                                <div className="text-[10px] text-gray-500">{p.tg_id ? `TG: ${p.tg_id}` : 'Без TG'} {p.tg_username ? `@${p.tg_username}` : ''}</div>

                              </div>

                            </div>

                            <button onClick={() => { setEditingPlayerId(p.id); setEditPlayerData({ mc_nickname: p.mc_nickname, tg_id: p.tg_id?.toString() || '', tg_username: p.tg_username || '', avatar_url: p.avatar_url || '' }); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white/5 rounded-full text-gray-400 hover:text-[#c0ff00]"><Edit2 size={14} /></button>

                          </div>

                        )}

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

                <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">

                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider"><UserPlus size={16} /><span>Создать персонажа для сезона</span></div>

                  <div className="grid grid-cols-2 gap-3">

                    <input type="text" placeholder="Minecraft ник игрока *" value={addMcNickname} onChange={e => setAddMcNickname(e.target.value)} className="ui-input"/>

                    <input type="text" placeholder="RP-имя персонажа *" value={addRpName} onChange={e => setAddRpName(e.target.value)} className="ui-input"/>

                    <input type="text" placeholder="Партия" value={addParty} onChange={e => setAddParty(e.target.value)} className="ui-input"/>

                    <label className="ui-input flex items-center gap-2 cursor-pointer overflow-hidden relative">

                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, setAddAvatarUrl, setIsUploadingAdminAvatar)} />

                      <Upload size={14} className={isUploadingAdminAvatar ? 'animate-bounce' : ''} />

                      <span className="text-xs text-gray-500 truncate">{isUploadingAdminAvatar ? 'Загрузка...' : addAvatarUrl ? 'Аватар выбран' : 'Загрузить аватар'}</span>

                    </label>

                  </div>

                  <div className="space-y-2">

                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Профессии персонажа</div>

                    <div className="flex flex-wrap gap-2">

                      {professions.map(prof => (

                        <button key={prof.name} onClick={() => { setAddProfessions(prev => prev.includes(prof.name) ? prev.filter(r => r !== prof.name) : [...prev, prof.name]); }} className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${addProfessions.includes(prof.name) ? 'border-current' : 'border-white/10 opacity-40'}`} style={{ color: prof.color, backgroundColor: addProfessions.includes(prof.name) ? `${prof.color}20` : 'transparent' }}>{prof.name.toUpperCase()}</button>

                      ))}

                      {professions.length === 0 && <span className="text-xs text-gray-500">Нет профессий</span>}

                    </div>

                  </div>

                  <button onClick={async () => {

                    if (!addMcNickname.trim() || !addRpName.trim()) return;

                    const { data: playerData } = await supabase.from('players').select('id').eq('mc_nickname', addMcNickname.trim()).limit(1);

                    const player = playerData && playerData.length > 0 ? playerData[0] : null;

                    if (!player) { alert('Игрок не найден. Сначала создай профиль.'); return; }

                    const { data: existingChars } = await supabase.from('characters').select('professions').eq('player_id', player.id).order('created_at', { ascending: false }).limit(1);
                    const inheritedProfs = existingChars?.[0]?.professions || [];
                    const finalProfs = addProfessions.length > 0 ? Array.from(new Set([...inheritedProfs, ...addProfessions])) : inheritedProfs;

                    const { error } = await supabase.from('characters').insert({ player_id: player.id, mc_nickname: addMcNickname.trim(), rp_name: addRpName.trim(), party: addParty || 'Нет партии', professions: finalProfs, avatar_url: addAvatarUrl || '', season: currentSeasonName, status: 'alive' });

                    if (error) { alert(`Ошибка: ${error.message}`); return; }

                    setAddMcNickname(''); setAddRpName(''); setAddParty('Нет партии'); setAddProfessions([]); setAddAvatarUrl('');

                    loadPlayers();

                  }} className="ui-pill-btn w-full justify-center py-3"><Plus size={16} /><span>Создать персонажа</span></button>

                </div>



                <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 shadow-xl">

                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider mb-3"><Users size={16} /><span>Персонажи сезона ({players.length})</span></div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto">

                    {players.map((c: Player) => (

                      <div key={c.id}>

                        {editingCharId === c.id ? (

                          <div className="bg-black/30 border border-[#c0ff00]/20 p-3 rounded-xl space-y-2">

                            <div className="grid grid-cols-2 gap-2">

                              <input type="text" placeholder="RP-имя" value={editCharData.rp_name} onChange={e => setEditCharData(prev => ({...prev, rp_name: e.target.value}))} className="ui-input text-xs" />

                              <input type="text" placeholder="Партия" value={editCharData.party} onChange={e => setEditCharData(prev => ({...prev, party: e.target.value}))} className="ui-input text-xs" />

                              <label className="ui-input flex items-center gap-2 cursor-pointer overflow-hidden relative col-span-2">

                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, (url) => setEditCharData(prev => ({...prev, avatar_url: url})), setIsUploadingAdminAvatar)} />

                                <Upload size={12} className={isUploadingAdminAvatar ? 'animate-bounce' : ''} />

                                <span className="text-[10px] text-gray-500 truncate">{editCharData.avatar_url ? '✓ Аватар' : 'Загрузить аватар'}</span>

                              </label>

                            </div>

                            <div className="space-y-1.5">

                              <div className="text-[9px] text-gray-500 uppercase">Профессии</div>

                              <div className="flex flex-wrap gap-1.5">

                                {professions.map(prof => (

                                  <button key={prof.name} onClick={() => { setEditCharData(prev => ({...prev, professions: prev.professions.includes(prof.name) ? prev.professions.filter(r => r !== prof.name) : [...prev.professions, prof.name]})); }} className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-all ${editCharData.professions.includes(prof.name) ? 'border-current' : 'border-white/10 opacity-40'}`} style={{ color: prof.color, backgroundColor: editCharData.professions.includes(prof.name) ? `${prof.color}20` : 'transparent' }}>{prof.name.toUpperCase()}</button>

                                ))}

                                {professions.length === 0 && <span className="text-[10px] text-gray-500">Нет профессий</span>}

                              </div>

                            </div>

                            <div className="flex gap-2">

                              <button onClick={async () => {

                                const { error } = await supabase.from('characters').update({ rp_name: editCharData.rp_name, party: editCharData.party, avatar_url: editCharData.avatar_url, professions: editCharData.professions }).eq('id', c.id);

                                if (error) { alert(`Ошибка: ${error.message}`); return; }

                                setEditingCharId(null);

                                loadPlayers();

                              }} className="ui-pill-btn flex-1 justify-center !bg-[#c0ff00] !text-black text-xs py-1.5"><Save size={12} /><span>Сохранить</span></button>

                              <button onClick={() => setEditingCharId(null)} className="ui-pill-btn px-4 !bg-white/5 text-xs py-1.5"><X size={12} /></button>

                            </div>

                          </div>

                        ) : (

                          <div className="flex items-center justify-between bg-black/20 border border-white/5 p-3 rounded-xl group">

                            <div className="flex items-center gap-3 min-w-0">

                              <div className="w-9 h-9 rounded-full bg-[#1c2026] border border-white/10 overflow-hidden flex-shrink-0">

                                {c.avatar_url ? <img src={c.avatar_url} className="w-full h-full object-cover" /> : <User size={14} className="m-auto text-gray-600" />}

                              </div>

                              <div className="min-w-0">

                                <div className="text-sm font-bold text-white truncate">{c.rp_name}</div>

                                <div className="text-[10px] text-gray-500">{c.mc_nickname} · {c.party}</div>

                              </div>

                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">

                              <div className="flex gap-1">

                                {c.professions?.slice(0, 2).map((p, i) => (

                                  <span key={i} className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${getProfessionColor(p)}20`, color: getProfessionColor(p) }}>{p}</span>

                                ))}

                              </div>

                              <button onClick={() => { setEditingCharId(c.id); setEditCharData({ rp_name: c.rp_name, party: c.party || 'Нет партии', avatar_url: c.avatar_url || '', professions: c.professions || [] }); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white/5 rounded-full text-gray-400 hover:text-[#c0ff00]"><Edit2 size={14} /></button>

                              <button onClick={(e) => { e.stopPropagation(); deleteCharacter(c.id, c.rp_name); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white/5 rounded-full text-gray-400 hover:text-red-400"><Trash2 size={14} /></button>

                            </div>

                          </div>

                        )}

                      </div>

                    ))}

                    {players.length === 0 && <p className="text-xs text-gray-500 text-center py-4">Нет персонажей</p>}

                  </div>

                </div>

              </div>

            )}



            {/* --- Роли --- */}

            {adminSubTab === 'roles' && (

              <div className="space-y-4">

                <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">

                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider"><ShieldCheck size={16} /><span>Создать роль</span></div>

                  <div className="flex gap-2 items-end">

                    <input type="text" placeholder="Название роли" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} className="ui-input flex-1"/>

                    <input type="color" value={newRoleColor} onChange={e => setNewRoleColor(e.target.value)} className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer"/>

                  </div>

                  <label className="flex items-center gap-2 text-xs text-gray-400">

                    <input type="checkbox" checked={newRolePerm} onChange={e => setNewRolePerm(e.target.checked)} className="accent-[#c0ff00]"/>

                    Может редактировать конституцию

                  </label>

                  <button onClick={handleCreateRole} className="ui-pill-btn w-full justify-center py-3"><UserPlus size={14} /><span>Создать роль</span></button>

                </div>



                <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 shadow-xl">

                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider mb-3"><ShieldCheck size={16} /><span>Все роли</span></div>

                  <div className="space-y-2">

                    {customRoles.map((role) => (

                      <div key={role.id} className="flex items-center gap-3 bg-black/20 border border-white/5 p-3 rounded-xl">

                        <input type="color" value={role.color} onChange={e => handleRoleChange(role.id!, 'color', e.target.value)} onBlur={() => saveRoleToDb(role)} className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer flex-shrink-0"/>

                        <input type="text" value={role.name} onChange={e => handleRoleChange(role.id!, 'name', e.target.value)} onBlur={() => saveRoleToDb(role)} className="bg-transparent text-sm font-bold flex-1 min-w-0" style={{ color: role.color }}/>

                        <label className="flex items-center gap-1 text-[10px] text-gray-500 flex-shrink-0">

                          <input type="checkbox" checked={role.canEditConstitution} onChange={e => { handleRoleChange(role.id!, 'canEditConstitution', e.target.checked); saveRoleToDb({...role, canEditConstitution: e.target.checked}); }} className="accent-[#c0ff00]"/>

                          Конст.

                        </label>

                      </div>

                    ))}

                  </div>

                </div>

              </div>

            )}



            {/* --- Профессии --- */}

            {adminSubTab === 'professions' && (

              <div className="space-y-4">

                <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">

                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider"><ShieldCheck size={16} /><span>Создать профессию</span></div>

                  <div className="flex gap-2 items-end">

                    <input type="text" placeholder="Название профессии" value={newProfessionName} onChange={e => setNewProfessionName(e.target.value)} className="ui-input flex-1"/>

                    <input type="color" value={newProfessionColor} onChange={e => setNewProfessionColor(e.target.value)} className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer"/>

                  </div>

                  <button onClick={async () => {

                    if (!newProfessionName.trim()) return;

                    const { error } = await supabase.from('professions').insert({ name: newProfessionName.toLowerCase(), color: newProfessionColor });

                    if (!error) { setNewProfessionName(''); loadProfessions(); }

                    else alert('Ошибка создания профессии');

                  }} className="ui-pill-btn w-full justify-center py-3"><AnvilIcon size={14} /><span>Создать профессию</span></button>

                </div>



                <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 shadow-xl">

                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider mb-3"><ShieldCheck size={16} /><span>Все профессии</span></div>

                  <div className="space-y-2">

                    {professions.map((prof) => (

                      <div key={prof.id} className="flex items-center gap-3 bg-black/20 border border-white/5 p-3 rounded-xl">

                        <input type="color" value={prof.color} onChange={e => { setProfessions(ps => ps.map(p => p.id === prof.id ? { ...p, color: e.target.value } : p)); }} onBlur={async () => { if (!prof.id) return; await supabase.from('professions').update({ color: prof.color }).eq('id', prof.id); }} className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer flex-shrink-0"/>

                        <input type="text" value={prof.name} onChange={e => { setProfessions(ps => ps.map(p => p.id === prof.id ? { ...p, name: e.target.value } : p)); }} onBlur={async () => { if (!prof.id) return; await supabase.from('professions').update({ name: prof.name }).eq('id', prof.id); }} className="bg-transparent text-sm font-bold flex-1 min-w-0" style={{ color: prof.color }}/>

                      </div>

                    ))}

                    {professions.length === 0 && <p className="text-xs text-gray-500 text-center py-4">Нет профессий</p>}

                  </div>

                </div>

              </div>

            )}





            {/* --- Гости --- */}

            {adminSubTab === 'guests' && (

              <div className="space-y-4">

                <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">

                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider"><User size={16} /><span>Добавить гостя</span></div>

                  <div className="flex gap-2">

                    <input type="number" placeholder="Telegram ID" value={guestTgId} onChange={e => setGuestTgId(e.target.value)} className="ui-input flex-1"/>

                    <button onClick={handleAddGuest} disabled={guestLoading || !guestTgId} className="ui-pill-btn shrink-0 px-4 disabled:opacity-30"><Plus size={16} /></button>

                  </div>

                  {guestList.length > 0 && (

                    <div className="space-y-1.5 max-h-40 overflow-y-auto">

                      {guestList.map(g => (

                        <div key={g.tg_id} className="flex items-center justify-between p-2.5 bg-black/10 rounded-xl border border-white/5 text-xs">

                          <div>

                            <span className="text-white font-bold">ID: {g.tg_id}</span>

                            <span className="text-gray-500 ml-2">{new Date(g.created_at).toLocaleDateString('ru-RU')}</span>

                          </div>

                          <button onClick={() => handleRemoveGuest(g.tg_id)} className="text-gray-500 hover:text-red-400 transition-colors p-1"><X size={14} /></button>

                        </div>

                      ))}

                    </div>

                  )}

                </div>

              </div>

            )}



            {/* --- Сезоны --- */}

            {adminSubTab === 'seasons' && (

              <div className="space-y-4">

                <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">

                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider"><Calendar size={16} /><span>Управление сезонами</span></div>

                  <div className="text-sm text-gray-400">Текущий: <span className="text-[#c0ff00] font-bold">{currentSeasonName}</span> {seasonEnded ? <span className="text-red-400 font-bold ml-2">• Завершён</span> : <span className="text-[#c0ff00] font-bold ml-2">• Активен</span>}</div>

                  {!seasonEnded && (

                    <button onClick={handleEndSeason} disabled={seasonLoading} className="ui-pill-btn w-full justify-center !bg-red-500/20 !border-red-500/30 !text-red-400 hover:!bg-red-500/30 disabled:opacity-30"><Flag size={14} /><span className="text-[11px] font-bold">Завершить сезон</span></button>

                  )}

                  {seasonEnded && (

                    <>

                      <button onClick={handleUndoEndSeason} disabled={seasonLoading} className="ui-pill-btn w-full justify-center !bg-[#c0ff00]/20 !border-[#c0ff00]/30 !text-[#c0ff00] hover:!bg-[#c0ff00]/30 disabled:opacity-30"><RotateCcw size={14} /><span className="text-[11px] font-bold">Восстановить сезон</span></button>

                      <div className="space-y-2">

                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500"><Server size={12} className="text-[#c0ff00]" /><span>Exaroton Server ID</span></div>

                        <input type="text" placeholder="e.g. abc123def456" value={newSeasonServerId} onChange={e => setNewSeasonServerId(e.target.value)} className="ui-input text-xs"/>

                        <button onClick={handleStartNewSeason} disabled={seasonLoading} className="ui-pill-btn w-full justify-center !bg-[#c0ff00] !text-black font-bold disabled:opacity-30"><Play size={14} /><span>Начать новый сезон</span></button>

                      </div>

                    </>

                  )}

                </div>



                {pastSeasons.length > 0 && (

                  <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 shadow-xl">

                    <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider mb-3"><Library size={16} /><span>Архив сезонов</span></div>

                    <div className="space-y-2">

                      {pastSeasons.map(s => (

                        <div key={s.id} className="flex items-center justify-between p-3 bg-black/20 rounded-[18px] border border-white/5">

                          <div className="text-sm">

                            <span className="text-white font-bold">Сезон #{s.season_number}</span>

                            <span className="text-gray-500 ml-2">{s.days_count} дн.</span>

                            <span className="text-gray-600 ml-2 text-[11px]">{new Date(s.end_date).toLocaleDateString('ru-RU')}</span>

                          </div>

                          <div className="flex gap-1.5">

                            <button onClick={() => handleRestoreSeason(s.id, s.season_number)} disabled={seasonLoading} className="ui-pill-btn !bg-[#c0ff00]/10 !border-[#c0ff00]/20 !text-[#c0ff00] hover:!bg-[#c0ff00]/20 disabled:opacity-30 px-3 py-1.5"><RotateCcw size={12} /></button>

                            <button onClick={() => handleDeleteSeason(s.id, s.season_number)} disabled={seasonLoading} className="ui-pill-btn !bg-red-500/10 !border-red-500/20 !text-red-400 hover:!bg-red-500/20 disabled:opacity-30 px-3 py-1.5"><X size={12} /></button>

                          </div>

                        </div>

                      ))}

                    </div>

                  </div>

                )}

              </div>

            )}

          </div>

        )}

      </main>



      {/* ПК САЙДБАР */}

      <aside className={`hidden md:flex flex-col items-center gap-3 fixed left-6 top-1/2 -translate-y-1/2 z-50 transition-all duration-500 ${showToolbar || isCreatingPost ? 'opacity-0 -translate-x-32 pointer-events-none' : 'opacity-100 translate-x-0'}`}>

        {dbUser && (

          <button onClick={() => { setIsEditingProfile(false); setSelectedCharacter(dbUser); }} className="group relative w-[72px] h-[72px] bg-[#14171c]/70 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center hover:border-[#c0ff00]/40 transition-all shadow-2xl hover:scale-105 z-50">

            <div className="w-[56px] h-[56px] rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#c0ff00]/50 transition-all"><img src={dbUser.avatar_url || ''} className="w-full h-full object-cover" alt="me" /></div>

          </button>

        )}



        {/* Pill с вкладками */}

        <nav className={`bg-[#14171c]/70 backdrop-blur-xl border border-white/10 rounded-[36px] shadow-2xl flex flex-col items-center gap-8 relative transition-all duration-300 ${seasonEnded ? 'w-[72px] py-4 px-1 gap-6' : 'w-[72px] py-6 px-1'}`}>

          

          <button onClick={() => handleTabChange('profile')} className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 ${activeTab === 'profile' ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-white'}`}>

            <HomeIcon size={23} />

            <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">{seasonEnded ? 'Главная' : 'Главная'}</span>

          </button>



          {seasonEnded ? (

            <button onClick={() => handleTabChange('archive')} className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 ${activeTab === 'archive' ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-white'}`}>

              <Library size={23} />

              <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">Архив</span>

            </button>

          ) : (

            <>

              <button onClick={() => handleTabChange('media')} className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 ${activeTab === 'media' ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-white'}`}>

                <Newspaper size={23} />

                <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">Медиа</span>

              </button>



              <button onClick={() => handleTabChange('svod')} className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 ${activeTab === 'svod' ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-white'}`}>

                <BookMarked size={23} />

                <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">Свод</span>

              </button>



              <button onClick={() => handleTabChange('treasury')} className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 ${activeTab === 'treasury' ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-white'}`}>

                <Landmark size={23} />

                <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">Казна</span>

              </button>

            </>

          )}

        </nav>



        {/* Кружок OneLaunch — под пилем, когда сезон завершён */}

        {seasonEnded && (

        <button

          onClick={() => handleTabChange('onelaunch')}

          className={`group relative w-[72px] h-[72px] bg-[#14171c]/70 backdrop-blur-xl border rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 ${

            activeTab === 'onelaunch'

              ? 'border-[#c0ff00]/40 text-[#c0ff00]'

              : 'border-white/10 text-gray-500 hover:text-white hover:border-white/20'

          }`}

        >

          <Download size={23} />

          <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">One Launch</span>

        </button>

        )}



        {/* Кружок Игроки — под пилем, идеальный круг */}

        {!seasonEnded && (

        <button

          onClick={() => handleTabChange('players')}

          className={`group relative w-[72px] h-[72px] bg-[#14171c]/70 backdrop-blur-xl border rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 ${

            activeTab === 'players' || selectedCharacter || selectedProfile

              ? 'border-[#c0ff00]/40 text-[#c0ff00]'

              : 'border-white/10 text-gray-500 hover:text-white hover:border-white/20'

          }`}

        >

          <Users size={23} />

          <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">Игроки</span>

        </button>

        )}

      </aside>



      {/* МОБИЛЬНЫЙ ТАББАР */}

      <div className={`md:hidden fixed bottom-6 left-4 right-4 z-50 flex items-center gap-3 transition-all duration-500 ${showToolbar || isCreatingPost ? 'opacity-0 translate-y-16 pointer-events-none' : 'opacity-100 translate-y-0'}`}>

        {seasonEnded && <div className="flex-1" />}

        <nav className={`bg-[#14171c]/90 backdrop-blur-xl border border-white/10 py-4 rounded-full shadow-2xl transition-all duration-300 ${seasonEnded ? 'px-10' : 'flex-1'}`}>

          <div className={`flex items-center px-2 ${seasonEnded ? 'gap-10' : 'w-full justify-around'}`}>

            <button onClick={() => handleTabChange('profile')} className={`flex flex-col items-center justify-center transition-all duration-300 ${activeTab === 'profile' && !selectedCharacter ? 'text-[#c0ff00]' : 'text-gray-500'}`}>

              <HomeIcon size={22} />

              <span className="text-[10px] font-bold mt-1 tracking-wide">Главная</span>

            </button>

            {seasonEnded ? (

              <button onClick={() => handleTabChange('archive')} className={`flex flex-col items-center justify-center transition-all duration-300 ${activeTab === 'archive' ? 'text-[#c0ff00]' : 'text-gray-500'}`}>

                <Library size={22} />

                <span className="text-[10px] font-bold mt-1 tracking-wide">Архив</span>

              </button>

            ) : (

              <>

                <button onClick={() => handleTabChange('media')} className={`flex flex-col items-center justify-center transition-all duration-300 ${activeTab === 'media' ? 'text-[#c0ff00]' : 'text-gray-500'}`}>

                  <Newspaper size={22} />

                  <span className="text-[10px] font-bold mt-1 tracking-wide">Медиа</span>

                </button>

                <button onClick={() => handleTabChange('svod')} className={`flex flex-col items-center justify-center transition-all duration-300 ${activeTab === 'svod' ? 'text-[#c0ff00]' : 'text-gray-500'}`}>

                  <BookMarked size={22} />

                  <span className="text-[10px] font-bold mt-1 tracking-wide">Свод</span>

                </button>

                <button onClick={() => handleTabChange('treasury')} className={`flex flex-col items-center justify-center transition-all duration-300 ${activeTab === 'treasury' ? 'text-[#c0ff00]' : 'text-gray-500'}`}>

                  <Landmark size={22} />

                  <span className="text-[10px] font-bold mt-1 tracking-wide">Казна</span>

                </button>

              </>

            )}

          </div>

        </nav>



        {/* Кружок Игроки справа — идеальный круг как в Монобанк */}

        {!seasonEnded && (

        <button

          onClick={() => handleTabChange('players')}

          className={`shrink-0 w-[68px] h-[68px] bg-[#14171c]/90 backdrop-blur-xl border rounded-full flex flex-col items-center justify-center gap-1 shadow-2xl transition-all active:scale-90 ${

            activeTab === 'players' || selectedCharacter || selectedProfile

              ? 'border-[#c0ff00]/40 text-[#c0ff00]'

              : 'border-white/10 text-gray-500'

          }`}

        >

          <Users size={22} />

          <span className="text-[10px] font-bold tracking-wide">Игроки</span>

        </button>

        )}



        {/* Кружок OneLaunch справа — при завершённом сезоне */}

        {seasonEnded && (

        <div className="flex-1 flex justify-end">

        <button

          onClick={() => handleTabChange('onelaunch')}

          className={`shrink-0 w-[68px] h-[68px] bg-[#14171c]/90 backdrop-blur-xl border rounded-full flex flex-col items-center justify-center gap-1 shadow-2xl transition-all active:scale-90 ${

            activeTab === 'onelaunch'

              ? 'border-[#c0ff00]/40 text-[#c0ff00]'

              : 'border-white/10 text-gray-500'

          }`}

        >

          <Download size={22} />

          <span className="text-[10px] font-bold tracking-wide leading-tight text-center">One<br/>Launch</span>

        </button>

        </div>

        )}

      </div>



      {/* Мобильная FAB — создание статьи */}

      {activeTab === 'media' && !seasonEnded && dbUser && !dbUser?.roles?.includes('guest') && (

        <button 

          onClick={() => router.push('/media/editor')} 

          className="md:hidden fixed bottom-28 right-4 w-14 h-14 bg-[#c0ff00] text-black rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-90 z-50"

        >

          <Plus size={28} />

        </button>

      )}



      <style jsx global>{`

        .prose, .prose * { word-break: break-word !important; overflow-wrap: break-word !important; max-w-full !important; white-space: pre-wrap !important; }

        .prose h1, [contenteditable] h1 { font-size: 1.25rem !important; font-weight: 800 !important; color: #ffffff !important; margin-top: 1.2rem !important; margin-bottom: 0.5rem !important; line-height: 1.2 !important; }

        .prose h2, [contenteditable] h2 { font-size: 1.1rem !important; font-weight: 800 !important; color: #c0ff00 !important; margin-top: 1rem !important; margin-bottom: 0.4rem !important; line-height: 1.2 !important; }

        .prose p { margin-bottom: 0.75rem; color: #d1d5db !important; }

        [contenteditable]:empty:before { content: attr(data-placeholder); color: #4b5563; cursor: text; }

        .ui-input { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 10px 14px; font-size: 13px; color: #fff; outline: none; transition: all 0.2s; box-sizing: border-box; }

        .ui-input:focus { border-color: rgba(192,255,0,0.4); background: rgba(255,255,255,0.08); }

        .ui-input::placeholder { color: rgba(255,255,255,0.25); }

        .ui-pill-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 9999px; font-size: 13px; font-weight: 700; transition: all 0.2s; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #fff; cursor: pointer; }

        .ui-pill-btn:hover { border-color: rgba(192,255,0,0.3); }

        .ui-pill-btn:active { transform: scale(0.96); }

        .no-scrollbar::-webkit-scrollbar { display: none; }

        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

      `}</style>

    </div>

  );

}

