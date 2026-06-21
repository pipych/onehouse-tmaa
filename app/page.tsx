'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  User, BookOpen, Users, Edit2, Check, X, ArrowLeft, ShieldAlert, UserPlus, ShieldCheck, Palette, Save,
  Bold, Italic, Strikethrough, Heading1, Heading2, AlignLeft, AlignCenter, Plus, Upload,
  Copy, Play, Square, Server, RefreshCw
} from 'lucide-react';

interface Player {
  id: string;
  tg_id: number;
  tg_username: string;
  mc_nickname: string;
  rp_name: string;
  avatar_url: string;
  roles: string[];
  party?: string;
}

interface CustomRole {
  name: string;
  color: string;
  canEditConstitution: boolean;
}

export default function Home() {
  const [tgUser, setTgUser] = useState<any>(null);
  const [dbUser, setDbUser] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'constitution' | 'players' | 'admin'>('players');
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [constitution, setConstitution] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const [newRpName, setNewRpName] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingNewUser, setIsUploadingNewUser] = useState(false);

  // Стейты для Exaroton API
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [isServerLoading, setIsServerLoading] = useState(false);
  const [serverActionLoading, setServerActionLoading] = useState(false);
  const staticIp = "mc.your-domain.com"; // ЗАМЕНИТЕ НА ВАШ СТАТИЧЕСКИЙ IP

  const [addTgId, setAddTgId] = useState('');
  const [addTgUsername, setAddTgUsername] = useState('');
  const [addMcNickname, setAddMcNickname] = useState('');
  const [addRpName, setAddRpName] = useState('');
  const [addAvatarUrl, setAddAvatarUrl] = useState('');
  const [addParty, setAddParty] = useState('');
  const [addRoles, setAddRoles] = useState<string[]>(['citizen']);

  const [customRoles, setCustomRoles] = useState<CustomRole[]>([
    { name: 'admin', color: '#ef4444', canEditConstitution: true },
    { name: 'president', color: '#f59e0b', canEditConstitution: true },
    { name: 'editor', color: '#3b82f6', canEditConstitution: true },
    { name: 'citizen', color: '#10b981', canEditConstitution: false },
    { name: 'мёртв', color: '#6b7280', canEditConstitution: false }
  ]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#c0ff00');
  const [newRolePerm, setNewRolePerm] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tg = (window as any).Telegram?.WebApp;

    if (tg && tg.initDataUnsafe?.user?.id) {
      tg.ready();
      tg.expand();
      
      if (typeof tg.setHeaderColor === 'function') tg.setHeaderColor('#090b0e');
      if (typeof tg.setBackgroundColor === 'function') tg.setBackgroundColor('#090b0e');
      if (typeof tg.requestFullscreen === 'function') tg.requestFullscreen();

      const userFromTg = tg.initDataUnsafe.user;
      setTgUser(userFromTg);
      checkUserInDb(userFromTg.id);
    } else {
      setError('Пожалуйста, откройте приложение внутри Telegram.');
      setLoading(false);
    }

    const savedRoles = localStorage.getItem('onehouse_custom_roles');
    if (savedRoles) setCustomRoles(JSON.parse(savedRoles));
  }, []);

  // Функция запроса статуса сервера
  const fetchServerStatus = async () => {
    setIsServerLoading(true);
    try {
      const res = await fetch('/api/exaroton');
      const data = await res.json();
      if (data.success) {
        setServerInfo(data.data);
      }
    } catch (e) {
      console.error('Ошибка получения статуса сервера:', e);
    } finally {
      setIsServerLoading(false);
    }
  };

  // Автоматически обновлять статус при переходе на главную вкладку
  useEffect(() => {
    if (activeTab === 'profile') {
      fetchServerStatus();
    }
  }, [activeTab]);

  // Управление сервером (Старт / Стоп)
  const handleServerAction = async (action: 'start' | 'stop') => {
    setServerActionLoading(true);
    try {
      const res = await fetch('/api/exaroton', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        // Ждем пару секунд и обновляем статус
        setTimeout(fetchServerStatus, 3000);
      } else {
        alert('Не удалось выполнить действие: ' + (data.error || 'Неизвестная ошибка'));
      }
    } catch (e) {
      alert('Ошибка при отправке команды');
    } finally {
      setServerActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    }
  };

  const checkUserInDb = async (tgId: number) => {
    try {
      const { data: user, error: dbError } = await supabase.from('users').select('*').eq('tg_id', tgId).single();
      if (dbError || !user) {
        setError(`Пользователь с TG ID ${tgId} не найден в базе Supabase.`);
      } else {
        setDbUser(user);
        setNewRpName(user.rp_name);
        setNewAvatarUrl(user.avatar_url);
        loadPlayers();
        loadConstitution();
      }
    } catch (e: any) {
      setError(`Ошибка базы данных: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayers = async () => {
    const { data } = await supabase.from('users').select('*').order('rp_name', { ascending: true });
    if (data) setPlayers(data);
  };

  const loadConstitution = async () => {
    const { data } = await supabase.from('constitution').select('content').eq('id', 1).single();
    if (data) setConstitution(data.content);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, setUrlCallback: (url: string) => void, setLoadingState: (loading: boolean) => void) => {
    try {
      setLoadingState(true);
      const file = event.target.files?.[0];
      if (!file) return;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const { error } = await supabase.storage.from('avatars').upload(fileName, file);
      if (error) return alert(`Ошибка загрузки: ${error.message}`);
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      if (urlData) setUrlCallback(urlData.publicUrl);
    } catch (e: any) {
      alert(`Сбой при загрузке: ${e.message}`);
    } finally {
      setLoadingState(false);
    }
  };

  const saveProfileData = async () => {
    if (!selectedPlayer || !newRpName.trim()) return;
    const { error } = await supabase.from('users').update({ rp_name: newRpName, avatar_url: newAvatarUrl }).eq('id', selectedPlayer.id); 
    if (!error) {
      const updatedUser = { ...selectedPlayer, rp_name: newRpName, avatar_url: newAvatarUrl };
      setSelectedPlayer(updatedUser);
      if (dbUser?.id === selectedPlayer.id) setDbUser(updatedUser);
      setIsEditingProfile(false);
      loadPlayers();
    } else {
      alert(`Ошибка при сохранении: ${error.message}`);
    }
  };

  const handleAddPlayer = async () => {
    const tgIdNum = parseInt(addTgId);
    if (isNaN(tgIdNum) || !addRpName.trim() || !addMcNickname.trim()) return;
    const { error } = await supabase.from('users').insert([{
      tg_id: tgIdNum, tg_username: addTgUsername || 'unknown', mc_nickname: addMcNickname, rp_name: addRpName, avatar_url: addAvatarUrl || 'https://via.placeholder.com/150', roles: addRoles, party: addParty || 'Нет партии'
    }]);
    if (error) {
      alert(`Ошибка: ${error.message}`);
    } else {
      setAddTgId(''); setAddTgUsername(''); setAddMcNickname(''); setAddRpName(''); setAddAvatarUrl(''); setAddParty(''); loadPlayers();
    }
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) return;
    const updated = [...customRoles, { name: newRoleName.toLowerCase(), color: newRoleColor, canEditConstitution: newRolePerm }];
    setCustomRoles(updated); localStorage.setItem('onehouse_custom_roles', JSON.stringify(updated));
    setNewRoleName(''); setNewRolePerm(false);
  };

  const handleToggleRolePerm = (index: number) => {
    const updated = [...customRoles]; updated[index].canEditConstitution = !updated[index].canEditConstitution;
    setCustomRoles(updated); localStorage.setItem('onehouse_custom_roles', JSON.stringify(updated));
  };

  const handleUpdateRoleColor = (index: number, color: string) => {
    const updated = [...customRoles]; updated[index].color = color;
    setCustomRoles(updated); localStorage.setItem('onehouse_custom_roles', JSON.stringify(updated));
  };

  const handleRenameRole = (index: number, name: string) => {
    const updated = [...customRoles]; updated[index].name = name.toLowerCase();
    setCustomRoles(updated); localStorage.setItem('onehouse_custom_roles', JSON.stringify(updated));
  };

  const handleAddRoleToUser = async (roleName: string) => {
    if (!selectedPlayer || selectedPlayer.roles.includes(roleName)) return;
    const updatedRoles = [...selectedPlayer.roles, roleName];
    const updatedPlayer = { ...selectedPlayer, roles: updatedRoles };
    const { error } = await supabase.from('users').update({ roles: updatedRoles }).eq('id', selectedPlayer.id);
    if (!error) {
      setSelectedPlayer(updatedPlayer); setPlayers(players.map(p => p.id === selectedPlayer.id ? updatedPlayer : p));
      if (dbUser?.id === selectedPlayer.id) setDbUser(updatedPlayer);
      setShowRoleSelector(false);
    }
  };

  const handleRemoveRoleFromUser = async (roleName: string) => {
    if (!selectedPlayer) return;
    const updatedRoles = selectedPlayer.roles.filter(r => r !== roleName);
    const updatedPlayer = { ...selectedPlayer, roles: updatedRoles };
    const { error } = await supabase.from('users').update({ roles: updatedRoles }).eq('id', selectedPlayer.id);
    if (!error) {
      setSelectedPlayer(updatedPlayer); setPlayers(players.map(p => p.id === selectedPlayer.id ? updatedPlayer : p));
      if (dbUser?.id === selectedPlayer.id) setDbUser(updatedPlayer);
    }
  };

  const execEditorCommand = (command: string, value: string = '') => {
    if (typeof document !== 'undefined') {
      document.execCommand(command, false, value);
      if (editorRef.current) editorRef.current.focus();
    }
  };

  const saveConstitution = async () => {
    if (!editorRef.current) return;
    const updatedContent = editorRef.current.innerHTML;
    const { error } = await supabase.from('constitution').update({ content: updatedContent }).eq('id', 1);
    if (!error) {
      setConstitution(updatedContent); setIsEditing(false);
    }
  };

  const handleTabChange = (tab: 'profile' | 'constitution' | 'players' | 'admin') => {
    setSelectedPlayer(null); setIsEditingProfile(false); setShowRoleSelector(false); setActiveTab(tab);
  };

  const isAdmin = dbUser?.roles.includes('admin');

  const canEditConstitution = dbUser?.roles.some(r => {
    const found = customRoles.find(cr => cr.name.toLowerCase() === r.toLowerCase());
    return found ? found.canEditConstitution : ['admin', 'president', 'editor'].includes(r);
  });

  const getRoleColor = (roleName: string) => {
    const found = customRoles.find(cr => cr.name.toLowerCase() === roleName.toLowerCase());
    return found ? found.color : '#888888';
  };

  const isDead = (roles: string[]) => roles.some(r => r.toLowerCase() === 'мёртв');

  const showToolbar = isEditing && activeTab === 'constitution' && !selectedPlayer;

  const sortedPlayers = players
    .filter((player) => player.tg_id !== dbUser?.tg_id)
    .sort((a, b) => {
      const aDead = isDead(a.roles); const bDead = isDead(b.roles);
      if (aDead && !bDead) return 1;
      if (!aDead && bDead) return -1;
      return a.rp_name.localeCompare(b.rp_name);
    });

  // Расшифровка статусов Exaroton API
  const getServerStatusText = (statusCode: number) => {
    switch(statusCode) {
      case 0: return { text: 'ОФФЛАЙН', color: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500/20' };
      case 1: return { text: 'ОНЛАЙН', color: 'text-[#c0ff00]', bg: 'bg-[#c0ff00]', border: 'border-[#c0ff00]/30' };
      case 2: return { text: 'ЗАПУСКАЕТСЯ...', color: 'text-yellow-400', bg: 'bg-yellow-400', border: 'border-yellow-400/20' };
      case 3: return { text: 'ОСТАНАВЛИВАЕТСЯ...', color: 'text-orange-400', bg: 'bg-orange-400', border: 'border-orange-400/20' };
      case 4: return { text: 'ПЕРЕЗАГРУЗКА...', color: 'text-blue-400', bg: 'bg-blue-400', border: 'border-blue-400/20' };
      default: return { text: 'ЗАГРУЗКА ДАННЫХ', color: 'text-gray-400', bg: 'bg-gray-400', border: 'border-gray-500/20' };
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090b0e] text-[#c0ff00]">
        <div className="text-center animate-pulse">
          <div className="text-3xl font-black tracking-widest">ONEHOUSE</div>
          <div className="text-xs text-gray-400 mt-2">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090b0e] px-6 text-center text-white animate-fade-in">
        <div className="bg-[#14171c] p-6 rounded-3xl border border-red-500/30 max-w-md w-full break-words shadow-2xl scale-95 transition-all">
          <div className="text-red-500 font-bold text-lg mb-2">Авторизация не удалась</div>
          <div className="text-sm text-gray-400 font-mono text-left bg-black/30 p-3 rounded-lg border border-white/5 whitespace-pre-wrap">{error}</div>
        </div>
      </div>
    );
  }

  const selectedIsDead = selectedPlayer ? isDead(selectedPlayer.roles) : false;

  return (
    <div className="min-h-screen bg-[#090b0e] text-white pb-32 antialiased selection:bg-[#c0ff00] selection:text-black transition-colors duration-300 overflow-x-hidden w-full max-w-full">
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${selectedPlayer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => { setSelectedPlayer(null); setIsEditingProfile(false); setShowRoleSelector(false); }} />
      <div className="fixed top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#090b0e] via-[#090b0e]/95 to-transparent pointer-events-none z-30 w-full" />

      {/* Верхний док управления */}
      <div className="fixed top-[96px] left-4 right-4 z-40 max-w-md mx-auto flex items-center justify-end gap-2 pointer-events-none">
        
        <div className={`transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden flex items-center justify-center ${showToolbar ? 'w-10 opacity-100 scale-100 translate-x-0' : 'w-0 opacity-0 scale-50 -translate-x-8 pointer-events-none'}`}>
          <button onClick={saveConstitution} className="pointer-events-auto bg-[#c0ff00] text-black w-10 h-10 rounded-full shadow-lg flex items-center justify-center flex-shrink-0 hover:scale-105 active:scale-95 transition-transform">
            <Save size={16} />
          </button>
        </div>

        <div className={`transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden flex items-center ${showToolbar ? 'flex-1 opacity-100 scale-100 translate-x-0' : 'w-0 opacity-0 scale-90 translate-x-8 pointer-events-none'}`}>
          <div className="p-1 bg-[#14171c]/95 border border-white/10 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-0.5 pointer-events-auto w-full">
            <div className="flex items-center w-full justify-start overflow-x-auto no-scrollbar py-0.5 px-1 gap-0.5 min-w-0">
              <button onClick={() => execEditorCommand('bold')} className="p-1.5 hover:text-[#c0ff00] hover:bg-white/5 rounded-full transition-all active:scale-75 flex-shrink-0"><Bold size={14}/></button>
              <button onClick={() => execEditorCommand('italic')} className="p-1.5 hover:text-[#c0ff00] hover:bg-white/5 rounded-full transition-all active:scale-75 flex-shrink-0"><Italic size={14}/></button>
              <button onClick={() => execEditorCommand('strikeThrough')} className="p-1.5 hover:text-[#c0ff00] hover:bg-white/5 rounded-full transition-all active:scale-75 flex-shrink-0"><Strikethrough size={14}/></button>
              <div className="w-[1px] h-3.5 bg-white/10 mx-0.5 flex-shrink-0" />
              <button onClick={() => execEditorCommand('formatBlock', '<h1>')} className="p-1.5 hover:text-[#c0ff00] hover:bg-white/5 rounded-full transition-all active:scale-75 flex-shrink-0"><Heading1 size={14}/></button>
              <button onClick={() => execEditorCommand('formatBlock', '<h2>')} className="p-1.5 hover:text-[#c0ff00] hover:bg-white/5 rounded-full transition-all active:scale-75 flex-shrink-0"><Heading2 size={14}/></button>
              <div className="w-[1px] h-3.5 bg-white/10 mx-0.5 flex-shrink-0" />
              <button onClick={() => execEditorCommand('justifyLeft')} className="p-1.5 hover:text-[#c0ff00] hover:bg-white/5 rounded-full transition-all active:scale-75 flex-shrink-0"><AlignLeft size={14}/></button>
              <button onClick={() => execEditorCommand('justifyCenter')} className="p-1.5 hover:text-[#c0ff00] hover:bg-white/5 rounded-full transition-all active:scale-75 flex-shrink-0"><AlignCenter size={14}/></button>
              <button onClick={() => setIsEditing(false)} className="p-1.5 text-gray-500 hover:text-red-400 rounded-full transition-colors ml-auto active:scale-75 flex-shrink-0"><X size={14} /></button>
            </div>
          </div>
        </div>

        {dbUser && !selectedPlayer && (
          <button
            onClick={() => { setIsEditingProfile(false); setSelectedPlayer(dbUser); }}
            className={`flex items-center bg-[#14171c]/90 border border-white/10 rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-2xl hover:border-[#c0ff00]/30 backdrop-blur-md pointer-events-auto flex-shrink-0 relative h-10 box-border ${
              showToolbar ? 'w-10 justify-center px-0' : 'w-auto px-1.5 pr-4'
            }`}
          >
            <div className="w-7 h-7 rounded-full overflow-hidden border border-white/15 flex-shrink-0">
              <img src={dbUser.avatar_url || 'https://via.placeholder.com/150'} alt="me" className="w-full h-full object-cover" />
            </div>
            <span className={`text-[11px] font-bold text-gray-200 tracking-wide transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] whitespace-nowrap overflow-hidden ${
              showToolbar ? 'max-w-0 opacity-0 ml-0' : 'max-w-[100px] opacity-100 ml-2.5'
            }`}>
              Профиль
            </span>
          </button>
        )}
      </div>

      {/* Окно детального просмотра профиля */}
      {selectedPlayer && (
        <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-32px)] max-w-md p-6 rounded-[32px] border border-white/10 shadow-2xl text-center space-y-5 animate-profile-grow overflow-visible transition-colors duration-300 ${selectedIsDead ? 'bg-[#0a0c0f]' : 'bg-[#14171c]'}`}>
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#c0ff00]/10 to-transparent pointer-events-none rounded-t-[32px]" />
          <button onClick={() => { setSelectedPlayer(null); setIsEditingProfile(false); setShowRoleSelector(false); }} className="absolute top-4 right-4 p-1.5 bg-white/5 border border-white/5 rounded-full text-gray-400 hover:text-white active:scale-90 transition-all z-10"><X size={14} /></button>

          {((selectedPlayer.id === dbUser?.id && !selectedIsDead) || isAdmin) && !isEditingProfile && (
            <button onClick={() => { setNewRpName(selectedPlayer.rp_name); setNewAvatarUrl(selectedPlayer.avatar_url || ''); setIsEditingProfile(true); }} className="absolute top-4 left-4 p-2 bg-white/5 border border-white/5 rounded-full text-gray-400 hover:text-[#c0ff00] active:scale-90 transition-all z-10"><Edit2 size={14} /></button>
          )}

          <div className={`relative w-24 h-24 rounded-full overflow-hidden bg-[#1c2026] border-2 mx-auto shadow-lg transition-all duration-300 ${selectedIsDead ? 'border-gray-600 opacity-60 grayscale' : 'border-[#c0ff00]'}`}>
            <img src={isEditingProfile ? newAvatarUrl : (selectedPlayer.avatar_url || 'https://via.placeholder.com/150')} alt="avatar" className="w-full h-full object-cover" />
          </div>

          <div className="space-y-2 w-full">
            {isEditingProfile ? (
              <div className="space-y-3 max-w-xs mx-auto w-full animate-fade-in">
                <input type="text" placeholder="Имя профиля" value={newRpName} onChange={(e) => setNewRpName(e.target.value)} className="ui-input text-center font-bold" />
                <label className="ui-pill-btn w-full justify-center !bg-white/5 !border-white/10 hover:!border-[#c0ff00]/40 cursor-pointer py-2.5 relative overflow-hidden">
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => handleFileUpload(e, setNewAvatarUrl, setIsUploadingProfile)} disabled={isUploadingProfile} />
                  <Upload size={14} className={isUploadingProfile ? "animate-bounce" : ""} />
                  <span className="font-medium text-xs">{isUploadingProfile ? 'Грузим файл...' : 'Загрузить из галереи'}</span>
                </label>
                <button onClick={saveProfileData} disabled={isUploadingProfile} className="ui-pill-btn w-full justify-center !bg-[#c0ff00] !text-black font-bold py-2.5 mt-2 disabled:opacity-50"><Save size={14} /><span>Сохранить всё</span></button>
              </div>
            ) : (
              <div className="w-full space-y-1">
                <h2 className={`text-2xl font-black tracking-wide break-all px-6 transition-all duration-300 ${selectedIsDead ? 'text-gray-500 line-through' : 'text-white'}`}>{selectedPlayer.rp_name}</h2>
                <p className="text-sm text-gray-400 font-mono tracking-tight break-all">{selectedPlayer.mc_nickname}</p>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5 rounded-full text-xs font-medium mt-1 ${selectedIsDead ? 'text-gray-500' : 'text-[#c0ff00]'}`}>
                  <span>🏛️ Партия:</span><span className="font-bold">{selectedPlayer.party || 'Нет партии'}</span>
                </div>
              </div>
            )}
          </div>

          <div className="w-full h-[1px] bg-white/5 my-2" />

          <div className="text-left space-y-2 w-full">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold pl-1">Роли и звания</div>
            <div className="flex flex-wrap gap-2 items-center relative">
              {selectedPlayer.roles.map((role, idx) => (
                <span key={idx} className={`text-xs font-bold py-1 rounded-full border transition-all flex items-center gap-1.5 ${isAdmin ? 'pl-3 pr-1' : 'px-3'} ${selectedIsDead && role.toLowerCase() !== 'мёртв' ? 'opacity-50 grayscale' : ''}`} style={{ backgroundColor: `${getRoleColor(role)}15`, color: getRoleColor(role), borderColor: `${getRoleColor(role)}30` }}>
                  <span>• {role.toUpperCase()}</span>
                  {isAdmin && <button onClick={() => handleRemoveRoleFromUser(role)} className="opacity-60 hover:opacity-100 hover:bg-white/10 rounded-full p-1 transition-all active:scale-90"><X size={10} /></button>}
                </span>
              ))}
              {isAdmin && (
                <div className="relative inline-block">
                  <button onClick={() => setShowRoleSelector(!showRoleSelector)} className="flex items-center justify-center w-6 h-6 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/40 transition-all active:scale-90 shadow-sm"><Plus size={14} /></button>
                  {showRoleSelector && (
                    <div className="absolute bottom-full left-0 mb-2 bg-[#14171c]/95 border border-white/10 rounded-2xl p-2 z-50 shadow-2xl min-w-[150px] flex flex-col gap-1 animate-fade-in backdrop-blur-xl">
                      <div className="text-[10px] text-gray-500 uppercase font-bold px-2 py-1">Выдать роль:</div>
                      {customRoles.filter(cr => !selectedPlayer.roles.includes(cr.name)).length === 0 && <div className="text-xs text-gray-500 px-2 py-1">Нет доступных ролей</div>}
                      {customRoles.filter(cr => !selectedPlayer.roles.includes(cr.name)).map((cr, idx) => (
                        <button key={idx} onClick={() => handleAddRoleToUser(cr.name)} className="text-xs text-left px-3 py-2.5 hover:bg-white/5 rounded-xl font-bold transition-all flex items-center gap-2 active:scale-95"><span className="w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0" style={{backgroundColor: cr.color}}></span><span className="truncate" style={{color: cr.color}}>{cr.name.toUpperCase()}</span></button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="p-4 pt-36 max-w-md mx-auto transition-all duration-300 w-full overflow-x-hidden break-words">
        
        {/* Вкладка ГЛАВНАЯ - ВИДЖЕТ СЕРВЕРА */}
        {activeTab === 'profile' && (
          <div className="space-y-4 animate-fade-in w-full">
            <div className="flex items-center justify-between w-full px-1">
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <Server size={18} className="text-[#c0ff00]" />
                Статус сервера
              </h2>
              <button 
                onClick={fetchServerStatus} 
                className={`p-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all active:scale-90 ${isServerLoading ? 'animate-spin' : ''}`}
              >
                <RefreshCw size={14} />
              </button>
            </div>

            <div className="bg-[#14171c] p-5 rounded-[28px] border border-white/5 shadow-2xl relative overflow-hidden">
              {/* Фоновое свечение в зависимости от статуса */}
              {serverInfo && (
                <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-20 rounded-full pointer-events-none transition-colors duration-700 ${getServerStatusText(serverInfo.status).bg}`} />
              )}

              <div className="space-y-5 relative z-10">
                {/* Статус */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Текущее состояние</div>
                    <div className={`text-xl font-black tracking-wider transition-colors duration-300 ${serverInfo ? getServerStatusText(serverInfo.status).color : 'text-gray-400'}`}>
                      {serverInfo ? getServerStatusText(serverInfo.status).text : 'ЗАГРУЗКА...'}
                    </div>
                  </div>
                  {serverInfo?.status === 1 && (
                    <div className="bg-black/30 border border-white/5 px-3 py-1.5 rounded-xl text-center">
                      <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Онлайн</div>
                      <div className="text-[#c0ff00] font-black text-sm">{serverInfo.players.count} / {serverInfo.players.max}</div>
                    </div>
                  )}
                </div>

                {/* IP адреса */}
                <div className="space-y-2">
                  <div className="bg-black/20 border border-white/5 p-3 rounded-2xl flex items-center justify-between group transition-all hover:border-white/10">
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Основной IP (Статика)</div>
                      <div className="font-mono text-sm text-gray-200 truncate">{staticIp}</div>
                    </div>
                    <button onClick={() => copyToClipboard(staticIp)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-[#c0ff00] transition-colors flex-shrink-0 active:scale-90 ml-2">
                      <Copy size={16} />
                    </button>
                  </div>

                  {serverInfo?.address && serverInfo.status === 1 && (
                    <div className="bg-black/20 border border-white/5 p-3 rounded-2xl flex items-center justify-between group transition-all hover:border-white/10">
                      <div className="min-w-0 flex-1">
                        <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Прямой IP (Резервный)</div>
                        <div className="font-mono text-xs text-gray-400 truncate">{serverInfo.address}</div>
                      </div>
                      <button onClick={() => copyToClipboard(serverInfo.address)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-[#c0ff00] transition-colors flex-shrink-0 active:scale-90 ml-2">
                        <Copy size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Кнопки управления (только для админов или если нужно всем — уберите isAdmin) */}
                {isAdmin && (
                  <div className="pt-2 flex gap-2">
                    <button 
                      onClick={() => handleServerAction('start')}
                      disabled={serverActionLoading || (serverInfo && serverInfo.status !== 0)}
                      className="flex-1 ui-pill-btn justify-center py-3 !bg-[#c0ff00]/10 !border-[#c0ff00]/30 !text-[#c0ff00] hover:!bg-[#c0ff00]/20 disabled:opacity-30 disabled:grayscale transition-all"
                    >
                      <Play size={14} className="fill-current" />
                      <span>Включить</span>
                    </button>
                    <button 
                      onClick={() => handleServerAction('stop')}
                      disabled={serverActionLoading || (serverInfo && serverInfo.status === 0)}
                      className="flex-1 ui-pill-btn justify-center py-3 !bg-red-500/10 !border-red-500/30 !text-red-500 hover:!bg-red-500/20 disabled:opacity-30 disabled:grayscale transition-all"
                    >
                      <Square size={14} className="fill-current" />
                      <span>Выключить</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {!isAdmin && (
              <p className="text-center text-[10px] text-gray-500 mt-4 px-4 leading-relaxed">
                Запускать и останавливать сервер могут только администраторы через этот пульт.
              </p>
            )}
          </div>
        )}

        {/* Остальные вкладки остаются без изменений... */}
        {activeTab === 'constitution' && (
          <div className="space-y-4 animate-fade-in w-full overflow-x-hidden">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-lg font-bold text-[#c0ff00] tracking-wide">Конституция Дома</h2>
              {canEditConstitution && !isEditing && (
                <button onClick={() => setIsEditing(true)} className="ui-pill-btn"><Edit2 size={12} /><span>Редактировать</span></button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-4 scale-100 w-full overflow-x-hidden pt-2">
                <div ref={editorRef} contentEditable suppressContentEditableWarning className="w-full min-h-[400px] bg-[#14171c] border border-white/5 focus:border-[#c0ff00]/40 rounded-[28px] p-5 text-base leading-relaxed text-gray-200 focus:outline-none transition-all shadow-inner prose prose-invert max-w-none break-words overflow-x-hidden" dangerouslySetInnerHTML={{ __html: constitution }} data-placeholder="Начните писать законы здесь..." />
              </div>
            ) : (
              <div className="bg-[#14171c] p-5 rounded-[28px] border border-white/5 text-base leading-relaxed max-w-none text-gray-300 prose prose-invert shadow-md break-words overflow-x-hidden w-full" dangerouslySetInnerHTML={{ __html: constitution }} />
            )}
          </div>
        )}

        {activeTab === 'players' && (
          <div className="space-y-6 animate-fade-in w-full">
            {dbUser && (
              <div className="space-y-2 w-full">
                <div className="text-xs text-[#c0ff00] uppercase tracking-wider font-extrabold pl-1">Мой личный профиль</div>
                <div onClick={() => { setIsEditingProfile(false); setSelectedPlayer(dbUser); }} className={`p-4 rounded-[28px] border flex items-center space-x-4 transition-all duration-300 cursor-pointer shadow-xl w-full active:scale-95 ${isDead(dbUser.roles) ? 'bg-[#0a0c0f] border-white/5 opacity-70 grayscale' : 'bg-gradient-to-r from-[#14171c] to-[#1c2026] border-[#c0ff00]/40 shadow-[#c0ff00]/5 hover:border-[#c0ff00]/60'}`}>
                  <div className={`w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-[#1c2026] border-2 ${isDead(dbUser.roles) ? 'border-gray-600' : 'border-[#c0ff00]'}`}>
                    <img src={dbUser.avatar_url || 'https://via.placeholder.com/150'} alt="avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-black truncate tracking-wide ${isDead(dbUser.roles) ? 'text-gray-500 line-through' : 'text-[#c0ff00]'}`}>{dbUser.rp_name}</span>
                    </div>
                    <div className="text-xs text-gray-400 truncate font-mono tracking-tight">{dbUser.mc_nickname}</div>
                    <div className="text-[11px] text-gray-400 font-medium mt-0.5 truncate">🏛️ {dbUser.party || 'Нет партии'}</div>
                  </div>
                  <div className="flex-shrink-0 text-gray-500"><Edit2 size={16} className={isDead(dbUser.roles) ? "text-gray-600" : "text-[#c0ff00]/80"} /></div>
                </div>
              </div>
            )}

            <div className="space-y-3 w-full">
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold pl-1">Жители сервера</div>
              <div className="grid grid-cols-1 gap-3 w-full">
                {sortedPlayers.map((player) => {
                  const dead = isDead(player.roles);
                  return (
                    <div key={player.id} onClick={() => { setIsEditingProfile(false); setSelectedPlayer(player); }} className={`p-4 rounded-[28px] flex items-center space-x-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-md active:scale-[0.99] w-full border ${dead ? 'bg-[#0a0c0f] border-transparent opacity-60 grayscale-[50%]' : 'bg-[#14171c] border-white/5 hover:border-white/20 hover:bg-[#1a1e24]'}`}>
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1c2026] border border-white/10 flex-shrink-0">
                        <img src={player.avatar_url || 'https://via.placeholder.com/150'} alt="avatar" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-black truncate tracking-wide ${dead ? 'text-gray-500 line-through' : 'text-white'}`}>{player.rp_name}</div>
                        <div className="text-xs text-gray-400 truncate font-mono tracking-tight">{player.mc_nickname}</div>
                        <div className="text-[11px] text-gray-500 font-medium mt-0.5 truncate">🏛️ {player.party || 'Нет партии'}</div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {player.roles.slice(0, 1).map((r, i) => (
                          <span key={i} className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full border" style={{ backgroundColor: `${getRoleColor(r)}10`, color: getRoleColor(r), borderColor: `${getRoleColor(r)}25` }}>{r}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-6 animate-fade-in w-full">
            <div className="bg-[#14171c] p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider"><UserPlus size={16} /><span>Добавить жителя</span></div>
              <div className="space-y-3">
                <input type="number" placeholder="Telegram ID" value={addTgId} onChange={e => setAddTgId(e.target.value)} className="ui-input"/>
                <input type="text" placeholder="Telegram Username" value={addTgUsername} onChange={e => setAddTgUsername(e.target.value)} className="ui-input"/>
                <input type="text" placeholder="Minecraft Никнейм" value={addMcNickname} onChange={e => setAddMcNickname(e.target.value)} className="ui-input"/>
                <input type="text" placeholder="RP Имя" value={addRpName} onChange={e => setAddRpName(e.target.value)} className="ui-input"/>
                <input type="text" placeholder="Политическая партия" value={addParty} onChange={e => setAddParty(e.target.value)} className="ui-input"/>
                <label className="ui-pill-btn w-full justify-center !bg-[#1c2026] !border-white/10 hover:!border-[#c0ff00]/40 cursor-pointer py-3 relative overflow-hidden">
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => handleFileUpload(e, setAddAvatarUrl, setIsUploadingNewUser)} disabled={isUploadingNewUser}/>
                  <Upload size={16} className={isUploadingNewUser ? "animate-bounce" : (addAvatarUrl ? "text-[#c0ff00]" : "")} />
                  <span className="font-medium">{isUploadingNewUser ? 'Загрузка фото...' : (addAvatarUrl ? 'Фото загружено ✅' : 'Загрузить аватарку из галереи')}</span>
                </label>
              </div>
              <button onClick={handleAddPlayer} disabled={isUploadingNewUser} className="ui-pill-btn w-full justify-center !bg-[#c0ff00] !text-black py-3 disabled:opacity-50"><Check size={16} /><span>Создать аккаунт</span></button>
            </div>

            <div className="bg-[#14171c] p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider"><ShieldCheck size={16} /><span>Управление ролями</span></div>
              <div className="p-4 bg-black/20 rounded-[20px] border border-white/5 space-y-3">
                <input type="text" placeholder="Название новой роли" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} className="ui-input"/>
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2 text-xs text-gray-400"><Palette size={14} /><span>Цвет роли:</span><input type="color" value={newRoleColor} onChange={e => setNewRoleColor(e.target.value)} className="w-6 h-6 rounded bg-transparent border-none cursor-pointer" /></div>
                  <label className="flex items-center space-x-2 text-xs text-gray-400 cursor-pointer"><input type="checkbox" checked={newRolePerm} onChange={e => setNewRolePerm(e.target.checked)} className="rounded border-white/10 bg-transparent text-[#c0ff00] focus:ring-0"/><span>Ред. законов</span></label>
                </div>
                <button onClick={handleCreateRole} className="ui-pill-btn w-full justify-center py-2"><UserPlus size={14} /><span>Создать роль</span></button>
              </div>
              <div className="space-y-3">
                {customRoles.map((role, idx) => (
                  <div key={idx} className="flex flex-col gap-2 p-3.5 bg-black/10 rounded-[18px] border border-white/5 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 mr-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: role.color }} />
                        <input type="text" value={role.name.toUpperCase()} onChange={e => handleRenameRole(idx, e.target.value)} className="bg-transparent border-none text-sm font-bold tracking-wide focus:outline-none focus:border-b focus:border-[#c0ff00] p-0 m-0 w-full" style={{ color: role.color }}/>
                      </div>
                      <div className="flex items-center space-x-3 flex-shrink-0">
                        <label className="flex items-center space-x-1.5 text-[11px] text-gray-400 cursor-pointer">
                          <input type="checkbox" checked={role.canEditConstitution} onChange={() => handleToggleRolePerm(idx)} className="rounded border-white/10 bg-transparent text-[#c0ff00] focus:ring-0"/><span>Законы</span>
                        </label>
                        <input type="color" value={role.color} onChange={e => handleUpdateRoleColor(idx, e.target.value)} className="w-5 h-5 bg-transparent border-none cursor-pointer rounded"/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-6 left-6 right-6 bg-[#14171c]/70 backdrop-blur-xl border border-white/10 py-3 rounded-full z-50 shadow-2xl max-w-md mx-auto transition-all">
        <div className={`grid w-full items-center justify-items-center ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <button onClick={() => handleTabChange('profile')} className={`flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'profile' && !selectedPlayer ? 'text-[#c0ff00] scale-105' : 'text-gray-500 hover:text-gray-300'}`}>
            <User size={20} />
            <span className="text-[10px] font-medium tracking-wide mt-1">Главная</span>
          </button>
          <button onClick={() => handleTabChange('constitution')} className={`flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'constitution' ? 'text-[#c0ff00] scale-105' : 'text-gray-500 hover:text-gray-300'}`}>
            <BookOpen size={20} />
            <span className="text-[10px] font-medium tracking-wide mt-1">Законы</span>
          </button>
          <button onClick={() => handleTabChange('players')} className={`flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'players' || selectedPlayer ? 'text-[#c0ff00] scale-105' : 'text-gray-500 hover:text-gray-300'}`}>
            <Users size={20} />
            <span className="text-[10px] font-medium tracking-wide mt-1">Игроки</span>
          </button>
          {isAdmin && (
            <button onClick={() => handleTabChange('admin')} className={`flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'admin' ? 'text-[#c0ff00] scale-105' : 'text-gray-500 hover:text-gray-300'}`}>
              <ShieldAlert size={20} />
              <span className="text-[10px] font-medium tracking-wide mt-1">Админ</span>
            </button>
          )}
        </div>
      </nav>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap');
        body, html, button, input, textarea, div, span { font-family: 'Google Sans', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif !important; max-w-full; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes profileGrow { from { opacity: 0; transform: translate(-50%, -40%) scale(0.9); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
        .animate-fade-in { animation: fadeIn 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
        .animate-profile-grow { animation: profileGrow 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
        [contenteditable]:empty:before { content: attr(data-placeholder); color: #4b5563; cursor: text; }
        .ui-pill-btn { background-color: rgba(20, 23, 28, 0.85); border: 1px solid rgba(255, 255, 255, 0.08); padding: 8px 16px; border-radius: 9999px; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #e5e7eb; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; }
        .ui-pill-btn:hover { border-color: rgba(192, 255, 0, 0.3); color: #ffffff; box-shadow: 0 10px 25px -5px rgba(192, 255, 0, 0.05); }
        .ui-pill-btn:active { transform: scale(0.94); }
        .ui-input { width: 100%; background-color: rgba(0, 0, 0, 0.25); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 16px; padding: 12px 16px; font-size: 13px; color: #ffffff; outline: none; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
        .ui-input:focus { border-color: rgba(192, 255, 0, 0.4); background-color: rgba(0, 0, 0, 0.4); box-shadow: 0 0 0 1px rgba(192, 255, 0, 0.1); }
        .prose, .prose * { word-break: break-word !important; overflow-wrap: break-word !important; max-w-full !important; white-space: pre-wrap !important; }
        .prose h1 { font-size: 1.5rem; font-weight: 800; color: #ffffff; margin-top: 1rem; margin-bottom: 0.5rem; }
        .prose h2 { font-size: 1.25rem; font-weight: 700; color: #c0ff00; margin-top: 0.8rem; margin-bottom: 0.4rem; }
        .prose p { margin-bottom: 0.75rem; color: #d1d5db; }
        .prose b, .prose strong { color: #ffffff; font-weight: 700; }
        .prose i, .prose em { color: #e5e7eb; font-style: italic; }
      `}</style>
    </div>
  );
}
