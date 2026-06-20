'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User, BookOpen, Users, Edit2, Check, Heading1, Heading2, Bold, Italic, Strikethrough } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  const [activeTab, setActiveTab] = useState<'profile' | 'constitution' | 'players'>('profile');
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [constitution, setConstitution] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [newRpName, setNewRpName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tg = (window as any).Telegram?.WebApp;

    if (tg && tg.initDataUnsafe?.user?.id) {
      tg.ready();
      tg.expand();
      const userFromTg = tg.initDataUnsafe.user;
      setTgUser(userFromTg);
      checkUserInDb(userFromTg.id);
    } else {
      // Режим разработки для ПК (если открыто вне Telegram)
      // ВСТАВЬ СВОЙ РЕАЛЬНЫЙ ЦИФРОВОЙ TG ID ВМЕСТО 123456789:
      const mockTgId = 123456789; 
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

      if (dbError) {
        setError(`Ошибка Supabase: ${dbError.message} (Код: ${dbError.code}).`);
      } else if (!user) {
        setError(`Пользователь с TG ID ${tgId} отсутствует в таблице.`);
      } else {
        setDbUser(user);
        setNewRpName(user.rp_name);
        loadPlayers();
        loadConstitution();
      }
    } catch (e: any) {
      // Выводим URL на экран для диагностики
      const currentUrl = (supabase as any).supabaseUrl || 'Не определен';
      setError(`Сетевая ошибка базы. Ссылка: ${currentUrl}. Текст: ${e.message}`);
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

  const saveConstitution = async () => {
    const { error } = await supabase.from('constitution').update({ content: constitution }).eq('id', 1);
    if (!error) setIsEditing(false);
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
      <div className="flex min-h-screen items-center justify-center bg-[#090b0e] px-6 text-center text-white">
        <div className="bg-[#14171c] p-6 rounded-2xl border border-red-500/30 max-w-md w-full break-words">
          <div className="text-red-500 font-bold text-lg mb-2">Авторизация не удалась</div>
          <div className="text-sm text-gray-400 font-mono text-left bg-black/30 p-3 rounded-lg border border-white/5 whitespace-pre-wrap">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b0e] text-white pb-24 font-sans antialiased selection:bg-[#c0ff00] selection:text-black">
      <header className="px-4 pt-4 pb-2 bg-[#090b0e] sticky top-0 z-50 border-b border-[#14171c]">
        <div className="flex items-center justify-between">
          <span className="text-xl font-black tracking-wider text-[#c0ff00]">ONEHOUSE</span>
          <span className="text-xs px-2 py-1 bg-[#14171c] rounded-full text-gray-400 border border-white/5">
            v1.0-TMA
          </span>
        </div>
      </header>

      <main className="p-4">
        {activeTab === 'profile' && dbUser && (
          <div className="space-y-6">
            <div className="bg-[#14171c] p-5 rounded-2xl border border-white/5 flex items-center space-x-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[#1c2026] border-2 border-[#c0ff00]">
                <img src={dbUser.avatar_url || 'https://via.placeholder.com/150'} alt="avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      value={newRpName} 
                      onChange={(e) => setNewRpName(e.target.value)}
                      className="bg-[#1c2026] text-white text-lg font-bold px-2 py-1 rounded border border-[#c0ff00]/40 w-full focus:outline-none"
                    />
                    <button onClick={saveRpName} className="p-1 text-[#c0ff00] bg-[#1c2026] rounded">
                      <Check size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold truncate text-white">{dbUser.rp_name}</h2>
                    <button onClick={() => setIsEditingName(true)} className="text-gray-500 hover:text-white">
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500 font-mono mt-0.5">{dbUser.mc_nickname}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold pl-1">Твои Роли</div>
              <div className="flex flex-wrap gap-2">
                {dbUser.roles.map((role, idx) => (
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
        )}

        {activeTab === 'constitution' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#c0ff00]">Конституция Дома</h2>
              {canEditConstitution && !isEditing && (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="flex items-center space-x-1 text-xs bg-[#14171c] border border-white/5 px-3 py-1.5 rounded-xl font-semibold text-gray-300"
                >
                  <Edit2 size={12} />
                  <span>Редактировать</span>
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <div className="bg-[#14171c] p-2 rounded-xl border border-white/5 flex flex-wrap gap-2 text-gray-400">
                  <button onClick={() => setConstitution(c => c + '<b></b>')} className="p-1 hover:text-white"><Bold size={16}/></button>
                  <button onClick={() => setConstitution(c => c + '<i></i>')} className="p-1 hover:text-white"><Italic size={16}/></button>
                  <button onClick={() => setConstitution(c => c + '<s></s>')} className="p-1 hover:text-white"><Strikethrough size={16}/></button>
                  <button onClick={() => setConstitution(c => c + '<h1></h1>')} className="p-1 hover:text-white"><Heading1 size={16}/></button>
                  <button onClick={() => setConstitution(c => c + '<h2></h2>')} className="p-1 hover:text-white"><Heading2 size={16}/></button>
                  <button onClick={() => setConstitution(c => c + '<center></center>')} className="p-1 text-xs font-bold hover:text-white">CENTER</button>
                </div>
                <textarea
                  value={constitution}
                  onChange={(e) => setConstitution(e.target.value)}
                  className="w-full h-96 bg-[#14171c] border border-[#c0ff00]/20 rounded-2xl p-4 text-sm font-mono text-white focus:outline-none focus:border-[#c0ff00]"
                  placeholder="Используйте HTML-теги..."
                />
                <button 
                  onClick={saveConstitution} 
                  className="w-full bg-[#c0ff00] text-black font-bold py-3 rounded-2xl hover:bg-[#aee600] transition"
                >
                  Сохранить изменения
                </button>
              </div>
            ) : (
              <div 
                className="bg-[#14171c] p-5 rounded-2xl border border-white/5 text-sm leading-relaxed max-w-none text-gray-300"
                dangerouslySetInnerHTML={{ __html: constitution }}
              />
            )}
          </div>
        )}

        {activeTab === 'players' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#c0ff00]">Жители сервера ({players.length})</h2>
            <div className="grid grid-cols-1 gap-2.5">
              {players.map((player) => (
                <div key={player.id} className="bg-[#14171c] p-3 rounded-xl border border-white/5 flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-[#1c2026] border border-white/10">
                    <img src={player.avatar_url || 'https://via.placeholder.com/150'} alt="avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{player.rp_name}</div>
                    <div className="text-xs text-gray-400 truncate font-mono">{player.mc_nickname}</div>
                  </div>
                  <div className="flex gap-1">
                    {player.roles.slice(0, 1).map((r, i) => (
                      <span key={i} className="text-[10px] uppercase font-bold tracking-tight px-2 py-0.5 bg-white/5 border border-white/5 rounded text-gray-400">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#090b0e]/90 backdrop-blur-lg border-t border-[#14171c] px-6 py-2 z-50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition ${activeTab === 'profile' ? 'text-[#c0ff00]' : 'text-gray-500'}`}
          >
            <User size={22} />
            <span className="text-[10px] font-medium tracking-wide">Главная</span>
          </button>

          <button 
            onClick={() => setActiveTab('constitution')} 
            className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition ${activeTab === 'constitution' ? 'text-[#c0ff00]' : 'text-gray-500'}`}
          >
            <BookOpen size={22} />
            <span className="text-[10px] font-medium tracking-wide">Законы</span>
          </button>

          <button 
            onClick={() => setActiveTab('players')} 
            className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition ${activeTab === 'players' ? 'text-[#c0ff00]' : 'text-gray-500'}`}
          >
            <Users size={22} />
            <span className="text-[10px] font-medium tracking-wide">Игроки</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
