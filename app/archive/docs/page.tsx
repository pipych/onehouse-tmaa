'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { getAllPastSeasons, getSeasonState, seasonName } from '../../../lib/season';
import { 
  ArrowLeft, FolderArchive, ChevronDown, FileText, Plus, Save, 
  RefreshCw, Trash2, Edit2, X, Bold, Italic, Strikethrough, 
  Heading1, Heading2, AlignLeft, AlignCenter, BookOpen
} from 'lucide-react';

export default function ArchiveDocsPage() {
  const router = useRouter();
  const [selectedSeason, setSelectedSeason] = useState<string>('Сезон 2');
  const [showSeasonSelector, setShowSeasonSelector] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Стейты просмотра и редактирования
  const [activeDoc, setActiveDoc] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Стейты тулбара оригинального редактора
  const [formats, setFormats] = useState({
    bold: false, italic: false, strikeThrough: false, h1: false, h2: false, justifyLeft: false, justifyCenter: false
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const [seasons, setSeasons] = useState<string[]>(['Сезон 2']);

  // Загружаем список сезонов
  useEffect(() => {
    async function loadSeasons() {
      const state = await getSeasonState();
      const past = await getAllPastSeasons();
      const nums = new Set<number>();
      nums.add(state.season_number);
      past.forEach(s => nums.add(s.season_number));
      const list = Array.from(nums).sort((a, b) => b - a).map(n => seasonName(n));
      setSeasons(list);
      if (list.length > 0 && !list.includes(selectedSeason)) setSelectedSeason(list[0]);
    }
    loadSeasons();
  }, []);

  const isEditor = currentUser?.roles?.some((r: string) => 
    ['admin', 'редактор', 'editor'].includes(r.toLowerCase())
  ) || false;

  function stripHtml(html: string) {
    if (typeof document === 'undefined') return html.replace(/<[^>]*>?/gm, '');
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  async function loadDocuments() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('constitution')
        .select('*')
        .eq('season', selectedSeason)
        .order('id', { ascending: true });
      
      if (data && !error) {
        setDocs(data);
        // ПК-оптимизация: автоматически открываем первый документ в сплит-вью на ПК
        if (data.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 768 && !activeDoc) {
          setActiveDoc(data[0]);
        }
      } else {
        setDocs([]);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
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

  async function handleSaveDocument() {
    if (!docTitle.trim() || !editorRef.current || isSubmitting) return;
    setIsSubmitting(true);
    const updatedContent = editorRef.current.innerHTML;

    try {
      if (activeDoc?.isNew) {
        const { error } = await supabase
          .from('constitution')
          .insert([{ title: docTitle.trim(), content: updatedContent, season: selectedSeason }]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('constitution')
          .update({ title: docTitle.trim(), content: updatedContent })
          .eq('id', activeDoc.id);
        if (error) throw error;
      }
      setIsEditing(false);
      setActiveDoc(null);
      loadDocuments();
    } catch (e: any) {
      alert(`Ошибка сохранения: ${e.message}`);
    }
    setIsSubmitting(false);
  }

  async function handleDeleteDocument(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Вы действительно хотите удалить этот документ из архива?')) return;
    await supabase.from('constitution').delete().eq('id', id);
    setActiveDoc(null);
    loadDocuments();
  }

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user?.id) {
      supabase.from('users').select('*').eq('tg_id', tg.initDataUnsafe.user.id).single().then(({ data }) => setCurrentUser(data));
    }
    loadDocuments();
  }, [selectedSeason]);

  useEffect(() => {
    if (isEditing && editorRef.current) {
      editorRef.current.innerHTML = activeDoc?.content || '';
    }
  }, [isEditing]);

  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-24 pb-32 antialiased">
      {/* ИСПРАВЛЕНО: Контейнер расширен до max-w-6xl на ПК для поддержки Split-View */}
      <div className="w-full max-w-md md:max-w-6xl mx-auto flex flex-col gap-6 relative">
        
        {/* ВСПЛЫВАЮЩИЙ ТУЛБАР РЕДАКТОРА */}
        {isEditing && (
          <div className="fixed z-50 bottom-4 left-4 right-4 md:bottom-auto md:top-[96px] md:left-1/2 md:-translate-x-1/2 md:w-auto flex items-center justify-center animate-fade-in">
            <div className="p-1.5 bg-[#14171c]/95 border border-white/10 rounded-2xl md:rounded-full shadow-2xl backdrop-blur-md flex items-center gap-1 w-full md:w-auto overflow-x-auto no-scrollbar">
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('bold')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 ${formats.bold ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Bold size={14}/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('italic')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 ${formats.italic ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Italic size={14}/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('strikeThrough')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 ${formats.strikeThrough ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Strikethrough size={14}/></button>
              <div className="w-[1px] h-3.5 bg-white/10 mx-0.5 flex-shrink-0" />
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('formatBlock', 'H1')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 ${formats.h1 ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Heading1 size={14}/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('formatBlock', 'H2')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 ${formats.h2 ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Heading2 size={14}/></button>
              <div className="w-[1px] h-3.5 bg-white/10 mx-0.5 flex-shrink-0" />
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('justifyLeft')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 ${formats.justifyLeft ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><AlignLeft size={14}/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('justifyCenter')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 ${formats.justifyCenter ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><AlignCenter size={14}/></button>
              <button onClick={() => { setIsEditing(false); if(activeDoc?.isNew) setActiveDoc(null); }} className="p-1.5 text-gray-500 hover:text-red-400 rounded-xl md:rounded-full transition-colors ml-auto active:scale-75"><X size={14} /></button>
            </div>
          </div>
        )}

        {/* НАВИГАЦИОННЫЙ ХЕДЕР */}
        <div className="flex items-center justify-between w-full select-none">
          <button 
            onClick={() => {
              if (isEditing && !activeDoc?.isNew) { setIsEditing(false); }
              else if (activeDoc) { setActiveDoc(null); }
              else { router.push('/'); }
            }} 
            className="w-12 h-12 flex items-center justify-center bg-[#14171c]/90 backdrop-blur-xl border border-white/10 rounded-full text-white shadow-2xl active:scale-90 transition-transform"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-2">
            {isEditing && (
              <button 
                onClick={handleSaveDocument}
                disabled={isSubmitting || !docTitle.trim()}
                className="bg-[#c0ff00] text-black w-10 h-10 rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-40"
              >
                {isSubmitting ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              </button>
            )}

            <div className="relative">
              <button onClick={() => setShowSeasonSelector(!showSeasonSelector)} className="bg-[#14171c]/90 border border-white/15 py-2 px-4 rounded-full backdrop-blur-md flex items-center gap-2 text-xs font-bold text-gray-200 shadow-lg">
                <FolderArchive size={14} className="text-[#c0ff00]" />
                <span>{selectedSeason}</span>
                <ChevronDown size={14} className="text-gray-500" />
              </button>
              {showSeasonSelector && (
                <div className="absolute right-0 mt-2 bg-[#14171c]/95 border border-white/10 rounded-2xl p-1.5 z-50 shadow-2xl min-w-[140px] flex flex-col gap-1">
                  {seasons.map(s => (
                    <button key={s} onClick={() => { setSelectedSeason(s); setShowSeasonSelector(false); setActiveDoc(null); }} className={`text-xs text-left px-3 py-2.5 rounded-xl font-bold transition-all ${selectedSeason === s ? 'bg-[#c0ff00]/10 text-[#c0ff00]' : 'text-gray-400 hover:bg-white/5'}`}>{s}</button>
                  ))}
                </div>
              )}
            </div>
            
            {isEditor && (
              <button 
                onClick={() => {
                  setActiveDoc({ title: '', content: '', isNew: true });
                  setDocTitle('');
                  setIsEditing(true);
                }}
                className="w-10 h-10 bg-[#14171c]/90 border border-white/15 rounded-full flex items-center justify-center text-[#c0ff00] shadow-lg"
              >
                <Plus size={18} />
              </button>
            )}
          </div>
        </div>

        {/* ИСПРАВЛЕНО: Двухколоночный Split View (Индекс слева, контент справа) на ПК */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start w-full">
          
          {/* Списковая колонка (Скрывается на мобилках при открытом документе, видна всегда на ПК) */}
          <div className={`${activeDoc && !activeDoc.isNew ? 'hidden md:flex' : 'flex'} flex-col gap-2 md:col-span-1 w-full`}>
            <div className="flex items-center gap-2 px-1 mb-2">
              <FileText size={16} className="text-[#c0ff00]" />
              <span className="text-xs font-black uppercase tracking-wider text-gray-500">Документы ({selectedSeason})</span>
            </div>
            {docs.length === 0 ? (
              <div className="text-center py-8 text-xs font-mono text-gray-500 bg-[#14171c]/40 rounded-2xl border border-white/5">ПУСТО</div>
            ) : (
              docs.map(doc => (
                <div 
                  key={doc.id} 
                  onClick={() => { setActiveDoc(doc); setIsEditing(false); }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${activeDoc?.id === doc.id ? 'bg-[#c0ff00]/10 border-[#c0ff00]/30 text-[#c0ff00]' : 'bg-[#14171c]/90 border-white/5 text-white hover:border-white/15'}`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold block truncate">{doc.title || `Документ #${doc.id}`}</span>
                    <span className="text-[10px] text-gray-500 block truncate mt-0.5">{stripHtml(doc.content || '')}</span>
                  </div>
                  {isEditor && (
                    <button onClick={(e) => handleDeleteDocument(doc.id, e)} className="p-1.5 bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition-all ml-2 md:opacity-0 group-hover:opacity-100 shrink-0">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Контентная колонка чтения / редактора */}
          <div className={`${!activeDoc ? 'hidden md:block' : 'block'} md:col-span-2 w-full`}>
            {activeDoc && isEditing ? (
              <div className="space-y-4 scale-100 w-full animate-fade-in">
                <input type="text" placeholder="Название архивного документа" value={docTitle} onChange={e => setDocTitle(e.target.value)} className="w-full bg-[#14171c]/60 border border-white/10 rounded-2xl p-4 text-sm font-black text-white outline-none focus:border-[#c0ff00]/40 transition-all shadow-xl" />
                <div ref={editorRef} contentEditable className="w-full min-h-[500px] bg-[#14171c]/90 border border-white/5 focus:border-[#c0ff00]/40 rounded-[28px] p-5 text-base leading-relaxed text-gray-200 focus:outline-none shadow-inner prose prose-invert max-w-none break-words pb-24" data-placeholder="Текст архивного документа..." />
              </div>
            ) : activeDoc ? (
              <div className="space-y-4 animate-fade-in w-full bg-[#14171c]/50 md:bg-[#14171c]/90 border border-white/5 p-5 rounded-[28px] shadow-2xl">
                <div className="flex items-center justify-between w-full border-b border-white/5 pb-3 gap-4">
                  <h2 className="text-lg font-black text-white flex items-center gap-2 min-w-0">
                    <BookOpen size={18} className="text-[#c0ff00] shrink-0" />
                    <span className="truncate">{activeDoc.title || `Документ #${activeDoc.id}`}</span>
                  </h2>
                  {isEditor && (
                    <button onClick={() => { setDocTitle(activeDoc.title || ''); setIsEditing(true); }} className="w-9 h-9 bg-[#14171c] border border-[#c0ff00]/25 rounded-full flex items-center justify-center text-gray-500 hover:text-[#c0ff00] hover:border-[#c0ff00]/50 transition-all" title="Редактировать">
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>
                <div className="text-base leading-relaxed text-gray-300 prose prose-invert break-words w-full" dangerouslySetInnerHTML={{ __html: activeDoc.content || '' }} />
              </div>
            ) : (
              <div className="bg-[#14171c]/30 border border-white/5 rounded-[28px] p-12 text-center text-gray-600 font-mono text-xs flex flex-col items-center justify-center min-h-[400px]">
                <BookOpen size={36} className="text-gray-700 mb-3" />
                <span>ВЫБЕРИТЕ ДОКУМЕНТ ИЗ СПИСКА СЛЕВА</span>
              </div>
            )}
          </div>

        </div>

      </div>

      <style jsx global>{`
        .prose h1 { font-size: 1.25rem !important; font-weight: 800 !important; color: #ffffff !important; margin-top: 1.2rem !important; }
        .prose h2 { font-size: 1.1rem !important; font-weight: 800 !important; color: #c0ff00 !important; margin-top: 1rem !important; }
        .prose p { margin-bottom: 0.75rem; color: #d1d5db !important; }
        [contenteditable]:empty:before { content: attr(data-placeholder); color: #4b5563; }
      `}</style>
    </div>
  );
}
