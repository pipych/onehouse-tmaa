'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, FolderArchive, ChevronDown, FileText, Plus, Save, X, RefreshCw, Trash2 } from 'lucide-react';

export default function ArchiveDocsPage() {
  const router = useRouter();
  const [selectedSeason, setSelectedSeason] = useState<string>('Сезон 2');
  const [showSeasonSelector, setShowSeasonSelector] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Стейты формы создания
  const [isCreating, setIsCreating] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [docUrl, setDocUrl] = useState('');

  const seasons = ['Сезон 1', 'Сезон 2'];

  const isEditor = currentUser?.roles?.some((r: string) => 
    ['admin', 'редактор', 'editor'].includes(r.toLowerCase())
  ) || false;

  async function loadDocuments() {
    setLoading(true);
    // Если решишь создать таблицу 'archived_docs', замени этот фетч. Пока выводим локальный стейт или пустую заглушку для 1 сезона
    if (selectedSeason === 'Сезон 1') {
      setDocs([]);
    } else {
      // Имитация документов 2 сезона, пока нет таблицы
      setDocs([
        { id: '1', title: 'Указ Мэра №14', description: 'О регулировании цен на недвижимость торгового квартала', season: 'Сезон 2' }
      ]);
    }
    setLoading(false);
  }

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user?.id) {
      supabase.from('users').select('*').eq('tg_id', tg.initDataUnsafe.user.id).single().then(({data}) => setCurrentUser(data));
    }
    loadArchivedMedia();
  }, [selectedSeason]);

  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-24 pb-32 antialiased">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
        
        {/* Навигация */}
        <div className="flex items-center justify-between w-full select-none">
          <button onClick={() => router.push('/')} className="w-12 h-12 flex items-center justify-center bg-[#14171c]/90 backdrop-blur-xl border border-white/10 rounded-full text-white shadow-2xl active:scale-90 transition-transform"><ArrowLeft size={20} /></button>

          <div className="relative">
            <button onClick={() => setShowSeasonSelector(!showSeasonSelector)} className="bg-[#14171c]/90 border border-white/15 py-2 px-4 rounded-full backdrop-blur-md flex items-center gap-2 text-xs font-bold text-gray-200 shadow-lg active:scale-95 transition-all"><FolderArchive size={14} className="text-[#c0ff00]" /><span>{selectedSeason}</span><ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${showSeasonSelector ? 'rotate-180' : ''}`} /></button>
            {showSeasonSelector && (
              <div className="absolute right-0 mt-2 bg-[#14171c]/95 border border-white/10 rounded-2xl p-1.5 z-50 shadow-2xl min-w-[140px] flex flex-col gap-1 animate-fade-in backdrop-blur-xl">
                {seasons.map(s => <button key={s} onClick={() => { setSelectedSeason(season); setShowSeasonSelector(false); }} className={`text-xs text-left px-3 py-2.5 rounded-xl font-bold transition-all ${selectedSeason === s ? 'bg-[#c0ff00]/10 text-[#c0ff00]' : 'text-gray-400 hover:bg-white/5'}`}>{s}</button>)}
              </div>
            )}
          </div>
        </div>

        {/* Панель администратора / редактора архива */}
        {isEditor && (
          <div className="p-4 bg-[#c0ff00]/5 border border-[#c0ff00]/20 rounded-2xl flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-gray-300">Доступно добавление документов в архив для {selectedSeason}</div>
              <button onClick={() => setIsCreatingPost(!isCreatingPost)} className="ui-pill-btn !py-1.5 !px-3 !bg-[#c0ff00] !text-black font-black !text-[10px] uppercase tracking-wider">{isCreatingPost ? 'Закрыть форму' : 'Создать указ'}</button>
            </div>

            {isCreatingPost && (
              <div className="space-y-3 pt-2 border-t border-white/5 animate-fade-in">
                <input type="text" placeholder="Название документа" value={docTitle} onChange={e => setDocTitle(e.target.value)} className="ui-input"/>
                <input type="text" placeholder="Краткое описание" value={docDescription} onChange={e => setDocDescription(e.target.value)} className="ui-input"/>
                <input type="text" placeholder="Ссылка на файл / текст" value={docUrl} onChange={e => setDocUrl(e.target.value)} className="ui-input"/>
                <button className="ui-pill-btn w-full justify-center py-2.5 !bg-[#c0ff00] !text-black font-bold"><Save size={14}/><span>Сохранить в {selectedSeason}</span></button>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 px-1">
          <FileText size={18} className="text-[#c0ff00]" />
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Архив официальных документов ({selectedSeason})</h2>
        </div>

        {/* Список вывода */}
        <div className="flex flex-col gap-2">
          {loading ? (
            <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-[#c0ff00]" size={24} /></div>
          ) : docs.length === 0 ? (
            <div className="text-center py-12 text-xs font-mono text-gray-500 bg-[#14171c]/40 border border-white/5 rounded-2xl">ДОКУМЕНТОВ ДЛЯ ЭТОГО СЕЗОНА ПОКА НЕТ</div>
          ) : (
            docs.map(doc => (
              <div key={doc.id} className="bg-[#14171c]/90 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2 bg-[#c0ff00]/10 rounded-xl text-[#c0ff00]"><FileText size={16} /></div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">{doc.title}</span>
                    <span className="text-[10px] text-gray-500 font-medium">{doc.content}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
