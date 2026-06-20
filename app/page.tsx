'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  User, BookOpen, Users, Edit2, Check, X, ArrowLeft, ShieldAlert, UserPlus, ShieldCheck, Palette, Save,
  Bold, Italic, Strikethrough, Heading1, Heading2, AlignLeft, AlignCenter
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Состояния для админ-панели
  const [addTgId, setAddTgId] = useState('');
  const [addTgUsername, setAddTgUsername] = useState('');
  const [addMcNickname, setAddMcNickname] = useState('');
  const [addRpName, setAddRpName] = useState('');
  const [addAvatarUrl, setAddAvatarUrl] = useState('');
  const [addParty, setAddParty] = useState('');
  const [addRoles, setAddRoles] = useState<string[]>(['citizen']);

  // Управление кастомными ролями
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([
    { name: 'admin', color: '#ef4444', canEditConstitution: true },
    { name: 'president', color: '#f59e0b', canEditConstitution: true },
    { name: 'editor', color: '#3b82f6', canEditConstitution: true },
    { name: 'citizen', color: '#10b981', canEditConstitution: false }
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
      if (typeof tg.requestFullscreen === 'function') {
        tg.requestFullscreen();
      }

      const userFromTg = tg.initDataUnsafe.user;
      setTgUser(userFromTg);
      checkUserInDb(userFromTg.id);
    } else {
      const mockTgId = 654479769; 
      setTgUser({ id: mockTgId, username: 'developer' });
      checkUserInDb(mockTgId);
    }

    const savedRoles = localStorage.getItem('onehouse_custom_roles');
    if (savedRoles) {
      setCustomRoles(JSON.parse(savedRoles));
    }
  }, []);

  const checkUserInDb = async (tgId: number) => {
    try {
      const { data: user, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('tg_id', tgId)
        .single();

      if (dbError || !user) {
        setError(`Пользователь с TG ID ${tgId} не найден в базе Supabase.`);
      } else {
        setDbUser(user);
        setNewRpName(user.rp_name);
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

  const saveRpName = async () => {
    if (!dbUser || !newRpName.trim()) return;
    const { error } = await supabase.from('users').update({ rp_name: newRpName }).eq('id', dbUser.id);
    if (!error) {
      setDbUser({ ...dbUser, rp_name: newRpName });
      setIsEditingName(false);
      loadPlayers();
    }
  };

  const handleAddPlayer = async () => {
    if (!addTgId || !addRpName || !addMcNickname) return;
    const { error } = await supabase.from('users').insert([{
      tg_id: parseInt(addTgId),
      tg_username: addTgUsername,
      mc_nickname: addMcNickname,
      rp_name: addRpName,
      avatar_url: addAvatarUrl,
      roles: addRoles,
      party: addParty || 'Нет партии'
    }]);

    if (!error) {
      setAddTgId('');
      setAddTgUsername('');
      setAddMcNickname('');
      setAddRpName('');
      setAddAvatarUrl('');
      setAddParty('');
      loadPlayers();
    }
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) return;
    const updated = [...customRoles, { name: newRoleName.toLowerCase(), color: newRoleColor, canEditConstitution: newRolePerm }];
    setCustomRoles(updated);
    localStorage.setItem('onehouse_custom_roles', JSON.stringify(updated));
    setNewRoleName('');
    setNewRolePerm(false);
  };

  const handleToggleRolePerm = (index: number) => {
    const updated = [...customRoles];
    updated[index].canEditConstitution = !updated[index].canEditConstitution;
    setCustomRoles(updated);
    localStorage.setItem('onehouse_custom_roles', JSON.stringify(updated));
  };

  const handleUpdateRoleColor = (index: number, color: string) => {
    const updated = [...customRoles];
    updated[index].color = color;
    setCustomRoles(updated);
    localStorage.setItem('onehouse_custom_roles', JSON.stringify(updated));
  };

  const execEditorCommand = (command: string, value: string = '') => {
    if (typeof document !== 'undefined') {
      document.execCommand(command, false, value);
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }
  };

  const saveConstitution = async () => {
    if (!editorRef.current) return;
    const updatedContent = editorRef.current.innerHTML;
    const { error } = await supabase.from('constitution').update({ content: updatedContent }).eq('id', 1);
    if (!error) {
      setConstitution(updatedContent);
      setIsEditing(false);
    }
  };

  const handleTabChange = (tab: 'profile' | 'constitution' | 'players' | 'admin') => {
    setSelectedPlayer(null);
    setActiveTab(tab);
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

  const showToolbar = isEditing && activeTab === 'constitution' && !selectedPlayer;

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
          <div className="text-sm text-gray-400 font-mono text-left bg-black/30 p-3 rounded-lg border border-white/5 whitespace-pre-wrap">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b0e] text-white pb-32 antialiased selection:bg-[#c0ff00] selection:text-black transition-colors duration-300 overflow-x-hidden w-full max-w-full">
      
      <div className="fixed top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#090b0e] via-[#090b0e]/95 to-transparent pointer-events-none z-30 w-full" />

      <div className="fixed top-[96px] left-4 right-4 z-40 max-w-md mx-auto flex items-center justify-between gap-2 pointer-events-none">
        
        <div className={`p-1 bg-[#14171c]/95 border border-white/10 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-0.5 transition-all duration-300 ease-in-out pointer-events-auto origin-left ${showToolbar ? 'flex-1 opacity-100 scale-100 translate-x-0' : 'absolute opacity-0 scale-95 -translate-x-4 pointer-events-none'}`}>
          <div className="flex items-center w-full justify-start overflow-x-auto no-scrollbar py-0.5 px-1 gap-0.5">
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

        {dbUser && !selectedPlayer && (
          <button 
            onClick={() => {
              setIsEditingName(false);
              setSelectedPlayer(dbUser);
            }}
            className={`ml-auto flex items-center bg-[#14171c]/90 border border-white/10 p-1.5 rounded-full transition-all duration-300 ease-in-out active:scale-95 shadow-2xl hover:border-[#c0ff00]/30 backdrop-blur-md pointer-events-auto ${showToolbar ? 'max-w-0 opacity-0 ml-0 invisible' : 'max-w-[100px] opacity-100 ml-2'}`}
          >
            <div className="w-5 h-5 rounded-full overflow-hidden border border-white/15 flex-shrink-0">
              <img src={dbUser.avatar_url || 'https://via.placeholder.com/150'} alt="me" className="w-full h-full object-cover" />
            </div>
            <span className={`text-[11px] font-bold text-gray-200 tracking-wide transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap inline-block ${showToolbar ? 'max-w-0 opacity-0 ml-0' : 'max-w-[60px] opacity-100 ml-2'}`}>
              Профиль
            </span>
          </button>
        )}

      </div>

      <main className="p-4 pt-36 max-w-md mx-auto transition-all duration-300 w-full overflow-x-hidden break-words">
        
        {selectedPlayer ? (
          <div className="space-y-6 animate-fade-in w-full">
            <button 
              onClick={() => setSelectedPlayer(null)}
              className="ui-pill-btn"
            >
              <ArrowLeft size={14} />
              <span>Назад</span>
            </button>

            <div className="bg-[#14171c] p-6 rounded-[28px] border border-white/5 text-center space-y-4 shadow-2xl relative overflow-hidden w-full transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#c0ff00]/10 to-transparent" />
              
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-[#1c2026] border-2 border-[#c0ff00] mx-auto shadow-lg transform transition-transform duration-500 hover:scale-105">
                <img src={selectedPlayer.avatar_url || 'https://via.placeholder.com/150'} alt="avatar" className="w-full h-full object-cover" />
              </div>

              <div className="relative space-y-2 w-full">
                {selectedPlayer.id === dbUser?.id ? (
                  <div className="space-y-3 max-w-xs mx-auto w-full">
                    {isEditingName ? (
                      <div className="flex items-center space-x-2 justify-center mt-2 w-full">
                        <input 
                          type="text" 
                          value={newRpName} 
                          onChange={(e) => setNewRpName(e.target.value)}
                          className="bg-[#1c2026] text-white text-center text-lg font-bold px-3 py-1.5 rounded-xl border border-[#c0ff00] w-full focus:outline-none transition-colors"
                        />
                        <button 
                          onClick={async () => {
                            await saveRpName();
                            setSelectedPlayer({ ...selectedPlayer, rp_name: newRpName });
                          }} 
                          className="p-2.5 text-black bg-[#c0ff00] rounded-full active:scale-90 transition-all flex-shrink-0"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 justify-center w-full">
                        <h2 className="text-2xl font-black tracking-wide text-white break-all">{selectedPlayer.rp_name}</h2>
                        <button onClick={() => setIsEditingName(true)} className="p-1.5 text-gray-400 bg-white/5 border border-white/5 rounded-full hover:text-white transition-all flex-shrink-0 active:scale-75">
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full">
                    <h2 className="text-2xl font-black tracking-wide text-white break-all">{selectedPlayer.rp_name}</h2>
                  </div>
                )}
                <p className="text-sm text-gray-500 font-mono tracking-tight break-all">{selectedPlayer.mc_nickname}</p>
                
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5 rounded-full text-xs text-[#c0ff00] font-medium mt-1">
                  <span>🏛️ Партия:</span>
                  <span className="font-bold">{selectedPlayer.party || 'Нет партии'}</span>
                </div>
              </div>

              <div className="w-full h-[1px] bg-white/5 my-4" />

              <div className="text-left space-y-2 w-full">
                <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold pl-1">Установленные роли</div>
                <div className="flex flex-wrap gap-2">
                  {selectedPlayer.roles.map((role, idx) => (
                    <span 
                      key={idx} 
                      className="text-xs font-bold px-3 py-1 rounded-full border transition-all"
                      style={{ backgroundColor: `${getRoleColor(role)}15`, color: getRoleColor(role), borderColor: `${getRoleColor(role)}30` }}
                    >
                      • {role.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'profile' && (
              <div className="flex flex-col items-center justify-center min-h-[45vh] animate-fade-in text-center space-y-3 w-full">
                <div className="text-2xl font-black tracking-widest text-[#c0ff00] bg-[#c0ff00]/5 px-6 py-3.5 rounded-2xl border border-[#c0ff00]/10 shadow-lg shadow-[#c0ff00]/5">
                  В РАЗРАБОТКЕ
                </div>
                <p className="text-xs text-gray-500 max-w-[220px]">Этот раздел наполнится контентом в ближайших обновлениях</p>
              </div>
            )}

            {activeTab === 'constitution' && (
              <div className="space-y-4 animate-fade-in w-full overflow-x-hidden">
                <div className="flex items-center justify-between w-full">
                  <h2 className="text-lg font-bold text-[#c0ff00] tracking-wide">Конституция Дома</h2>
                  {canEditConstitution && !isEditing && (
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="ui-pill-btn"
                    >
                      <Edit2 size={12} />
                      <span>Редактировать</span>
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4 scale-100 w-full overflow-x-hidden pt-2">
                    <div 
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      className="w-full min-h-[400px] bg-[#14171c] border border-white/5 focus:border-[#c0ff00]/40 rounded-[28px] p-5 text-base leading-relaxed text-gray-200 focus:outline-none transition-all shadow-inner prose prose-invert max-w-none break-words overflow-x-hidden"
                      dangerouslySetInnerHTML={{ __html: constitution }}
                      data-placeholder="Начните писать законы здесь..."
                    />

                    <button 
                      onClick={saveConstitution} 
                      className="ui-pill-btn w-full justify-center !bg-[#c0ff00] !text-black py-3.5"
                    >
                      <Save size={14} />
                      <span>Сохранить изменения</span>
                    </button>
                  </div>
                ) : (
                  <div 
                    className="bg-[#14171c] p-5 rounded-[28px] border border-white/5 text-base leading-relaxed max-w-none text-gray-300 prose prose-invert shadow-md break-words overflow-x-hidden w-full"
                    dangerouslySetInnerHTML={{ __html: constitution }}
                  />
                )}
              </div>
            )}

            {activeTab === 'players' && (
              <div className="space-y-6 animate-fade-in w-full">
                
                {dbUser && (
                  <div className="space-y-2 w-full">
                    <div className="text-xs text-[#c0ff00] uppercase tracking-wider font-extrabold pl-1">Мой личный профиль</div>
                    <div 
                      onClick={() => {
                        setIsEditingName(false);
                        setSelectedPlayer(dbUser);
                      }}
                      className="bg-gradient-to-r from-[#14171c] to-[#1c2026] p-4 rounded-[28px] border border-[#c0ff00]/30 flex items-center space-x-4 transition-all duration-300 cursor-pointer shadow-lg shadow-[#c0ff00]/5 hover:border-[#c0ff00]/50 active:scale-95 w-full"
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-[#1c2026] border-2 border-[#c0ff00] flex-shrink-0">
                        <img src={dbUser.avatar_url || 'https://via.placeholder.com/150'} alt="avatar" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-black truncate text-white tracking-wide flex items-center gap-2">
                          <span className="truncate">{dbUser.rp_name}</span>
                          <span className="text-[9px] bg-[#c0ff00] text-black font-black px-1.5 py-0.5 rounded uppercase tracking-tight flex-shrink-0">Вы</span>
                        </div>
                        <div className="text-xs text-gray-400 truncate font-mono tracking-tight">{dbUser.mc_nickname}</div>
                        <div className="text-[11px] text-gray-400 font-medium mt-0.5 truncate">🏛️ {dbUser.party || 'Нет партии'}</div>
                      </div>
                      <div className="flex-shrink-0 text-gray-500">
                        <Edit2 size={16} className="text-[#c0ff00]/80" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3 w-full">
                  <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold pl-1">
                    Жители сервера ({players.filter(p => p.tg_id !== dbUser?.tg_id).length})
                  </div>
                  <div className="grid grid-cols-1 gap-3 w-full">
                    {players
                      .filter((player) => player.tg_id !== dbUser?.tg_id)
                      .map((player) => (
                        <div 
                          key={player.id} 
                          onClick={() => setSelectedPlayer(player)}
                          className="bg-[#14171c] p-4 rounded-[28px] border border-white/5 flex items-center space-x-4 transition-all duration-300 hover:scale-[1.02] hover:border-white/20 hover:bg-[#1a1e24] cursor-pointer shadow-md active:scale-[0.99] w-full"
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1c2026] border border-white/10 flex-shrink-0">
                            <img src={player.avatar_url || 'https://via.placeholder.com/150'} alt="avatar" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-black truncate text-white tracking-wide">{player.rp_name}</div>
                            <div className="text-xs text-gray-400 truncate font-mono tracking-tight">{player.mc_nickname}</div>
                            <div className="text-[11px] text-gray-500 font-medium mt-0.5 truncate">🏛️ {player.party || 'Нет партии'}</div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {player.roles.slice(0, 1).map((r, i) => (
                              <span 
                                key={i} 
                                className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full border"
                                style={{ backgroundColor: `${getRoleColor(r)}10`, color: getRoleColor(r), borderColor: `${getRoleColor(r)}25` }}
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'admin' && isAdmin && (
              <div className="space-y-6 animate-fade-in w-full">
                
                <div className="bg-[#14171c] p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">
                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider">
                    <UserPlus size={16} />
                    <span>Добавить жителя</span>
                  </div>
                  
                  <div className="space-y-3">
                    <input type="number" placeholder="Telegram ID" value={addTgId} onChange={e => setAddTgId(e.target.value)} className="ui-input"/>
                    <input type="text" placeholder="Telegram Username" value={addTgUsername} onChange={e => setAddTgUsername(e.target.value)} className="ui-input"/>
                    <input type="text" placeholder="Minecraft Никнейм" value={addMcNickname} onChange={e => setAddMcNickname(e.target.value)} className="ui-input"/>
                    <input type="text" placeholder="RP Имя" value={addRpName} onChange={e => setAddRpName(e.target.value)} className="ui-input"/>
                    <input type="text" placeholder="URL Аватарки" value={addAvatarUrl} onChange={e => setAddAvatarUrl(e.target.value)} className="ui-input"/>
                    <input type="text" placeholder="Политическая партия" value={addParty} onChange={e => setAddParty(e.target.value)} className="ui-input"/>
                  </div>

                  <button onClick={handleAddPlayer} className="ui-pill-btn w-full justify-center !bg-[#c0ff00] !text-black py-3">
                    <Check size={16} />
                    <span>Создать аккаунт</span>
                  </button>
                </div>

                <div className="bg-[#14171c] p-5 rounded-[28px] border border-white/5 space-y-4 shadow-xl">
                  <div className="flex items-center space-x-2 text-[#c0ff00] font-bold text-sm uppercase tracking-wider">
                    <ShieldCheck size={16} />
                    <span>Управление ролями</span>
                  </div>

                  <div className="p-4 bg-black/20 rounded-[20px] border border-white/5 space-y-3">
                    <input type="text" placeholder="Название новой роли" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} className="ui-input"/>
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <Palette size={14} />
                        <span>Цвет роли:</span>
                        <input type="color" value={newRoleColor} onChange={e => setNewRoleColor(e.target.value)} className="w-6 h-6 rounded bg-transparent border-none cursor-pointer" />
                      </div>
                      <label className="flex items-center space-x-2 text-xs text-gray-400 cursor-pointer">
                        <input type="checkbox" checked={newRolePerm} onChange={e => setNewRolePerm(e.target.checked)} className="rounded border-white/10 bg-transparent text-[#c0ff00] focus:ring-0"/>
                        <span>Ред. законов</span>
                      </label>
                    </div>
                    <button onClick={handleCreateRole} className="ui-pill-btn w-full justify-center py-2">
                      <UserPlus size={14} />
                      <span>Создать роль</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {customRoles.map((role, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-black/10 rounded-[18px] border border-white/5 transition-all">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color }} />
                          <span className="text-sm font-bold uppercase tracking-wide" style={{ color: role.color }}>{role.name}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <label className="flex items-center space-x-1.5 text-[11px] text-gray-400 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={role.canEditConstitution} 
                              onChange={() => handleToggleRolePerm(idx)} 
                              className="rounded border-white/10 bg-transparent text-[#c0ff00] focus:ring-0"
                            />
                            <span>Законы</span>
                          </label>
                          <input 
                            type="color" 
                            value={role.color} 
                            onChange={e => handleUpdateRoleColor(idx, e.target.value)} 
                            className="w-5 h-5 bg-transparent border-none cursor-pointer rounded"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

              </div>
            )}
          </>
        )}
      </main>

      <nav className="fixed bottom-6 left-6 right-6 bg-[#14171c]/70 backdrop-blur-xl border border-white/10 py-3 rounded-full z-50 shadow-2xl max-w-md mx-auto transition-all">
        <div className={`grid w-full items-center justify-items-center ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
          
          <button 
            onClick={() => handleTabChange('profile')} 
            className={`flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'profile' && !selectedPlayer ? 'text-[#c0ff00] scale-105' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <User size={20} />
            <span className="text-[10px] font-medium tracking-wide relative inline-block mt-1">
              Главная
              <span className="absolute -top-1 left-full ml-1 text-[7px] font-extrabold uppercase bg-[#c0ff00]/10 text-[#c0ff00] px-1 py-0.5 rounded tracking-tight border border-[#c0ff00]/25 scale-90 whitespace-nowrap">soon</span>
            </span>
          </button>

          <button 
            onClick={() => handleTabChange('constitution')} 
            className={`flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'constitution' ? 'text-[#c0ff00] scale-105' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <BookOpen size={20} />
            <span className="text-[10px] font-medium tracking-wide mt-1">Законы</span>
          </button>

          <button 
            onClick={() => handleTabChange('players')} 
            className={`flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'players' || selectedPlayer ? 'text-[#c0ff00] scale-105' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Users size={20} />
            <span className="text-[10px] font-medium tracking-wide mt-1">Игроки</span>
          </button>

          {isAdmin && (
            <button 
              onClick={() => handleTabChange('admin')} 
              className={`flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'admin' ? 'text-[#c0ff00] scale-105' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <ShieldAlert size={20} />
              <span className="text-[10px] font-medium tracking-wide mt-1">Админ</span>
            </button>
          )}

        </div>
      </nav>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap');
        
        body, html, button, input, textarea, div, span {
          font-family: 'Google Sans', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
          max-w-full;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); filter: blur(6px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #4b5563;
          cursor: text;
        }

        .ui-pill-btn {
          background-color: rgba(20, 23, 28, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 8px 16px;
          border-radius: 9999px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          color: #e5e7eb;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .ui-pill-btn:hover {
          border-color: rgba(192, 255, 0, 0.3);
          color: #ffffff;
          box-shadow: 0 10px 25px -5px rgba(192, 255, 0, 0.05);
        }
        .ui-pill-btn:active {
          transform: scale(0.94);
        }

        .ui-input {
          width: 100%;
          background-color: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 12px 16px;
          font-size: 13px;
          color: #ffffff;
          outline: none;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ui-input:focus {
          border-color: rgba(192, 255, 0, 0.4);
          background-color: rgba(0, 0, 0, 0.4);
          box-shadow: 0 0 0 1px rgba(192, 255, 0, 0.1);
        }

        .prose, .prose * {
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          max-w-full !important;
          white-space: pre-wrap !important;
        }
        .prose h1 { font-size: 1.5rem; font-weight: 800; color: #ffffff; margin-top: 1rem; margin-bottom: 0.5rem; }
        .prose h2 { font-size: 1.25rem; font-weight: 700; color: #c0ff00; margin-top: 0.8rem; margin-bottom: 0.4rem; }
        .prose p { margin-bottom: 0.75rem; color: #d1d5db; }
        .prose b, .prose strong { color: #ffffff; font-weight: 700; }
        .prose i, .prose em { color: #e5e7eb; font-style: italic; }
      `}</style>
    </div>
  );
}
