'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  User, BookOpen, Users, Edit2, Check, X, ArrowLeft,
  Heading1, Heading2, Bold, Italic, Strikethrough, AlignCenter, AlignLeft
} from 'lucide-react';

interface Player {
  id: string;
  tg_id: number;
  tg_username: string;
  mc_nickname: string;
  rp_name: string;
  avatar_url: string;
  roles: string[];
}

export default function Home() {
  const [tgUser, setTgUser] = useState<any>(null);
  const [dbUser, setDbUser] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'constitution' | 'players'>('players');
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [constitution, setConstitution] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [newRpName, setNewRpName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

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

  const handleTabChange = (tab: 'profile' | 'constitution' | 'players') => {
    setSelectedPlayer(null);
    setActiveTab(tab);
  };

  const canEditConstitution = dbUser?.roles.some(r => ['admin', 'president', 'editor'].includes(r));

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090b0e] text-[#c0ff00]">
        <div className="text-center animate-pulse">
          <div className="text-3xl font-black tracking-widest">ONEHOUSE</div>
          <div className="text-xs text-gray-400 mt-2">Загрузка профиля...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090b0e] px-6 text-center text-white animate-fade-in">
        <div className="bg-[#14171c] p-6 rounded-2xl border border-red-500/30 max-w-md w-full break-words shadow-2xl scale-95 transition-all">
          <div className="text-red-500 font-bold text-lg mb-2">Авторизация не удалась</div>
          <div className="text-sm text-gray-400 font-mono text-left bg-black/30 p-3 rounded-lg border border-white/5 whitespace-pre-wrap">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b0e] text-white pb-32 antialiased selection:bg-[#c0ff00] selection:text-black transition-colors duration-300">
      
      {/* Невидимый градиентный щит для скрытия контента под нативной панелью ТГ */}
      <div className="fixed top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#090b0e] via-[#090b0e]/90 to-transparent pointer-events-none z-30" />

      {/* Кнопка профиля: опущена ниже кнопок ТГ, но зафиксирована строго НАД основным контентом */}
      {dbUser && !selectedPlayer && (
        <button 
          onClick={() => {
            setIsEditingName(false);
            setSelectedPlayer(dbUser);
          }}
          className="fixed top-[74px] right-4 z-40 flex items-center space-x-2 bg-[#14171c]/90 border border-white/10 p-1.5 pr-3.5 rounded-full transition-all active:scale-95 shadow-2xl hover:border-[#c0ff00]/30 backdrop-blur-md"
        >
          <div className="w-5 h-5 rounded-full overflow-hidden border border-white/15 flex-shrink-0">
            <img src={dbUser.avatar_url || 'https://via.placeholder.com/150'} alt="me" className="w-full h-full object-cover" />
          </div>
          <span className="text-[11px] font-bold text-gray-200 tracking-wide">Профиль</span>
        </button>
      )}

      {/* Увеличенный до pt-28 (112px) невидимый отступ, полностью исключающий наложение на кнопки ТГ */}
      <main className="p-4 pt-28 max-w-md mx-auto transition-all duration-300">
        
        {selectedPlayer ? (
          <div className="space-y-6 animate-fade-in">
            <button 
              onClick={() => setSelectedPlayer(null)}
              className="flex items-center space-x-2 text-xs bg-[#14171c] border border-white/5 hover:border-white/10 px-4 py-2 rounded-xl font-semibold text-gray-300 active:scale-95 transition-all shadow-md"
            >
              <ArrowLeft size={14} />
              <span>Назад</span>
            </button>

            <div className="bg-[#14171c] p-6 rounded-3xl border border-white/5 text-center space-y-4 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#c0ff00]/10 to-transparent" />
              
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-[#1c2026] border-2 border-[#c0ff00] mx-auto shadow-lg transform transition-transform duration-500 hover:scale-105">
                <img src={selectedPlayer.avatar_url || 'https://via.placeholder.com/150'} alt="avatar" className="w-full h-full object-cover" />
              </div>

              <div className="relative space-y-2">
                {selectedPlayer.id === dbUser?.id ? (
                  <div className="space-y-3 max-w-xs mx-auto">
                    {isEditingName ? (
                      <div className="flex items-center space-x-2 justify-center mt-2">
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
                          className="p-2.5 text-black bg-[#c0ff00] rounded-xl active:scale-90 transition-transform flex-shrink-0"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 justify-center">
                        <h2 className="text-2xl font-black tracking-wide text-white">{selectedPlayer.rp_name}</h2>
                        <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-white transition-colors p-1.5 bg-white/5 rounded-xl border border-white/5">
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-black tracking-wide text-white">{selectedPlayer.rp_name}</h2>
                  </div>
                )}
                <p className="text-sm text-gray-500 font-mono mt-1 tracking-tight">{selectedPlayer.mc_nickname}</p>
              </div>

              <div className="w-full h-[1px] bg-white/5 my-4" />

              <div className="text-left space-y-2">
                <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold pl-1">Установленные роли</div>
                <div className="flex flex-wrap gap-2">
                  {selectedPlayer.roles.map((role, idx) => (
                    <span 
                      key={idx} 
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        role === 'admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        role === 'president' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        role === 'editor' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}
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
              <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in text-center space-y-3">
                <div className="text-2xl font-black tracking-widest text-[#c0ff00] bg-[#c0ff00]/5 px-6 py-3.5 rounded-2xl border border-[#c0ff00]/10 shadow-lg shadow-[#c0ff00]/5">
                  В РАЗРАБОТКЕ
                </div>
                <p className="text-xs text-gray-500 max-w-[220px]">Этот раздел наполнится контентом в ближайших обновлениях</p>
              </div>
            )}

            {activeTab === 'constitution' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#c0ff00] tracking-wide">Конституция Дома</h2>
                  {canEditConstitution && !isEditing && (
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="flex items-center space-x-1 text-xs bg-[#14171c] border border-white/5 hover:border-[#c0ff00]/30 px-3 py-1.5 rounded-xl font-semibold text-gray-300 transition-all duration-200 active:scale-95"
                    >
                      <Edit2 size={12} />
                      <span>Редактировать</span>
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4 transition-all duration-300 scale-100">
                    <div className="bg-[#14171c] p-2 rounded-xl border border-white/5 sticky top-[74px] z-40 flex flex-wrap gap-1 items-center justify-between shadow-xl backdrop-blur-md bg-opacity-95">
                      <div className="flex gap-1">
                        <button onClick={() => execEditorCommand('bold')} className="p-2 hover:text-[#c0ff00] hover:bg-white/5 rounded-lg transition-all active:scale-90"><Bold size={16}/></button>
                        <button onClick={() => execEditorCommand('italic')} className="p-2 hover:text-[#c0ff00] hover:bg-white/5 rounded-lg transition-all active:scale-90"><Italic size={16}/></button>
                        <button onClick={() => execEditorCommand('strikeThrough')} className="p-2 hover:text-[#c0ff00] hover:bg-white/5 rounded-lg transition-all active:scale-90"><Strikethrough size={16}/></button>
                        <div className="w-[1px] h-5 bg-white/10 mx-1" />
                        <button onClick={() => execEditorCommand('formatBlock', '<h1>')} className="p-2 hover:text-[#c0ff00] hover:bg-white/5 rounded-lg transition-all active:scale-90"><Heading1 size={16}/></button>
                        <button onClick={() => execEditorCommand('formatBlock', '<h2>')} className="p-2 hover:text-[#c0ff00] hover:bg-white/5 rounded-lg transition-all active:scale-90"><Heading2 size={16}/></button>
                        <div className="w-[1px] h-5 bg-white/10 mx-1" />
                        <button onClick={() => execEditorCommand('justifyLeft')} className="p-2 hover:text-[#c0ff00] hover:bg-white/5 rounded-lg transition-all active:scale-90"><AlignLeft size={16}/></button>
                        <button onClick={() => execEditorCommand('justifyCenter')} className="p-2 hover:text-[#c0ff00] hover:bg-white/5 rounded-lg transition-all active:scale-90"><AlignCenter size={16}/></button>
                      </div>
                      <button onClick={() => setIsEditing(false)} className="p-2 text-gray-500 hover:text-red-400 rounded-lg transition-colors ml-auto active:scale-90"><X size={16} /></button>
                    </div>

                    <div 
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      className="w-full min-h-[400px] bg-[#14171c] border border-white/5 focus:border-[#c0ff00]/40 rounded-2xl p-5 text-base leading-relaxed text-gray-200 focus:outline-none transition-all shadow-inner prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: constitution }}
                      data-placeholder="Начните писать законы здесь..."
                    />

                    <button 
                      onClick={saveConstitution} 
                      className="w-full bg-[#c0ff00] text-black font-bold py-3.5 rounded-2xl hover:bg-[#aee600] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#c0ff00]/10 flex items-center justify-center space-x-2"
                    >
                      <Check size={18} />
                      <span>Сохранить законы</span>
                    </button>
                  </div>
                ) : (
                  <div 
                    className="bg-[#14171c] p-5 rounded-2xl border border-white/5 text-base leading-relaxed max-w-none text-gray-300 prose prose-invert shadow-md"
                    dangerouslySetInnerHTML={{ __html: constitution }}
                  />
                )}
              </div>
            )}

            {activeTab === 'players' && (
              <div className="space-y-6 animate-fade-in">
                
                {dbUser && (
                  <div className="space-y-2">
                    <div className="text-xs text-[#c0ff00] uppercase tracking-wider font-extrabold pl-1">Мой личный профиль</div>
                    <div 
                      onClick={() => {
                        setIsEditingName(false);
                        setSelectedPlayer(dbUser);
                      }}
                      className="bg-gradient-to-r from-[#14171c] to-[#1c2026] p-4 rounded-2xl border border-[#c0ff00]/30 flex items-center space-x-4 transition-all duration-200 cursor-pointer shadow-lg shadow-[#c0ff00]/5 hover:border-[#c0ff00]/50 active:scale-95"
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-[#1c2026] border-2 border-[#c0ff00] flex-shrink-0">
                        <img src={dbUser.avatar_url || 'https://via.placeholder.com/150'} alt="avatar" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-black truncate text-white tracking-wide flex items-center gap-2">
                          {dbUser.rp_name}
                          <span className="text-[9px] bg-[#c0ff00] text-black font-black px-1.5 py-0.5 rounded uppercase tracking-tight">Вы</span>
                        </div>
                        <div className="text-xs text-gray-400 truncate font-mono tracking-tight">{dbUser.mc_nickname}</div>
                      </div>
                      <div className="flex-shrink-0 text-gray-500">
                        <Edit2 size={16} className="text-[#c0ff00]/80" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold pl-1">
                    Жители сервера ({players.filter(p => p.tg_id !== dbUser?.tg_id).length})
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {players
                      .filter((player) => player.tg_id !== dbUser?.tg_id)
                      .map((player) => (
                        <div 
                          key={player.id} 
                          onClick={() => setSelectedPlayer(player)}
                          className="bg-[#14171c] p-3 rounded-xl border border-white/5 flex items-center space-x-3 transition-all duration-200 hover:scale-[1.01] hover:border-white/20 hover:bg-[#1a1e24] cursor-pointer shadow-sm active:scale-95"
                        >
                          <div className="w-11 h-11 rounded-full overflow-hidden bg-[#1c2026] border border-white/10 flex-shrink-0">
                            <img src={player.avatar_url || 'https://via.placeholder.com/150'} alt="avatar" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold truncate text-white">{player.rp_name}</div>
                            <div className="text-xs text-gray-400 truncate font-mono tracking-tight">{player.mc_nickname}</div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {player.roles.slice(0, 1).map((r, i) => (
                              <span key={i} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-white/5 border border-white/5 rounded text-gray-400">
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
          </>
        )}
      </main>

      <nav className="fixed bottom-6 left-6 right-6 bg-[#14171c]/70 backdrop-blur-xl border border-white/10 py-3 rounded-full z-50 shadow-2xl max-w-md mx-auto transition-all">
        <div className="grid grid-cols-3 w-full items-center justify-items-center">
          
          <button 
            onClick={() => handleTabChange('profile')} 
            className={`flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'profile' && !selectedPlayer ? 'text-[#c0ff00] scale-105' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <User size={22} />
            <span className="text-[10px] font-medium tracking-wide relative inline-block mt-1">
              Главная
              <span className="absolute -top-1 left-full ml-1 text-[7px] font-extrabold uppercase bg-[#c0ff00]/10 text-[#c0ff00] px-1 py-0.5 rounded tracking-tight border border-[#c0ff00]/25 scale-90 whitespace-nowrap">soon</span>
            </span>
          </button>

          <button 
            onClick={() => handleTabChange('constitution')} 
            className={`flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'constitution' ? 'text-[#c0ff00] scale-105' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <BookOpen size={22} />
            <span className="text-[10px] font-medium tracking-wide mt-1">Законы</span>
          </button>

          <button 
            onClick={() => handleTabChange('players')} 
            className={`flex flex-col items-center justify-center w-full transition-all duration-300 transform active:scale-90 ${activeTab === 'players' || selectedPlayer ? 'text-[#c0ff00] scale-105' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Users size={22} />
            <span className="text-[10px] font-medium tracking-wide mt-1">Игроки</span>
          </button>

        </div>
      </nav>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap');
        
        body, html, button, input, textarea, div, span {
          font-family: 'Google Sans', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #4b5563;
          cursor: text;
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
