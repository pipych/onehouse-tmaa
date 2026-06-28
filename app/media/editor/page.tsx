'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Send, Clock, Image as ImageIcon, Youtube, X, Bold, Italic, Strikethrough, Heading1, Heading2, AlignLeft, AlignCenter, RefreshCw } from 'lucide-react';

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
    if (!newPostTitle.trim() || !postContent.trim() || postContent === '<br>' || !currentUser) {
      return alert('Заполните поля заголовка и контента статьи!');
    }

    const finalDate = newPostPublishedAtInput ? new Date(newPostPublishedAtInput).toISOString() : new Date().toISOString();
    const payload = {
      author_id: currentUser.id, title: newPostTitle, content: postContent,
      cover_url: newPostCoverUrl || null, youtube_url: newPostYoutubeUrl || null, created_at: finalDate
    };

    const { error } = editingPostId 
      ? await supabase.from('posts').update(payload).eq('id', editingPostId)
      : await supabase.from('posts').insert([payload]);

    if (!error) router.back();
    else alert(error.message);
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user?.id) {
      supabase.from('users').select('id').eq('tg_id', tg.initDataUnsafe.user.id).single().then(({ data }) => {
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
          if (editorRef.current) editorRef.current.innerHTML = data.content || '';
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

  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-24 pb-40">
      <div className="w-full max-w-3xl mx-auto flex flex-col relative">
        
        <div className="flex items-center justify-between w-full mb-12">
          <button onClick={() => router.back()} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-gray-300"><ArrowLeft size={20} /></button>
          <button onClick={handlePublish} disabled={isUploadingPostCover || !newPostTitle.trim()} className="w-12 h-12 flex items-center justify-center bg-[#c0ff00] text-black rounded-full shadow-lg"><Send size={20} /></button>
        </div>

        <div className="w-full mb-14">
          <div className="flex flex-wrap gap-3">
            <div onClick={() => dateInputRef.current?.showPicker()} className="relative flex items-center gap-2 border px-4 py-2 rounded-full cursor-pointer text-xs font-bold bg-white/5 border-white/10 text-gray-400">
              <Clock size={14} /> 
              {/* ИСПРАВЛЕНО: Закрывающая фигурная скобка перенесена в самый конец тернарного оператора */}
              <span>{newPostPublishedAtInput ? new Date(newPostPublishedAtInput).toLocaleDateString('ru-RU') : 'Дата'}</span>
              <input ref={dateInputRef} type="datetime-local" value={newPostPublishedAtInput} onChange={e => setNewPostPublishedAtInput(e.target.value)} style={{ colorScheme: 'dark' }} className="absolute opacity-0 w-0 h-0" />
            </div>
            <label className="relative flex items-center gap-2 border px-4 py-2 rounded-full cursor-pointer text-xs font-bold bg-white/5 border-white/10 text-gray-400">
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
              {isUploadingPostCover ? <RefreshCw className="animate-spin" size={14} /> : <ImageIcon size={14} />} <span>Фото</span>
            </label>
            <button onClick={() => setIsYoutubeModalOpen(true)} className="flex items-center gap-2 border px-4 py-2 rounded-full bg-white/5 border-white/10 text-gray-400 text-xs font-bold outline-none">
              <Youtube size={14} /> <span>YouTube</span>
            </button>
          </div>
        </div>

        <input type="text" placeholder="Яркий заголовок..." value={newPostTitle} onChange={e => setNewPostTitle(e.target.value)} className="w-full bg-transparent text-3xl md:text-5xl font-black text-white border-none outline-none py-1 focus:ring-0 placeholder:text-gray-700 mb-8" />
        
        <div className="space-y-4 mb-8">
          {newPostCoverUrl && <div className="w-full rounded-[24px] overflow-hidden relative" style={{ aspectRatio: '16/9' }}><img src={newPostCoverUrl} className="w-full h-full object-cover" alt="preview" /></div>}
          {newPostYoutubeUrl && getYoutubeEmbedUrl(newPostYoutubeUrl) && <div className="w-full relative rounded-[24px] overflow-hidden bg-black/50 shadow-md" style={{ paddingBottom: '56.25%', height: 0 }}><iframe src={getYoutubeEmbedUrl(newPostYoutubeUrl)!} className="absolute inset-0 w-full h-full border-none" allowFullScreen /></div>}
        </div>

        <div ref={editorRef} contentEditable onKeyUp={checkFormatting} onMouseUp={checkFormatting} onInput={checkFormatting} className="w-full min-h-[40vh] bg-transparent text-lg text-gray-200 outline-none prose prose-invert max-w-none pt-2 pb-10 focus:outline-none" data-placeholder="Текст вашей статьи..." />

        {isTextSelected && (
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
    </div>
  );
}

export default function StandalonePostEditor() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090b0e] text-gray-500 flex items-center justify-center font-mono text-xs tracking-wider">ЗАГРУЗКА ИНТЕРФЕЙСА РЕДАКТОРА...</div>}>
      <EditorContent />
    </Suspense>
  );
}
