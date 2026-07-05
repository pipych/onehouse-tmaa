'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { getAllPastSeasons, getSeasonState, seasonName } from '../../../lib/season';
import { 
  ArrowLeft, FolderArchive, ChevronDown, Calendar, Plus, Save, 
  RefreshCw, Trash2, Edit2, X, Bold, Italic, Strikethrough, 
  Heading1, Heading2, AlignLeft, AlignCenter, Clock, ArrowRight, MoreVertical 
} from 'lucide-react';

export default function ArchiveTimelinePage() {
  const router = useRouter();
  const [selectedSeason, setSelectedSeason] = useState<string>('Сезон 2');
  const [showSeasonSelector, setShowSeasonSelector] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);

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

  async function loadEvents() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('season', selectedSeason)
        .order('event_date', { ascending: true });
      
      if (data && !error) {
        setEvents(data);
      } else {
        setEvents([]);
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

  async function handleSaveEvent() {
    if (!eventTitle.trim() || !editorRef.current || isSubmitting) return;
    setIsSubmitting(true);
    
    const updatedContent = editorRef.current.innerHTML;
    const finalDate = eventDate ? new Date(eventDate).toISOString() : new Date().toISOString();

    try {
      if (activeEvent?.isNew) {
        const { error } = await supabase
          .from('timeline_events')
          .insert([{
            title: eventTitle.trim(),
            content: updatedContent,
            event_date: finalDate,
            season: selectedSeason
          }]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('timeline_events')
          .update({ title: eventTitle.trim(), content: updatedContent, event_date: finalDate, season: selectedSeason })
          .eq('id', activeEvent.id);
        if (error) throw error;
      }

      setIsEditing(false);
      setActiveEvent(null);
      loadEvents();
    } catch (e: any) {
      alert(`Ошибка сохранения события: ${e.message}`);
    }
    setIsSubmitting(false);
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
    loadEvents();
  }, [selectedSeason]);

  useEffect(() => {
    if (isEditing && editorRef.current) {
      editorRef.current.innerHTML = activeEvent?.content || '';
    }
  }, [isEditing]);

  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-24 pb-32 antialiased">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
        
        <div className="flex items-center justify-between w-full select-none">
          <button 
            onClick={() => {
              if (isEditing && !activeEvent?.isNew) {
                setIsEditing(false);
                setShowActionMenu(false);
              } else if (activeEvent) {
                setActiveEvent(null);
                setShowActionMenu(false);
              } else {
                router.push('/');
              }
            }} 
            className="w-12 h-12 flex items-center justify-center bg-[#14171c]/90 backdrop-blur-xl border border-white/10 rounded-full text-white shadow-2xl active:scale-90 transition-transform"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="relative flex items-center gap-2">
            {activeEvent && !isEditing && isEditor && (
              <div className="relative">
                <button 
                  onClick={() => setShowActionMenu(!showActionMenu)}
                  className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white active:scale-95 transition-all shadow-md"
                >
                  <MoreVertical size={18} />
                </button>
                
                {showActionMenu && (
                  <div className="absolute right-0 mt-2 bg-[#14171c]/95 border border-white/10 rounded-2xl p-1.5 z-50 shadow-2xl min-w-[160px] flex flex-col gap-1 backdrop-blur-xl animate-fade-in">
                    <button 
                      onClick={() => {
                        setEventTitle(activeEvent.title);
                        setEventDate(new Date(activeEvent.event_date).toISOString().substring(0, 10));
                        setSelectedSeason(activeEvent.season || 'Сезон 2');
                        setIsEditing(true);
                        setShowActionMenu(false);
                      }}
                      className="text-xs text-left px-3 py-2.5 rounded-xl font-bold text-gray-300 hover:bg-white/5 flex items-center gap-2 transition-all"
                    >
                      <Edit2 size={14} className="text-[#c0ff00]" />
                      <span>Редактировать</span>
                    </button>
                    <button 
                      onClick={async () => {
                        if (confirm('Вы действительно хотите стереть это событие из хронологии?')) {
                          await supabase.from('timeline_events').delete().eq('id', activeEvent.id);
                          setActiveEvent(null);
                          setShowActionMenu(false);
                          loadEvents();
                        }
                      }}
                      className="text-xs text-left px-3 py-2.5 rounded-xl font-bold text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-all"
                    >
                      <Trash2 size={14} />
                      <span>Удалить веху</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {isEditor && !isEditing && !activeEvent && (
              <button 
                onClick={() => {
                  setEventTitle('');
                  setEventDate(new Date().toISOString().substring(0, 10));
                  setSelectedSeason('Сезон 2');
                  setActiveEvent({ isNew: true });
                  setIsEditing(true);
                }}
                className="w-10 h-10 bg-[#14171c]/90 border border-white/15 rounded-full flex items-center justify-center text-[#c0ff00] shadow-lg active:scale-95 transition-all"
              >
                <Plus size={18} />
              </button>
            )}

            {!isEditing && !activeEvent && (
              <div className="relative">
                <button 
                  onClick={() => setShowSeasonSelector(!showSeasonSelector)}
                  className="bg-[#14171c]/90 border border-white/15 py-2 px-4 rounded-full backdrop-blur-md flex items-center gap-2 text-xs font-bold text-gray-200 shadow-lg"
                >
                  <FolderArchive size={14} className="text-[#c0ff00]" />
                  <span>{selectedSeason}</span>
                  <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${showSeasonSelector ? 'rotate-180' : ''}`} />
                </button>
                {showSeasonSelector && (
                  <div className="absolute right-0 mt-2 bg-[#14171c]/95 border border-white/10 rounded-2xl p-1.5 z-50 shadow-2xl min-w-[140px] flex flex-col gap-1 backdrop-blur-xl animate-fade-in">
                    {seasons.map((season) => (
                      <button key={season} onClick={() => { setSelectedSeason(season); setShowSeasonSelector(false); }} className={`text-xs text-left px-3 py-2.5 rounded-xl font-bold transition-all ${selectedSeason === season ? 'bg-[#c0ff00]/10 text-[#c0ff00]' : 'text-gray-400 hover:bg-white/5'}`}>{season}</button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isEditing && (
              <button 
                onClick={handleSaveEvent}
                disabled={isSubmitting || !eventTitle.trim()}
                className="bg-[#c0ff00] text-black w-10 h-10 rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-40"
              >
                {isSubmitting ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              </button>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="p-1.5 bg-[#14171c]/95 border border-white/10 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-1 w-max mx-auto overflow-x-auto no-scrollbar">
            <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('bold')} className={`p-1.5 rounded-full transition-all ${formats.bold ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Bold size={14}/></button>
            <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('italic')} className={`p-1.5 rounded-full transition-all ${formats.italic ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Italic size={14}/></button>
            <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('strikeThrough')} className={`p-1.5 rounded-full transition-all ${formats.strikeThrough ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Strikethrough size={14}/></button>
            <div className="w-[1px] h-3.5 bg-white/10 mx-0.5 flex-shrink-0" />
            <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('formatBlock', 'H1')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 flex-shrink-0 ${formats.h1 ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Heading1 size={14}/></button>
            <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('formatBlock', 'H2')} className={`p-1.5 rounded-xl md:rounded-full transition-all active:scale-75 flex-shrink-0 ${formats.h2 ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Heading2 size={14}/></button>
            <div className="w-[1px] h-3.5 bg-white/10 mx-0.5" />
            <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('justifyLeft')} className={`p-1.5 rounded-full transition-all ${formats.justifyLeft ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><AlignLeft size={14}/></button>
            <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('justifyCenter')} className={`p-1.5 rounded-full transition-all ${formats.justifyCenter ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><AlignCenter size={14}/></button>
          </div>
        )}

        {isEditing ? (
          <div className="space-y-4 w-full pt-2 animate-fade-in">
            <input 
              type="text" 
              placeholder="Заголовок исторической вехи..." 
              value={eventTitle} 
              onChange={e => setEventTitle(e.target.value)} 
              className="w-full bg-[#14171c]/60 border border-white/10 rounded-2xl p-4 text-sm font-black text-white outline-none focus:border-[#c0ff00]/40 focus:bg-black/40 transition-all shadow-xl placeholder:text-gray-600"
            />
            
            <div className="flex flex-wrap gap-2.5 pt-1 select-none">
              <div className="inline-flex items-center gap-2 bg-[#14171c]/80 border border-white/10 rounded-full px-4 py-2 text-xs font-bold text-gray-300 shadow-md">
                <Calendar size={14} className="text-[#c0ff00]" />
                <input 
                  type="date" 
                  value={eventDate} 
                  onChange={e => setEventDate(e.target.value)} 
                  className="bg-transparent border-none outline-none text-white font-mono cursor-pointer p-0 text-xs w-28 focus:ring-0"
                />
              </div>

              <div className="inline-flex items-center gap-2 bg-[#14171c]/80 border border-white/10 rounded-full px-4 py-2 text-xs font-bold text-gray-300 shadow-md relative">
                <FolderArchive size={14} className="text-[#c0ff00]" />
                <select 
                  value={selectedSeason} 
                  onChange={e => setSelectedSeason(e.target.value)}
                  className="bg-transparent border-none outline-none text-white font-bold cursor-pointer p-0 pr-6 text-xs focus:ring-0 appearance-none"
                >
                  {seasons.map(s => (
                    <option key={s} value={s} className="bg-[#14171c] text-white font-bold">{s}</option>
                  ))}
                </select>
                <div className="absolute right-3 pointer-events-none text-gray-500">
                  <ChevronDown size={12} />
                </div>
              </div>
            </div>

            <div 
              ref={editorRef} 
              contentEditable 
              className="w-full min-h-[500px] bg-[#14171c]/90 backdrop-blur-xl border border-white/5 focus:border-[#c0ff00]/40 rounded-[28px] p-5 text-base leading-relaxed text-gray-200 focus:outline-none transition-all shadow-inner prose prose-invert max-w-none break-words pb-24" 
              data-placeholder="Детальный разбор исторического события..." 
            />
          </div>
        ) : activeEvent ? (
          <div className="space-y-4 animate-fade-in w-full">
            <div className="space-y-1 w-full border-b border-white/5 pb-3">
              <h2 className="text-xl md:text-2xl font-black text-white leading-tight break-words">
                {activeEvent.title}
              </h2>
              <div className="text-[10px] font-bold font-mono text-gray-500 uppercase tracking-wider flex items-center gap-1 select-none pt-0.5">
                <Clock size={12} /> {new Date(activeEvent.event_date).toLocaleDateString('ru-RU')}
              </div>
            </div>
            <div className="bg-[#14171c]/90 backdrop-blur-xl p-5 rounded-[28px] border border-white/5 text-base leading-relaxed text-gray-300 prose prose-invert shadow-md break-words w-full" dangerouslySetInnerHTML={{ __html: activeEvent.content }} />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 px-1">
              <Calendar size={18} className="text-[#c0ff00]" />
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Хронология великих вех ({selectedSeason})</h2>
            </div>

            <div className="relative pl-6 border-l border-white/10 space-y-5 ml-4 pt-2">
              {loading ? (
                <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-[#c0ff00]" size={24} /></div>
              ) : events.length === 0 ? (
                <div className="text-center py-12 text-xs font-mono text-gray-500 bg-[#14171c]/40 border border-white/5 rounded-[24px] -ml-6">
                  ИСТОРИЧЕСКИХ ЗАПИСЕЙ ДЛЯ ЭТОГО СЕЗОНА НЕТ
                </div>
              ) : (
                events.map(event => (
                  <div 
                    key={event.id}
                    onClick={() => {
                      setActiveEvent(event);
                      setIsEditing(false);
                    }}
                    className="bg-[#14171c]/90 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:border-white/10 transition-all cursor-pointer group relative shadow-xl transform hover:scale-[1.01]"
                  >
                    <div className="absolute -left-[31px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#090b0e] border-2 border-white/20 flex items-center justify-center group-hover:border-[#c0ff00] transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-[#c0ff00]" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5 pr-4">
                      <div className="text-[9px] font-bold font-mono text-[#c0ff00] uppercase tracking-wider flex items-center gap-1 select-none">
                        <Clock size={10}/> {new Date(event.event_date).toLocaleDateString('ru-RU')}
                      </div>
                      <h4 className="font-black text-sm text-white group-hover:text-[#c0ff00] transition-colors leading-snug break-words">{event.title}</h4>
                      <p className="text-[11px] text-gray-400 font-medium line-clamp-2 leading-relaxed">{stripHtml(event.content)}</p>
                    </div>

                    <div className="flex items-center shrink-0">
                      <ArrowRight size={15} className="text-gray-600 group-hover:text-white transition-all transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

      </div>

      <style jsx global>{`
        .prose, .prose * { word-break: break-word !important; overflow-wrap: break-word !important; max-w-full !important; white-space: pre-wrap !important; }
        .prose h1, [contenteditable] h1 { font-size: 1.25rem !important; font-weight: 800 !important; color: #ffffff !important; margin-top: 1.2rem !important; margin-bottom: 0.5rem !important; line-height: 1.2 !important; }
        .prose h2, [contenteditable] h2 { font-size: 1.1rem !important; font-weight: 800 !important; color: #c0ff00 !important; margin-top: 1rem !important; margin-bottom: 0.4rem !important; line-height: 1.2 !important; }
        .prose p { margin-bottom: 0.75rem; color: #d1d5db !important; }
        [contenteditable]:empty:before { content: attr(data-placeholder); color: #4b5563; cursor: text; }
      `}</style>
    </div>
  );
}
