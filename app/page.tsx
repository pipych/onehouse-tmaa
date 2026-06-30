'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import MediaBlog from '../components/MediaBlog';
import Archive from '../components/Archive';
import { 
  User, BookOpen, Users, Edit2, Check, X, ShieldAlert, UserPlus, ShieldCheck, Palette, Save,
  Bold, Italic, Strikethrough, Heading1, Heading2, AlignLeft, AlignCenter, Plus, Upload,
  Copy, Play, Square, Server, RefreshCw, Coins, Search, ChevronUp, ChevronDown, ArrowUp,
  Info, ArrowLeft, Home as HomeIcon, Map, Newspaper, Download, Library
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
  
  const [activeTab, setActiveTab] = useState<'profile' | 'constitution' | 'players' | 'admin' | 'map' | 'media' | 'archive'>('profile');
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
  
  const [latestPosts, setLatestPosts] = useState<any[]>([]);
  
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

  const showToolbar = isEditing && activeTab === 'constitution' && activeDocument !== 'none' && !selectedPlayer;
  
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
          if (!ctx) return reject(new Error('Не удалось создать контекст Canvas'));
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Ошибка конвертации в WebP'));
          }, 'image/webp', 0.85);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  function getRoleColor(roleName: string) {
    const found = customRoles.find(cr => cr.name.toLowerCase() === roleName.toLowerCase());
    return found ? found.color : '#888888';
  }

  function isDead(roles: string[]) {
    return roles ? roles.some(r => r.toLowerCase() === 'мёртв') : false;
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
    if (!confirm('Вы действительно хотите запустить оптимизацию всех старых изображений сайта в WebP? Это может занять некоторое время.')) return;
    
    setIsMigrating(true);
    setMigrationProgress('Запуск процесса... Сбор данных таблиц.');

    try {
      setMigrationProgress('Анализ обложек публикаций...');
      const { data: posts, error: postsError } = await supabase.from('posts').select('id, cover_url');
      if (postsError) throw postsError;

      let postsCount = 0;
      if (posts) {
        for (let i = 0; i < posts.length; i++) {
          const post = posts[i];
          if (post.cover_url && !post.cover_url.endsWith('.webp')) {
            setMigrationProgress(text => `Пережатие обложки статьи [${i + 1}/${posts.length}]...`);
            try {
              const res = await fetch(post.cover_url);
              const blob = await res.blob();
              const file = new File([blob], 'post.jpg', { type: blob.type });
              const webpBlob = await convertToWebP(file);
              const fileName = `migrated-post-cover-${post.id}-${Date.now()}.webp`;
              const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, webpBlob, { contentType: 'image/webp', upsert: true });
              if (uploadError) throw uploadError;
              const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
              if (urlData?.publicUrl) {
                await supabase.from('posts').update({ cover_url: urlData.publicUrl }).eq('id', post.id);
                postsCount++;
              }
            } catch (err) { console.error(`Ошибка обработки поста ${post.id}:`, err); }
          }
        }
      }

      setMigrationProgress('Анализ аватарок жителей сервера...');
      const { data: users, error: usersError } = await supabase.from('users').select('id, avatar_url');
      if (usersError) throw usersError;

      let usersCount = 0;
      if (users) {
        for (let i = 0; i < users.length; i++) {
          const user = users[i];
          if (user.avatar_url && !user.avatar_url.endsWith('.webp') && !user.avatar_url.includes('via.placeholder')) {
            setMigrationProgress(`Пережатие аватара жителя [${i + 1}/${users.length}]...`);
            try {
              const res = await fetch(user.avatar_url);
              const blob = await res.blob();
              const file = new File([blob], 'avatar.jpg', { type: blob.type });
              const webpBlob = await convertToWebP(file);
              const fileName = `migrated-user-avatar-${user.id}-${Date.now()}.webp`;
              const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, webpBlob, { contentType: 'image/webp', upsert: true });
              if (uploadError) throw uploadError;
              const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
              if (urlData?.publicUrl) {
                await supabase.from('users').update({ avatar_url: urlData.publicUrl }).eq('id', user.id);
                usersCount++;
              }
            } catch (err) { console.error(`Ошибка обработки юзера ${user.id}:`, err); }
          }
        }
      }

      setMigrationProgress('Сканирование хранилища на наличие старых форматов...');
      
      const nonWebpExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg'];
      let deletedCount = 0;
      let pageOffset = 0;
      const pageSize = 100;

      const activeUrls = new Set<string>();
      if (posts) activeUrls.add(posts.map(p => p.cover_url).join(','));
      if (users) activeUrls.add(users.map(u => u.avatar_url).join(','));

      while (true) {
        const { data: storageFiles, error: listError } = await supabase.storage
          .from('avatars')
          .list('', { limit: pageSize, offset: pageOffset });

        if (listError) { console.error('Ошибка чтения хранилища:', listError); break; }
        if (!storageFiles || storageFiles.length === 0) break;

        const filesToDelete = storageFiles.filter(file => {
          const nameLower = file.name.toLowerCase();
          const isOldFormat = nonWebpExtensions.some(ext => nameLower.endsWith(ext));
          if (!isOldFormat) return false;

          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(file.name);
          const isActive = activeUrls.has(urlData?.publicUrl || '');
          return !isActive;
        });

        if (filesToDelete.length > 0) {
          const pathsToDelete = filesToDelete.map(f => f.name);
          const { error: deleteError } = await supabase.storage.from('avatars').remove(pathsToDelete);
          if (!deleteError) {
            deletedCount += pathsToDelete.length;
          }
        }

        if (storageFiles.length < pageSize) break;
        pageOffset += pageSize;
      }

      setMigrationProgress(`✅ Готово! Конвертировано постов: ${postsCount}, аватарок: ${usersCount}. Удалено старых файлов из хранилища: ${deletedCount}.`);
      loadPlayers(); 
    } catch (e: any) {
      alert(`Ошибка выполнения скрипта: ${e.message}`);
      setMigrationProgress('Процесс принудительно остановлен.');
    } finally {
      setIsMigrating(false);
    }
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

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function fetchServerStatus() {
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
  }

  async function loadLatestPosts() {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, author:users(rp_name)')
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
      else alert('Не удалось выполнить действие: ' + (data.error || 'Неизвестная ошибка'));
    } catch (e) {
      alert('Ошибка при отправке команды');
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
        loadLatestPosts();
      }
    } catch (e: any) {
      setError(`Ошибка базы данных: ${e.message}`);
    } finally {
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
    const updatedContent = editorRef.current.innerHTML;
    const docId = activeDocument === 'constitution' ? 1 : 2;
    const { error } = await supabase.from('constitution').upsert({ id: docId, content: updatedContent });
    if (!error) {
      if (activeDocument === 'constitution') setConstitutionText(updatedContent);
      else setCommandmentsText(updatedContent);
      setIsEditing(false);
    } else {
      alert(`Ошибка сохранения. Ошибка: ${error.message}`);
    }
  }

  async function saveProfileData() {
    if (!selectedPlayer || !newRpName.trim()) return;
    const { error = null } = await supabase.from('users').update({ rp_name: newRpName, avatar_url: newAvatarUrl }).eq('id', selectedPlayer.id); 
    if (!error) {
      const updatedUser = { ...selectedPlayer, rp_name: newRpName, avatar_url: newAvatarUrl };
      setSelectedPlayer(updatedUser);
      if (dbUser?.id === selectedPlayer.id) setDbUser(updatedUser);
      setIsEditingProfile(false);
      loadPlayers();
    } else {
      alert(`Ошибка при сохранении: ${error.message}`);
    }
  }

  async function handleAddPlayer() {
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
  }

  async function handleCreateRole() {
    if (!newRoleName.trim()) return;
    const newRole = { name: newRoleName.toLowerCase(), color: newRoleColor, can_edit_constitution: newRolePerm };
    const { error = null } = await supabase.from('roles').insert([newRole]);
    if (!error) {
      setNewRoleName('');
      setNewRolePerm(false);
      loadRoles();
    } else {
      alert(`Ошибка: Имя роли должно быть уникальным`);
    }
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

  function handleTabChange(tab: 'profile' | 'constitution' | 'players' | 'admin' | 'map' | 'media' | 'archive') {
    setSelectedPlayer(null); setIsEditingProfile(false); setShowRoleSelector(false); 
    setActiveTab(tab);
    setActiveDocument('none'); 
    setIsEditing(false);
    setSearchQuery('');
    if (tab === 'profile') loadLatestPosts();
  }

  // ИСПРАВЛЕНО: Полностью удален ошибочный отладочный блок мока checkUserInDb(12345). Оставлена только строгая проверка Telegram WebApp окружения
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

      if (tg.initDataUnsafe.start_param) {
        const param = tg.initDataUnsafe.start_param;
        const alreadyHandled = sessionStorage.getItem('handled_start_param');
        
        if (param.startsWith('post_') && alreadyHandled !== param) {
          sessionStorage.setItem('handled_start_param', param); 
          const postId = param.replace('post_', '');
          router.push(`/media/${postId}`);
          return;
        }
      }
      checkUserInDb(tg.initDataUnsafe.user.id);
    } else {
      setError('Пожалуйста, откройте приложение внутри Telegram.');
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

  return (
    <div className="min-h-screen text-white pb-32 md:pb-8 antialiased selection:bg-[#c0ff00] selection:text-black transition-colors duration-300 w-full max-w-full relative z-0 flex flex-col">
      
      <div className="fixed inset-0 bg-[#090b0e] -z-10 md:hidden" />
      <div className="fixed inset-0 -z-10 hidden md:block bg-[#090b0e]">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover">
          <source src="/bg-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#090b0e]/85 backdrop-blur-[2px]" />
      </div>

      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${selectedPlayer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => { setSelectedPlayer(null); setIsEditingProfile(false); setShowRoleSelector(false); }} />
      <div className="fixed top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#090b0e] via-[#090b0e]/95 to-transparent pointer-events-none z-30 w-full" />

      <div className="fixed top-[96px] left-4 right-4 md:left-44 md:right-12 z-40 max-w-md md:max-w-7xl mx-auto flex items-center justify-end gap-2 pointer-events-none">
        <div className={`transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden flex items-center justify-center ${showToolbar ? 'w-10 opacity-100 scale-100 translate-x-0' : 'w-0 opacity-0 scale-50 -translate-x-8 pointer-events-none'}`}>
          <button onClick={saveDocument} className="pointer-events-auto bg-[#c0ff00] text-black w-10 h-10 rounded-full shadow-lg flex items-center justify-center flex-shrink-0 hover:scale-105 active:scale-95 transition-transform">
            <Save size={16} />
          </button>
        </div>
      </div>

      {selectedPlayer && (
        <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-32px)] max-w-md p-6 rounded-[32px] border border-white/10 shadow-2xl text-center space-y-5 animate-profile-grow overflow-visible transition-colors duration-300 ${selectedPlayer && isDead(selectedPlayer.roles) ? 'bg-[#0a0c0f]' : 'bg-[#14171c]'}`}>
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#c0ff00]/10 to-transparent pointer-events-none rounded-t-[32px]" />
          <button onClick={() => { setSelectedPlayer(null); setIsEditingProfile(false); setShowRoleSelector(false); }} className="absolute top-4 right-4 p-1.5 bg-white/5 border border-white/5 rounded-full text-gray-400 hover:text-white active:scale-90 transition-all z-10"><X size={14} /></button>

          {((selectedPlayer.id === dbUser?.id && !isDead(selectedPlayer.roles)) || isAdmin) && !isEditingProfile && (
            <button onClick={() => { setNewRpName(selectedPlayer.rp_name); setNewAvatarUrl(selectedPlayer.avatar_url || ''); setIsEditingProfile(true); }} className="absolute top-4 left-4 p-2 bg-white/5 border border-white/5 rounded-full text-gray-400 hover:text-[#c0ff00] active:scale-90 transition-all z-10"><Edit2 size={14} /></button>
          )}

          <div className={`relative w-24 h-24 rounded-full overflow-hidden bg-[#1c2026] border-2 mx-auto shadow-lg transition-all duration-300 ${selectedPlayer && isDead(selectedPlayer.roles) ? 'border-gray-600 opacity-60 grayscale' : 'border-[#c0ff00]'}`}>
            <img src={isEditingProfile ? newAvatarUrl : (selectedPlayer.avatar_url || 'https://via.placeholder.com/150')} alt="avatar" className="w-full h-full object-cover" />
          </div>

          <div className="space-y-2 w-full">
            {isEditingProfile ? (
              <div className="space-y-3 max-w-xs mx-auto w-full animate-fade-in">
                <input type="text" placeholder="Имя профиля" value={newRpName} onChange={(e) => setNewRpName(e.target.value)} className="ui-input text-center font-bold" />
                <label className="ui-pill-btn w-full justify-center !bg-white/5 !border-white/10 hover:!border-[#c0ff00]/40 cursor-pointer py-2.5 relative overflow-hidden">
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => handleFileUpload(e, setNewAvatarUrl, setIsUploadingProfile)} disabled={isUploadingProfile} />
                  <Upload size={14} className={isUploadingProfile ? "animate-bounce" : ""} />
                  <span className="font-medium text-xs">{isUploadingProfile ? 'Грузим file...' : 'Загрузить из галереи'}</span>
                </label>
                <button onClick={saveProfileData} disabled={isUploadingProfile} className="ui-pill-btn w-full justify-center !bg-[#c0ff00] !text-black font-bold py-2.5 mt-2 disabled:opacity-50"><Save size={14} /><span>Сохранить всё</span></button>
              </div>
            ) : (
              <div className="w-full space-y-1">
                <h2 className={`text-2xl font-black tracking-wide break-all px-6 transition-all duration-300 ${selectedPlayer && isDead(selectedPlayer.roles) ? 'text-gray-500 line-through' : 'text-white'}`}>{selectedPlayer.rp_name}</h2>
                <p className="text-sm text-gray-400 font-mono tracking-tight break-all">{selectedPlayer.mc_nickname}</p>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5 rounded-full text-xs font-medium mt-1 ${selectedPlayer && isDead(selectedPlayer.roles) ? 'text-gray-500' : 'text-[#c0ff00]'}`}>
                  <span>🏛️ Партия:</span><span className="font-bold">{selectedPlayer.party || 'Нет партии'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <main key={activeTab} className="p-4 pt-36 pb-24 md:pb-12 md:pl-[160px] md:pr-12 max-w-md md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto transition-all duration-300 w-full flex-grow flex flex-col animate-fade-in">
        {activeTab === 'profile' && (
          <div className="space-y-6 w-full">
            
            <div className="flex flex-col items-center text-center gap-3 pt-2 pb-6 w-full select-none">
              <img src="/OneAppLogo.gif" alt="OneApp Logo" className="w-40 h-40 object-contain" />
              <h3 className="text-base md:text-xl font-black text-white tracking-wide leading-tight">
                Добро пожаловать в One App<br />
                <span className="text-[#c0ff00] text-xl md:text-3xl font-black block mt-1.5">{dbUser?.rp_name || 'Житель'}</span>
              </h3>
            </div>

            <div className="grid grid-cols-4 gap-4 w-full">
              {/* 1. ВИДЖЕТ КОНСТИТУЦИИ */}
              <div 
                onClick={() => { setActiveTab('constitution'); setActiveDocument('constitution'); }}
                className="col-span-2 md:col-span-1 aspect-square bg-[#14171c]/90 backdrop-blur-xl rounded-[24px] border border-white/5 p-4 md:p-5 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:border-[#c0ff00]/30 transition-all duration-300 shadow-xl"
              >
                <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-all duration-500 bg-right-bottom bg-no-repeat bg-[length:90px] md:bg-[length:180px]" style={{ backgroundImage: "url('/1000024917.png')", imageRendering: "pixelated" }} />
                <div className="w-11 h-11 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-[#c0ff00] shrink-0">
                  <BookOpen size={20} />
                </div>
                <div className="space-y-0.5 relative z-10">
                  <h3 className="text-sm md:text-base font-black text-white tracking-wide">Конституция</h3>
                  <p className="text-[10px] text-[#c0ff00] font-bold uppercase tracking-wider">РП Законы</p>
                </div>
              </div>

              {/* 2. ВИДЖЕТ КАРТЫ */}
              <div 
                onClick={() => handleTabChange('map')}
                className="col-span-2 md:col-span-1 aspect-square bg-[#14171c]/90 backdrop-blur-xl rounded-[24px] border border-white/5 p-4 md:p-5 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:border-white/20 transition-all duration-300 shadow-xl"
              >
                <div className="absolute top-3 right-3 bg-[#c0ff00] text-black text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-md z-20">Soon</div>
                <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-15 transition-all duration-500 bg-right-bottom bg-no-repeat bg-[length:90px] md:bg-[length:180px] grayscale" style={{ backgroundImage: "url('/mapicon.svg')" }} />
                <div className="w-11 h-11 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-gray-400 shrink-0">
                  <Map size={20} />
                </div>
                <div className="space-y-0.5 relative z-10">
                  <h3 className="text-sm md:text-gray-300 font-black tracking-wide">Карта мира</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">3D Рендер</p>
                </div>
              </div>

              {/* 3. ВИДЖЕТ ПОСЛЕДНИХ НОВОСТЕЙ */}
              <div className="col-span-4 md:col-span-2 bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[24px] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col justify-between gap-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Newspaper size={16} className="text-[#c0ff00]" />
                    <div className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Последние публикации</div>
                  </div>
                  <button onClick={() => handleTabChange('media')} className="text-[11px] font-bold text-[#c0ff00] hover:underline">Все статьи</button>
                </div>
                
                <div className="grid grid-cols-2 gap-2.5 h-full">
                  {latestPosts.map((post) => (
                    <div 
                      key={post.id} 
                      onClick={() => router.push(`/media/${post.id}`)}
                      className="bg-black/20 border border-white/5 p-4 rounded-2xl cursor-pointer hover:border-white/10 transition-all duration-300 flex flex-col justify-between gap-3 group min-w-0"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="font-bold text-xs text-white group-hover:text-[#c0ff00] transition-colors line-clamp-2 break-words leading-snug">
                          {post.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium truncate">{post.author?.rp_name || 'Неизвестный'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. ВИДЖЕТ СТАТУСА СЕРВЕРА */}
              <div className="col-span-4 md:col-span-2 bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[24px] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col gap-4">
                <button
                  onClick={fetchServerStatus}
                  className={`absolute top-5 right-5 p-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all active:scale-90 z-20 ${isServerLoading ? 'animate-spin' : ''}`}
                >
                  <RefreshCw size={14} />
                </button>

                {serverInfo && <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-20 rounded-full pointer-events-none transition-colors duration-700 ${getServerStatusText(serverInfo.status).bg}`} />}

                <div className="relative z-10 flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <Server size={24} className={getServerStatusText(serverInfo?.status || 0).color} />
                    <div>
                      <div className={`text-base md:text-xl font-black tracking-wider transition-colors duration-300 ${serverInfo ? getServerStatusText(serverInfo.status).color : 'text-gray-400'}`}>
                        {serverInfo ? getServerStatusText(serverInfo.status).text : 'ЗАГРУЗКА...'}
                      </div>
                    </div>
                  </div>
                  {serverInfo?.status === 1 && (
                    <div className="bg-black/30 border border-white/5 px-2.5 py-1 rounded-xl text-[11px] font-bold text-gray-300">
                      Online: <span className="text-[#c0ff00] font-mono">{serverInfo.players.count}/{serverInfo.players.max}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 w-full relative z-10">
                  <div className="bg-black/20 border border-white/5 p-3 rounded-2xl flex items-center justify-between group">
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">IP СЕРВЕРА</div>
                      <div className="font-mono text-xs text-gray-200 truncate">{staticIp}</div>
                    </div>
                    <button onClick={() => copyToClipboard(staticIp)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-[#c0ff00] transition-colors shrink-0">
                      <Copy size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/20 border border-white/5 p-2.5 rounded-2xl flex items-center justify-between group">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 bg-white/5 rounded-lg text-gray-400"><AnvilIcon size={14} /></div>
                        <div className="min-w-0">
                          <div className="text-[8px] text-gray-500 font-bold uppercase">Версия</div>
                          <div className="font-bold text-[11px] text-white truncate">1.20.1</div>
                        </div>
                      </div>
                      <a href="https://maven.minecraftforge.net/net/minecraftforge/forge/1.20.1-47.4.20/forge-1.20.1-47.4.20-installer.jar" target="_blank" rel="noopener noreferrer" className="w-6 h-6 bg-white/5 hover:bg-[#c0ff00] text-gray-400 hover:text-black rounded-full flex items-center justify-center transition-all shrink-0">
                        <Download size={11} />
                      </a>
                    </div>

                    {credits !== null && (
                      <div className="bg-black/20 border border-white/5 p-2.5 rounded-2xl flex items-center gap-2 group">
                        <div className="p-1.5 bg-[#c0ff00]/10 rounded-lg text-[#c0ff00]"><Coins size={14} /></div>
                        <div className="min-w-0">
                          <div className="text-[8px] text-gray-500 font-bold uppercase">{credits.toFixed(0)} кр.</div>
                          <div className="font-mono text-[10px] text-[#c0ff00] truncate">{Math.floor(credits / 7)}ч {Math.floor(((credits % 7) / 7) * 60)}м</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 relative z-10 w-full">
                  <button onClick={() => handleServerAction('start')} disabled={serverActionLoading || (serverInfo && serverInfo.status !== 0)} className="flex-1 ui-pill-btn justify-center py-2 !bg-[#c0ff00]/10 !border-[#c0ff00]/30 !text-[#c0ff00] hover:!bg-[#c0ff00]/20 disabled:opacity-30"><Play size={12} className="fill-current" /><span>Включить</span></button>
                  <button onClick={() => handleServerAction('stop')} disabled={serverActionLoading || (serverInfo && serverInfo.status === 0)} className="flex-1 ui-pill-btn justify-center py-2 !bg-red-500/10 !border-red-500/30 !text-red-500 hover:!bg-red-500/20 disabled:opacity-30"><Square size={12} className="fill-current" /><span>Выключить</span></button>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'archive' && (
          <Archive currentUser={dbUser} />
        )}

        {activeTab === 'media' && (
          <div className="w-full space-y-6">
            <MediaBlog currentUser={dbUser} onProfileClick={setSelectedPlayer} isCreatingPost={isCreatingPost} setIsCreatingPost={setIsCreatingPost} />
          </div>
        )}

        {activeTab === 'constitution' && (
          <div className="space-y-4 animate-fade-in w-full relative flex-grow flex flex-col">
            <div className="flex items-center justify-between w-full border-b border-white/5 pb-3">
              <div className="flex items-center gap-3">
                {activeDocument !== 'none' && !isEditing && (
                  <button onClick={() => setActiveDocument('none')} className="md:hidden p-1.5 bg-white/5 border border-white/10 rounded-full text-gray-400"><ArrowLeft size={16} /></button>
                )}
                <h2 className="text-lg md:text-xl font-black text-[#c0ff00] tracking-wide flex items-center gap-2"><BookOpen size={20} />Свод законов и правил</h2>
              </div>
              {activeDocument !== 'none' && canEditConstitution && !isEditing && (
                <button onClick={() => setIsEditing(true)} className="ui-pill-btn"><Edit2 size={12} /><span>Редактировать</span></button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start w-full flex-grow mt-2">
              <div className={`${activeDocument !== 'none' ? 'hidden md:flex' : 'flex'} flex-col gap-3 md:col-span-1 w-full`}>
                <div onClick={() => { setActiveDocument('constitution'); setIsEditing(false); }} className={`p-4 rounded-2xl border transition-all cursor-pointer ${activeDocument === 'constitution' ? 'bg-[#c0ff00]/10 border-[#c0ff00]/30 text-[#c0ff00]' : 'bg-[#14171c]/90 border-white/5 text-white hover:border-white/25'}`}>
                  <h3 className="font-bold text-sm">Конституция</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Внутриигровые РП законы мира</p>
                </div>
                <div onClick={() => { setActiveDocument('commandments'); setIsEditing(false); }} className={`p-4 rounded-2xl border transition-all cursor-pointer ${activeDocument === 'commandments' ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'bg-[#14171c]/90 border-white/5 text-white hover:border-white/25'}`}>
                  <h3 className="font-bold text-sm">Заповеди дома</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">Внеигровые (Нон-РП) правила</p>
                </div>
              </div>

              <div className={`${activeDocument === 'none' ? 'hidden md:block' : 'block'} md:col-span-2 w-full h-full`}>
                {activeDocument === 'none' ? (
                  <div className="bg-[#14171c]/40 border border-white/5 rounded-[28px] p-8 text-center text-gray-500 font-mono text-xs flex flex-col items-center justify-center min-h-[300px]">
                    <BookOpen size={36} className="text-gray-700 mb-3" />
                    <span>ВЫБЕРИТЕ ДОКУМЕНТ ДЛЯ ПРОСМОТРА</span>
                  </div>
                ) : (
                  <div className="space-y-4 w-full">
                    {!isEditing && (
                      <div className="flex items-center bg-[#1c2026]/90 border border-white/10 rounded-full px-4 py-2.5 w-full shadow-md">
                        <Search size={14} className="text-[#c0ff00] shrink-0" />
                        <input type="text" placeholder="Поиск по документу..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-xs text-white ml-3 w-full placeholder:text-gray-500 focus:ring-0" />
                      </div>
                    )}
                    {isEditing ? (
                      <div className="space-y-4 animate-fade-in w-full">
                        <div ref={editorRef} contentEditable className="w-full min-h-[500px] bg-[#14171c]/90 border border-white/5 focus:border-[#c0ff00]/40 rounded-[28px] p-5 text-base text-gray-200 focus:outline-none shadow-inner prose prose-invert max-w-none break-words pb-20" />
                      </div>
                    ) : (
                      <div ref={viewRef} className="bg-[#14171c]/90 border border-white/5 p-5 rounded-[28px] text-base leading-relaxed text-gray-300 prose prose-invert shadow-md break-words w-full transition-all" dangerouslySetInnerHTML={{ __html: currentDocText }} />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'players' && (
          <div className="space-y-6 animate-fade-in w-full">
            <div className="flex items-center justify-between w-full px-1">
              <h2 className="text-lg md:text-xl font-black text-white tracking-wide flex items-center gap-2"><Users size={20} className="text-[#c0ff00]" />Жители сервера</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
              {sortedPlayers.map((player) => {
                const dead = isDead(player.roles);
                return (
                  <div key={player.id} onClick={() => { setIsEditingProfile(false); setSelectedPlayer(player); }} className={`p-4 rounded-[28px] flex items-center space-x-4 transition-all duration-300 hover:scale-[1.03] cursor-pointer shadow-md w-full border ${dead ? 'bg-[#0a0c0f] border-transparent opacity-60 grayscale' : 'bg-[#14171c]/90 backdrop-blur-xl border-white/5 hover:border-white/20'}`}>
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1c2026] border border-white/10 flex-shrink-0"><img src={player.avatar_url || 'https://via.placeholder.com/150'} alt="avatar" className="w-full h-full object-cover" /></div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-black truncate tracking-wide ${dead ? 'text-gray-500 line-through' : 'text-white'}`}>{player.rp_name}</div>
                      <div className="text-xs text-gray-400 truncate font-mono tracking-tight">{player.mc_nickname}</div>
                      <div className="text-[11px] text-gray-400 font-medium mt-0.5 truncate">🏛️ {player.party || 'Нет партии'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <nav className={`md:hidden fixed bottom-5 left-4 right-4 bg-[#14171c]/90 backdrop-blur-xl border border-white/10 py-3 rounded-full z-50 shadow-2xl transition-all duration-500 ${showToolbar || isCreatingPost ? 'opacity-0 translate-y-16 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
        <div className="flex w-full items-center justify-around px-2">
          <button onClick={() => handleTabChange('profile')} className={`flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'profile' && !selectedPlayer ? 'text-[#c0ff00] scale-105' : 'text-gray-500'}`}><HomeIcon size={22} /><span className="text-[10px] font-bold mt-1 tracking-wide">Главная</span></button>
          <button onClick={() => handleTabChange('media')} className={`flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'media' ? 'text-[#c0ff00] scale-105' : 'text-gray-500'}`}><Newspaper size={22} /><span className="text-[10px] font-bold mt-1 tracking-wide">.медиа</span></button>
          <button onClick={() => handleTabChange('constitution')} className={`flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'constitution' ? 'text-[#c0ff00] scale-105' : 'text-gray-500'}`}><BookOpen size={22} /><span className="text-[10px] font-bold mt-1 tracking-wide">Законы</span></button>
          <button onClick={() => handleTabChange('archive')} className={`flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'archive' ? 'text-[#c0ff00] scale-105' : 'text-gray-500'}`}><Library size={22} /><span className="text-[10px] font-bold mt-1 tracking-wide">Архив</span></button>
          <button onClick={() => handleTabChange('players')} className={`flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'players' || selectedPlayer ? 'text-[#c0ff00] scale-105' : 'text-gray-500'}`}><Users size={22} /><span className="text-[10px] font-bold mt-1 tracking-wide">Игроки</span></button>
        </div>
      </nav>

      {/* ПК Сайдбар */}
      <aside className={`hidden md:flex flex-col items-center gap-6 fixed left-6 top-1/2 -translate-y-1/2 z-50 transition-all duration-500 ${showToolbar || isCreatingPost ? 'opacity-0 -translate-x-32 pointer-events-none' : 'opacity-100 translate-x-0'}`}>
       {dbUser && (
         <button onClick={() => { setIsEditingProfile(false); setSelectedPlayer(dbUser); }} className="group relative w-[72px] h-[72px] bg-[#14171c]/70 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center hover:border-[#c0ff00]/40 transition-all shadow-2xl hover:scale-105 z-50">
           <div className="w-[56px] h-[56px] rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#c0ff00]/50 transition-all"><img src={dbUser.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" /></div>
         </button>
       )}
       <nav className="w-[72px] bg-[#14171c]/70 backdrop-blur-xl border border-white/10 py-6 px-1 rounded-[36px] shadow-2xl flex flex-col items-center gap-8 relative">
         <button onClick={() => handleTabChange('profile')} className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 ${activeTab === 'profile' ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-white'}`}><HomeIcon size={28} /></button>
         <button onClick={() => handleTabChange('media')} className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 ${activeTab === 'media' ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-white'}`}><Newspaper size={28} /></button>
         <button onClick={() => handleTabChange('constitution')} className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 ${activeTab === 'constitution' ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-white'}`}><BookOpen size={28} /></button>
         <button onClick={() => handleTabChange('archive')} className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 ${activeTab === 'archive' ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-white'}`}><Library size={28} /></button>
         <button onClick={() => handleTabChange('players')} className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 ${activeTab === 'players' ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-white'}`}><Users size={28} /></button>
         {/* ИСПРАВЛЕНО: Кнопка админки возвращена на десктопный сайдбар */}
         {isAdmin && <button onClick={() => handleTabChange('admin')} className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 ${activeTab === 'admin' ? 'text-[#c0ff00] scale-110' : 'text-gray-500 hover:text-white'}`}><ShieldAlert size={28} /></button>}
       </nav>
      </aside>

      <button onClick={scrollToTop} className={`fixed z-40 p-3 bg-[#14171c]/90 backdrop-blur-md border border-[#c0ff00]/40 text-[#c0ff00] rounded-full shadow-lg transition-all duration-500 hover:scale-110 ${showScrollTop ? 'bottom-24 right-6 md:bottom-10 md:right-10 opacity-100' : 'opacity-0 pointer-events-none'}`}><ArrowUp size={20} /></button>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap');
        body, html { font-family: 'Google Sans', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif !important; max-w-full; overflow-x: clip; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .ui-pill-btn { background-color: rgba(20, 23, 28, 0.85); border: 1px solid rgba(255, 255, 255, 0.08); padding: 8px 16px; border-radius: 9999px; backdrop-filter: blur(16px); display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #e5e7eb; transition: all 0.3s ease; cursor: pointer; }
        .ui-pill-btn:hover { border-color: rgba(192, 255, 0, 0.3); color: #ffffff; }
        .ui-input { width: 100%; background-color: rgba(0, 0, 0, 0.25); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 16px; padding: 12px 16px; font-size: 13px; color: #ffffff; outline: none; transition: all 0.25s ease; }
        .prose h1 { font-size: 1.25rem !important; font-weight: 800 !important; color: #ffffff !important; margin-top: 1.2rem !important; }
        .prose h2 { font-size: 1.1rem !important; font-weight: 800 !important; color: #c0ff00 !important; margin-top: 1rem !important; }
        .prose p { color: #d1d5db !important; margin-bottom: 0.75rem; }
      `}</style>
    </div>
  );
}
