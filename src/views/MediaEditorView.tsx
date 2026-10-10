import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getCurrentSeasonName } from '../lib/season';
import { useTelegram } from '../hooks/useTelegram';
import { OneIcon } from '../components/ui/SFSymbol';

const BOT_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbw_u1zTK5C44FvRfldEuadVy4vs0MQzCsfutsyZf-roJwsg-oY3gvUZiRn8Jk190lpxtg/exec";

interface Player {
  id: string;
}

function EditorContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editingPostId = searchParams.get('edit');
  const { showBackButton, hideBackButton } = useTelegram();

  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [myCharacters, setMyCharacters] = useState<any[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<string>('');
  const [showCharPicker, setShowCharPicker] = useState(false);
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

  async function loadUser() {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.initDataUnsafe?.user?.id) return;
    const { data: player } = await supabase.from('players').select('id, roles').eq('tg_id', tg.initDataUnsafe.user.id).single();
    if (player) {
      setCurrentUser(player);
      const { data: chars } = await supabase.from('characters').select('*').eq('player_id', player.id);
      if (chars) {
        setMyCharacters(chars);
        const { data: activeId } = await supabase.rpc('get_active_character', { p_player_id: player.id });
        if (activeId) setSelectedCharId(activeId);
        else if (chars.length > 0) setSelectedCharId(chars[0].id);
      }
    }
  }

  async function loadEditingPost(postId: string) {
    const { data: post } = await supabase.from('posts').select('*').eq('id', postId).single();
    if (post) {
      setNewPostTitle(post.title || '');
      setNewPostCoverUrl(post.cover_url || '');
      setNewPostYoutubeUrl(post.youtube_url || '');
      if (post.author_id) setSelectedCharId(post.author_id);
      if (post.created_at) {
        const d = new Date(post.created_at);
        const pad = (n: number) => n.toString().padStart(2, '0');
        setNewPostPublishedAtInput(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
      }
      if (editorRef.current) {
        editorRef.current.innerHTML = post.content || '';
        setIsEditorEmpty(!post.content || post.content === '<br>');
      }
    }
  }

  async function handlePublish() {
    if (!newPostTitle.trim()) return alert('Введите заголовок!');
    const content = editorRef.current?.innerHTML || '';
    if (!content.trim() || content === '<br>') return alert('Введите текст!');
    if (!selectedCharId) return alert('Выберите персонажа!');

    setPublishStatus('publishing');
    const seasonName = await getCurrentSeasonName();

    const postPayload: any = {
      title: newPostTitle.trim(),
      content: content,
      cover_url: newPostCoverUrl,
      youtube_url: newPostYoutubeUrl,
      author_id: selectedCharId,
      season: seasonName,
    };

    if (newPostPublishedAtInput) {
      postPayload.created_at = new Date(newPostPublishedAtInput).toISOString();
    }

    try {
      if (editingPostId) {
        const { error } = await supabase.from('posts').update(postPayload).eq('id', editingPostId);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase.from('posts').insert([postPayload]).select().single();
        if (error) throw error;
        
        // Telegram notification webhook
        try {
          fetch(BOT_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'new_post', post: inserted }),
          }).catch(() => {});
        } catch (_) {}
      }

      setPublishStatus('success');
      setTimeout(() => navigate('/'), 800);
    } catch (e: any) {
      alert(e.message);
      setPublishStatus('idle');
    }
  }

  useEffect(() => {
    showBackButton(() => navigate('/'));
    return () => hideBackButton();
  }, [showBackButton, hideBackButton, navigate]);

  useEffect(() => {
    loadUser();
    if (editingPostId) loadEditingPost(editingPostId);
  }, [editingPostId]);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setIsTextSelected(false);
      } else {
        const anchorNode = selection.anchorNode;
        if (editorRef.current && anchorNode && editorRef.current.contains(anchorNode)) {
          setIsTextSelected(true);
          checkFormatting();
        } else {
          setIsTextSelected(false);
        }
      }
    };
    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  const selectedChar = myCharacters.find(c => c.id === selectedCharId);
  const isButtonDisabled = publishStatus !== 'idle' || !newPostTitle.trim() || isEditorEmpty || !selectedCharId;

  let buttonClass = "w-11 h-11 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 border-none sf-tap ";
  let buttonIcon = <OneIcon name="send" size={20} />;

  if (publishStatus === 'publishing') {
    buttonClass += "bg-yellow-500 text-black cursor-not-allowed scale-95";
    buttonIcon = <OneIcon name="sync" size={20} className="animate-spin" />;
  } else if (publishStatus === 'success') {
    buttonClass += "bg-[#1bd96a] text-black scale-105";
    buttonIcon = <OneIcon name="check" size={20} />;
  } else if (isButtonDisabled) {
    buttonClass += "bg-[#14171c] text-[#8e8e93] cursor-not-allowed opacity-40";
  } else {
    buttonClass += "bg-[#c0ff00] text-[#090b0e] hover:bg-[#aee600] active:scale-90";
  }

  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-tma-safe md:pt-10 pb-40 select-none antialiased">
      <div className="w-full max-w-3xl mx-auto flex flex-col relative">
        <div className="flex items-center justify-between w-full mb-8">
          <button 
            onClick={() => navigate('/')} 
            disabled={publishStatus !== 'idle'} 
            className="w-11 h-11 flex items-center justify-center bg-[#14171c] hover:bg-[#181c23] rounded-full text-white disabled:opacity-30 border-none sf-tap"
          >
            <OneIcon name="arrow_back" size={20} />
          </button>
          
          <button onClick={handlePublish} disabled={isButtonDisabled} className={buttonClass} title="Опубликовать">
            {buttonIcon}
          </button>
        </div>

        {/* Выбор персонажа */}
        <div className="w-full mb-6">
          <div className="relative inline-block">
            <button 
              onClick={() => setShowCharPicker(!showCharPicker)} 
              className="flex items-center gap-2.5 px-4 py-2 rounded-full cursor-pointer text-xs font-bold bg-[#14171c] hover:bg-[#181c23] text-white border-none sf-tap"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden bg-[#181c23] flex-shrink-0 flex items-center justify-center border-none">
                {selectedChar?.avatar_url ? (
                  <img src={selectedChar.avatar_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <OneIcon name="person" size={14} className="text-[#8e8e93]" />
                )}
              </div>
              <span>{selectedChar?.rp_name || 'Выбери персонажа'}</span>
              <OneIcon name="expand_more" size={16} className="text-[#8e8e93]" />
            </button>

            {showCharPicker && myCharacters.length > 0 && (
              <div className="absolute left-0 mt-2 bg-[#14171c] rounded-[24px] p-2 z-50 shadow-2xl min-w-[240px] flex flex-col gap-1 animate-fade-in border-none">
                {myCharacters.map((char: any) => (
                  <button
                    key={char.id}
                    onClick={() => { setSelectedCharId(char.id); setShowCharPicker(false); }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-full text-left transition-all border-none ${selectedCharId === char.id ? 'bg-[#c0ff00]/10 text-[#c0ff00]' : 'text-white hover:bg-white/5'}`}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#181c23] flex-shrink-0 border-none">
                      {char.avatar_url ? <img src={char.avatar_url} className="w-full h-full object-cover" alt="" /> : <OneIcon name="person" size={16} className="text-[#8e8e93] m-auto" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate">{char.rp_name}</div>
                      <div className="text-[10px] text-[#8e8e93]">{char.season} · {char.status === 'dead' ? 'Мёртв' : 'Жив'}</div>
                    </div>
                    {selectedCharId === char.id && <OneIcon name="check" size={16} className="text-[#c0ff00] ml-auto flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Панель вложений (Strictly Pill, No Borders) */}
        <div className="w-full mb-6">
          <div className="flex flex-wrap gap-2.5">
            <div 
              onClick={() => publishStatus === 'idle' && dateInputRef.current?.showPicker()} 
              className="relative flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer text-xs font-bold bg-[#14171c] hover:bg-[#181c23] text-[#8e8e93] hover:text-white border-none sf-tap"
            >
              <OneIcon name="schedule" size={16} /> 
              <span>{newPostPublishedAtInput ? new Date(newPostPublishedAtInput).toLocaleDateString('ru-RU') : 'Дата'}</span>
              <input ref={dateInputRef} type="datetime-local" value={newPostPublishedAtInput} onChange={e => setNewPostPublishedAtInput(e.target.value)} style={{ colorScheme: 'dark' }} className="absolute opacity-0 w-0 h-0" />
            </div>

            <label className="relative flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer text-xs font-bold bg-[#14171c] hover:bg-[#181c23] text-[#8e8e93] hover:text-white border-none sf-tap">
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} disabled={publishStatus !== 'idle'} />
              {isUploadingPostCover ? <OneIcon name="sync" size={16} className="animate-spin" /> : <OneIcon name="image" size={16} />} 
              <span>Фото</span>
            </label>

            <button 
              type="button"
              onClick={() => publishStatus === 'idle' && setIsYoutubeModalOpen(true)} 
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#14171c] hover:bg-[#181c23] text-[#8e8e93] hover:text-white text-xs font-bold border-none outline-none sf-tap"
            >
              <OneIcon name="smart_display" size={16} /> 
              <span>YouTube</span>
            </button>
          </div>
        </div>

        {/* Поле заголовка */}
        <input 
          type="text" 
          placeholder="Заголовок статьи..." 
          value={newPostTitle} 
          onChange={e => setNewPostTitle(e.target.value)} 
          disabled={publishStatus !== 'idle'} 
          className="w-full bg-transparent text-2xl md:text-3xl font-black text-white border-none outline-none ring-0 focus:ring-0 py-2 placeholder-[#8e8e93]/50 mb-6 disabled:opacity-50" 
        />
        
        {/* Превью медиа */}
        <div className="space-y-4 mb-6">
          {newPostCoverUrl && (
            <div className="w-full rounded-[28px] overflow-hidden relative border-none" style={{ aspectRatio: '16/9' }}>
              <img src={newPostCoverUrl} className="w-full h-full object-cover" alt="preview" />
            </div>
          )}
          {newPostYoutubeUrl && getYoutubeEmbedUrl(newPostYoutubeUrl) && (
            <div className="w-full relative rounded-[28px] overflow-hidden bg-black/50 shadow-md border-none" style={{ paddingBottom: '56.25%', height: 0 }}>
              <iframe src={getYoutubeEmbedUrl(newPostYoutubeUrl)!} className="absolute inset-0 w-full h-full border-none" allowFullScreen />
            </div>
          )}
        </div>

        {/* Область редактора текста */}
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

        {/* Плавающий тулбар форматирования (Strictly Pill, No Borders) */}
        {isTextSelected && publishStatus === 'idle' && (
          <div className="fixed bottom-24 left-0 right-0 z-[99999] flex items-center justify-center px-4 pointer-events-none animate-fade-in">
            <div className="p-1.5 bg-[#14171c] rounded-full shadow-2xl backdrop-blur-md flex items-center gap-1 pointer-events-auto w-auto overflow-x-auto no-scrollbar border-none">
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('bold')} className={`p-2 rounded-full transition-all border-none ${formats.bold ? 'bg-[#c0ff00] text-[#090b0e]' : 'text-[#8e8e93] hover:text-white'}`}><OneIcon name="format_bold" size={18}/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('italic')} className={`p-2 rounded-full transition-all border-none ${formats.italic ? 'bg-[#c0ff00] text-[#090b0e]' : 'text-[#8e8e93] hover:text-white'}`}><OneIcon name="format_italic" size={18}/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('strikeThrough')} className={`p-2 rounded-full transition-all border-none ${formats.strikeThrough ? 'bg-[#c0ff00] text-[#090b0e]' : 'text-[#8e8e93] hover:text-white'}`}><OneIcon name="format_strikethrough" size={18}/></button>
              <div className="w-[1px] h-4 bg-white/10" />
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('formatBlock', 'H1')} className={`p-2 rounded-full transition-all border-none ${formats.h1 ? 'bg-[#c0ff00] text-[#090b0e]' : 'text-[#8e8e93] hover:text-white'}`}><OneIcon name="format_size" size={18}/></button>
              <div className="w-[1px] h-4 bg-white/10" />
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('justifyLeft')} className={`p-2 rounded-full transition-all border-none ${formats.justifyLeft ? 'bg-[#c0ff00] text-[#090b0e]' : 'text-[#8e8e93] hover:text-white'}`}><OneIcon name="format_align_left" size={18}/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('justifyCenter')} className={`p-2 rounded-full transition-all border-none ${formats.justifyCenter ? 'bg-[#c0ff00] text-[#090b0e]' : 'text-[#8e8e93] hover:text-white'}`}><OneIcon name="format_align_center" size={18}/></button>
            </div>
          </div>
        )}

        {/* Модалка YouTube */}
        {isYoutubeModalOpen && (
          <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="bg-[#14171c] p-6 pt-3 pb-[max(var(--tma-raw-bottom-inset,env(safe-area-inset-bottom,0px)),28px)] md:pb-6 rounded-t-[32px] rounded-b-none md:rounded-[32px] w-full max-w-md relative flex flex-col gap-5 border-none shadow-2xl">
              <div className="w-12 h-1 rounded-full bg-white/20 mx-auto mb-1 md:hidden" />
              <button 
                onClick={() => setIsYoutubeModalOpen(false)} 
                className="hidden md:flex absolute top-5 right-5 w-8 h-8 rounded-full bg-[#181c23] items-center justify-center text-[#8e8e93] hover:text-white border-none sf-tap"
              >
                <OneIcon name="close" size={18} />
              </button>
              <h3 className="text-xl font-black text-white">Видео с YouTube</h3>
              <input 
                type="text" 
                placeholder="Ссылка на видео..." 
                value={newPostYoutubeUrl} 
                onChange={e => setNewPostYoutubeUrl(e.target.value)} 
                className="w-full bg-[#181c23] rounded-full h-12 px-5 text-sm text-white placeholder-[#8e8e93] border-none outline-none ring-0 focus:ring-0" 
              />
              <button 
                onClick={() => setIsYoutubeModalOpen(false)} 
                className="w-full bg-[#c0ff00] text-[#090b0e] font-black h-12 rounded-full hover:bg-[#aee600] active:scale-95 transition-all border-none sf-tap"
              >
                Сохранить
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        [contenteditable]:empty:before { content: attr(data-placeholder); color: #8e8e93; }
      `}</style>
    </div>
  );
}

export default function StandalonePostEditor() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#090b0e] flex flex-col items-center justify-center gap-4">
        <OneIcon name="sync" className="animate-spin text-[#c0ff00]" size={36} />
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
