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
  published_at: string | null;
  author?: Player;
}

interface MediaBlogProps {
  currentUser: Player | null;
  onProfileClick: (player: Player) => void;
  isCreatingPost: boolean;
  setIsCreatingPost: (val: boolean) => void;
}

export default function MediaBlog({ currentUser, onProfileClick, isCreatingPost, setIsCreatingPost }: MediaBlogProps) {
  const POSTS_PER_PAGE = 4;
  
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
  const [newPostPublishedAtInput, setNewPostPublishedAtInput] = useState<string>(''); 

  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const editorRef = useRef<HTMLDivElement>(null);
  const [formats, setFormats] = useState({
    bold: false, italic: false, strikeThrough: false, h1: false, h2: false, justifyLeft: false, justifyCenter: false
  });

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const stripHtml = (html: string) => {
    if (typeof document === 'undefined') return html.replace(/<[^>]*>?/gm, '');
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const formatPillDate = (val: string) => {
    if (!val) return 'Дата';
    try {
      return new Date(val).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Дата';
    }
  };

  const fetchPosts = async (page: number, append: boolean = false) => {
    const from = (page - 1) * POSTS_PER_PAGE;
    const to = page * POSTS_PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from('posts')
      .select('*, author:users(*)', { count: 'exact' })
      .order('published_at', { ascending: false })
      .range(from, to);

    if (data && !error) {
      if (append) {
        setPosts(prev => [...prev, ...data]);
      } else {
        setPosts(data);
      }
      if (count !== null) setTotalCount(count);
      return data;
    }
    return [];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, setUrlCallback: (url: string) => void, setLoadingState: (loading: boolean) => void) => {
    try {
      setLoadingState(true);
      const file = event.target.files?.[0];
      if (!file) return;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const { error } = await supabase.storage.from('avatars').upload(fileName, file);
      if (error) return alert(`Ошибка загрузки: ${error.message}`);
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      if (urlData) setUrlCallback(urlData.publicUrl);
    } catch (e: any) {
      alert(`Сбой при загрузке: ${e.message}`);
    } finally {
      setLoadingState(false);
    }
  };

  useEffect(() => {
    const initBlog = async () => {
      const fetched = await fetchPosts(1, false);

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const postIdFromUrl = params.get('post');
        if (postIdFromUrl) {
          const targetPost = fetched.find(p => p.id === postIdFromUrl);
          if (targetPost) {
            setSelectedPost(targetPost);
          } else {
            const { data } = await supabase.from('posts').select('*, author:users(*)').eq('id', postIdFromUrl).single();
            if (data) setSelectedPost(data);
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
      setNewPostPublishedAtInput('');
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
        if (postToEdit.published_at) {
          const date = new Date(postToEdit.published_at);
          date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
          setNewPostPublishedAtInput(date.toISOString().slice(0, 16));
        }
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
    return post.author_id === currentUser.id || currentUser.roles?.includes('admin');
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Вы действительно хотите удалить эту публикацию?')) return;
    
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (!error) {
      setActiveMenuPostId(null);
      handleClosePost();
      fetchPosts(currentPage, false);
    } else {
      alert(`Ошибка при удалении: ${error.message}`);
    }
  };

  const checkFormatting = () => {
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
  };

  const execEditorCommand = (command: string, value: string = '') => {
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
  };

  const publishPost = async () => {
    const postContent = editorRef.current?.innerHTML || '';
    if (!newPostTitle.trim() || !postContent.trim() || postContent === '<br>' || !currentUser) {
      alert('Заголовок и текст не могут быть пустыми!');
      return;
    }

    let finalPublishedAt = newPostPublishedAtInput ? new Date(newPostPublishedAtInput).toISOString() : new Date().toISOString();

    const postData = {
      author_id: currentUser.id,
      title: newPostTitle,
      content: postContent,
      cover_url: newPostCoverUrl || null,
      youtube_url: newPostYoutubeUrl || null,
      published_at: finalPublishedAt
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
      setCurrentPage(1);
      fetchPosts(1, false); 
    } else {
      alert(`Ошибка сохранения: ${error.message}`);
    }
  };

  const loadMorePosts = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchPosts(nextPage, true);
  };

  const handlePageSelect = (pageIdx: number) => {
    setCurrentPage(pageIdx);
    fetchPosts(pageIdx, false);
  };

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  // --------------------------------------------------------
  // СТРАНИЦА ПРОСМОТРА ПОЛНОГО ПОСТА
  // --------------------------------------------------------
  if (selectedPost) {
    return (
      <div className="w-full max-w-3xl mx-auto animate-fade-in pb-32 px-4 md:px-0 flex flex-col">
        
        {/* Кнопка Назад */}
        <div className="w-full select-none flex" style={{ paddingTop: '20px', marginBottom: '44px' }}>
          <button 
            onClick={handleClosePost} 
            className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all active:scale-90 shadow-lg shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Главная карточка поста */}
        <div className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden shadow-2xl flex flex-col pt-2 relative">
          
          <div className="p-5 md:p-6 pb-2 flex items-center justify-between select-none">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-black/50 border border-white/10 flex-shrink-0 cursor-pointer" onClick={() => onProfileClick(selectedPost.author!)}>
                <img src={selectedPost.author?.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold text-white truncate">{selectedPost.author?.rp_name || 'Неизвестный'}</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">
                  <Clock size={12} className="inline mr-1" />
                  {selectedPost.published_at ? new Date(selectedPost.published_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
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

          {/* Медиа 16:9 */}
          {selectedPost.youtube_url && (
            <div className="px-5 md:px-6 w-full mb-4">
              <div className="w-full relative h-0 rounded-2xl overflow-hidden bg-black/50 shadow-md" style={{ paddingBottom: '56.25%' }}>
                <iframe src={getYoutubeEmbedUrl(selectedPost.youtube_url)!} className="absolute inset-0 w-full h-full border-none" allowFullScreen loading="lazy" />
              </div>
            </div>
          )}
          {selectedPost.cover_url && !selectedPost.youtube_url && (
            <div className="px-5 md:px-6 w-full mb-4">
              <div onClick={() => setIsImageZoomOpen(true)} className="w-full relative h-0 rounded-2xl overflow-hidden bg-black/50 shadow-md cursor-zoom-in" style={{ paddingBottom: '56.25%' }}>
                <img src={selectedPost.cover_url} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              </div>
            </div>
          )}

          <div className="p-5 md:p-6 pt-2 flex flex-col gap-5 flex-grow">
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-white mb-6 leading-tight">{selectedPost.title}</h1>
              <div className="prose prose-invert max-w-none text-gray-300 text-base leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
            </div>

            <div className="flex items-center justify-start gap-3 mt-2 select-none">
              <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full text-gray-400 hover:text-red-400 transition-all active:scale-95 text-xs font-bold font-mono">
                <Heart size={15} /> <span>0</span>
              </button>
              <button 
                onClick={(e) => handleSharePost(e, selectedPost.id)} 
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full text-gray-400 hover:text-[#c0ff00] transition-all active:scale-95 text-xs font-bold font-mono min-w-[90px]"
              >
                <Share2 size={15} /> <span>{copiedPostId === selectedPost.id ? 'Скопировано!' : 'Ссылка'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* БЛОК КОММЕНТАРИЕВ */}
        <div className="bg-[#14171c]/60 backdrop-blur-xl border border-white/5 rounded-[32px] p-5 md:p-6 shadow-xl" style={{ marginTop: '56px' }}>
          <h3 className="text-lg font-black text-white mb-5 flex items-center gap-2 select-none">
            <MessageCircle size={20} className="text-[#c0ff00]" /> <span>Комментарии</span>
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

        {/* PROSМОТР ФУЛЛ КАРТИНКИ */}
        {isImageZoomOpen && selectedPost.cover_url && (
          <div onClick={() => setIsImageZoomOpen(false)} className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fade-in">
            <button className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white"><X size={24} /></button>
            <img src={selectedPost.cover_url} alt="Full view" className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" />
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------
  // ПОЛНОЭКРАННЫЙ РЕДАКТОР ПОСТА
  // --------------------------------------------------------
  if (isCreatingPost && !selectedPost) {
    return (
      <div className="w-full max-w-3xl mx-auto animate-fade-in pb-40 px-4 md:px-0 flex flex-col pt-6">
        
        <div className="flex items-center justify-between w-full select-none" style={{ marginBottom: '48px' }}>
          <button onClick={() => setIsCreatingPost(false)} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-gray-300 hover:text-white transition-all active:scale-95 shadow-sm shrink-0"><ArrowLeft size={20} /></button>
          <button onClick={publishPost} disabled={isUploadingPostCover || !newPostTitle.trim()} className="w-12 h-12 flex items-center justify-center bg-[#c0ff00] text-black rounded-full shadow-[0_0_30px_rgba(192,255,0,0.35)] hover:scale-105 active:scale-95 transition-all shrink-0"><Send size={20} /></button>
        </div>

        {/* ЖЕЛЕЗОБЕТОННЫЙ РЯД ПИЛЮЛЬ: Все настройки и вложения собраны в одну аккуратную строчку */}
        <div className="w-full" style={{ marginBottom: '54px' }}>
          <div className="text-[11px] font-black text-gray-500 mb-3 px-1 uppercase tracking-widest select-none">Параметры публикации</div>
          <div className="flex flex-wrap items-center gap-3">
            
            {/* ИСПРАВЛЕНО: Дата теперь пилюля в одном ряду */}
            <label className={`relative flex items-center gap-2 border px-4 py-2 rounded-full cursor-pointer transition-all active:scale-95 text-xs font-bold select-none ${newPostPublishedAtInput ? 'border-[#c0ff00]/40 bg-[#c0ff00]/10 text-[#c0ff00]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}>
              <Clock size={14} />
              <span>{formatPillDate(newPostPublishedAtInput)}</span>
              <input 
                type="datetime-local" 
                value={newPostPublishedAtInput} 
                onChange={e => setNewPostPublishedAtInput(e.target.value)} 
                style={{ colorScheme: 'dark' }} 
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
              />
              {newPostPublishedAtInput && (
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setNewPostPublishedAtInput(''); }} 
                  className="ml-1.5 p-0.5 hover:bg-red-500/20 rounded-full text-gray-400 hover:text-red-400 transition-colors z-20"
                >
                  <X size={12} />
                </button>
              )}
            </label>
            
            {/* Пилюля Фото без встроенного превью */}
            <label className={`relative flex items-center gap-2 border px-4 py-2 rounded-full cursor-pointer transition-all active:scale-95 text-xs font-bold select-none ${newPostCoverUrl ? 'border-[#c0ff00]/40 bg-[#c0ff00]/10 text-[#c0ff00]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}>
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" onChange={(e) => handleFileUpload(e, setNewPostCoverUrl, setIsUploadingPostCover)} disabled={isUploadingPostCover} />
              {isUploadingPostCover ? <RefreshCw className="animate-spin" size={14} /> : <ImageIcon size={14} />}
              <span>Фото</span>
              {newPostCoverUrl && (
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setNewPostCoverUrl(''); }} 
                  className="ml-1.5 p-0.5 hover:bg-red-500/20 rounded-full text-gray-400 hover:text-red-400 transition-colors z-20"
                >
                  <X size={12} />
                </button>
              )}
            </label>

            {/* Пилюля YouTube */}
            <button 
              onClick={() => setIsYoutubeModalOpen(true)} 
              className={`flex items-center gap-2 border px-4 py-2 rounded-full cursor-pointer transition-all active:scale-95 text-xs font-bold select-none ${newPostYoutubeUrl ? 'border-[#c0ff00]/40 bg-[#c0ff00]/10 text-[#c0ff00]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
            >
              <Youtube size={14} />
              <span>YouTube</span>
              {newPostYoutubeUrl && (
                <span 
                  onClick={(e) => { e.stopPropagation(); setNewPostYoutubeUrl(''); }} 
                  className="ml-1.5 p-0.5 hover:bg-red-500/20 rounded-full text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X size={12} />
                </span>
              )}
            </button>
          </div>
        </div>

        <input type="text" placeholder="Яркий заголовок..." value={newPostTitle} onChange={e => setNewPostTitle(e.target.value)} className="w-full bg-transparent text-3xl md:text-5xl font-black text-white border-none outline-none py-1 focus:ring-0 placeholder:text-gray-700 mb-8" />
        
        {/* Полноразмерный качественный предпросмотр вложений ниже */}
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

        {/* Панель редактора */}
        <div className="sticky top-[80px] md:top-[20px] z-40 bg-[#1a1e24]/95 backdrop-blur-xl border border-white/10 p-2 rounded-[20px] flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-2xl mb-8 mx-1 select-none">
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('bold')} className={`p-2.5 rounded-full transition-all ${formats.bold ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400 hover:text-white'}`}><Bold size={18}/></button>
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('italic')} className={`p-2.5 rounded-full transition-all ${formats.italic ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400 hover:text-white'}`}><Italic size={18}/></button>
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('strikeThrough')} className={`p-2.5 rounded-full transition-all ${formats.strikeThrough ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400 hover:text-white'}`}><Strikethrough size={18}/></button>
          <div className="w-[2px] h-6 bg-white/10 mx-2 flex-shrink-0" />
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('formatBlock', 'H1')} className={`p-2.5 rounded-full transition-all ${formats.h1 ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400 hover:text-white'}`}><Heading1 size={18}/></button>
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('formatBlock', 'H2')} className={`p-2.5 rounded-full transition-all ${formats.h2 ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400 hover:text-white'}`}><Heading2 size={18}/></button>
          <div className="w-[2px] h-6 bg-white/10 mx-2 flex-shrink-0" />
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('justifyLeft')} className={`p-2.5 rounded-full transition-all ${formats.justifyLeft ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400 hover:text-white'}`}><AlignLeft size={18}/></button>
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('justifyCenter')} className={`p-2.5 rounded-full transition-all ${formats.justifyCenter ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'text-gray-400 hover:text-white'}`}><AlignCenter size={18}/></button>
        </div>

        <div ref={editorRef} contentEditable className="w-full min-h-[40vh] bg-transparent text-lg text-gray-200 outline-none prose prose-invert max-w-none break-words pt-2 pb-10 focus:outline-none" data-placeholder="Текст вашей статьи..." />
        
        {isYoutubeModalOpen && (
          <div className="fixed inset-0 z-[99999] bg-[#090b0e]/95 backdrop-blur-xl flex items-center justify-center px-4 animate-fade-in">
            <div className="bg-[#14171c] border border-white/10 p-6 md:p-8 rounded-[32px] w-full max-w-md shadow-2xl relative flex flex-col gap-6">
              <button onClick={() => setIsYoutubeModalOpen(false)} className="absolute top-5 right-5 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all active:scale-90"><X size={20}/></button>
              <div className="flex items-center gap-3 select-none"><div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500"><Youtube size={24} /></div><h3 className="text-xl font-black text-white">Видео с YouTube</h3></div>
              <input type="text" placeholder="Вставьте ссылку..." value={newPostYoutubeUrl} onChange={e => setNewPostYoutubeUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-medium text-white outline-none focus:border-red-500/50 transition-all placeholder:text-gray-600" />
              <button onClick={() => setIsYoutubeModalOpen(false)} className="w-full bg-[#c0ff00] text-black font-black text-sm uppercase tracking-wider py-4 rounded-2xl active:scale-95 transition-all shadow-md">Сохранить ссылку</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------
  // ГЛАВНАЯ СТРАНИЦА БЛОГА (ЛЕНТА НОВОСТЕЙ)
  // --------------------------------------------------------
  return (
    <>
      <div className="space-y-6 animate-fade-in w-full max-w-3xl mx-auto px-2">
        <div className="flex items-center justify-between w-full select-none">
          <h2 className="text-xl md:text-2xl font-black text-white tracking-wide flex items-center gap-3">
            <Newspaper size={24} className="text-[#c0ff00]" />
            .медиа
          </h2>
          {currentUser && (
            <button onClick={() => setIsCreatingPost(true)} className="w-12 h-12 bg-[#c0ff00] text-black rounded-full flex items-center justify-center shadow-lg active:scale-90"><Plus size={26} /></button>
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
                <div className="p-5 md:p-6 pb-2 flex items-center justify-between select-none">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-black/50 border border-white/10 flex-shrink-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); if(post.author) onProfileClick(post.author); }}>
                      <img src={post.author?.avatar_url || 'https://via.placeholder.com/150'} alt="author" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold text-white tracking-wide truncate">{post.author?.rp_name || 'Неизвестный'}</div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-0.5">
                        <Clock size={12} /> 
                        {post.published_at ? new Date(post.published_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
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
                      <iframe src={getYoutubeEmbedUrl(post.youtube_url)!} className="absolute inset-0 w-full h-full border-none" allowFullScreen loading="lazy" />
                    </div>
                  </div>
                )}
                {post.cover_url && !post.youtube_url && (
                  <div className="px-5 md:px-6 w-full mb-2">
                    <div className="w-full relative h-0 rounded-2xl overflow-hidden bg-black/50 shadow-md" style={{ paddingBottom: '56.25%' }}>
                      <img src={post.cover_url} alt="cover" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    </div>
                  </div>
                )}

                <div className="p-5 md:p-6 pt-4 flex flex-col gap-4 flex-grow">
                  <div>
                    <h3 className="text-2xl font-black text-white mb-2 leading-tight truncate">{post.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed truncate">
                      {stripHtml(post.content)}
                    </p>
                  </div>

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

        {/* СИСТЕМА 1: КНОПКА «ПОКАЗАТЬ ЕЩЕ» */}
        {totalCount > posts.length && (
          <div className="flex justify-center mt-4 mb-6 select-none">
            <button onClick={loadMorePosts} className="flex items-center justify-center gap-2 px-6 py-3 bg-[#14171c]/90 border border-white/10 hover:border-[#c0ff00]/30 rounded-full text-xs font-bold text-gray-400 hover:text-white transition-all active:scale-95 shadow-xl">
              <RefreshCw size={14} className="animate-pulse text-[#c0ff00]" />
              <span>Показать еще</span>
            </button>
          </div>
        )}

        {/* СИСТЕМА 2: СТАНДАРТНЫЕ НОМЕРА СТРАНИЦ */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 select-none" style={{ marginTop: '24px' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button 
                key={pageNum}
                onClick={() => handlePageSelect(pageNum)}
                className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-black transition-all ${currentPage === pageNum ? 'bg-[#c0ff00] text-black shadow-md scale-105' : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'}`}
              >
                {pageNum}
              </button>
            ))}
          </div>
        )}
      </div>

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
