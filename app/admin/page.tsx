'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { addGuest, removeGuest, getGuests } from '../../lib/guests';
import {
  ArrowLeft, ShieldAlert, Users, Folder, Calendar, Package,
  User, UserPlus, ShieldCheck, Edit2, Save, X, Plus, Upload,
  Check, Play, Flag, RotateCcw, Library, Server as ServerIcon, Trash2,
  Home, ChevronRight, FolderOpen, File, Download, RefreshCw,
  MoreVertical, FolderPlus, UploadCloud
} from 'lucide-react';

const AnvilIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7 10H6a4 4 0 0 1-4-4 1 1 0 0 1 1-1h4" />
    <path d="M7 5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1" />
    <path d="M17 10h1a4 4 0 0 0 4-4 1 1 0 0 0-1-1h-4" />
    <path d="M9 12v5" />
    <path d="M15 12v5" />
    <path d="M5 20a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3 1 1 0 0 1-1 1H6a1 1 0 0 1-1-1Z" />
  </svg>
);

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

async function uploadFile(event: React.ChangeEvent<HTMLInputElement>, setUrl: (url: string) => void, setLoading: (v: boolean) => void) {
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

// --- Types ---
type MainTab = 'home' | 'players' | 'server';
type PlayersSubTab = 'profiles' | 'characters' | 'professions' | 'roles' | 'guests';
type ServerSubTab = 'seasons' | 'modpack';

export default function AdminPage() {
  const router = useRouter();

  // --- Tabs ---
  const [mainTab, setMainTab] = useState<MainTab>('home');
  const [playersSubTab, setPlayersSubTab] = useState<PlayersSubTab>('profiles');
  const [serverSubTab, setServerSubTab] = useState<ServerSubTab>('seasons');

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
  const [editPlayerData, setEditPlayerData] = useState({ mc_nickname: '', tg_id: '', tg_username: '', avatar_url: '', tg_id_2: '', roles: [] as string[] });

  // --- Form: Characters ---
  const [addRpName, setAddRpName] = useState('');
  const [addParty, setAddParty] = useState('');
  const [addProfessions, setAddProfessions] = useState<string[]>([]);
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [editCharData, setEditCharData] = useState({ rp_name: '', party: 'Нет партии', avatar_url: '', professions: [] as string[] });

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

  // --- Form: Seasons ---
  const [newSeasonServerId, setNewSeasonServerId] = useState('');

  // --- R2 Modpack browser ---
  const [r2Path, setR2Path] = useState('');
  const [r2Items, setR2Items] = useState<{key:string;name:string;type:'folder'|'file';size?:number;lastModified?:string}[]>([]);
  const [r2Loading, setR2Loading] = useState(false);
  const [r2Error, setR2Error] = useState('');
  const [r2MenuOpen, setR2MenuOpen] = useState<string | null>(null);
  const [r2NewFolderName, setR2NewFolderName] = useState('');
  const [r2ShowNewFolder, setR2ShowNewFolder] = useState(false);

  // --- Upload overlay ---
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'merge' | 'replace'>('merge');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadProcessing, setUploadProcessing] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadDragOver, setUploadDragOver] = useState(false);
  const uploadFileRef = useRef<HTMLInputElement>(null);

  // --- Helpers ---
  const getProfessionColor = (name: string) => {
    const found = professions.find(p => p.name.toLowerCase() === name.toLowerCase());
    return found ? found.color : '#888888';
  };

  // --- Load season state ---
  const loadSeasonState = async () => {
    const { getSeasonState, getAllPastSeasons } = await import('../../lib/season');
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
    const { data } = await supabase.from('characters').select('*').eq('season', currentSeasonName).order('rp_name');
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
    const { endSeason, getLastEndedSeason } = await import('../../lib/season');
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
    const { undoEndSeason } = await import('../../lib/season');
    const ok = await undoEndSeason();
    if (ok) { setSeasonEnded(false); loadSeasonState(); }
    else alert('Ошибка отмены завершения');
    setSeasonLoading(false);
  };

  const handleStartNewSeason = async (serverId?: string) => {
    const nextNum = (pastSeasons.length > 0 ? Math.max(...pastSeasons.map(s => s.season_number)) : currentSeasonNum) + 1;
    if (!confirm('Начать новый сезон #' + nextNum + '?')) return;
    setSeasonLoading(true);
    const { startNewSeason } = await import('../../lib/season');
    const ok = await startNewSeason(serverId || undefined);
    if (ok) { setSeasonEnded(false); loadSeasonState(); loadPlayersData(); }
    else alert('Ошибка создания нового сезона');
    setSeasonLoading(false);
  };

  const handleRestoreSeason = async (id: number, num: number) => {
    if (!confirm('Восстановить сезон #' + num + '?')) return;
    setSeasonLoading(true);
    const { restorePastSeason } = await import('../../lib/season');
    const ok = await restorePastSeason(id);
    if (ok) { setSeasonEnded(false); loadSeasonState(); }
    else alert('Ошибка восстановления сезона');
    setSeasonLoading(false);
  };

  const handleDeleteSeason = async (id: number, num: number) => {
    if (!confirm('Удалить сезон #' + num + ' навсегда?')) return;
    setSeasonLoading(true);
    const { deletePastSeason } = await import('../../lib/season');
    const ok = await deletePastSeason(id);
    if (ok) loadSeasonState();
    else alert('Ошибка удаления сезона');
    setSeasonLoading(false);
  };

  // --- Role operations ---
  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    const { error } = await supabase.from('roles').insert({
      name: newRoleName.toLowerCase(), color: newRoleColor, can_edit_constitution: newRolePerm
    });
    if (error) { alert('Ошибка: ' + error.message); return; }
    setNewRoleName(''); loadCustomRoles();
  };

  // --- Guest operations ---
  const handleAddGuest = async () => {
    const tgId = parseInt(guestTgId);
    if (!tgId) return;
    setGuestLoading(true);
    const ok = await addGuest(tgId, 'Админ');
    if (ok) { setGuestTgId(''); loadGuestsData(); }
    else alert('Ошибка добавления гостя');
    setGuestLoading(false);
  };

  const handleRemoveGuest = async (tgId: number) => {
    const ok = await removeGuest(tgId);
    if (ok) loadGuestsData();
    else alert('Ошибка удаления гостя');
  };

  // --- R2 modpack browser ---
  const loadR2Items = async (prefix?: string) => {
    const path = prefix !== undefined ? prefix : r2Path;
    setR2Loading(true);
    setR2Error('');
    try {
      const res = await fetch('/api/r2-browser?prefix=' + encodeURIComponent(path));
      const data = await res.json();
      if (data.error) { setR2Error(data.error); setR2Items([]); }
      else setR2Items(data.items || []);
    } catch (e: any) {
      setR2Error(e.message || 'Ошибка загрузки');
    }
    setR2Loading(false);
  };

  useEffect(() => {
    if (serverSubTab === 'modpack') {
      const initialPath = 'onehouse-pack-v1/';
      setR2Path(initialPath);
      loadR2Items(initialPath);
    }
  }, [serverSubTab]);

  const navigateR2 = (folder: string) => {
    const newPath = r2Path + folder + '/';
    setR2Path(newPath);
    loadR2Items(newPath);
  };

  const navigateR2Up = () => {
    if (!r2Path) return;
    const parts = r2Path.split('/').filter(Boolean);
    parts.pop();
    const newPath = parts.length > 0 ? parts.join('/') + '/' : '';
    setR2Path(newPath);
    loadR2Items(newPath);
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDeleteR2 = async (key: string, type: 'file' | 'folder') => {
    const label = type === 'folder' ? 'папку' : 'файл';
    if (!confirm('Удалить ' + label + '?')) return;
    try {
      const res = await fetch('/api/r2-browser?key=' + encodeURIComponent(key) + '&type=' + type, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setR2MenuOpen(null);
        loadR2Items();
      } else {
        alert('Ошибка: ' + (data.error || 'неизвестно'));
      }
    } catch (e: any) {
      alert('Ошибка: ' + e.message);
    }
  };

  const handleCreateFolder = async () => {
    const name = r2NewFolderName.trim();
    if (!name) return;
    try {
      const res = await fetch('/api/r2-browser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName: name, prefix: r2Path }),
      });
      const data = await res.json();
      if (data.success) {
        setR2NewFolderName('');
        setR2ShowNewFolder(false);
        loadR2Items();
      } else {
        alert('Ошибка: ' + (data.error || 'неизвестно'));
      }
    } catch (e: any) {
      alert('Ошибка: ' + e.message);
    }
  };

  // --- Upload handler ---
  const handleUploadSubmit = () => {
    const input = uploadFileRef.current;
    if (!input?.files?.length) return;
    const file = input.files[0];
    setUploadProcessing(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', uploadMode);
    formData.append('prefix', r2Path);

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 90)); // 0-90% for upload
      }
    };
    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        if (data.success) {
          setUploadProgress(100);
          setTimeout(() => {
            setUploadOpen(false);
            setUploadProgress(0);
            setUploadProcessing(false);
            setUploadFileName('');
            if (input) input.value = '';
            loadR2Items();
          }, 500);
        } else {
          alert('Ошибка: ' + (data.error || 'неизвестно'));
          setUploadProcessing(false);
          setUploadProgress(0);
        }
      } else {
        alert('Ошибка загрузки: ' + xhr.status);
        setUploadProcessing(false);
        setUploadProgress(0);
      }
    };
    xhr.onerror = () => {
      alert('Ошибка сети');
      setUploadProcessing(false);
      setUploadProgress(0);
    };
    xhr.open('POST', '/api/r2-upload');
    xhr.send(formData);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setUploadFileName(f.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setUploadDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && uploadFileRef.current) {
      const dt = new DataTransfer();
      dt.items.add(f);
      uploadFileRef.current.files = dt.files;
      setUploadFileName(f.name);
    }
  };

  // ===================================================================
  // RENDER
  // ===================================================================
  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-24 pb-32 antialiased">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-5">

        {/* --- Header --- */}
        <div className="flex items-center gap-3 select-none">
          <button
            onClick={() => router.push('/')}
            className="w-12 h-12 flex items-center justify-center bg-[#14171c]/90 backdrop-blur-xl border border-white/10 rounded-full text-white shadow-2xl active:scale-90 transition-transform"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-[#c0ff00]" />
            <h2 className="text-lg font-black text-white">Админ-панель</h2>
          </div>
        </div>



        {/* ==================== ГЛАВНАЯ ==================== */}
        {mainTab === 'home' && (
          <div className="flex flex-col items-center justify-center text-center gap-4 py-20 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-[#c0ff00]/10 border border-[#c0ff00]/20 flex items-center justify-center">
              <ShieldAlert size={36} className="text-[#c0ff00]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">Админ-панель</h3>
              <p className="text-sm text-gray-500">Управление сервером и игроками</p>
            </div>
          </div>
        )}

        {/* ==================== ИГРОКИ ==================== */}
        {mainTab === 'players' && (
          <>
            {/* Sub-tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {([
                { key: 'profiles' as const, label: 'Профили', icon: <User size={13} /> },
                { key: 'characters' as const, label: 'Персонажи', icon: <Users size={13} /> },
                { key: 'professions' as const, label: 'Профессии', icon: <AnvilIcon size={13} /> },
                { key: 'roles' as const, label: 'Роли', icon: <ShieldCheck size={13} /> },
                { key: 'guests' as const, label: 'Гости', icon: <UserPlus size={13} /> },
              ]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setPlayersSubTab(tab.key)}
                  className={`text-xs font-bold uppercase px-4 py-2 rounded-full whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    playersSubTab === tab.key
                      ? 'bg-[#c0ff00]/20 text-[#c0ff00] border border-[#c0ff00]/30'
                      : 'bg-white/5 text-gray-400 border border-white/5'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* --- Профили --- */}
            {playersSubTab === 'profiles' && (
              <div className="space-y-4">
                <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">
                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider">
                    <UserPlus size={16} /><span>Создать Minecraft-профиль</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Minecraft ник *" value={addMcNickname} onChange={e => setAddMcNickname(e.target.value)} className="ui-input"/>
                    <input type="number" placeholder="Telegram ID" value={addTgId} onChange={e => setAddTgId(e.target.value)} className="ui-input"/>
                    <input type="text" placeholder="Telegram Username" value={addTgUsername} onChange={e => setAddTgUsername(e.target.value)} className="ui-input"/>
                    <label className="ui-input flex items-center gap-2 cursor-pointer overflow-hidden relative">
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => uploadFile(e, setAddAvatarUrl, setIsUploading)} />
                      <Upload size={14} className={isUploading ? 'animate-bounce' : ''} />
                      <span className="text-xs text-gray-500 truncate">{isUploading ? 'Загрузка...' : addAvatarUrl ? 'Аватар выбран' : 'Загрузить аватар'}</span>
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
                    if (error) { alert('Ошибка: ' + error.message); return; }
                    setAddMcNickname(''); setAddTgId(''); setAddTgUsername(''); setAddAvatarUrl('');
                    loadAllPlayersData();
                  }} className="ui-pill-btn w-full justify-center py-3"><Check size={16} /><span>Создать профиль</span></button>
                </div>

                <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 shadow-xl">
                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider mb-3">
                    <Users size={16} /><span>Все профили ({allPlayers.length})</span>
                  </div>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
                    {allPlayers.map((p: any) => (
                      <div key={p.id}>
                        {editingPlayerId === p.id ? (
                          <div className="bg-black/30 border border-[#c0ff00]/20 p-3 rounded-xl space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input type="text" placeholder="Minecraft ник" value={editPlayerData.mc_nickname} onChange={e => setEditPlayerData(prev => ({...prev, mc_nickname: e.target.value}))} className="ui-input text-xs" />
                              <input type="number" placeholder="Telegram ID" value={editPlayerData.tg_id} onChange={e => setEditPlayerData(prev => ({...prev, tg_id: e.target.value}))} className="ui-input text-xs" />
                              <input type="number" placeholder="Второй Telegram ID" value={editPlayerData.tg_id_2} onChange={e => setEditPlayerData(prev => ({...prev, tg_id_2: e.target.value}))} className="ui-input text-xs" />
                              <input type="text" placeholder="TG Username" value={editPlayerData.tg_username} onChange={e => setEditPlayerData(prev => ({...prev, tg_username: e.target.value}))} className="ui-input text-xs" />
                            </div>
                            <label className="ui-input flex items-center gap-2 cursor-pointer overflow-hidden relative">
                              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => uploadFile(e, (url) => setEditPlayerData(prev => ({...prev, avatar_url: url})), setIsUploading)} />
                              <Upload size={12} className={isUploading ? 'animate-bounce' : ''} />
                              <span className="text-[10px] text-gray-500 truncate">{editPlayerData.avatar_url ? 'Аватар' : 'Аватар'}</span>
                            </label>
                            <div className="space-y-1.5 col-span-2">
                              <div className="text-[9px] text-gray-500 uppercase">Роли</div>
                              <div className="flex flex-wrap gap-1.5">
                                {customRoles.map(role => {
                                  const hasRole = editPlayerData.roles.includes(role.name);
                                  return (
                                    <button key={role.id} onClick={() => {
                                      setEditPlayerData(prev => ({
                                        ...prev,
                                        roles: hasRole ? prev.roles.filter(r => r !== role.name) : [...prev.roles, role.name]
                                      }));
                                    }} className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-all ${hasRole ? 'border-current' : 'border-white/10 opacity-40'}`}
                                      style={{ color: role.color, backgroundColor: hasRole ? role.color + '20' : 'transparent' }}
                                    >{role.name.toUpperCase()}</button>
                                  );
                                })}
                                {customRoles.length === 0 && <span className="text-[10px] text-gray-500">Нет ролей</span>}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button onClick={async () => {
                                const payload = { ...editPlayerData, tg_id: editPlayerData.tg_id ? parseInt(editPlayerData.tg_id) : null, tg_id_2: editPlayerData.tg_id_2 ? parseInt(editPlayerData.tg_id_2) : null, roles: editPlayerData.roles };
                                const { error } = await supabase.from('players').update(payload).eq('id', p.id);
                                if (error) { alert('Ошибка: ' + error.message); return; }
                                setEditingPlayerId(null);
                                loadAllPlayersData();
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
                                <div className="text-[10px] text-gray-500">{p.tg_id ? 'TG: ' + p.tg_id : 'Без TG'} {p.tg_username ? '@' + p.tg_username : ''}{p.tg_id_2 ? ' | TG2: ' + p.tg_id_2 : ''}</div>
                              </div>
                            </div>
                            <button onClick={() => { setEditingPlayerId(p.id); setEditPlayerData({ mc_nickname: p.mc_nickname, tg_id: p.tg_id?.toString() || '', tg_username: p.tg_username || '', avatar_url: p.avatar_url || '', tg_id_2: p.tg_id_2?.toString() || '', roles: p.roles || [] }); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white/5 rounded-full text-gray-400 hover:text-[#c0ff00]"><Edit2 size={14} /></button>
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
            {playersSubTab === 'characters' && (
              <div className="space-y-4">
                <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">
                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider">
                    <UserPlus size={16} /><span>Создать персонажа для сезона</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Minecraft ник игрока *" value={addMcNickname} onChange={e => setAddMcNickname(e.target.value)} className="ui-input"/>
                    <input type="text" placeholder="RP-имя персонажа *" value={addRpName} onChange={e => setAddRpName(e.target.value)} className="ui-input"/>
                    <input type="text" placeholder="Партия" value={addParty} onChange={e => setAddParty(e.target.value)} className="ui-input"/>
                    <label className="ui-input flex items-center gap-2 cursor-pointer overflow-hidden relative">
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => uploadFile(e, setAddAvatarUrl, setIsUploading)} />
                      <Upload size={14} className={isUploading ? 'animate-bounce' : ''} />
                      <span className="text-xs text-gray-500 truncate">{isUploading ? 'Загрузка...' : addAvatarUrl ? 'Аватар выбран' : 'Загрузить аватар'}</span>
                    </label>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Профессии персонажа</div>
                    <div className="flex flex-wrap gap-2">
                      {professions.map(prof => (
                        <button key={prof.name} onClick={() => { setAddProfessions(prev => prev.includes(prof.name) ? prev.filter(r => r !== prof.name) : [...prev, prof.name]); }} className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${addProfessions.includes(prof.name) ? 'border-current' : 'border-white/10 opacity-40'}`} style={{ color: prof.color, backgroundColor: addProfessions.includes(prof.name) ? prof.color + '20' : 'transparent' }}>{prof.name.toUpperCase()}</button>
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
                    if (error) { alert('Ошибка: ' + error.message); return; }
                    setAddMcNickname(''); setAddRpName(''); setAddParty('Нет партии'); setAddProfessions([]); setAddAvatarUrl('');
                    loadPlayersData();
                  }} className="ui-pill-btn w-full justify-center py-3"><Plus size={16} /><span>Создать персонажа</span></button>
                </div>

                <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 shadow-xl">
                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider mb-3">
                    <Users size={16} /><span>Персонажи сезона ({players.length})</span>
                  </div>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
                    {players.map((c: any) => (
                      <div key={c.id}>
                        {editingCharId === c.id ? (
                          <div className="bg-black/30 border border-[#c0ff00]/20 p-3 rounded-xl space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input type="text" placeholder="RP-имя" value={editCharData.rp_name} onChange={e => setEditCharData(prev => ({...prev, rp_name: e.target.value}))} className="ui-input text-xs" />
                              <input type="text" placeholder="Партия" value={editCharData.party} onChange={e => setEditCharData(prev => ({...prev, party: e.target.value}))} className="ui-input text-xs" />
                            </div>
                            <label className="ui-input flex items-center gap-2 cursor-pointer overflow-hidden relative">
                              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => uploadFile(e, (url) => setEditCharData(prev => ({...prev, avatar_url: url})), setIsUploading)} />
                              <Upload size={12} className={isUploading ? 'animate-bounce' : ''} />
                              <span className="text-[10px] text-gray-500 truncate">{editCharData.avatar_url ? 'Аватар' : 'Загрузить аватар'}</span>
                            </label>
                            <div className="space-y-1.5">
                              <div className="text-[9px] text-gray-500 uppercase">Профессии</div>
                              <div className="flex flex-wrap gap-1.5">
                                {professions.map(prof => (
                                  <button key={prof.name} onClick={() => { setEditCharData(prev => ({...prev, professions: prev.professions.includes(prof.name) ? prev.professions.filter(r => r !== prof.name) : [...prev.professions, prof.name]})); }} className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-all ${editCharData.professions.includes(prof.name) ? 'border-current' : 'border-white/10 opacity-40'}`} style={{ color: prof.color, backgroundColor: editCharData.professions.includes(prof.name) ? prof.color + '20' : 'transparent' }}>{prof.name.toUpperCase()}</button>
                                ))}
                                {professions.length === 0 && <span className="text-[10px] text-gray-500">Нет профессий</span>}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={async () => {
                                const { error } = await supabase.from('characters').update({ rp_name: editCharData.rp_name, party: editCharData.party, avatar_url: editCharData.avatar_url, professions: editCharData.professions }).eq('id', c.id);
                                if (error) { alert('Ошибка: ' + error.message); return; }
                                setEditingCharId(null);
                                loadPlayersData();
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
                                {c.professions?.slice(0, 2).map((p: string, i: number) => (
                                  <span key={i} className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: getProfessionColor(p) + '20', color: getProfessionColor(p) }}>{p}</span>
                                ))}
                              </div>
                              <button onClick={() => { setEditingCharId(c.id); setEditCharData({ rp_name: c.rp_name, party: c.party || 'Нет партии', avatar_url: c.avatar_url || '', professions: c.professions || [] }); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white/5 rounded-full text-gray-400 hover:text-[#c0ff00]"><Edit2 size={14} /></button>
                              <button onClick={async () => {
                                if (!confirm('Удалить персонажа?')) return;
                                const { error } = await supabase.from('characters').delete().eq('id', c.id);
                                if (!error) loadPlayersData();
                              }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white/5 rounded-full text-gray-400 hover:text-red-400"><Trash2 size={14} /></button>
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

            {/* --- Профессии --- */}
            {playersSubTab === 'professions' && (
              <div className="space-y-4">
                <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">
                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider">
                    <AnvilIcon size={16} /><span>Создать профессию</span>
                  </div>
                  <div className="flex gap-2 items-end">
                    <input type="text" placeholder="Название профессии" value={newProfessionName} onChange={e => setNewProfessionName(e.target.value)} className="ui-input flex-1"/>
                    <input type="color" value={newProfessionColor} onChange={e => setNewProfessionColor(e.target.value)} className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer"/>
                  </div>
                  <button onClick={async () => {
                    if (!newProfessionName.trim()) return;
                    const { error } = await supabase.from('professions').insert({ name: newProfessionName.toLowerCase(), color: newProfessionColor });
                    if (!error) { setNewProfessionName(''); loadProfessionsData(); }
                    else alert('Ошибка создания профессии');
                  }} className="ui-pill-btn w-full justify-center py-3"><AnvilIcon size={14} /><span>Создать профессию</span></button>
                </div>
                <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 shadow-xl">
                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider mb-3">
                    <AnvilIcon size={16} /><span>Все профессии</span>
                  </div>
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

            {/* --- Роли --- */}
            {playersSubTab === 'roles' && (
              <div className="space-y-4">
                <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">
                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider">
                    <ShieldCheck size={16} /><span>Создать роль</span>
                  </div>
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
                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider mb-3">
                    <ShieldCheck size={16} /><span>Все роли</span>
                  </div>
                  <div className="space-y-2">
                    {customRoles.map((role) => (
                      <div key={role.id} className="flex items-center gap-3 bg-black/20 border border-white/5 p-3 rounded-xl">
                        <input type="color" value={role.color} onChange={e => { setCustomRoles(prev => prev.map(r => r.id === role.id ? { ...r, color: e.target.value } : r)); }} onBlur={async () => { if (!role.id) return; await supabase.from('roles').update({ color: role.color }).eq('id', role.id); }} className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer flex-shrink-0"/>
                        <input type="text" value={role.name} onChange={e => { setCustomRoles(prev => prev.map(r => r.id === role.id ? { ...r, name: e.target.value } : r)); }} onBlur={async () => { if (!role.id) return; await supabase.from('roles').update({ name: role.name, can_edit_constitution: role.canEditConstitution }).eq('id', role.id); }} className="bg-transparent text-sm font-bold flex-1 min-w-0" style={{ color: role.color }}/>
                        <label className="flex items-center gap-1 text-[10px] text-gray-500 flex-shrink-0">
                          <input type="checkbox" checked={role.canEditConstitution} onChange={e => { setCustomRoles(prev => prev.map(r => r.id === role.id ? { ...r, canEditConstitution: e.target.checked } : r)); }} onBlur={async () => { await supabase.from('roles').update({ can_edit_constitution: role.canEditConstitution }).eq('id', role.id); }} className="accent-[#c0ff00]"/>
                          Конст.
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* --- Гости --- */}
            {playersSubTab === 'guests' && (
              <div className="space-y-4">
                <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">
                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider">
                    <User size={16} /><span>Добавить гостя</span>
                  </div>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Telegram ID" value={guestTgId} onChange={e => setGuestTgId(e.target.value)} className="ui-input flex-1"/>
                    <button onClick={handleAddGuest} disabled={guestLoading || !guestTgId} className="ui-pill-btn shrink-0 px-4 disabled:opacity-30"><Plus size={16} /></button>
                  </div>
                  {guestList.length > 0 && (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
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
          </>
        )}

        {/* ==================== СЕРВЕР ==================== */}
        {mainTab === 'server' && (
          <>
            {/* Sub-tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {([
                { key: 'seasons' as const, label: 'Сезоны', icon: <Calendar size={13} /> },
                { key: 'modpack' as const, label: 'Модпак', icon: <Package size={13} /> },
              ]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setServerSubTab(tab.key)}
                  className={`text-xs font-bold uppercase px-4 py-2 rounded-full whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    serverSubTab === tab.key
                      ? 'bg-[#c0ff00]/20 text-[#c0ff00] border border-[#c0ff00]/30'
                      : 'bg-white/5 text-gray-400 border border-white/5'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* --- Сезоны --- */}
            {serverSubTab === 'seasons' && (
              <div className="space-y-4">
                <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">
                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider">
                    <Calendar size={16} /><span>Управление сезонами</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Текущий: <span className="text-[#c0ff00] font-bold">{currentSeasonName}</span>
                    {seasonEnded
                      ? <span className="text-red-400 font-bold ml-2">• Завершён</span>
                      : <span className="text-[#c0ff00] font-bold ml-2">• Активен</span>
                    }
                  </div>
                  {!seasonEnded && (
                    <button onClick={handleEndSeason} disabled={seasonLoading} className="ui-pill-btn w-full justify-center !bg-red-500/20 !border-red-500/30 !text-red-400 hover:!bg-red-500/30 disabled:opacity-30">
                      <Flag size={14} /><span className="text-[11px] font-bold">Завершить сезон</span>
                    </button>
                  )}
                  {seasonEnded && (
                    <>
                      <button onClick={handleUndoEndSeason} disabled={seasonLoading} className="ui-pill-btn w-full justify-center !bg-[#c0ff00]/20 !border-[#c0ff00]/30 !text-[#c0ff00] hover:!bg-[#c0ff00]/30 disabled:opacity-30">
                        <RotateCcw size={14} /><span className="text-[11px] font-bold">Восстановить сезон</span>
                      </button>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          <ServerIcon size={12} className="text-[#c0ff00]" /><span>Exaroton Server ID</span>
                        </div>
                        <input type="text" placeholder="e.g. abc123def456" value={newSeasonServerId} onChange={e => setNewSeasonServerId(e.target.value)} className="ui-input text-xs"/>
                        <button onClick={() => handleStartNewSeason(newSeasonServerId)} disabled={seasonLoading} className="ui-pill-btn w-full justify-center !bg-[#c0ff00] !text-black font-bold disabled:opacity-30">
                          <Play size={14} /><span>Начать новый сезон</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {pastSeasons.length > 0 && (
                  <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 shadow-xl">
                    <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider mb-3">
                      <Library size={16} /><span>Архив сезонов</span>
                    </div>
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

            {/* --- Модпак --- */}
            {serverSubTab === 'modpack' && (
              <div className="space-y-4 animate-fade-in">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
                  <button onClick={() => { setR2Path(''); loadR2Items(''); }} className="flex items-center gap-1 hover:text-[#c0ff00] transition-colors">
                    <Home size={14} />
                  </button>
                  {r2Path.split('/').filter(Boolean).map((part, i, arr) => (
                    <span key={i} className="flex items-center gap-1.5">
                      <ChevronRight size={12} className="text-gray-600" />
                      <button
                        onClick={() => {
                          const newPath = arr.slice(0, i + 1).join('/') + '/';
                          setR2Path(newPath);
                          loadR2Items(newPath);
                        }}
                        className="hover:text-[#c0ff00] transition-colors truncate max-w-[120px]"
                      >
                        {part}
                      </button>
                    </span>
                  ))}
                </div>

                {/* Create folder */}
                {r2ShowNewFolder ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Название папки"
                      value={r2NewFolderName}
                      onChange={e => setR2NewFolderName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') { setR2ShowNewFolder(false); setR2NewFolderName(''); } }}
                      className="ui-input flex-1"
                      autoFocus
                    />
                    <button onClick={handleCreateFolder} className="ui-pill-btn !bg-[#c0ff00] !text-black shrink-0"><Plus size={14} /> Создать</button>
                    <button onClick={() => { setR2ShowNewFolder(false); setR2NewFolderName(''); }} className="ui-pill-btn shrink-0"><X size={14} /></button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setR2ShowNewFolder(true)}
                      className="ui-pill-btn flex-1 justify-center"
                    >
                      <FolderPlus size={14} />
                      <span>Создать папку</span>
                    </button>
                    <button
                      onClick={() => setUploadOpen(true)}
                      className="ui-pill-btn flex-1 justify-center"
                    >
                      <UploadCloud size={14} />
                      <span>Загрузить</span>
                    </button>
                  </div>
                )}

                {/* Content */}
                <div className="bg-[#14171c]/90 backdrop-blur-xl rounded-[28px] border border-white/5 shadow-xl overflow-hidden">
                  {r2Loading ? (
                    <div className="flex justify-center py-12">
                      <RefreshCw className="animate-spin text-[#c0ff00]" size={24} />
                    </div>
                  ) : r2Error ? (
                    <div className="text-center py-12 text-xs text-red-400">{r2Error}</div>
                  ) : r2Items.length === 0 ? (
                    <div className="text-center py-12 text-xs text-gray-500">Папка пуста</div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {r2Path && (
                        <button
                          onClick={navigateR2Up}
                          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors text-left"
                        >
                          <FolderOpen size={18} className="text-[#c0ff00] shrink-0" />
                          <span className="text-sm font-medium text-gray-400">..</span>
                        </button>
                      )}
                      {r2Items.map((item) => (
                        <div key={item.key} className="relative">
                          {item.type === 'folder' ? (
                            <div className="flex items-center group">
                              <button
                                onClick={() => navigateR2(item.name)}
                                className="flex-1 flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors text-left"
                              >
                                <FolderOpen size={18} className="text-[#c0ff00] shrink-0" />
                                <span className="text-sm font-medium text-white truncate">{item.name}</span>
                              </button>
                              <div className="relative shrink-0 pr-3">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setR2MenuOpen(r2MenuOpen === item.key ? null : item.key); }}
                                  className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all text-gray-400"
                                >
                                  <MoreVertical size={14} />
                                </button>
                                {r2MenuOpen === item.key && (
                                  <>
                                    <div className="fixed inset-0 z-10" onClick={() => setR2MenuOpen(null)} />
                                    <div className="absolute right-0 top-full mt-1 z-20 bg-[#14171c]/95 border border-white/10 rounded-2xl p-1.5 shadow-2xl min-w-[140px] backdrop-blur-xl">
                                      <button
                                        onClick={() => { handleDeleteR2(item.key, 'folder'); }}
                                        className="w-full text-xs text-left px-3 py-2 rounded-xl font-bold transition-all hover:bg-red-500/10 text-red-400 flex items-center gap-2"
                                      >
                                        <Trash2 size={12} /> Удалить
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center group">
                              <a
                                href={`/api/r2-browser?download=${encodeURIComponent(item.key)}`}
                                className="flex-1 flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors text-left"
                              >
                                <File size={18} className="text-gray-500 shrink-0" />
                                <span className="text-sm text-gray-300 truncate">{item.name}</span>
                                <span className="text-[10px] text-gray-600 shrink-0 ml-auto mr-3">{formatSize(item.size)}</span>
                              </a>
                              <div className="relative shrink-0 pr-3">
                                <button
                                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); setR2MenuOpen(r2MenuOpen === item.key ? null : item.key); }}
                                  className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all text-gray-400"
                                >
                                  <MoreVertical size={14} />
                                </button>
                                {r2MenuOpen === item.key && (
                                  <>
                                    <div className="fixed inset-0 z-10" onClick={() => setR2MenuOpen(null)} />
                                    <div className="absolute right-0 top-full mt-1 z-20 bg-[#14171c]/95 border border-white/10 rounded-2xl p-1.5 shadow-2xl min-w-[140px] backdrop-blur-xl">
                                      <a
                                        href={`/api/r2-browser?download=${encodeURIComponent(item.key)}`}
                                        className="w-full text-xs text-left px-3 py-2 rounded-xl font-bold transition-all hover:bg-white/5 text-white flex items-center gap-2 no-underline"
                                      >
                                        <Download size={12} /> Скачать
                                      </a>
                                      <button
                                        onClick={() => { handleDeleteR2(item.key, 'file'); }}
                                        className="w-full text-xs text-left px-3 py-2 rounded-xl font-bold transition-all hover:bg-red-500/10 text-red-400 flex items-center gap-2"
                                      >
                                        <Trash2 size={12} /> Удалить
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload overlay modal */}
      {uploadOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => { if (!uploadProcessing) setUploadOpen(false); }} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-32px)] max-w-md bg-[#14171c] border border-white/10 rounded-[32px] p-6 shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#c0ff00]/5 to-transparent pointer-events-none rounded-t-[32px]" />

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <UploadCloud size={18} className="text-[#c0ff00]" />
                Загрузить файлы
              </h3>
              <button onClick={() => { if (!uploadProcessing) setUploadOpen(false); }} className="p-1.5 bg-white/5 border border-white/5 rounded-full text-gray-400 hover:text-white active:scale-90 transition-all">
                <X size={14} />
              </button>
            </div>

            {/* Drag & drop zone */}
            <label
              className={`block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-4 ${
                uploadDragOver
                  ? 'border-[#c0ff00] bg-[#c0ff00]/5'
                  : uploadFileName
                    ? 'border-[#c0ff00]/40 bg-[#c0ff00]/5'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
              }`}
              onDragOver={(e) => { e.preventDefault(); setUploadDragOver(true); }}
              onDragLeave={() => setUploadDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                ref={uploadFileRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".jar,.zip"
              />
              <UploadCloud size={32} className={`mx-auto mb-3 ${uploadFileName ? 'text-[#c0ff00]' : 'text-gray-600'}`} />
              {uploadFileName ? (
                <>
                  <p className="text-sm font-bold text-[#c0ff00] truncate">{uploadFileName}</p>
                  <p className="text-[10px] text-gray-500 mt-1">Нажмите чтобы заменить</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-400">Перетащите файл сюда</p>
                  <p className="text-[10px] text-gray-600 mt-1">или нажмите чтобы выбрать</p>
                  <p className="text-[10px] text-gray-700 mt-2">.jar / .zip</p>
                </>
              )}
            </label>

            {/* Mode selector */}
            <div className="space-y-2 mb-1">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Режим замены для ZIP-архива</div>
              <div className="flex gap-2">
                <label className={`flex-1 flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all text-xs font-bold ${
                  uploadMode === 'merge'
                    ? 'border-[#c0ff00]/30 bg-[#c0ff00]/10 text-[#c0ff00]'
                    : 'border-white/5 bg-white/5 text-gray-400'
                }`}>
                  <input type="radio" name="uploadMode" value="merge" checked={uploadMode === 'merge'} onChange={() => setUploadMode('merge')} className="hidden" />
                  Замена и дополнение
                </label>
                <label className={`flex-1 flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all text-xs font-bold ${
                  uploadMode === 'replace'
                    ? 'border-red-500/30 bg-red-500/10 text-red-400'
                    : 'border-white/5 bg-white/5 text-gray-400'
                }`}>
                  <input type="radio" name="uploadMode" value="replace" checked={uploadMode === 'replace'} onChange={() => setUploadMode('replace')} className="hidden" />
                  Пересборка
                </label>
              </div>
              <p className="text-[10px] text-gray-600 leading-relaxed">
                {uploadMode === 'merge'
                  ? 'Заменит совпадающие и добавит новые файлы, остальные не тронет'
                  : 'Удалит всё в этой папке и загрузит только новые файлы из архива'
                }
              </p>
            </div>

            {/* Progress bar */}
            {uploadProcessing && (
              <div className="mt-4 space-y-2">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#c0ff00] rounded-full transition-all duration-300"
                    style={{ width: uploadProgress + '%' }}
                  />
                </div>
                <p className="text-[10px] text-gray-500 text-center">
                  {uploadProgress < 100 ? 'Загрузка... ' + uploadProgress + '%' : 'Готово!'}
                </p>
              </div>
            )}

            {/* Upload button */}
            <button
              onClick={handleUploadSubmit}
              disabled={uploadProcessing || !uploadFileName}
              className="ui-pill-btn w-full justify-center mt-4 !bg-[#c0ff00] !text-black font-bold disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {uploadProcessing ? (
                <>
                  <RefreshCw className="animate-spin" size={14} />
                  <span>{uploadProgress < 100 ? 'Загрузка...' : 'Обработка...'}</span>
                </>
              ) : (
                <>
                  <Upload size={14} />
                  <span>Загрузить</span>
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* ПК САЙДБАР */}
      <aside className="hidden md:flex flex-col items-center gap-3 fixed left-6 top-1/2 -translate-y-1/2 z-50">
        <nav className="bg-[#14171c]/70 backdrop-blur-xl border border-white/10 rounded-[36px] shadow-2xl flex flex-col items-center gap-8 relative transition-all duration-300 w-[72px] py-6 px-1">
          <button
            onClick={() => setMainTab('home')}
            className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 ${mainTab === 'home' ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-white'}`}
          >
            <ShieldAlert size={23} />
            <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">Главная</span>
          </button>
          <button
            onClick={() => setMainTab('players')}
            className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 ${mainTab === 'players' ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-white'}`}
          >
            <Users size={23} />
            <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">Игроки</span>
          </button>
          <button
            onClick={() => setMainTab('server')}
            className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 ${mainTab === 'server' ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-white'}`}
          >
            <Folder size={23} />
            <span className="absolute left-full ml-4 px-3 py-1.5 bg-[#14171c]/95 border border-white/10 rounded-full text-[11px] font-bold text-white shadow-2xl transition-all duration-200 opacity-0 scale-95 translate-x-[-8px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">Сервер</span>
          </button>
        </nav>
      </aside>

      {/* Мобильный навбар */}
      <div className="md:hidden fixed bottom-6 left-8 right-8 z-50 flex items-center justify-center">
        <nav className="bg-[#14171c]/90 backdrop-blur-xl border border-white/10 py-4 rounded-full shadow-2xl flex-1">
          <div className="flex items-center w-full justify-around px-2">
            <button
              onClick={() => setMainTab('home')}
              className={`flex flex-col items-center justify-center transition-all duration-300 ${mainTab === 'home' ? 'text-[#c0ff00]' : 'text-gray-500'}`}
            >
              <ShieldAlert size={22} />
              <span className="text-[10px] font-bold mt-1 tracking-wide">Главная</span>
            </button>
            <button
              onClick={() => setMainTab('players')}
              className={`flex flex-col items-center justify-center transition-all duration-300 ${mainTab === 'players' ? 'text-[#c0ff00]' : 'text-gray-500'}`}
            >
              <Users size={22} />
              <span className="text-[10px] font-bold mt-1 tracking-wide">Игроки</span>
            </button>
            <button
              onClick={() => setMainTab('server')}
              className={`flex flex-col items-center justify-center transition-all duration-300 ${mainTab === 'server' ? 'text-[#c0ff00]' : 'text-gray-500'}`}
            >
              <Folder size={22} />
              <span className="text-[10px] font-bold mt-1 tracking-wide">Сервер</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
