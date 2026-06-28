'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import MediaBlog from '../components/MediaBlog';
import { 
  User, BookOpen, Users, Edit2, Check, X, ShieldAlert, UserPlus, ShieldCheck, Palette, Save,
  Bold, Italic, Strikethrough, Heading1, Heading2, AlignLeft, AlignCenter, Plus, Upload,
  Copy, Play, Square, Server, RefreshCw, Coins, Search, ChevronUp, ChevronDown, ArrowUp,
  Info, ArrowLeft, Home as HomeIcon, Map, Newspaper
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
  const router = useRouter();
  const [tgUser, setTgUser] = useState<any>(null);
  const [dbUser, setDbUser] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'profile' | 'constitution' | 'players' | 'admin' | 'map' | 'media'>('profile');
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

  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState('');

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

  const [isCreatingPost, setIsCreatingPost] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  const currentDocText = activeDocument === 'constitution' ? constitutionText : commandmentsText;
  const isAdmin = dbUser?.roles.includes('admin');
  const canEditConstitution = dbUser?.roles.some(r => {
    const found = customRoles.find(cr => cr.name.toLowerCase() === r.toLowerCase());
    return found ? found.canEditConstitution : false;
  });
  
  const sortedPlayers = players
    .filter((player) => player.tg_id !== dbUser?.tg_id)
    .sort((a, b) => {
      const aDead = isDead(a.roles); const bDead = isDead(b.roles);
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
          if (!ctx) return reject(new Error('Canvas ctx error'));
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('WebP error'));
          }, 'image/webp', 0.85);
        };
      };
    });
  }

  function getRoleColor(roleName: string) {
    const found = customRoles.find(cr => cr.name.toLowerCase() === roleName.toLowerCase());
    return found ? found.color : '#888888';
  }

  function isDead(roles: string[]) {
    return roles.some(r => r.toLowerCase() === 'мёртв');
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

  async function runWebPMigration() {
    if (!confirm('Запустить оптимизацию?')) return;
    setIsMigrating(true);
    setMigrationProgress('Запуск...');
    try {
      const { data: posts } = await supabase.from('posts').select('id, cover_url');
      if (posts) {
        for (let i = 0; i < posts.length; i++) {
          const post = posts[i];
          if (post.cover_url && !post.cover_url.endsWith('.webp')) {
            setMigrationProgress(`Пережатие поста ${i+1}/${posts.length}`);
            const res = await fetch(post.cover_url);
            const blob = await res.blob();
            const webp = await convertToWebP(new File([blob], 'p.jpg', {type: blob.type}));
            const fileName = `migrated-${post.id}-${Date.now()}.webp`;
            await supabase.storage.from('avatars').upload(fileName, webp, { contentType: 'image/webp' });
            const { data: u } = supabase.storage.from('avatars').getPublicUrl(fileName);
            if (u) await supabase.from('posts').update({ cover_url: u.publicUrl }).eq('id', post.id);
          }
        }
      }
      setMigrationProgress('✅ Готово!');
      loadPlayers();
    } catch (e: any) { alert(e.message); } finally { setIsMigrating(false); }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>, setUrlCallback: (url: string) => void, setLoadingState: (loading: boolean) => void) {
    try {
      setLoadingState(true);
      const file = event.target.files?.[0];
      if (!file) return;
      const webpBlob = await convertToWebP(file);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.webp`;
      const { error } = await supabase.storage.from('avatars').upload(fileName, webpBlob, { contentType: 'image/webp' });
      if (error) return alert(error.message);
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      if (urlData) setUrlCallback(urlData.publicUrl);
    } catch (e: any) { alert(e.message); } finally { setLoadingState(false); }
  }

  function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

  async function fetchServerStatus() {
    setIsServerLoading(true);
    try {
      const res = await fetch('/api/exaroton');
      const data = await res.json();
      if (data.success) {
        setServerInfo(data.data.server || data.data);
        setCredits(data.data.credits ?? null);
      }
    } catch (e) { console.error(e); } finally { setIsServerLoading(false); }
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
      document.execCommand(command, false, value);
      if (editorRef.current) editorRef.current.focus();
      setTimeout(checkFormatting, 50);
    }
  }

  function nextMatch() { setCurrentMatchIndex(prev => prev < matches.length ? prev + 1 : 1); }
  function prevMatch() { setCurrentMatchIndex(prev => prev > 1 ? prev - 1 : matches.length); }

  async function handleServerAction(action: 'start' | 'stop') {
    setServerActionLoading(true);
    try {
      const res = await fetch('/api/exaroton', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) setTimeout(fetchServerStatus, 3000);
      else alert(data.error);
    } catch (e) { alert('Error'); } finally { setServerActionLoading(false); }
  }

  function copyToClipboard(text: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    }
  }

  async function checkUserInDb(tgId: number) {
    try {
      const { data: user, error: dbError } = await supabase.from('users').select('*').eq('tg_id', tgId).single();
      if (dbError || !user) {
        setError(`User not found: ${tgId}`);
      } else {
        setDbUser(user);
        setNewRpName(user.rp_name);
        setNewAvatarUrl(user.avatar_url);
        loadRoles();
        loadPlayers();
        loadConstitution();
      }
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
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

  async function loadPlayers() {
    const { data } = await supabase.from('users').select('*').order('rp_name', { ascending: true });
    if (data) setPlayers(data);
  }

  async function loadConstitution() {
    const { data } = await supabase.from('constitution').select('*').in('id', [1, 2]);
    if (data) {
      const constDoc = data.find((d: any) => d.id === 1);
      const cmdDoc = data.find((d: any) => d.id === 2);
      if (constDoc) setConstitutionText(constDoc.content || '');
      if (cmdDoc) setCommandmentsText(cmdDoc.content || '');
    }
  }

  async function saveDocument() {
    if (!editorRef.current || activeDocument === 'none') return;
    const content = editorRef.current.innerHTML;
    const docId = activeDocument === 'constitution' ? 1 : 2;
    const { error } = await supabase.from('constitution').upsert({ id: docId, content });
    if (!error) {
      if (activeDocument === 'constitution') setConstitutionText(content);
      else setCommandmentsText(content);
      setIsEditing(false);
    } else { alert(error.message); }
  }

  async function saveProfileData() {
    if (!selectedPlayer || !newRpName.trim()) return;
    const { error } = await supabase.from('users').update({ rp_name: newRpName, avatar_url: newAvatarUrl }).eq('id', selectedPlayer.id); 
    if (!error) {
      const updatedUser = { ...selectedPlayer, rp_name: newRpName, avatar_url: newAvatarUrl };
      setSelectedPlayer(updatedUser);
      if (dbUser?.id === selectedPlayer.id) setDbUser(updatedUser);
      setIsEditingProfile(false);
      loadPlayers();
    } else { alert(error.message); }
  }

  async function handleAddPlayer() {
    const tgIdNum = parseInt(addTgId);
    if (isNaN(tgIdNum) || !addRpName.trim()) return;
    const { error } = await supabase.from('users').insert([{
      tg_id: tgIdNum, tg_username: addTgUsername || 'unknown', mc_nickname: addMcNickname, rp_name: addRpName, avatar_url: addAvatarUrl || 'https://via.placeholder.com/150', roles: addRoles, party: addParty || 'Нет партии'
    }]);
    if (error) { alert(error.message); } else { setAddTgId(''); loadPlayers(); }
  }

  async function handleCreateRole() {
    if (!newRoleName.trim()) return;
    const newRole = { name: newRoleName.toLowerCase(), color: newRoleColor, can_edit_constitution: newRolePerm };
    const { error } = await supabase.from('roles').insert([newRole]);
    if (!error) { setNewRoleName(''); loadRoles(); } else { alert('Role must be unique'); }
  }

  function handleRoleChange(id: string, field: string, value: any) {
    setCustomRoles(roles => roles.map(r => r.id === id ? { ...r, [field]: value } : r));
  }

  async function saveRoleToDb(role: CustomRole) {
    if (!role.id) return;
    await supabase.from('roles').update({
      name: role.name,
      color: role.color,
      can_edit_constitution: role.canEditConstitution
    }).eq('id', role.id);
  }

  async function handleAddRoleToUser(roleName: string) {
    if (!selectedPlayer || selectedPlayer.roles.includes(roleName)) return;
    const updatedRoles = [...selectedPlayer.roles, roleName];
    const updatedPlayer = { ...selectedPlayer, roles: updatedRoles };
    const { error } = await supabase.from('users').update({ roles: updatedRoles }).eq('id', selectedPlayer.id);
    if (!error) {
      setSelectedPlayer(updatedPlayer); setPlayers(players.map(p => p.id === selectedPlayer.id ? updatedPlayer : p));
      if (dbUser?.id === selectedPlayer.id) setDbUser(updatedPlayer);
      setShowRoleSelector(false);
    }
  }

  async function handleRemoveRoleFromUser(roleName: string) {
    if (!selectedPlayer) return;
    const updatedRoles = selectedPlayer.roles.filter(r => r !== roleName);
    const updatedPlayer = { ...selectedPlayer, roles: updatedRoles };
    const { error = null } = await supabase.from('users').update({ roles: updatedRoles }).eq('id', selectedPlayer.id);
    if (!error) {
      setSelectedPlayer(updatedPlayer); setPlayers(players.map(p => p.id === selectedPlayer.id ? updatedPlayer : p));
      if (dbUser?.id === selectedPlayer.id) setDbUser(updatedPlayer);
    }
  }

  function handleTabChange(tab: 'profile' | 'constitution' | 'players' | 'admin' | 'map' | 'media') {
    setSelectedPlayer(null); setIsEditingProfile(false); setShowRoleSelector(false); 
    setActiveTab(tab);
    setActiveDocument('none'); 
    setIsEditing(false);
    setSearchQuery('');
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
      setShowScrollTop(window.scrollY > window.innerHeight * 1.5);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.initDataUnsafe?.user?.id) {
      tg.ready();
      tg.expand(); 
      if (typeof tg.setHeaderColor === 'function') tg.setHeaderColor('#090b0e');
      setTgUser(tg.initDataUnsafe.user);
      
      if (tg.initDataUnsafe.start_param) {
        const param = tg.initDataUnsafe.start_param;
        const handled = sessionStorage.getItem('handled_start_param');
        if (param.startsWith('post_') && handled !== param) {
          sessionStorage.setItem('handled_start_param', param);
          router.push(`/media/${param.replace('post_', '')}`);
          return;
        }
      }
      checkUserInDb(tg.initDataUnsafe.user.id);
    } else {
      setError('Please open in Telegram.');
      setLoading(false);
    }
  }, []);

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

  useEffect(() => {
    if (!viewRef.current || activeTab !== 'constitution' || isEditing || activeDocument === 'none') return;
    const children = Array.from(viewRef.current.children) as HTMLElement[];
    children.forEach((child) => {
      child.style.transition = 'all 0.3s ease';
      child.style.backgroundColor = '';
      child.style.opacity = '1';
    });

    if (!searchQuery.trim()) { setMatches([]); setCurrentMatchIndex(0); return; }
    const query = searchQuery.toLowerCase().trim();
    const foundIndices: number[] = [];

    children.forEach((child, index) => {
      const text = child.textContent?.toLowerCase() || '';
      if (text.includes(query)) {
        foundIndices.push(index);
        child.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        child.style.borderRadius = '8px';
      } else { child.style.opacity = '0.3'; }
    });
    setMatches(foundIndices);
    setCurrentMatchIndex(foundIndices.length > 0 ? 1 : 0);
  }, [searchQuery, currentDocText, activeTab, isEditing, activeDocument]);

  useEffect(() => {
    if (matches.length === 0 || currentMatchIndex === 0 || !viewRef.current) return;
    const children = Array.from(viewRef.current.children) as HTMLElement[];
    const activeIdx = matches[currentMatchIndex - 1];
    const activeEl = children[activeIdx];
    if (activeEl) {
      activeEl.style.backgroundColor = 'rgba(192, 255, 0, 0.15)';
      activeEl.style.borderRadius = '8px';
      setTimeout(() => {
        const yOffset = activeEl.getBoundingClientRect().top + window.pageYOffset - 160;
        window.scrollTo({ top: yOffset, behavior: 'smooth' });
      }, 50);
    }
  }, [currentMatchIndex, matches]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090b0e] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="animate-spin text-[#c0ff00]" size={36} />
        <span className="text-xs text-gray-500 font-bold uppercase tracking-widest animate-pulse">Загрузка...</span>
      </div>
    );
  }

  if (error) {
    return <div className="min-h-screen bg-[#090b0e] text-red-400 flex items-center justify-center p-4 text-center">{error}</div>;
  }

  return (
    <div className="min-h-screen text-white pb-32 md:pb-8 selection:bg-[#c0ff00] selection:text-black transition-colors duration-300 w-full relative z-0 flex flex-col">
      
      <div className="fixed inset-0 bg-[#090b0e] -z-10" />

      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${selectedPlayer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSelectedPlayer(null)} />
      <div className="fixed top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#090b0e] via-[#090b0e]/95 to-transparent pointer-events-none z-30" />

      <div className="fixed top-[96px] left-4 right-4 md:left-32 md:right-8 z-40 flex items-center justify-end gap-2 pointer-events-none">
        <div className={`transition-all duration-500 flex items-center justify-center ${showToolbar ? 'w-10 opacity-100 scale-100' : 'w-0 opacity-0 scale-50'}`}>
          <button onClick={saveDocument} className="pointer-events-auto bg-[#c0ff00] text-black w-10 h-10 rounded-full shadow-lg flex items-center justify-center"><Save size={16} /></button>
        </div>

        {dbUser && !selectedPlayer && !isCreatingPost && (
          <button onClick={() => setSelectedPlayer(dbUser)} className={`md:hidden flex items-center bg-[#14171c]/90 border border-white/10 rounded-full shadow-2xl backdrop-blur-md pointer-events-auto h-10 z-50 ${showToolbar ? 'w-10 justify-center px-0' : 'w-auto px-1.5 pr-4'}`}>
            <div className="w-7 h-7 rounded-full overflow-hidden border border-white/15 shrink-0"><img src={dbUser.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" /></div>
            <span className={`text-[11px] font-bold text-white transition-all overflow-hidden ${showToolbar ? 'max-w-0 opacity-0' : 'max-w-[100px] ml-2.5'}`}>Профиль</span>
          </button>
        )}
      </div>

      <div className={`fixed z-50 flex items-center justify-center pointer-events-none ${showToolbar ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} bottom-2 left-2 right-2 md:top-[96px] md:bottom-auto md:left-1/2 md:-translate-x-1/2`}>
        <div className="p-1.5 bg-[#14171c]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-1 pointer-events-auto w-full md:w-auto overflow-x-auto justify-start md:justify-center">
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('bold')} className={`p-1.5 rounded-xl ${formats.bold ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Bold size={14}/></button>
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('italic')} className={`p-1.5 rounded-xl ${formats.italic ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Italic size={14}/></button>
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('strikeThrough')} className={`p-1.5 rounded-xl ${formats.strikeThrough ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Strikethrough size={14}/></button>
          <div className="w-[1px] h-3.5 bg-white/10 mx-0.5" />
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('formatBlock', 'H1')} className={`p-1.5 rounded-xl ${formats.h1 ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Heading1 size={14}/></button>
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('formatBlock', 'H2')} className={`p-1.5 rounded-xl ${formats.h2 ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Heading2 size={14}/></button>
          <button onClick={() => setIsEditing(false)} className="p-1.5 text-gray-500 ml-auto"><X size={14} /></button>
        </div>
      </div>

      {selectedPlayer && (
        <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-32px)] max-w-md p-6 rounded-[32px] border border-white/10 shadow-2xl text-center space-y-5 animate-profile-grow ${isDead(selectedPlayer.roles) ? 'bg-[#0a0c0f]' : 'bg-[#14171c]'}`}>
          <button onClick={() => setSelectedPlayer(null)} className="absolute top-4 right-4 p-1.5 bg-white/5 rounded-full text-gray-400 z-10"><X size={14} /></button>
          <div className={`relative w-24 h-24 rounded-full overflow-hidden border-2 mx-auto ${isDead(selectedPlayer.roles) ? 'border-gray-600 grayscale' : 'border-[#c0ff00]'}`}>
            <img src={isEditingProfile ? newAvatarUrl : (selectedPlayer.avatar_url || 'https://via.placeholder.com/150')} className="w-full h-full object-cover" />
          </div>
          <div className="space-y-2">
            {isEditingProfile ? (
              <div className="space-y-3 max-w-xs mx-auto animate-fade-in">
                <input type="text" value={newRpName} onChange={(e) => setNewRpName(e.target.value)} className="ui-input text-center font-bold" />
                <button onClick={saveProfileData} className="ui-pill-btn w-full justify-center !bg-[#c0ff00] !text-black font-black py-2.5">Сохранить</button>
              </div>
            ) : (
              <div>
                <h2 className={`text-2xl font-black ${isDead(selectedPlayer.roles) ? 'text-gray-500 line-through' : 'text-white'}`}>{selectedPlayer.rp_name}</h2>
                <p className="text-sm text-gray-400 font-bold">{selectedPlayer.mc_nickname}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <main key={activeTab} className="p-4 pt-36 pb-24 md:pl-[120px] max-w-6xl mx-auto flex-grow flex flex-col animate-fade-in">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2"><HomeIcon size={18} className="text-[#c0ff00]" />Панель управления</h2>
            <div className="flex flex-col xl:flex-row gap-6">
              <div className="w-full xl:max-w-[480px] bg-[#14171c]/90 p-6 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[10px] text-gray-500 font-black uppercase">Сервер</div>
                      <div className={`text-lg font-black ${serverInfo ? getServerStatusText(serverInfo.status).color : 'text-white'}`}>{serverInfo ? getServerStatusText(serverInfo.status).text : 'ЗАГРУЗКА...'}</div>
                    </div>
                    {serverInfo?.status === 1 && <div className="text-[#c0ff00] font-black text-sm">{serverInfo.players.count} / {serverInfo.players.max}</div>}
                  </div>
                  <div className="bg-black/20 p-3 rounded-2xl flex justify-between items-center">
                    <span className="font-mono text-sm text-gray-300">{staticIp}</span>
                    <button onClick={() => copyToClipboard(staticIp)} className="text-gray-500 hover:text-[#c0ff00]"><Copy size={16}/></button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleServerAction('start')} disabled={serverActionLoading || serverInfo?.status !== 0} className="flex-1 ui-pill-btn justify-center !bg-[#c0ff00]/10 !text-[#c0ff00] py-3 disabled:opacity-20"><Play size={14}/></button>
                    <button onClick={() => handleServerAction('stop')} disabled={serverActionLoading || serverInfo?.status === 0} className="flex-1 ui-pill-btn justify-center !bg-red-500/10 !text-red-500 py-3 disabled:opacity-20"><Square size={14}/></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'media' && (
          <MediaBlog currentUser={dbUser} onProfileClick={setSelectedPlayer} isCreatingPost={isCreatingPost} setIsCreatingPost={setIsCreatingPost} />
        )}

        {activeTab === 'constitution' && (
          <div className="space-y-4 animate-fade-in w-full flex-grow flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeDocument !== 'none' && !isEditing && <button onClick={() => setActiveDocument('none')} className="p-2 bg-white/5 rounded-full text-gray-400"><ArrowLeft size={16} /></button>}
                <h2 className="text-lg font-black text-[#c0ff00] uppercase tracking-widest">{activeDocument === 'none' ? 'Законы' : (activeDocument === 'constitution' ? 'Конституция' : 'Заповеди')}</h2>
              </div>
              {activeDocument !== 'none' && canEditConstitution && !isEditing && <button onClick={() => setIsEditing(true)} className="ui-pill-btn"><Edit2 size={12}/><span>Правка</span></button>}
            </div>

            {activeDocument === 'none' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div onClick={() => setActiveDocument('constitution')} className="relative overflow-hidden bg-[#14171c]/90 rounded-[32px] border border-white/5 p-8 h-[160px] cursor-pointer hover:border-[#c0ff00]/40 transition-all">
                  <h3 className="text-2xl font-black text-white relative z-10">Конституция</h3>
                  <p className="text-xs text-[#c0ff00] font-bold relative z-10">РП Правила</p>
                </div>
                <div onClick={() => setActiveDocument('commandments')} className="relative overflow-hidden bg-[#14171c]/90 rounded-[32px] border border-white/5 p-8 h-[160px] cursor-pointer hover:border-red-500/40 transition-all">
                  <h3 className="text-2xl font-black text-white relative z-10">Заповеди</h3>
                  <p className="text-xs text-red-400 font-bold relative z-10">Основной свод</p>
                </div>
              </div>
            )}

            {activeDocument !== 'none' && isEditing && (
              <div ref={editorRef} contentEditable className="w-full min-h-[500px] bg-[#14171c]/90 border border-white/5 rounded-[32px] p-6 text-white outline-none prose prose-invert max-w-none" />
            )}
            {activeDocument !== 'none' && !isEditing && (
              <div ref={viewRef} className="bg-[#14171c]/90 p-6 rounded-[32px] border border-white/5 text-gray-200 prose prose-invert max-w-none break-words" dangerouslySetInnerHTML={{ __html: currentDocText }} />
            )}
          </div>
        )}
      </main>

      <nav className={`md:hidden fixed bottom-5 left-4 right-4 bg-[#14171c]/90 backdrop-blur-xl border border-white/10 py-3 rounded-full z-50 shadow-2xl transition-all duration-500 ${showToolbar || isCreatingPost ? 'opacity-0 translate-y-16 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex justify-around items-center">
          <button onClick={() => handleTabChange('profile')} className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-[#c0ff00]' : 'text-gray-500'}`}><HomeIcon size={22}/><span className="text-[10px] font-black mt-1">ГЛАВНАЯ</span></button>
          <button onClick={() => handleTabChange('media')} className={`flex flex-col items-center ${activeTab === 'media' ? 'text-[#c0ff00]' : 'text-gray-500'}`}><Newspaper size={22}/><span className="text-[10px] font-black mt-1">МЕДИА</span></button>
          <button onClick={() => handleTabChange('constitution')} className={`flex flex-col items-center ${activeTab === 'constitution' ? 'text-[#c0ff00]' : 'text-gray-500'}`}><BookOpen size={22}/><span className="text-[10px] font-black mt-1">ЗАКОНЫ</span></button>
          <button onClick={() => handleTabChange('players')} className={`flex flex-col items-center ${activeTab === 'players' ? 'text-[#c0ff00]' : 'text-gray-500'}`}><Users size={22}/><span className="text-[10px] font-black mt-1">ИГРОКИ</span></button>
        </div>
      </nav>

      <style jsx global>{`
        body, html { 
          font-family: var(--font-wix), sans-serif !important; 
          background: #090b0e;
          color: #ffffff;
        }
        * { font-family: var(--font-wix), sans-serif !important; color: inherit; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .ui-pill-btn { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 10px 20px; border-radius: 99px; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.2s; }
        .ui-pill-btn:active { transform: scale(0.95); opacity: 0.8; }
        .ui-input { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 14px; font-size: 15px; color: #fff; outline: none; }
        .prose { line-height: 1.6 !important; }
        .prose h1, .prose h2, .prose h3 { color: #fff !important; font-weight: 800 !important; margin-bottom: 15px; }
        .prose p { color: rgba(255,255,255,0.8) !important; margin-bottom: 12px; }
      `}</style>
    </div>
  );
}
