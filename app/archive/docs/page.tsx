'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { 
  ArrowLeft, FolderArchive, ChevronDown, FileText, Plus, Save, 
  RefreshCw, Trash2, Edit2, X, Bold, Italic, Strikethrough, 
  Heading1, Heading2, AlignLeft, AlignCenter 
} from 'lucide-react';

export default function ArchiveDocsPage() {
  const router = useRouter();
  const [selectedSeason, setSelectedSeason] = useState<string>('Сезон 2');
  const [showSeasonSelector, setShowSeasonSelector] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Стейты просмотра и редактирования
  const [activeDoc, setActiveDoc] = useState<any>(null); // Выбранный документ
  const [isEditing, setIsEditing] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Стейты тулбара редактора из основной страницы
  const [formats, setFormats] = useState({
    bold: false, italic: false, strikeThrough: false, h1: false, h2: false, justifyLeft: false, justifyCenter: false
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const seasons = ['Сезон 1', 'Сезон 2'];

  // Проверка прав: админ или пользователь с ролью "редактор"
  const isEditor = currentUser?.roles?.some((r: string) => 
    ['admin', 'редактор', 'editor'].includes(r.toLowerCase())
  ) || false;

  // Очистка HTML тегов для красивого превью в списке
  function stripHtml(html: string) {
    if (typeof document === 'undefined') return html.replace(/<[^>]*>?/gm, '');
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  // Загрузка документов из базы
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
      } else {
        setDocs([]);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  // Функции оригинального текстового редактора
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

  // Сохранение документа (Создание или Обновление существующего)
  async function handleSaveDocument() {
    if (!docTitle.trim() || !editorRef.current || isSubmitting) return;
    setIsSubmitting(true);
    
    const updatedContent = editorRef.current.innerHTML;

    try {
      if (activeDoc?.isNew) {
        // Создание новой записи
        const { error } = await supabase
          .from('constitution')
          .insert([{
            title: docTitle.trim(),
            content: updatedContent,
            season: selectedSeason
          }]);
        if (error) throw error;
      } else {
        // Обновление старой записи
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

  // Удаление архивного документа
  async function handleDeleteDocument(id: string, e: React.MouseEvent) {
    e.stopPropagation(); // Предотвращаем открытие документа при клике на корзину
    if (!confirm('Вы действительно хотите удалить этот документ из архива?')) return;
    await supabase.from('constitution').delete().eq('id', id);
    loadDocuments();
  }

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user?.id) {
      supabase
        .from('users')
        .select('*')
        .eq('tg_id', tg.initDataUnsafe.user.id)
        .single()
        .then(({ data }) => setCurrentUser(data));
    }
    loadDocuments();
  }, [selectedSeason]);

  // Следим за фокусом в редакторе для обновления стилей кнопок тулбара
  useEffect(() => {
    if (isEditing && editorRef.current) {
      editorRef.current.innerHTML = activeDoc?.content || '';
      editorRef.current.addEventListener('keyup', checkFormatting);
      editorRef.current.addEventListener('mouseup', checkFormatting);
      return () => {
        editorRef.current?.removeEventListener('keyup', checkFormatting);
        editorRef.current?.removeEventListener('mouseup', checkFormatting);
      };
    }
  }, [isEditing]);

  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-24 pb-32 antialiased">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 relative">
        
        {/* Панель инструментов редактора из app/page.tsx */}
        {isEditing && (
          <div className="fixed z-50 bottom-4 left-4 right-4 md:bottom-auto md:top-[96px] md:left-1/2 md:-translate-x-1/2 md:w-auto flex items-center justify-center animate-fade-in">
            <div className="p-1.5 bg-[#14171c]/95 border border-white/10 rounded-2xl md:rounded-full shadow-2xl backdrop-blur-md flex items-center gap-1 w-full md:w-auto overflow-x-auto no-scrollbar justify-start md:justify-center">
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('bold')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 ${formats.bold ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Bold size={14}/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('italic')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 ${formats.italic ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Italic size={14}/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('strikeThrough')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 ${formats.strikeThrough ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Strikethrough size={14}/></button>
              <div className="w-[1px] h-3.5 bg-white/10 mx-0.5 flex-shrink-0" />
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('formatBlock', 'H1')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 ${formats.h1 ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Heading1 size={14}/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('formatBlock', 'H2')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 ${formats.h2 ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Heading2 size={14}/></button>
              <div className="w-[1px] h-3.5 bg-white/10 mx-0.5 flex-shrink-0" />
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('justifyLeft')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 ${formats.justifyLeft ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><AlignLeft size={14}/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('justifyCenter')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 ${formats.justifyCenter ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><AlignCenter size={14}/></button>
              <button onClick={() => { setIsEditing(false); if(activeDoc.isNew) setActiveDoc(null); }} className="p-1.5 text-gray-500 hover:text-red-400 rounded-xl md:rounded-full transition-colors ml-auto active:scale-75"><X size={14} /></button>
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

          {/* Селектор сезонов и кнопка сохранения */}
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

            {!activeDoc && (
              <div className="relative">
                <button onClick={() => setShowSeasonSelector(!showSeasonSelector)} className="bg-[#14171c]/90 border border-white/15 py-2 px-4 rounded-full backdrop-blur-md flex items-center gap-2 text-xs font-bold text-gray-200 shadow-lg active:scale-95 transition-all">
                  <FolderArchive size={14} className="text-[#c0ff00]" />
                  <span>{selectedSeason}</span>
                  <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${showSeasonSelector ? 'rotate-180' : ''}`} />
                </button>
                {showSeasonSelector && (
                  <div className="absolute right-0 mt-2 bg-[#14171c]/95 border border-white/10 rounded-2xl p-1.5 z-50 shadow-2xl min-w-[140px] flex flex-col gap-1 animate-fade-in backdrop-blur-xl">
                    {seasons.map(s => (
                      <button key={s} onClick={() => { setSelectedSeason(s); setShowSeasonSelector(false); }} className={`text-xs text-left px-3 py-2.5 rounded-xl font-bold transition-all ${selectedSeason === s ? 'bg-[#c0ff00]/10 text-[#c0ff00]' : 'text-gray-400 hover:bg-white/5'}`}>{s}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* ИСПРАВЛЕНО: Кнопка «Создать указ» переделана в аккуратный плюсик в кружке Apple HIG */}
            {!activeDoc && isEditor && (
              <button 
                onClick={() => {
                  setActiveDoc({ title: '', content: '', isNew: true });
                  setDocTitle('');
                  setIsEditing(true);
                }}
                className="w-10 h-10 bg-[#14171c]/90 border border-white/15 rounded-full flex items-center justify-center text-[#c0ff00] shadow-lg active:scale-95 transition-all"
              >
                <Plus size={18} />
              </button>
            )}
          </div>
        </div>

        {/* ЭКРАН 1: РЕЖИМ РЕДАКТИРОВАНИЯ (ДЛЯ СОЗДАНИЯ И РЕЖАКТУРЫ) */}
        {activeDoc && isEditing ? (
          <div className="space-y-4 scale-100 w-full pt-2 animate-fade-in">
            <input 
              type="text" 
              placeholder="Название архивного документа" 
              value={docTitle} 
              onChange={e => setDocTitle(e.target.value)} 
              className="ui-input !font-black !text-base"
            />
            <div 
              ref={editorRef} 
              contentEditable 
              className="w-full min-h-[500px] bg-[#14171c]/90 backdrop-blur-xl border border-white/5 focus:border-[#c0ff00]/40 rounded-[28px] p-5 text-base leading-relaxed text-gray-200 focus:outline-none transition-all shadow-inner prose prose-invert max-w-none break-words pb-24" 
              data-placeholder="Текст архивного документа..." 
            />
          </div>
        ) : activeDoc ? (
          /* ЭКРАН 2: ПОЛНОЭКРАННЫЙ ПРОСМТР ДОКУМЕНТА ПО НАЖАТИЮ */
          <div className="space-y-4 animate-fade-in w-full">
            <div className="flex items-center justify-between w-full border-b border-white/5 pb-3">
              <h2 className="text-xl font-black text-white leading-tight">{activeDoc.title || (activeDoc.id === 1 ? 'Конституция' : 'Заповеди дома')}</h2>
              {isEditor && (
                <button 
                  onClick={() => {
                    setDocTitle(activeDoc.title || (activeDoc.id === 1 ? 'Конституция' : 'Заповеди дома'));
                    setIsEditing(true);
                  }} 
                  className="ui-pill-btn !py-1.5 !px-3"
                >
                  <Edit2 size={12} /><span>Редактировать</span>
                </button>
              )}
            </div>
            <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 text-base leading-relaxed text-gray-300 prose prose-invert shadow-md break-words w-full" dangerouslySetInnerHTML={{ __html: activeDoc.content || '' }} />
          </div>
        ) : (
          /* ЭКРАН 3: СПИСОК ВСЕХ ДОКУМЕНТОВ СЕЗОНА */
          <>
            <div className="flex items-center gap-2 px-1">
              <FileText size={18} className="text-[#c0ff00]" />
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Архив официальных документов ({selectedSeason})</h2>
            </div>

            <div className="flex flex-col gap-2">
              {loading ? (
                <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-[#c0ff00]" size={24} /></div>
              ) : docs.length === 0 ? (
                <div className="text-center py-12 text-xs font-mono text-gray-500 bg-[#14171c]/40 border border-white/5 rounded-2xl">
                  ДОКУМЕНТОВ ДЛЯ ЭТОГО СЕЗОНА ПОКА НЕТ
                </div>
              ) : (
                docs.map(doc => (
                  <div 
                    key={doc.id} 
                    onClick={() => {
                      setActiveDoc(doc);
                      setIsEditing(false);
                    }}
                    className="bg-[#14171c]/90 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:border-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="p-2 bg-[#c0ff00]/10 rounded-xl text-[#c0ff00] shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-white block truncate group-hover:text-[#c0ff00] transition-colors">
                          {doc.title || (doc.id === 1 ? 'Конституция' : doc.id === 2 ? 'Заповеди дома' : `Документ #${doc.id}`)}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium block truncate mt-0.5">
                          {stripHtml(doc.content || '')}
                        </span>
                      </div>
                    </div>
                    {/* ИСПРАВЛЕНО: Кнопка удаления строго защищена проверкой роли isEditor */}
                    {isEditor && (
                      <button 
                        onClick={(e) => handleDeleteDocument(doc.id, e)}
                        className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-xl transition-all shrink-0 ml-2 md:opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
