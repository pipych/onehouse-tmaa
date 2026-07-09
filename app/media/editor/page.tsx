'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { getCurrentSeasonName } from '../../../lib/season';
import { ArrowLeft, Send, Clock, Image as ImageIcon, Youtube, X, Bold, Italic, Strikethrough, Heading1, Heading2, AlignLeft, AlignCenter, RefreshCw, Check } from 'lucide-react';

const BOT_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbw_u1zTK5C44FvRfldEuadVy4vs0MQzCsfutsyZf-roJwsg-oY3gvUZiRn8Jk190lpxtg/exec";

interface Player {
  id: string;
}

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingPostId = searchParams.get('edit');

  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCoverUrl, setNewPostCoverUrl] = useState('');
  const [newPostYoutubeUrl, setNewPostYoutubeUrl] = useState('');
  const [isUploadingPostCover, setIsUploadingPostCover] = useState(false);
  const [newPostPublishedAtInput, setNewPostPublishedAtInput] = useState(''); 
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  const [isTextSelected, setIsTextSelected] = useState(false);
  
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'success'>('idle');
  
  const editorRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [formats, setFormats] = useState({
    bold: false, italic: false, strikeThrough: false, h1: false, h2: false, justifyLeft: false, justifyCenter: false
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
          canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Blob error')), 'image/webp', 0.85);
        };
      };
    });
  }

  function getYoutubeEmbedUrl(url: string) {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  }

  function checkFormatting() {
    if (typeof document === 'undefined') return;
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
  }

  function execEditorCommand(command: string, value = '') {
    if (typeof document === 'undefined') return;
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
    setTimeout(checkFormatting, 50);
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setIsUploadingPostCover(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const webpBlob = await convertToWebP(file);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.webp`;

      const { error } = await supabase.storage.from('avatars').upload(fileName, webpBlob, { contentType: 'image/webp' });
      if (error) return alert(error.message);
      
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      if (data) setNewPostCoverUrl(data.publicUrl);
    } catch (e: any) { alert(e.message); } finally { setIsUploadingPostCover(false); }
  }

  async function handlePublish() {
    const postContent = editorRef.current?.innerHTML || '';
    if (!newPostTitle.trim() || isEditorEmpty || !currentUser) return;

    setPublishStatus('publishing');

    const finalDate = newPostPublishedAtInput ? new Date(newPostPublishedAtInput).toISOString() : new Date().toISOString();
    const season = await getCurrentSeasonName();
    const payload = {
      author_id: currentUser.id, title: newPostTitle, content: postContent,
      cover_url: newPostCoverUrl || null, youtube_url: newPostYoutubeUrl || null, created_at: finalDate, season
    };

    const query = editingPostId 
      ? supabase.from('posts').update(payload).eq('id', editingPostId).select().single()
      : supabase.from('posts').insert([payload]).select().single();

    const { data: savedPost, error } = await query;

    if (!error && savedPost) {
      if (!editingPostId && BOT_WEBHOOK_URL) {
        try {
          await fetch(BOT_WEBHOOK_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'new_post',
              id: savedPost.id,
              title: savedPost.title,
              cover_url: savedPost.cover_url
            })
          });
        } catch (e) {}
      }
      
      setPublishStatus('success');
      setTimeout(() => {
        router.push('/');
      }, 1200);

    } else {
      if (error) alert(error.message);
      setPublishStatus('idle');
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user?.id) {
      supabase.from('players').select('id').eq('tg_id', tg.initDataUnsafe.user.id).single().then(({ data }) => {
        if (data) setCurrentUser(data);
      });
    }
  }, []);

  useEffect(() => {
    if (editingPostId) {
      supabase.from('posts').select('*').eq('id', editingPostId).single().then(({ data }) => {
        if (data) {
          setNewPostTitle(data.title);
          setNewPostCoverUrl(data.cover_url || '');
          setNewPostYoutubeUrl(data.youtube_url || '');
          const d = new Date(data.created_at);
          d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
          setNewPostPublishedAtInput(d.toISOString().slice(0, 16));
          if (editorRef.current) {
            editorRef.current.innerHTML = data.content || '';
            setIsEditorEmpty(!data.content || !data.content.trim() || data.content === '<br>');
          }
        }
      });
    }
  }, [editingPostId]);

  useEffect(() => {
    const handleSelection = () => {
      const s = window.getSelection();
      if (s && s.toString().trim().length > 0 && editorRef.current?.contains(s.anchorNode)) {
        setIsTextSelected(true); checkFormatting();
      } else setIsTextSelected(false);
    };
    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  const isButtonDisabled = isUploadingPostCover || !newPostTitle.trim() || isEditorEmpty || publishStatus !== 'idle';
  
  let buttonClass = "w-12 h-12 flex items-center justify-center rounded-full shadow-lg transition-all duration-500 ease-out ";
  let buttonIcon = <Send size={20} />;

  if (publishStatus === 'publishing') {
    buttonClass += "bg-yellow-500 text-black cursor-not-allowed scale-95";
    buttonIcon = <RefreshCw size={20} className="animate-spin" />;
  } else if (publishStatus === 'success') {
    buttonClass += "bg-green-500 text-white scale-110";
    buttonIcon = <Check size={20} className="animate-fade-in" />;
  } else if (isButtonDisabled) {
    buttonClass += "bg-gray-800 text-gray-600 border border-white/5 cursor-not-allowed";
  } else {
    buttonClass += "bg-[#c0ff00] text-black active:scale-90 hover:scale-105";
  }

  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-24 pb-40">
      <div className="w-full max-w-3xl mx-auto flex flex-col relative">
        
        <div className="flex items-center justify-between w-full mb-12">
          <button onClick={() => router.push('/')} disabled={publishStatus !== 'idle'} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-gray-300 disabled:opacity-30"><ArrowLeft size={20} /></button>
          
          <button onClick={handlePublish} disabled={isButtonDisabled} className={buttonClass}>
            {buttonIcon}
          </button>
        </div>

        {/* ВЕРНУЛИ: Панель вложений (Дата, Фото, YouTube) */}
        <div className="w-full mb-8">
          <div className="flex flex-wrap gap-3">
            <div onClick={() => publishStatus === 'idle' && dateInputRef.current?.showPicker()} className="relative flex items-center gap-2 border px-4 py-2 rounded-full cursor-pointer text-xs font-bold bg-white/5 border-white/10 text-gray-400">
              <Clock size={14} /> 
              <span>{newPostPublishedAtInput ? new Date(newPostPublishedAtInput).toLocaleDateString('ru-RU') : 'Дата'}</span>
              <input ref={dateInputRef} type="datetime-local" value={newPostPublishedAtInput} onChange={e => setNewPostPublishedAtInput(e.target.value)} style={{ colorScheme: 'dark' }} className="absolute opacity-0 w-0 h-0" />
            </div>
            <label className="relative flex items-center gap-2 border px-4 py-2 rounded-full cursor-pointer text-xs font-bold bg-white/5 border-white/10 text-gray-400">
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} disabled={publishStatus !== 'idle'} />
              {isUploadingPostCover ? <RefreshCw className="animate-spin" size={14} /> : <ImageIcon size={14} />} <span>Фото</span>
            </label>
            <button onClick={() => publishStatus === 'idle' && setIsYoutubeModalOpen(true)} className="flex items-center gap-2 border px-4 py-2 rounded-full bg-white/5 border-white/10 text-gray-400 text-xs font-bold outline-none">
              <Youtube size={14} /> <span>YouTube</span>
            </button>
          </div>
        </div>

        {/* ИСПРАВЛЕНО: Гораздо меньший размер шрифта для заголовка (text-xl md:text-3xl) */}
        <input type="text" placeholder="Заголовок статьи..." value={newPostTitle} onChange={e => setNewPostTitle(e.target.value)} disabled={publishStatus !== 'idle'} className="w-full bg-transparent text-xl md:text-3xl font-black text-white border-none outline-none py-1 focus:ring-0 placeholder:text-gray-700 mb-6 disabled:opacity-50" />
        
        <div className="space-y-4 mb-6">
          {newPostCoverUrl && <div className="w-full rounded-[24px] overflow-hidden relative" style={{ aspectRatio: '16/9' }}><img src={newPostCoverUrl} className="w-full h-full object-cover" alt="preview" /></div>}
          {newPostYoutubeUrl && getYoutubeEmbedUrl(newPostYoutubeUrl) && <div className="w-full relative rounded-[24px] overflow-hidden bg-black/50 shadow-md" style={{ paddingBottom: '56.25%', height: 0 }}><iframe src={getYoutubeEmbedUrl(newPostYoutubeUrl)!} className="absolute inset-0 w-full h-full border-none" allowFullScreen /></div>}
        </div>

        <div 
          ref={editorRef} 
          contentEditable={publishStatus === 'idle'} 
          onKeyUp={checkFormatting} 
          onMouseUp={checkFormatting} 
          onInput={() => {
            checkFormatting();
            const html = editorRef.current?.innerHTML || '';
            setIsEditorEmpty(!html.trim() || html === '<br>');
          }} 
          className="w-full min-h-[40vh] bg-transparent text-base text-gray-200 outline-none prose prose-invert max-w-none pt-2 pb-10 focus:outline-none disabled:opacity-50" 
          data-placeholder="Текст вашей статьи..." 
        />

        {/* ВЕРНУЛИ: Плавающая панель стилей текста при выделении */}
        {isTextSelected && publishStatus === 'idle' && (
          <div className="fixed bottom-24 left-0 right-0 z-[99999] flex items-center justify-center px-4 pointer-events-none animate-fade-in">
            <div className="p-2 bg-[#14171c]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-1.5 pointer-events-auto w-full max-w-sm overflow-x-auto no-scrollbar justify-around">
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('bold')} className={`p-2 rounded-xl ${formats.bold ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Bold size={16}/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('italic')} className={`p-2 rounded-xl ${formats.italic ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Italic size={16}/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('strikeThrough')} className={`p-2 rounded-xl ${formats.strikeThrough ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Strikethrough size={16}/></button>
              <div className="w-[1px] h-4 bg-white/10" />
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('formatBlock', 'H1')} className={`p-2 rounded-xl ${formats.h1 ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Heading1 size={16}/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('formatBlock', 'H2')} className={`p-2 rounded-xl ${formats.h2 ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><Heading2 size={16}/></button>
              <div className="w-[1px] h-4 bg-white/10" />
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('justifyLeft')} className={`p-2 rounded-xl ${formats.justifyLeft ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><AlignLeft size={16}/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('justifyCenter')} className={`p-2 rounded-xl ${formats.justifyCenter ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400'}`}><AlignCenter size={16}/></button>
            </div>
          </div>
        )}

        {/* ВЕРНУЛИ: Модальное окно ввода ссылки YouTube */}
        {isYoutubeModalOpen && (
          <div className="fixed inset-0 z-[99999] bg-[#090b0e]/95 backdrop-blur-xl flex items-center justify-center px-4">
            <div className="bg-[#14171c] border border-white/10 p-6 rounded-[32px] w-full max-w-md relative flex flex-col gap-6">
              <button onClick={() => setIsYoutubeModalOpen(false)} className="absolute top-5 right-5 text-gray-400"><X size={20}/></button>
              <h3 className="text-xl font-black text-white">Видео с YouTube</h3>
              <input type="text" placeholder="Ссылка..." value={newPostYoutubeUrl} onChange={e => setNewPostYoutubeUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none" />
              <button onClick={() => setIsYoutubeModalOpen(false)} className="w-full bg-[#c0ff00] text-black font-black py-4 rounded-2xl">Сохранить</button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        body { font-family: var(--font-wix), sans-serif !important; }
        .prose h1 { font-size: 1.25rem !important; font-weight: 800 !important; }
        .prose h2 { font-size: 1.1rem !important; font-weight: 800 !important; }
        [contenteditable]:empty:before { content: attr(data-placeholder); color: #374151; }
      `}</style>
    </div>
  );
}

export default function StandalonePostEditor() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#090b0e] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="animate-spin text-[#c0ff00]" size={36} />
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
