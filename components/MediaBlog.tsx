'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Newspaper, Clock, Heart, MessageCircle, Image as ImageIcon, 
  Youtube, X, Send, Bold, Italic, Strikethrough, 
  Heading1, Heading2, AlignLeft, AlignCenter, Plus, ArrowLeft,
  Check, RefreshCw, MoreVertical, Share2
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

interface Post {
  id: string;
  author_id: string;
  title: string;
  content: string;
  cover_url: string;
  youtube_url: string;
  created_at: string;
  author?: Player;
}

interface MediaBlogProps {
  currentUser: Player | null;
  onProfileClick: (player: Player) => void;
  isCreatingPost: boolean;
  setIsCreatingPost: (val: boolean) => void;
}

export default function MediaBlog({ currentUser, onProfileClick, isCreatingPost, setIsCreatingPost }: MediaBlogProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null); 
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false); 
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCoverUrl, setNewPostCoverUrl] = useState('');
  const [newPostYoutubeUrl, setNewPostYoutubeUrl] = useState('');
  const [isUploadingPostCover, setIsUploadingPostCover] = useState(false);

  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const [formats, setFormats] = useState({
    bold: false, italic: false, strikeThrough: false, h1: false, h2: false, justifyLeft: false, justifyCenter: false
  });

  const loadPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:users(*)')
      .order('created_at', { ascending: false });
    
    if (data && !error) {
      setPosts(data);
      return data;
    }
    return [];
  };

  useEffect(() => {
    const initBlog = async () => {
      const fetchedPosts = await loadPosts();

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const postIdFromUrl = params.get('post');
        if (postIdFromUrl) {
          const targetPost = fetchedPosts.find(p => p.id === postIdFromUrl);
          if (targetPost) {
            setSelectedPost(targetPost);
          }
        }
      }
    };

    initBlog();
  }, []);

  const handleOpenPost = (post: Post) => {
    setSelectedPost(post);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('post', post.id);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };

  const handleClosePost = () => {
    setSelectedPost(null);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.delete('post');
      const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };

  const handleSharePost = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation(); 
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}${window.location.pathname}?post=${postId}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedPostId(postId);
      
      if ((window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }

      setTimeout(() => setCopiedPostId(null), 2000);
    }
  };

  useEffect(() => {
    if (!isCreatingPost) {
      setNewPostTitle('');
      setNewPostCoverUrl('');
      setNewPostYoutubeUrl('');
      setEditingPostId(null);
      if (editorRef.current) editorRef.current.innerHTML = '';
    }
  }, [isCreatingPost]);

  useEffect(() => {
    if (isCreatingPost && editingPostId) {
      const postToEdit = posts.find(p => p.id === editingPostId);
      if (postToEdit) {
        setNewPostTitle(postToEdit.title);
        setNewPostCoverUrl(postToEdit.cover_url || '');
        setNewPostYoutubeUrl(postToEdit.youtube_url || '');
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.innerHTML = postToEdit.content || '';
          }
        }, 60);
      }
    }
  }, [isCreatingPost, editingPostId, posts]);

  const canManagePost = (post: Post) => {
    if (!currentUser) return false;
    const isAdmin = currentUser.roles?.includes('admin');
    return post.author_id === currentUser.id || isAdmin;
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Вы действительно хотите удалить эту публикацию?')) return;
    
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (!error) {
      setActiveMenuPostId(null);
      handleClosePost();
      loadPosts();
    } else {
      alert(`Ошибка при удалении: ${error.message}`);
    }
  };

  const publishPost = async () => {
    const postContent = editorRef.current?.innerHTML || '';

    if (!newPostTitle.trim() || !postContent.trim() || postContent === '<br>' || !currentUser) {
      alert('Заголовок и текст не могут быть пустыми!');
      return;
    }

    const postData = {
      author_id: currentUser.id,
      title: newPostTitle,
      content: postContent,
      cover_url: newPostCoverUrl || null,
      youtube_url: newPostYoutubeUrl || null
    };

    let error;
    if (editingPostId) {
      const { error: updateError } = await supabase.from('posts').update(postData).eq('id', editingPostId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('posts').insert([postData]);
      error = insertError;
    }

    if (!error) {
      setIsCreatingPost(false);
      setEditingPostId(null);
      loadPosts(); 
    } else {
      alert(`Ошибка сохранения: ${error.message}`);
    }
  };

  return (
    <>
      {/* --------------------------------------------------------
      СТРАНИЦА ПРОСМОТРА ПОЛНОГО ПОСТА (С КОММЕНТАРИЯМИ)
      -------------------------------------------------------- */}
      {selectedPost && (
        <div className="w-full max-w-3xl mx-auto animate-fade-in pb-32 px-4 md:px-0 flex flex-col">
          
          {/* Вернули обычную кнопку Назад на прежнее место */}
          <div className="mb-6 select-none">
            <button 
              onClick={handleClosePost} 
              className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-sm shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
          </div>

          {/* Главная карточка поста */}
          <div className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden shadow-2xl flex flex-col pt-2 relative">
            
            {/* Автор + Управление */}
            <div className="p-5 md:p-6 pb-2 flex items-center justify-between select-none">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-black/50 border border-white/10 flex-shrink-0 cursor-pointer" onClick={() => { if(selectedPost.author) onProfileClick(selectedPost.author); }}>
                  <img src={selectedPost.author?.avatar_url || 'https://via.placeholder.com/150'} alt="author" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-white tracking-wide truncate">{selectedPost.author?.rp_name || 'Неизвестный'}</div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-0.5">
                    <Clock size={12} /> 
                    {new Date(selectedPost.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                  </div>
                </div>
              </div>

              {canManagePost(selectedPost) && (
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveMenuPostId(activeMenuPostId === selectedPost.id ? null : selectedPost.id); }}
                    className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
                  >
                    <MoreVertical size={20} />
                  </button>
                  {activeMenuPostId === selectedPost.id && (
                    <div className="absolute right-0 mt-2 w-40 bg-[#1a1e24] border border-white/10 rounded-2xl p-1.5 z-[60] shadow-2xl animate-fade-in flex flex-col gap-0.5">
                      <button onClick={() => { setEditingPostId(selectedPost.id); setIsCreatingPost(true); setActiveMenuPostId(null); setSelectedPost(null); }} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl text-sm font-bold text-gray-200 hover:text-[#c0ff00] transition-colors">Редактировать</button>
                      <button onClick={() => handleDeletePost(selectedPost.id)} className="w-full text-left px-3 py-2 hover:bg-red-500/10 rounded-xl text-sm font-bold text-red-400 hover:text-red-300 transition-colors">Удалить</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Обложка статьи 16:9 */}
            {selectedPost.youtube_url && (
              <div className="px-5 md:px-6 w-full mb-2">
                <div className="w-full relative h-0 rounded-2xl overflow-hidden bg-black/50 shadow-md" style={{ paddingBottom: '56.25%' }}>
                  <iframe src={getYoutubeEmbedUrl(selectedPost.youtube_url)!} className="absolute inset-0 w-full h-full border-none" allowFullScreen />
                </div>
              </div>
            )}
            {selectedPost.cover_url && !selectedPost.youtube_url && (
              <div className="px-5 md:px-6 w-full mb-2">
                <div onClick={() => setIsImageZoomOpen(true)} className="w-full relative h-0 rounded-2xl overflow-hidden bg-black/50 shadow-md cursor-zoom-in" style={{ paddingBottom: '56.25%' }}>
                  <img src={selectedPost.cover_url} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
                </div>
              </div>
            )}

            {/* Контент поста */}
            <div className="p-5 md:p-6 pt-2 flex flex-col gap-5 flex-grow">
              <div>
                <h1 className="text-2xl md:text-4xl font-black text-white mb-6 leading-tight">{selectedPost.title}</h1>
                <div className="prose prose-invert max-w-none text-gray-300 text-base leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
              </div>

              {/* Лайки / Ссылка в общем блоке */}
              <div className="flex items-center justify-start gap-3 bg-transparent select-none">
                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/10 border border-white/5 rounded-full text-gray-400 hover:text-red-400 transition-all active:scale-95 text-xs font-bold font-mono">
                  <Heart size={15} />
                  <span>0</span>
                </button>
                <button 
                  onClick={(e) => handleSharePost(e, selectedPost.id)} 
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-[#c0ff00]/10 border border-white/5 rounded-full text-gray-400 hover:text-[#c0ff00] transition-all active:scale-95 text-xs font-bold font-mono min-w-[90px]"
                >
                  <Share2 size={15} />
                  <span>{copiedPostId === selectedPost.id ? 'Скопировано!' : 'Ссылка'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* БЛОК КОММЕНТАРИЕВ (Поле ввода теперь пилюля, кнопка — круг) */}
          <div className="bg-[#14171c]/60 backdrop-blur-xl border border-white/5 rounded-[32px] p-5 md:p-6 shadow-xl" style={{ marginTop: '56px' }}>
            <h3 className="text-lg font-black text-white mb-5 flex items-center gap-2 select-none">
              <MessageCircle size={20} className="text-[#c0ff00]" />
              <span>Комментарии</span>
            </h3>

            <div className="flex gap-3 items-center">
              <input 
                type="text" 
                placeholder="Напишите свое мнение..." 
                className="w-full bg-black/30 border border-white/10 rounded-full p-4 px-6 text-sm text-white outline-none focus:border-[#c0ff00]/40 transition-all placeholder:text-gray-600 shadow-inner" 
              />
              <button className="w-12 h-12 rounded-full flex items-center justify-center bg-[#c0ff00] hover:bg-[#a6e600] text-black transition-all active:scale-90 shadow-lg shrink-0">
                <Send size={18} />
              </button>
            </div>

            <div className="text-center py-10 text-sm text-gray-500 font-medium select-none">Здесь пока нет обсуждений. Станьте первым!</div>
          </div>

          {/* ПРОСМОТР ФУЛЛ КАРТИНКИ */}
          {isImageZoomOpen && selectedPost.cover_url && (
            <div onClick={() => setIsImageZoomOpen(false)} className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fade-in">
              <button className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"><X size={24} /></button>
              <img src={selectedPost.cover_url} alt="Full view" className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl pointer-events-none" />
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------
      ПОЛНОЭКРАННЫЙ РЕДАКТОР ПОСТА (ВСТРОЕННЫЙ)
      -------------------------------------------------------- */}
      {isCreatingPost && !selectedPost && (
        <div className="w-full max-w-3xl mx-auto animate-fade-in pb-40 px-4 md:px-0 flex flex-col" style={{ paddingTop: '24px' }}>
          
          {/* Шапка редактора */}
          <div className="flex items-center justify-between w-full select-none" style={{ marginBottom: '48px' }}>
            <button 
              onClick={() => setIsCreatingPost(false)} 
              className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-sm shrink-0"
            >
              <ArrowLeft size={20} />
            </button>

            <button 
              onClick={publishPost} 
              disabled={isUploadingPostCover || !newPostTitle.trim()}
              className="w-12 h-12 flex items-center justify-center bg-[#c0ff00] text-black rounded-full shadow-[0_0_30px_rgba(192,255,0,0.35)] hover:scale-105 active:scale-95 transition-all shrink-0 disabled:opacity-50 disabled:grayscale"
            >
              <Send size={20} />
            </button>
          </div>

          {/* БЛОК ВЛОЖЕНИЙ */}
          <div className="w-full" style={{ marginBottom: '54px' }}>
            <div className="text-[11px] font-black text-gray-500 mb-4 px-1 uppercase tracking-widest select-none">Вложения</div>
            <div className="grid grid-cols-2 gap-5 md:gap-6">
              <label className={`relative flex flex-col items-center justify-center gap-2 border transition-all cursor-pointer overflow-hidden active:scale-[0.98] group ${newPostCoverUrl ? 'border-[#c0ff00]/40 shadow-[0_0_30px_rgba(192,255,0,0.15)]' : 'bg-[#14171c] border-white/5 hover:border-white/20 hover:bg-[#1a1e24]'}`} style={{ height: '160px', borderRadius: '32px' }}>
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20" onChange={(e) => handleFileUpload(e, setNewPostCoverUrl, setIsUploadingPostCover)} disabled={isUploadingPostCover} />
                {newPostCoverUrl && <button onClick={(e) => { e.preventDefault(); setNewPostCoverUrl(''); }} className="absolute top-4 right-4 z-30 p-2 bg-black/60 hover:bg-red-500 rounded-full text-white transition-all active:scale-90 backdrop-blur-md"><X size={16}/></button>}
                {newPostCoverUrl && <><div className="absolute inset-0 z-0 bg-cover bg-center opacity-40 blur-md scale-110" style={{ backgroundImage: `url(${newPostCoverUrl})` }} /><div className="absolute inset-0 z-0 bg-gradient-to-t from-[#c0ff00]/20 to-[#090b0e]/50 opacity-80" /></>}
                <div className="relative z-10 flex flex-col items-center pointer-events-none select-none">
                  {isUploadingPostCover ? <RefreshCw className="animate-spin text-[#c0ff00] mb-2" size={24} /> : newPostCoverUrl ? <div className="bg-[#c0ff00] text-black w-12 h-12 rounded-full flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(192,255,0,0.4)]"><Check size={22} strokeWidth={3} /></div> : <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-2 group-hover:bg-white/10 transition-colors"><ImageIcon className="text-gray-400 group-hover:text-white transition-colors" size={22} /></div>}
                  <span className={`text-xs md:text-sm font-bold tracking-wide ${newPostCoverUrl ? 'text-[#c0ff00] drop-shadow-md' : 'text-gray-400 group-hover:text-white transition-colors'}`}>Фото</span>
                </div>
              </label>

              <div onClick={() => setIsYoutubeModalOpen(true)} className={`relative flex flex-col items-center justify-center gap-2 border transition-all cursor-pointer overflow-hidden active:scale-[0.98] group ${newPostYoutubeUrl ? 'border-[#c0ff00]/40 shadow-[0_0_30px_rgba(192,255,0,0.15)] bg-gradient-to-tr from-[#14171c] to-[#c0ff00]/10' : 'bg-[#14171c] border-white/5 hover:border-white/20 hover:bg-[#1a1e24]'}`} style={{ height: '160px', borderRadius: '32px' }}>
                {newPostYoutubeUrl && <button onClick={(e) => { e.stopPropagation(); setNewPostYoutubeUrl(''); }} className="absolute top-4 right-4 z-30 p-2 bg-black/40 hover:bg-red-500 rounded-full text-white transition-all active:scale-90 backdrop-blur-md"><X size={16}/></button>}
                <div className="relative z-10 flex flex-col items-center pointer-events-none select-none">
                  {newPostYoutubeUrl ? <div className="bg-[#c0ff00] text-black w-11 h-11 rounded-full flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(192,255,0,0.4)]"><Check size={22} strokeWidth={3} /></div> : <div className="w-11 h-11 bg-white/5 rounded-full flex items-center justify-center mb-2 group-hover:bg-red-500/20 transition-colors"><Youtube className="text-gray-400 group-hover:text-red-500 transition-colors" size={22} /></div>}
                  <span className={`text-xs md:text-sm font-bold tracking-wide ${newPostYoutubeUrl ? 'text-[#c0ff00] drop-shadow-md' : 'text-gray-400 group-hover:text-white transition-colors'}`}>YouTube</span>
                </div>
              </div>
            </div>
          </div>

          {/* ЗАГОЛОВОК */}
          <div className="w-full px-1" style={{ marginBottom: '44px' }}>
            <input type="text" placeholder="Яркий заголовок..." value={newPostTitle} onChange={e => setNewPostTitle(e.target.value)} className="w-full bg-transparent text-3xl md:text-5xl font-black text-white placeholder-gray-700 border-none outline-none py-1 focus:ring-0" />
          </div>

          {/* Превью вложений */}
          {newPostYoutubeUrl && (
            <div className="w-full rounded-[24px] overflow-hidden bg-black/50 shadow-xl mx-1" style={{ marginBottom: '44px', aspectRatio: '16/9' }}>
              <iframe src={getYoutubeEmbedUrl(newPostYoutubeUrl)!} className="w-full h-full border-none" allowFullScreen style={{ width: '100%', height: '100%' }} />
            </div>
          )}
          {newPostCoverUrl && !newPostYoutubeUrl && (
            <div className="w-full rounded-[24px] overflow-hidden bg-black/50 relative shadow-xl flex justify-center items-center mx-1" style={{ marginBottom: '44px', aspectRatio: '16/9' }}>
              <img src={newPostCoverUrl} alt="Cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          {/* ПАНЕЛЬ ФОРМАТИРОВАНИЯ */}
          <div className="sticky top-[80px] md:top-[20px] z-40 bg-[#1a1e24]/95 backdrop-blur-xl border border-white/10 p-2 rounded-[20px] flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-2xl mb-8 mx-1 select-none" style={{ marginBottom: '40px' }}>
            <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('bold')} className={`p-2.5 rounded-full transition-all active:scale-75 flex-shrink-0 ${formats.bold ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><Bold size={18}/></button>
            <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('italic')} className={`p-2.5 rounded-full transition-all active:scale-75 flex-shrink-0 ${formats.italic ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><Italic size={18}/></button>
            <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('strikeThrough')} className={`p-2.5 rounded-full transition-all active:scale-75 flex-shrink-0 ${formats.strikeThrough ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><Strikethrough size={18}/></button>
            <div className="w-[2px] h-6 bg-white/10 mx-2 flex-shrink-0 rounded-full" />
            <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('formatBlock', 'H1')} className={`p-2.5 rounded-full transition-all active:scale-75 flex-shrink-0 ${formats.h1 ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><Heading1 size={18}/></button>
            <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('formatBlock', 'H2')} className={`p-2.5 rounded-full transition-all active:scale-75 flex-shrink-0 ${formats.h2 ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><Heading2 size={18}/></button>
            <div className="w-[2px] h-6 bg-white/10 mx-2 flex-shrink-0 rounded-full" />
            <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('justifyLeft')} className={`p-2.5 rounded-full transition-all active:scale-75 flex-shrink-0 ${formats.justifyLeft ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><AlignLeft size={18}/></button>
            <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('justifyCenter')} className={`p-2.5 rounded-full transition-all active:scale-75 flex-shrink-0 ${formats.justifyCenter ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><AlignCenter size={18}/></button>
          </div>

          <div className="w-full px-1">
            <div ref={editorRef} contentEditable suppressContentEditableWarning onKeyUp={checkFormatting} onMouseUp={checkFormatting} onInput={checkFormatting} className="w-full min-h-[40vh] bg-transparent text-lg md:text-xl leading-relaxed text-gray-200 outline-none prose prose-invert max-w-none break-words pt-2 pb-10 focus:outline-none" data-placeholder="Текст вашей статьи..." />
          </div>
        </div>
      )}

      {/* --------------------------------------------------------
      ГЛАВНАЯ СТРАНИЦА БЛОГА (ЛЕНТА НОВОСТЕЙ)
      -------------------------------------------------------- */}
      {!isCreatingPost && !selectedPost && (
        <div className="space-y-6 animate-fade-in w-full max-w-3xl mx-auto px-2">
          <div className="flex items-center justify-between w-full select-none">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-wide flex items-center gap-3">
              <Newspaper size={24} className="text-[#c0ff00]" />
              .медиа
            </h2>
            {currentUser && (
              <button onClick={() => setIsCreatingPost(true)} className="hidden md:flex w-12 h-12 bg-[#c0ff00] text-black rounded-full items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(192,255,0,0.25)]">
                <Plus size={26} strokeWidth={2.5} />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-8 pb-8">
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 bg-[#14171c]/50 rounded-[32px] border border-white/5 shadow-inner mt-4 select-none">
                <div className="w-20 h-20 bg-black/40 border border-white/5 rounded-full flex items-center justify-center mb-5 shadow-lg flex-shrink-0">
                  <Newspaper size={32} className="text-gray-500" />
                </div>
                <h3 className="text-lg font-black text-white mb-2 tracking-wide">Здесь пока пусто</h3>
                <p className="text-sm text-gray-400 text-center max-w-[250px]">Станьте первым, кто опубликует новость!</p>
              </div>
            ) : (
              posts.map(post => (
                <div 
                  key={post.id} 
                  onClick={() => handleOpenPost(post)} 
                  className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden shadow-2xl transition-all hover:border-white/10 group cursor-pointer flex flex-col pt-2 relative"
                >
                  {/* Автор + Управление */}
                  <div className="p-5 md:p-6 pb-2 flex items-center justify-between select-none">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-black/50 border border-white/10 flex-shrink-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); if(post.author) onProfileClick(post.author); }}>
                        <img src={post.author?.avatar_url || 'https://via.placeholder.com/150'} alt="author" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-bold text-white tracking-wide truncate">{post.author?.rp_name || 'Неизвестный'}</div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-0.5">
                          <Clock size={12} /> 
                          {new Date(post.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                        </div>
                      </div>
                    </div>

                    {canManagePost(post) && (
                      <div className="relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id); }}
                          className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
                        >
                          <MoreVertical size={20} />
                        </button>
                        {activeMenuPostId === post.id && (
                          <div className="absolute right-0 mt-2 w-40 bg-[#1a1e24] border border-white/10 rounded-2xl p-1.5 z-30 shadow-2xl animate-fade-in flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => { setEditingPostId(post.id); setIsCreatingPost(true); setActiveMenuPostId(null); }} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl text-sm font-bold text-gray-200 hover:text-[#c0ff00] transition-colors">Редактировать</button>
                            <button onClick={() => handleDeletePost(post.id)} className="w-full text-left px-3 py-2 hover:bg-red-500/10 rounded-xl text-sm font-bold text-red-400 hover:text-red-300 transition-colors">Удалить</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Медиа 16:9 */}
                  {post.youtube_url && (
                    <div className="px-5 md:px-6 w-full mb-2">
                      <div className="w-full relative h-0 rounded-2xl overflow-hidden bg-black/50 shadow-md" style={{ paddingBottom: '56.25%' }}>
                        <iframe src={getYoutubeEmbedUrl(post.youtube_url)!} className="absolute inset-0 w-full h-full border-none" allowFullScreen />
                      </div>
                    </div>
                  )}
                  {post.cover_url && !post.youtube_url && (
                    <div className="px-5 md:px-6 w-full mb-2">
                      <div className="w-full relative h-0 rounded-2xl overflow-hidden bg-black/50 shadow-md" style={{ paddingBottom: '56.25%' }}>
                        <img src={post.cover_url} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                    </div>
                  )}

                  {/* Описание + Кнопки */}
                  <div className="p-5 md:p-6 pt-4 flex flex-col gap-4 flex-grow">
                    <div>
                      <h3 className="text-2xl font-black text-white mb-2 leading-tight truncate">{post.title}</h3>
                      <div className="prose prose-invert max-w-none text-gray-400 text-sm leading-relaxed break-words line-clamp-1 overflow-hidden" dangerouslySetInnerHTML={{ __html: post.content }} />
                    </div>

                    {/* Раздел кнопок лайков и комментариев */}
                    <div className="flex items-center justify-start gap-3 bg-transparent select-none" onClick={(e) => e.stopPropagation()}>
                      <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/10 border border-white/5 rounded-full text-gray-400 hover:text-red-400 transition-all active:scale-95 text-xs font-bold font-mono">
                        <Heart size={15} />
                        <span>0</span>
                      </button>
                      <button onClick={() => handleOpenPost(post)} className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-[#c0ff00]/10 border border-white/5 rounded-full text-gray-400 hover:text-[#c0ff00] transition-all active:scale-95 text-xs font-bold font-mono">
                        <MessageCircle size={15} />
                        <span>0</span>
                      </button>
                      <button 
                        onClick={(e) => handleSharePost(e, post.id)} 
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-[#c0ff00]/10 border border-white/5 rounded-full text-gray-400 hover:text-[#c0ff00] transition-all active:scale-95 text-xs font-bold font-mono min-w-[100px]"
                      >
                        <Share2 size={15} />
                        <span>{copiedPostId === post.id ? 'Ссылка у вас!' : 'Поделиться'}</span>
                      </button>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* МОБИЛЬНАЯ КНОПКА СОЗДАНИЯ ПОСТА */}
      {currentUser && !isCreatingPost && !selectedPost && (
        <button 
          onClick={() => setIsCreatingPost(true)}
          className="md:hidden fixed bottom-[90px] right-5 w-14 h-14 bg-[#c0ff00] text-black rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(192,255,0,0.35)] z-40 active:scale-90 transition-transform"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      )}
    </>
  );
}
