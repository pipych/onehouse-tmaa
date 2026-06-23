'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  User, BookOpen, Users, Edit2, Check, X, ShieldAlert, UserPlus, ShieldCheck, Palette, Save,
  Bold, Italic, Strikethrough, Heading1, Heading2, AlignLeft, AlignCenter, Plus, Upload,
  Copy, Play, Square, Server, RefreshCw, Coins, Search, ChevronUp, ChevronDown, ArrowUp,
  Info, ArrowLeft, Home as HomeIcon, Map
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
  id?: string;
  name: string;
  color: string;
  canEditConstitution: boolean;
}

export default function Home() {
  const [tgUser, setTgUser] = useState<any>(null);
  const [dbUser, setDbUser] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'profile' | 'constitution' | 'players' | 'admin' | 'map'>('profile');
  const [players, setPlayers] = useState<Player[]>([]);
  
  const [constitutionText, setConstitutionText] = useState('');
  const [commandmentsText, setCommandmentsText] = useState('');
  const [activeDocument, setActiveDocument] = useState<'none' | 'constitution' | 'commandments'>('none');
  const [isEditing, setIsEditing] = useState(false);
  
  const [newRpName, setNewRpName] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const [showTooltip, setShowTooltip] = useState<'none' | 'constitution' | 'commandments'>('none');

  const [searchQuery, setSearchQuery] = useState('');
  const [matches, setMatches] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false); 

  const [formats, setFormats] = useState({
    bold: false, italic: false, strikeThrough: false, h1: false, h2: false, justifyLeft: false, justifyCenter: false
  });

  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingNewUser, setIsUploadingNewUser] = useState(false);

  const [serverInfo, setServerInfo] = useState<any>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [isServerLoading, setIsServerLoading] = useState(false);
  const [serverActionLoading, setServerActionLoading] = useState(false);
  
  const staticIp = "onehouse2.exaroton.me:15879"; 

  const [addTgId, setAddTgId] = useState('');
  const [addTgUsername, setAddTgUsername] = useState('');
  const [addMcNickname, setAddMcNickname] = useState('');
  const [addRpName, setAddRpName] = useState('');
  const [addAvatarUrl, setAddAvatarUrl] = useState('');
  const [addParty, setAddParty] = useState('');
  const [addRoles, setAddRoles] = useState<string[]>(['citizen']);

  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#c0ff00');
  const [newRolePerm, setNewRolePerm] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
      setShowScrollTop(window.scrollY > window.innerHeight * 1.5);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tg = (window as any).Telegram?.WebApp;

    if (tg && tg.initDataUnsafe?.user?.id) {
      tg.ready();
      tg.expand(); 
      if (typeof tg.requestFullscreen === 'function') {
        tg.requestFullscreen();
      }
      if (typeof tg.setHeaderColor === 'function') tg.setHeaderColor('#090b0e');
      if (typeof tg.setBackgroundColor === 'function') tg.setBackgroundColor('#090b0e');
      
      const userFromTg = tg.initDataUnsafe.user;
      setTgUser(userFromTg);
      checkUserInDb(userFromTg.id);
    } else {
      setError('Пожалуйста, откройте приложение внутри Telegram.');
      setLoading(false);
    }
  }, []);

  const fetchServerStatus = async () => {
    setIsServerLoading(true);
    try {
      const res = await fetch('/api/exaroton');
      const data = await res.json();
      if (data.success) {
        setServerInfo(data.data.server || data.data);
        setCredits(data.data.credits ?? null);
      }
    } catch (e) {
      console.error('Ошибка получения статуса сервера:', e);
    } finally {
      setIsServerLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'profile') {
      fetchServerStatus();
      const intervalId = setInterval(() => fetchServerStatus(), 3600000); 
      return () => clearInterval(intervalId);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isEditing && editorRef.current) {
      editorRef.current.innerHTML = activeDocument === 'constitution' ? constitutionText : commandmentsText;
    }
  }, [isEditing, activeDocument]);

  const checkFormatting = () => {
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
  };

  const execEditorCommand = (command: string, value: string = '') => {
    if (typeof document !== 'undefined') {
      if (command === 'formatBlock') {
        const currentBlock = document.queryCommandValue('formatBlock')?.toLowerCase() || '';
        const valLower = value.toLowerCase();
        
        if ((valLower === 'h1' && currentBlock.includes('h1')) || 
            (valLower === 'h2' && currentBlock.includes('h2'))) {
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
  };

  const currentDocText = activeDocument === 'constitution' ? constitutionText : commandmentsText;

  useEffect(() => {
    if (!viewRef.current || activeTab !== 'constitution' || isEditing || activeDocument === 'none') return;

    const children = Array.from(viewRef.current.children) as HTMLElement[];
    children.forEach((child) => {
      child.style.transition = 'all 0.3s ease';
      child.style.backgroundColor = '';
      child.style.boxShadow = '';
      child.style.borderRadius = '';
      child.style.transform = '';
      child.style.opacity = '1';
    });

    if (!searchQuery.trim()) {
      setMatches([]);
      setCurrentMatchIndex(0);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fuzzyRegex = new RegExp(safeQuery.split('').join('.*?'), 'i');

    const foundIndices: number[] = [];

    children.forEach((child, index) => {
      const text = child.textContent?.toLowerCase() || '';
      if (!text.trim()) return;

      let score = 0;
      if (text.includes(query)) score += 100;
      else if (query.length >= 3 && fuzzyRegex.test(text)) score += 10;

      if (score > 0) {
        foundIndices.push(index);
        child.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        child.style.borderRadius = '8px';
      } else {
        child.style.opacity = '0.3';
      }
    });

    setMatches(foundIndices);
    setCurrentMatchIndex(foundIndices.length > 0 ? 1 : 0);
  }, [searchQuery, currentDocText, activeTab, isEditing, activeDocument]);

  useEffect(() => {
    if (matches.length === 0 || currentMatchIndex === 0 || !viewRef.current) return;

    const children = Array.from(viewRef.current.children) as HTMLElement[];
    matches.forEach(idx => {
      const el = children[idx];
      if (el) {
        el.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        el.style.boxShadow = '';
        el.style.transform = '';
      }
    });

    const activeIdx = matches[currentMatchIndex - 1];
    const activeEl = children[activeIdx];
    
    if (activeEl) {
      activeEl.style.backgroundColor = 'rgba(192, 255, 0, 0.15)';
      activeEl.style.boxShadow = '0 0 0 6px rgba(192, 255, 0, 0.15)';
      activeEl.style.transform = 'scale(1.02)';
      activeEl.style.borderRadius = '8px';

      setTimeout(() => {
        const yOffset = activeEl.getBoundingClientRect().top + window.pageYOffset - 160;
        window.scrollTo({ top: yOffset, behavior: 'smooth' });
      }, 50);
    }
  }, [currentMatchIndex, matches]);

  const nextMatch = () => setCurrentMatchIndex(prev => prev < matches.length ? prev + 1 : 1);
  const prevMatch = () => setCurrentMatchIndex(prev => prev > 1 ? prev - 1 : matches.length);

  const handleServerAction = async (action: 'start' | 'stop') => {
    setServerActionLoading(true);
    try {
      const res = await fetch('/api/exaroton', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) setTimeout(fetchServerStatus, 3000);
      else alert('Не удалось выполнить действие: ' + (data.error || 'Неизвестная ошибка'));
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
        loadRoles();
        loadPlayers();
        loadConstitution();
      }
    } catch (e: any) {
      setError(`Ошибка базы данных: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    const { data } = await supabase.from('roles').select('*').order('name');
    if (data) {
      setCustomRoles(data.map((r: any) => ({
        id: r.id,
        name: r.name,
        color: r.color,
        canEditConstitution: r.can_edit_constitution
      })));
    }
  };

  const loadPlayers = async () => {
    const { data } = await supabase.from('users').select('*').order('rp_name', { ascending: true });
    if (data) setPlayers(data);
  };

  const loadConstitution = async () => {
    const { data, error } = await supabase.from('constitution').select('*').in('id', [1, 2]);
    if (data) {
      const constDoc = data.find((d: any) => d.id === 1);
      const cmdDoc = data.find((d: any) => d.id === 2);
      if (constDoc) setConstitutionText(constDoc.content || '');
      if (cmdDoc) setCommandmentsText(cmdDoc.content || '');
    }
  };

  const saveDocument = async () => {
    if (!editorRef.current || activeDocument === 'none') return;
    
    const updatedContent = editorRef.current.innerHTML;
    const docId = activeDocument === 'constitution' ? 1 : 2;
    
    const { error } = await supabase.from('constitution').upsert({ id: docId, content: updatedContent });
    
    if (!error) {
      if (activeDocument === 'constitution') {
        setConstitutionText(updatedContent);
      } else {
        setCommandmentsText(updatedContent);
      }
      setIsEditing(false);
    } else {
      alert(`Ошибка сохранения. Ошибка: ${error.message}`);
    }
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

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    const newRole = { name: newRoleName.toLowerCase(), color: newRoleColor, can_edit_constitution: newRolePerm };
    const { error } = await supabase.from('roles').insert([newRole]);
    if (!error) {
      setNewRoleName('');
      setNewRolePerm(false);
      loadRoles();
    } else {
      alert(`Ошибка: Имя роли должно быть уникальным`);
    }
  };

  const handleRoleChange = (id: string, field: string, value: any) => {
    setCustomRoles(roles => roles.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const saveRoleToDb = async (role: CustomRole) => {
    if (!role.id) return;
    await supabase.from('roles').update({
      name: role.name,
      color: role.color,
      can_edit_constitution: role.canEditConstitution
    }).eq('id', role.id);
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

  const handleTabChange = (tab: 'profile' | 'constitution' | 'players' | 'admin' | 'map') => {
    setSelectedPlayer(null); setIsEditingProfile(false); setShowRoleSelector(false); 
    setActiveTab(tab);
    setActiveDocument('none'); 
    setIsEditing(false);
    setSearchQuery('');
  };

  const isAdmin = dbUser?.roles.includes('admin');

  const canEditConstitution = dbUser?.roles.some(r => {
    const found = customRoles.find(cr => cr.name.toLowerCase() === r.toLowerCase());
    return found ? found.canEditConstitution : false;
  });

  const getRoleColor = (roleName: string) => {
    const found = customRoles.find(cr => cr.name.toLowerCase() === roleName.toLowerCase());
    return found ? found.color : '#888888';
  };

  const isDead = (roles: string[]) => roles.some(r => r.toLowerCase() === 'мёртв');

  const showToolbar = isEditing && activeTab === 'constitution' && activeDocument !== 'none' && !selectedPlayer;

  const sortedPlayers = players
    .filter((player) => player.tg_id !== dbUser?.tg_id)
    .sort((a, b) => {
      const aDead = isDead(a.roles); const bDead = isDead(b.roles);
      if (aDead && !bDead) return 1;
      if (!aDead && bDead) return -1;
      return a.rp_name.localeCompare(b.rp_name);
    });

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
        <div className="bg-[#14171c] p-6 rounded-3xl border border-red-500/30 max-w-md md:max-w-xl w-full break-words shadow-2xl scale-95 transition-all">
          <div className="text-red-500 font-bold text-lg mb-2">Авторизация не удалась</div>
          <div className="text-sm text-gray-400 font-mono text-left bg-black/30 p-3 rounded-lg border border-white/5 whitespace-pre-wrap">{error}</div>
        </div>
      </div>
    );
  }

  const selectedIsDead = selectedPlayer ? isDead(selectedPlayer.roles) : false;

  return (
    <div className="min-h-screen text-white pb-32 md:pb-8 antialiased selection:bg-[#c0ff00] selection:text-black transition-colors duration-300 w-full max-w-full relative z-0 flex flex-col">
      
      {/* ФОН ДЛЯ ТЕЛЕФОНОВ */}
      <div className="fixed inset-0 bg-[#090b0e] -z-10 md:hidden" />
      
      {/* ЖИВЫЕ ОБОИ ДЛЯ ПК */}
      <div className="fixed inset-0 -z-10 hidden md:block bg-[#090b0e]">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover">
          <source src="/bg-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#090b0e]/85 backdrop-blur-[2px]" />
      </div>

      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${selectedPlayer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => { setSelectedPlayer(null); setIsEditingProfile(false); setShowRoleSelector(false); }} />
      
      <div className="fixed top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#090b0e] via-[#090b0e]/95 to-transparent pointer-events-none z-30 w-full" />

      {/* Модальное окно справки для Мобилок */}
      {showTooltip !== 'none' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in md:hidden" onClick={() => setShowTooltip('none')}>
          <div className="bg-[#14171c] border border-white/10 rounded-[32px] p-6 max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowTooltip('none')} className="absolute top-5 right-5 p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all active:scale-90"><X size={16}/></button>
            <div className="flex items-center gap-3 mb-4 pr-8">
              <div className="p-2.5 bg-[#c0ff00]/10 rounded-full text-[#c0ff00]"><Info size={20}/></div>
              <h3 className="font-black text-white text-xl tracking-wide">{showTooltip === 'constitution' ? 'Конституция' : 'Заповеди дома'}</h3>
            </div>
            <p className="text-[13px] text-gray-300 leading-relaxed bg-black/20 p-4 rounded-2xl border border-white/5">
              {showTooltip === 'constitution'
                ? 'Это РП законы. Все законы внутри этого документа могут изменяться общим голосованием игроков в процессе игры.'
                : 'Это внеигровые правила, которые нельзя нарушать для сохранения баланса игры. Никакое оправдание под предлогом РП не принимается, все кто нарушат — дураки.'}
            </p>
          </div>
        </div>
      )}

      {/* Верхний док управления */}
      <div className="fixed top-[96px] left-4 right-4 md:left-32 md:right-8 z-40 max-w-md md:max-w-[1200px] mx-auto flex items-center justify-end gap-2 pointer-events-none">
        
        {/* Кнопка сохранения */}
        <div className={`transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden flex items-center justify-center ${showToolbar ? 'w-10 opacity-100 scale-100 translate-x-0' : 'w-0 opacity-0 scale-50 -translate-x-8 pointer-events-none'}`}>
          <button onClick={saveDocument} className="pointer-events-auto bg-[#c0ff00] text-black w-10 h-10 rounded-full shadow-lg flex items-center justify-center flex-shrink-0 hover:scale-105 active:scale-95 transition-transform">
            <Save size={16} />
          </button>
        </div>

        {/* Кнопка Профиля (Только на телефонах) */}
        {dbUser && !selectedPlayer && (
          <button
            onClick={() => { setIsEditingProfile(false); setSelectedPlayer(dbUser); }}
            className={`md:hidden flex items-center bg-[#14171c]/90 border border-white/10 rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-2xl hover:border-[#c0ff00]/30 backdrop-blur-md pointer-events-auto flex-shrink-0 relative h-10 box-border z-50 ${
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

      {/* ОТДЕЛЬНАЯ ПАНЕЛЬ ФОРМАТИРОВАНИЯ */}
      <div className={`fixed z-50 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center justify-center pointer-events-none
        ${showToolbar ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-12 md:-translate-y-4'}
        bottom-2 left-2 right-2          
        md:bottom-auto md:top-[96px] md:left-1/2 md:-translate-x-1/2 md:w-auto 
      `}>
        <div className="p-1.5 bg-[#14171c]/95 border border-white/10 rounded-2xl md:rounded-full shadow-2xl backdrop-blur-md flex items-center gap-1 pointer-events-auto w-full md:w-auto overflow-x-auto no-scrollbar justify-start md:justify-center">
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('bold')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 flex-shrink-0 ${formats.bold ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 hover:text-[#c0ff00]'}`}><Bold size={14}/></button>
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('italic')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 flex-shrink-0 ${formats.italic ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 hover:text-[#c0ff00]'}`}><Italic size={14}/></button>
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('strikeThrough')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 flex-shrink-0 ${formats.strikeThrough ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 hover:text-[#c0ff00]'}`}><Strikethrough size={14}/></button>
          <div className="w-[1px] h-3.5 bg-white/10 mx-0.5 flex-shrink-0" />
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('formatBlock', 'H1')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 flex-shrink-0 ${formats.h1 ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 hover:text-[#c0ff00]'}`}><Heading1 size={14}/></button>
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('formatBlock', 'H2')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 flex-shrink-0 ${formats.h2 ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 hover:text-[#c0ff00]'}`}><Heading2 size={14}/></button>
          <div className="w-[1px] h-3.5 bg-white/10 mx-0.5 flex-shrink-0" />
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('justifyLeft')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 flex-shrink-0 ${formats.justifyLeft ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 hover:text-[#c0ff00]'}`}><AlignLeft size={14}/></button>
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('justifyCenter')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 flex-shrink-0 ${formats.justifyCenter ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 hover:text-[#c0ff00]'}`}><AlignCenter size={14}/></button>
          <button onMouseDown={e => e.preventDefault()} onClick={() => setIsEditing(false)} className="p-1.5 text-gray-500 hover:text-red-400 rounded-xl md:rounded-full transition-colors ml-auto active:scale-75 flex-shrink-0"><X size={14} /></button>
        </div>
      </div>

      {/* Окно профиля */}
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

      {/* ГЛАВНЫЙ КОНТЕЙНЕР */}
      <main className="p-4 pt-36 pb-24 md:pb-12 md:pl-[120px] max-w-md md:max-w-6xl mx-auto transition-all duration-300 w-full flex-grow flex flex-col">
        
        {/* ГЛАВНАЯ (Виджет Сервера, Конституция, Карта) */}
        {activeTab === 'profile' && (
          <div className="space-y-6 w-full animate-fade-in">
            <div className="flex items-center justify-between w-full px-1">
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <HomeIcon size={18} className="text-[#c0ff00]" />
                Главная панель
              </h2>
            </div>

            <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
              
              {/* СЕРВЕР ВИДЖЕТ */}
              <div className="w-full xl:max-w-[480px] space-y-4">
                 {/* Заголовок и кнопка обновления */}
                 <div className="flex items-center justify-between w-full px-1">
                    <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                      <Server size={18} className="text-[#c0ff00]" />
                      Статус сервера
                    </h2>
                    <button onClick={fetchServerStatus} className={`p-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all active:scale-90 ${isServerLoading ? 'animate-spin' : ''}`}>
                      <RefreshCw size={14} />
                    </button>
                 </div>

                 {/* Карточка */}
                 <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] md:rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden">
                    {serverInfo && <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-20 rounded-full pointer-events-none transition-colors duration-700 ${getServerStatusText(serverInfo.status).bg}`} />}
                    
                    <div className="relative z-10 flex flex-col gap-4">
                      
                      {/* Состояние */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Текущее состояние</div>
                          <div className={`text-base md:text-lg font-black tracking-wider transition-colors duration-300 ${serverInfo ? getServerStatusText(serverInfo.status).color : 'text-gray-400'}`}>
                            {serverInfo ? getServerStatusText(serverInfo.status).text : 'ЗАГРУЗКА...'}
                          </div>
                        </div>
                        {serverInfo?.status === 1 && (
                          <div className="bg-black/30 border border-white/5 px-3 py-1.5 rounded-xl text-center">
                            <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Онлайн</div>
                            <div className="text-[#c0ff00] font-black text-sm leading-none">{serverInfo.players.count} / {serverInfo.players.max}</div>
                          </div>
                        )}
                      </div>

                      {/* Информационная сетка */}
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

                        <div className="grid grid-cols-2 gap-2">
                           <div className="bg-black/20 border border-white/5 p-3 rounded-2xl flex items-center gap-2 group transition-all hover:border-white/10">
                             <div className="p-1.5 bg-[#a1a1aa]/10 rounded-lg text-[#a1a1aa] shrink-0"><AnvilIcon size={16} /></div>
                             <div className="min-w-0">
                               <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Версия</div>
                               <div className="font-bold text-xs text-white truncate">Forge <span className="text-gray-400">1.20.1</span></div>
                             </div>
                           </div>
                           {credits !== null && (
                           <div className="bg-black/20 border border-white/5 p-3 rounded-2xl flex items-center gap-2 group transition-all hover:border-white/10">
                             <div className="p-1.5 bg-[#c0ff00]/10 rounded-lg text-[#c0ff00] shrink-0"><Coins size={16} /></div>
                             <div className="min-w-0">
                               <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">{credits.toFixed(2)} кр.</div>
                               <div className="font-mono text-xs text-[#c0ff00] truncate">{Math.floor(credits / 7)}ч {Math.floor(((credits % 7) / 7) * 60)}м</div>
                             </div>
                           </div>
                           )}
                        </div>
                      </div>

                      {/* Кнопки */}
                      <div className="flex gap-2 pt-1">
                        <button 
                          onClick={() => handleServerAction('start')}
                          disabled={serverActionLoading || (serverInfo && serverInfo.status !== 0)}
                          className="flex-1 ui-pill-btn justify-center py-2.5 md:py-3 !bg-[#c0ff00]/10 !border-[#c0ff00]/30 !text-[#c0ff00] hover:!bg-[#c0ff00]/20 disabled:opacity-30 disabled:grayscale transition-all"
                        >
                          <Play size={14} className="fill-current" />
                          <span>Включить</span>
                        </button>
                        <button 
                          onClick={() => handleServerAction('stop')}
                          disabled={serverActionLoading || (serverInfo && serverInfo.status === 0)}
                          className="flex-1 ui-pill-btn justify-center py-2.5 md:py-3 !bg-red-500/10 !border-red-500/30 !text-red-500 hover:!bg-red-500/20 disabled:opacity-30 disabled:grayscale transition-all"
                        >
                          <Square size={14} className="fill-current" />
                          <span>Выключить</span>
                        </button>
                      </div>

                    </div>
                 </div>
              </div>

              {/* ПРАВАЯ КОЛОНКА (ВИДЖЕТЫ КОНСТИТУЦИИ И КАРТЫ) */}
              <div className="w-full xl:max-w-[320px] shrink-0 space-y-4">
                 <div className="hidden xl:block h-[26px]"></div> 
                 
                 <div className="flex flex-col sm:flex-row xl:flex-col gap-4 w-full">
                   
                   {/* ВИДЖЕТ КОНСТИТУЦИИ */}
                   <div 
                      onClick={() => {
                        setActiveTab('constitution');
                        setActiveDocument('constitution');
                      }}
                      className="group relative overflow-hidden bg-[#14171c]/90 backdrop-blur-xl rounded-[28px] border border-white/5 hover:border-[#c0ff00]/40 transition-all cursor-pointer shadow-xl flex flex-row xl:flex-col items-center justify-start xl:justify-center w-full h-[110px] xl:h-[180px] p-5 flex-1"
                    >
                      <div 
                        className="absolute inset-0 z-0 opacity-30 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500 bg-[right_-10px_center] bg-[length:120px] xl:bg-[right_-20px_bottom_-20px] xl:bg-[length:180px] bg-no-repeat"
                        style={{ backgroundImage: "url('/1000024917.png')", imageRendering: "pixelated" }} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#14171c] via-[#14171c]/90 to-transparent xl:bg-gradient-to-t xl:from-[#14171c] xl:via-[#14171c]/80 xl:to-transparent z-0" />

                      <div className="relative z-10 flex items-center xl:flex-col xl:text-center w-full">
                        <div className="w-12 h-12 xl:w-14 xl:h-14 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mb-0 xl:mb-3 mr-4 xl:mr-0 group-hover:scale-110 transition-transform backdrop-blur-md shrink-0">
                          <BookOpen size={20} className="text-[#c0ff00] xl:w-6 xl:h-6" />
                        </div>
                        <div className="text-left xl:text-center flex-1">
                          <h3 className="text-base xl:text-lg font-black text-white mb-0.5 xl:mb-1 tracking-wide drop-shadow-md">Конституция</h3>
                          <p className="text-[10px] text-[#c0ff00] font-medium leading-tight drop-shadow-md max-w-[150px] xl:max-w-none">Внутриигровые законы</p>
                        </div>
                      </div>
                    </div>

                    {/* ВИДЖЕТ КАРТЫ С ПЛАШКОЙ SOON */}
                    <div 
                      onClick={() => handleTabChange('map')}
                      className="group/widget relative overflow-hidden bg-[#14171c]/90 backdrop-blur-xl rounded-[28px] border border-white/5 hover:border-[#c0ff00]/40 transition-all cursor-pointer shadow-xl flex flex-row xl:flex-col items-center justify-start xl:justify-center w-full h-[110px] xl:h-[180px] p-5 flex-1"
                    >
                      {/* ПЛАШКА SOON С ПОДСКАЗКОЙ */}
                      <div className="absolute top-4 right-4 z-30 group/badge">
                        <div className="bg-[#c0ff00] text-black text-[9px] font-black uppercase px-2 py-1 rounded-md shadow-lg cursor-help">Soon</div>
                        <div className="hidden xl:block absolute top-[calc(100%+8px)] right-0 w-[180px] p-2 bg-[#1a1e24] border border-[#c0ff00]/30 rounded-xl text-[10px] font-medium text-gray-300 opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50 text-center leading-tight">
                          Функционал в разработке, появится позже
                        </div>
                      </div>

                      {/* ФОНОВАЯ КАРТИНКА (mapicon.svg) */}
                      <div 
                        className="absolute inset-0 z-0 opacity-20 group-hover/widget:opacity-30 group-hover/widget:scale-105 transition-all duration-500 bg-[right_-10px_center] bg-[length:120px] xl:bg-[right_-20px_bottom_-20px] xl:bg-[length:180px] bg-no-repeat grayscale"
                        style={{ backgroundImage: "url('/mapicon.svg')" }} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#14171c] via-[#14171c]/90 to-transparent xl:bg-gradient-to-t xl:from-[#14171c] xl:via-[#14171c]/80 xl:to-transparent z-0" />

                      <div className="relative z-10 flex items-center xl:flex-col xl:text-center w-full">
                        <div className="w-12 h-12 xl:w-14 xl:h-14 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mb-0 xl:mb-3 mr-4 xl:mr-0 group-hover/widget:scale-110 transition-transform backdrop-blur-md shrink-0">
                          <Map size={20} className="text-gray-400 xl:w-6 xl:h-6" />
                        </div>
                        <div className="text-left xl:text-center flex-1">
                          <h3 className="text-base xl:text-lg font-bold text-gray-300 m-0 tracking-wide drop-shadow-md">Карта мира</h3>
                        </div>
                      </div>
                    </div>

                 </div>
              </div>

            </div>
          </div>
        )}

        {/* ЗАКОНЫ И ДОКУМЕНТЫ */}
        {activeTab === 'constitution' && (
          <div className="space-y-4 animate-fade-in w-full relative flex-grow flex flex-col">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                {activeDocument !== 'none' && !isEditing && (
                  <button 
                    onClick={() => setActiveDocument('none')} 
                    className="p-1.5 md:p-2 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:text-white transition-all active:scale-90 shadow-md"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                <h2 className="text-lg font-bold text-[#c0ff00] tracking-wide flex items-center gap-2">
                  <BookOpen size={18} />
                  {activeDocument === 'none' ? 'Свод правил сервера' : (activeDocument === 'constitution' ? 'Конституция' : 'Заповеди дома')}
                </h2>
              </div>

              {activeDocument !== 'none' && canEditConstitution && !isEditing && (
                <button onClick={() => setIsEditing(true)} className="ui-pill-btn"><Edit2 size={12} /><span>Редактировать</span></button>
              )}
            </div>

            {/* МЕНЮ ВЫБОРА ДОКУМЕНТОВ */}
            {activeDocument === 'none' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mt-6 w-full">
                
                {/* Виджет: Конституция */}
                <div className="relative w-full group cursor-pointer" onClick={() => setActiveDocument('constitution')}>
                  {/* Tooltip для ПК */}
                  <div className="hidden md:block absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 z-50 w-[280px] p-4 bg-[#1a1e24] border border-[#c0ff00]/30 rounded-2xl text-[12px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-2xl leading-relaxed text-center">
                    Это РП законы. Все законы внутри этого документа могут изменяться общим голосованием игроков в процессе игры.
                  </div>

                  <div className="relative overflow-hidden bg-[#14171c]/90 backdrop-blur-xl rounded-[28px] md:rounded-[36px] border border-white/5 group-hover:border-[#c0ff00]/40 transition-all shadow-xl flex flex-row md:flex-col items-center justify-start md:justify-center w-full h-[110px] md:h-[260px] p-5 md:p-8">
                    <div className="absolute inset-0 z-0 opacity-30 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500 bg-[right_-10px_center] bg-[length:120px] md:bg-[right_-30px_bottom_-30px] md:bg-[length:240px] bg-no-repeat"
                      style={{ backgroundImage: "url('/1000024917.png')", imageRendering: "pixelated" }} />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#14171c] via-[#14171c]/90 to-transparent md:bg-gradient-to-t md:from-[#14171c] md:via-[#14171c]/80 md:to-transparent z-0" />
                    
                    <button onClick={(e) => { e.stopPropagation(); setShowTooltip('constitution'); }} className="absolute top-4 right-4 z-20 p-2 bg-black/40 border border-white/10 rounded-full text-gray-400 hover:text-white transition-all active:scale-90 md:hidden">
                      <Info size={16} />
                    </button>
                    
                    <div className="hidden md:flex absolute top-5 right-5 z-20 p-2 bg-black/40 border border-white/10 rounded-full text-gray-400 group-hover:text-[#c0ff00] transition-colors shadow-lg backdrop-blur-sm">
                      <Info size={18} />
                    </div>

                    <div className="relative z-10 flex items-center md:flex-col md:text-center w-full">
                      <div className="text-left md:text-center flex-1">
                        <h3 className="text-base md:text-2xl font-black text-white mb-0.5 md:mb-2 tracking-wide drop-shadow-md">Конституция</h3>
                        <p className="text-[10px] md:text-sm text-[#c0ff00] font-medium leading-tight drop-shadow-md">Внутриигровые РП законы</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Виджет: Заповеди дома */}
                <div className="relative w-full group cursor-pointer" onClick={() => setActiveDocument('commandments')}>
                  {/* Tooltip для ПК */}
                  <div className="hidden md:block absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 z-50 w-[280px] p-4 bg-[#1a1e24] border border-red-500/30 rounded-2xl text-[12px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-2xl leading-relaxed text-center">
                    Это внеигровые правила, которые нельзя нарушать для сохранения баланса игры. Никакое оправдание под предлогом РП не принимается, все кто нарушат — дураки.
                  </div>

                  <div className="relative overflow-hidden bg-[#14171c]/90 backdrop-blur-xl rounded-[28px] md:rounded-[36px] border border-white/5 group-hover:border-red-500/40 transition-all shadow-xl flex flex-row md:flex-col items-center justify-start md:justify-center w-full h-[110px] md:h-[260px] p-5 md:p-8">
                    <div className="absolute inset-0 z-0 opacity-30 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500 bg-[right_-10px_center] bg-[length:120px] md:bg-[right_-30px_bottom_-30px] md:bg-[length:240px] bg-no-repeat"
                      style={{ backgroundImage: "url('/zapovedi.gif')", imageRendering: "pixelated" }} />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#14171c] via-[#14171c]/90 to-transparent md:bg-gradient-to-t md:from-[#14171c] md:via-[#14171c]/80 md:to-transparent z-0" />
                    
                    <button onClick={(e) => { e.stopPropagation(); setShowTooltip('commandments'); }} className="absolute top-4 right-4 z-20 p-2 bg-black/40 border border-white/10 rounded-full text-gray-400 hover:text-white transition-all active:scale-90 md:hidden">
                      <Info size={16} />
                    </button>
                    
                    <div className="hidden md:flex absolute top-5 right-5 z-20 p-2 bg-black/40 border border-white/10 rounded-full text-gray-400 group-hover:text-red-400 transition-colors shadow-lg backdrop-blur-sm">
                      <Info size={18} />
                    </div>

                    <div className="relative z-10 flex items-center md:flex-col md:text-center w-full">
                      <div className="text-left md:text-center flex-1">
                        <h3 className="text-base md:text-2xl font-black text-white mb-0.5 md:mb-2 tracking-wide drop-shadow-md">Заповеди дома</h3>
                        <p className="text-[10px] md:text-sm text-red-400 font-medium leading-tight drop-shadow-md">Внеигровые (Нон-РП) правила</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ПРОСМОТР/РЕДАКТИРОВАНИЕ ДОКУМЕНТА */}
            {activeDocument !== 'none' && !isEditing && (
              <div className={`sticky z-30 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isScrolled ? 'top-[96px] pr-[135px] md:pr-0 md:-mt-2 md:pb-3 md:pt-2' : 'top-[96px] pr-0 mb-4'}`}>
                <div className="flex items-center bg-[#1c2026]/90 backdrop-blur-xl border border-white/10 rounded-full px-4 py-3 w-full shadow-2xl transition-all">
                  <Search size={16} className="text-[#c0ff00] flex-shrink-0" />
                  <input
                    type="text"
                    placeholder={`Поиск по ${activeDocument === 'constitution' ? 'конституции' : 'заповедям'}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm font-medium text-white ml-3 w-full flex-1 placeholder:text-gray-500"
                  />
                  
                  {matches.length > 0 && (
                    <div className="flex items-center gap-2 ml-2 border-l border-white/10 pl-3">
                      <span className="text-[10px] text-gray-400 font-mono font-bold whitespace-nowrap">
                        {currentMatchIndex} / {matches.length}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={prevMatch} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-[#c0ff00] active:scale-90 transition-all">
                          <ChevronUp size={14}/>
                        </button>
                        <button onClick={nextMatch} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-[#c0ff00] active:scale-90 transition-all">
                          <ChevronDown size={14}/>
                        </button>
                      </div>
                    </div>
                  )}

                  {searchQuery && matches.length === 0 && (
                    <span className="text-[10px] font-bold text-red-400 ml-2 whitespace-nowrap">0 / 0</span>
                  )}

                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="p-1.5 ml-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-red-400 transition-all active:scale-90 flex-shrink-0">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeDocument !== 'none' && isEditing && (
              <div className="space-y-4 scale-100 w-full pt-2">
                <div 
                  ref={editorRef} 
                  contentEditable 
                  suppressContentEditableWarning 
                  onKeyUp={checkFormatting}
                  onMouseUp={checkFormatting}
                  onInput={checkFormatting}
                  className="w-full min-h-[600px] bg-[#14171c]/90 backdrop-blur-xl border border-white/5 focus:border-[#c0ff00]/40 rounded-[28px] p-5 text-base leading-relaxed text-gray-200 focus:outline-none transition-all shadow-inner prose prose-invert max-w-none break-words pb-20 md:pb-5" 
                  data-placeholder={`Начните писать ${activeDocument === 'constitution' ? 'законы' : 'заповеди'} здесь...`} 
                />
              </div>
            )}
            
            {activeDocument !== 'none' && !isEditing && (
              <div 
                ref={viewRef}
                className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 text-base leading-relaxed max-w-none text-gray-300 prose prose-invert shadow-md break-words w-full transition-all" 
                dangerouslySetInnerHTML={{ __html: currentDocText }} 
              />
            )}
          </div>
        )}

        {/* ВКЛАДКА MAP (ЗАГЛУШКА SOON) */}
        {activeTab === 'map' && (
          <div className="w-full h-full min-h-[60vh] md:min-h-[80vh] flex flex-col animate-fade-in relative">
            <div className="flex items-center justify-between w-full px-1 mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-400 tracking-wide flex items-center gap-2">
                  <Map size={18} />
                  Карта мира
                </h2>
                <div className="group/badge relative">
                  <div className="bg-[#c0ff00] text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-md cursor-help shadow-lg">Soon</div>
                  <div className="hidden md:block absolute top-full left-0 mt-2 w-[180px] p-2 bg-[#1a1e24] border border-[#c0ff00]/30 rounded-xl text-[10px] font-medium text-gray-300 opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50 text-center leading-tight">
                    Функционал в разработке, появится позже
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-grow w-full rounded-[28px] overflow-hidden border border-white/5 shadow-2xl relative bg-[#14171c]/90 backdrop-blur-xl flex items-center justify-center">
              <div className="absolute inset-0 z-0 opacity-20 bg-gradient-to-br from-[#c0ff00]/5 to-transparent" />
              
              <div className="text-center p-6 max-w-sm relative z-10 animate-fade-in">
                 <div className="w-20 h-20 bg-black/40 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-5 relative shadow-xl">
                   <Map size={32} className="text-gray-500" />
                   <div className="absolute -bottom-2 bg-[#c0ff00] text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow-lg">Soon</div>
                 </div>
                 <h3 className="text-xl font-black text-white mb-2 tracking-wide">Карта в разработке</h3>
                 <p className="text-sm text-gray-400 leading-relaxed">Интерактивный 3D-рендер мира находится в стадии настройки. Этот функционал появится в приложении немного позже.</p>
              </div>
            </div>
          </div>
        )}

        {/* ИГРОКИ */}
        {activeTab === 'players' && (
          <div className="space-y-6 animate-fade-in w-full">
            <div className="flex items-center justify-between w-full px-1">
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <Users size={18} className="text-[#c0ff00]" />
                Жители сервера
              </h2>
            </div>

            {dbUser && (
              <div className="space-y-2 w-full md:max-w-sm">
                <div className="text-xs text-[#c0ff00] uppercase tracking-wider font-extrabold pl-1">Мой личный профиль</div>
                <div onClick={() => { setIsEditingProfile(false); setSelectedPlayer(dbUser); }} className={`p-4 rounded-[28px] border flex items-center space-x-4 transition-all duration-300 cursor-pointer shadow-xl w-full active:scale-95 ${isDead(dbUser.roles) ? 'bg-[#0a0c0f] border-white/5 opacity-70 grayscale' : 'bg-gradient-to-r from-[#14171c]/90 to-[#1c2026]/90 backdrop-blur-xl border-[#c0ff00]/40 shadow-[#c0ff00]/5 hover:border-[#c0ff00]/60'}`}>
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
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold pl-1">Все игроки</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {sortedPlayers.map((player) => {
                  const dead = isDead(player.roles);
                  return (
                    <div key={player.id} onClick={() => { setIsEditingProfile(false); setSelectedPlayer(player); }} className={`p-4 rounded-[28px] flex items-center space-x-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-md active:scale-[0.99] w-full border ${dead ? 'bg-[#0a0c0f] border-transparent opacity-60 grayscale-[50%]' : 'bg-[#14171c]/90 backdrop-blur-xl border-white/5 hover:border-white/20 hover:bg-[#1a1e24]/90'}`}>
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

        {/* АДМИН ПАНЕЛЬ */}
        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6 animate-fade-in w-full items-start">
            <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">
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

            <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">
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
                {customRoles.map((role) => (
                  <div key={role.id} className="flex flex-col gap-2 p-3.5 bg-black/10 rounded-[18px] border border-white/5 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 mr-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: role.color }} />
                        <input 
                          type="text" 
                          value={role.name.toUpperCase()} 
                          onChange={e => handleRoleChange(role.id!, 'name', e.target.value.toLowerCase())} 
                          onBlur={() => saveRoleToDb(role)}
                          className="bg-transparent border-none text-sm font-bold tracking-wide focus:outline-none focus:border-b focus:border-[#c0ff00] p-0 m-0 w-full" 
                          style={{ color: role.color }}
                        />
                      </div>
                      <div className="flex items-center space-x-3 flex-shrink-0">
                        <label className="flex items-center space-x-1.5 text-[11px] text-gray-400 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={role.canEditConstitution} 
                            onChange={e => {
                              handleRoleChange(role.id!, 'canEditConstitution', e.target.checked);
                              saveRoleToDb({ ...role, canEditConstitution: e.target.checked });
                            }} 
                            className="rounded border-white/10 bg-transparent text-[#c0ff00] focus:ring-0"
                          />
                          <span>Законы</span>
                        </label>
                        <input 
                          type="color" 
                          value={role.color} 
                          onChange={e => handleRoleChange(role.id!, 'color', e.target.value)} 
                          onBlur={() => saveRoleToDb(role)}
                          className="w-5 h-5 bg-transparent border-none cursor-pointer rounded"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* МЕНЮ ДЛЯ МОБИЛЬНЫХ УСТРОЙСТВ (Карта убрана) */}
      <nav className={`md:hidden fixed bottom-5 left-4 right-4 bg-[#14171c]/90 backdrop-blur-xl border border-white/10 py-3 rounded-full z-50 shadow-2xl transition-all duration-500
         ${showToolbar ? 'opacity-0 translate-y-16 pointer-events-none' : 'opacity-100 translate-y-0'}
      `}>
        <div className={`flex w-full items-center justify-around px-2`}>
          <button onClick={() => handleTabChange('profile')} className={`flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'profile' && !selectedPlayer ? 'text-[#c0ff00] scale-105' : 'text-gray-500 hover:text-gray-300'}`}>
            <HomeIcon size={22} />
            <span className="text-[10px] font-bold mt-1 tracking-wide">Главная</span>
          </button>
          
          <button onClick={() => handleTabChange('constitution')} className={`flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'constitution' ? 'text-[#c0ff00] scale-105' : 'text-gray-500 hover:text-gray-300'}`}>
            <BookOpen size={22} />
            <span className="text-[10px] font-bold mt-1 tracking-wide">Законы</span>
          </button>
          
          <button onClick={() => handleTabChange('players')} className={`flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'players' || selectedPlayer ? 'text-[#c0ff00] scale-105' : 'text-gray-500 hover:text-gray-300'}`}>
            <Users size={22} />
            <span className="text-[10px] font-bold mt-1 tracking-wide">Игроки</span>
          </button>
          
          {isAdmin && (
            <button onClick={() => handleTabChange('admin')} className={`flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'admin' ? 'text-[#c0ff00] scale-105' : 'text-gray-500 hover:text-gray-300'}`}>
              <ShieldAlert size={22} />
              <span className="text-[10px] font-bold mt-1 tracking-wide">Админ</span>
            </button>
          )}
        </div>
      </nav>

      {/* САЙДБАР ДЛЯ ПК (Карта убрана) */}
      <aside className={`hidden md:flex flex-col items-center gap-6 fixed left-8 top-1/2 -translate-y-1/2 z-50 transition-all duration-500 ${showToolbar ? 'opacity-0 -translate-x-32 pointer-events-none' : 'opacity-100 translate-x-0'}`}>
       
       {dbUser && (
         <button onClick={() => { setIsEditingProfile(false); setSelectedPlayer(dbUser); }} className="group relative w-[72px] h-[72px] bg-[#14171c]/70 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center hover:border-[#c0ff00]/40 transition-all shadow-2xl hover:scale-105 active:scale-95 z-50">
           <div className="w-[60px] h-[60px] rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#c0ff00]/50 transition-all">
             <img src={dbUser.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
           </div>
           <div className="absolute left-[calc(100%+20px)] px-4 py-2 bg-[#1a1e24] border border-[#c0ff00]/30 rounded-xl text-[13px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-2xl">
             Мой профиль
           </div>
         </button>
       )}

       <nav className="w-[72px] bg-[#14171c]/70 backdrop-blur-xl border border-white/10 py-8 px-2 rounded-[40px] shadow-2xl flex flex-col items-center gap-8 relative">
         
         <button onClick={() => handleTabChange('profile')} className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'profile' && !selectedPlayer ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
            <HomeIcon size={24} />
            <div className="absolute left-[calc(100%+28px)] px-4 py-2 bg-[#1a1e24] border border-[#c0ff00]/30 rounded-xl text-[13px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-2xl">
              Главная
            </div>
         </button>

         <button onClick={() => handleTabChange('constitution')} className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'constitution' ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
            <BookOpen size={24} />
            <div className="absolute left-[calc(100%+28px)] px-4 py-2 bg-[#1a1e24] border border-[#c0ff00]/30 rounded-xl text-[13px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-2xl">
              Законы
            </div>
         </button>

         <button onClick={() => handleTabChange('players')} className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'players' || selectedPlayer ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
            <Users size={24} />
            <div className="absolute left-[calc(100%+28px)] px-4 py-2 bg-[#1a1e24] border border-[#c0ff00]/30 rounded-xl text-[13px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-2xl">
              Игроки
            </div>
         </button>

         {isAdmin && (
            <button onClick={() => handleTabChange('admin')} className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'admin' ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-gray-300'}`}>
              <ShieldAlert size={24} />
              <div className="absolute left-[calc(100%+28px)] px-4 py-2 bg-[#1a1e24] border border-[#c0ff00]/30 rounded-xl text-[13px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-2xl">
                Админ-панель
              </div>
            </button>
         )}
       </nav>
      </aside>

      {/* КНОПКА "НАВЕРХ" */}
      <button 
        onClick={scrollToTop} 
        className={`fixed z-40 p-3 bg-[#14171c]/90 backdrop-blur-md border border-[#c0ff00]/40 text-[#c0ff00] rounded-full shadow-[0_0_20px_rgba(192,255,0,0.15)] transition-all duration-500 hover:scale-110 hover:bg-[#c0ff00] hover:text-black active:scale-90 ${
          showScrollTop ? 'bottom-24 right-6 md:bottom-10 md:right-10 opacity-100 translate-y-0' : 'bottom-16 right-6 md:bottom-2 opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        <ArrowUp size={20} />
      </button>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap');
        
        body, html { 
          font-family: 'Google Sans', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif !important; 
          max-w-full; 
          overflow-x: clip; 
        }
        
        button, input, textarea, div, span { font-family: inherit; }
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
        
        .prose h1 { font-size: 2rem !important; font-weight: 900 !important; color: #ffffff !important; margin-top: 1.5rem !important; margin-bottom: 0.75rem !important; line-height: 1.1 !important; }
        .prose h2 { font-size: 1.5rem !important; font-weight: 800 !important; color: #c0ff00 !important; margin-top: 1.2rem !important; margin-bottom: 0.5rem !important; line-height: 1.2 !important; }
        
        .prose p { margin-bottom: 0.75rem; color: #d1d5db; transition: all 0.3s ease; }
        .prose b, .prose strong { color: #ffffff; font-weight: 700; }
        .prose i, .prose em { color: #e5e7eb; font-style: italic; }
      `}</style>
    </div>
  );
}
