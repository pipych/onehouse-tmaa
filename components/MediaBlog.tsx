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
      const fetchedPosts = await loadPosts();
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const postIdFromUrl = params.get('post');
        if (postIdFromUrl) {
          const targetPost = fetchedPosts.find(p => p.id === postIdFromUrl);
          if (targetPost) setSelectedPost(targetPost);
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
      setTimeout(() => setCopiedPostId(null), 2000);
    }
  };

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
      loadPosts();
    }
  };

  const publishPost = async () => {
    const postContent = editorRef.current?.innerHTML || '';
    if (!newPostTitle.trim() || !postContent.trim() || !currentUser) return alert('Заголовок и текст не могут быть пустыми!');
    
    const postData = { author_id: currentUser.id, title: newPostTitle, content: postContent, cover_url: newPostCoverUrl || null, youtube_url: newPostYoutubeUrl || null };

    if (editingPostId) await supabase.from('posts').update(postData).eq('id', editingPostId);
    else await supabase.from('posts').insert([postData]);
    
    setIsCreatingPost(false);
    setEditingPostId(null);
    loadPosts();
  };

  // --- ЭКРАН ПОЛНОГО ПОСТА ---
  if (selectedPost) {
    return (
      <div className="w-full max-w-3xl mx-auto animate-fade-in pb-32 px-4 md:px-0 flex flex-col relative">
        
        {/* Кнопка НАЗАД с ГАРАНТИРОВАННЫМ отступом через padding-bottom */}
        <div className="w-full pt-4 pb-12 select-none">
          <button 
            onClick={handleClosePost} 
            className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all active:scale-90 shadow-lg"
          >
            <ArrowLeft size={22} />
          </button>
        </div>

        {/* Карточка поста */}
        <div className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden shadow-2xl flex flex-col pt-2">
          
          <div className="p-5 md:p-6 pb-2 flex items-center justify-between select-none">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-black/50 border border-white/10 flex-shrink-0 cursor-pointer" onClick={() => onProfileClick(selectedPost.author!)}>
                <img src={selectedPost.author?.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold text-white truncate">{selectedPost.author?.rp_name || 'Неизвестный'}</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">
                  <Clock size={10} className="inline mr-1" />
                  {new Date(selectedPost.created_at).toLocaleDateString('ru-RU')}
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
            <div className="px-5 md:px-6 w-full mb-2">
              <div className="w-full relative h-0 rounded-2xl overflow-hidden bg-black/50" style={{ paddingBottom: '56.25%' }}>
                <iframe src={getYoutubeEmbedUrl(selectedPost.youtube_url)!} className="absolute inset-0 w-full h-full border-none" allowFullScreen />
              </div>
            </div>
          )}
          {selectedPost.cover_url && !selectedPost.youtube_url && (
            <div className="px-5 md:px-6 w-full mb-2">
              <div onClick={() => setIsImageZoomOpen(true)} className="w-full relative h-0 rounded-2xl overflow-hidden bg-black/50 cursor-zoom-in" style={{ paddingBottom: '56.25%' }}>
                <img src={selectedPost.cover_url} className="absolute inset-0 w-full h-full object-cover" />
              </div>
            </div>
          )}

          <div className="p-5 md:p-6 pt-2 flex flex-col gap-5">
            <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">{selectedPost.title}</h1>
            <div className="prose prose-invert max-w-none text-gray-300 text-base leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
            
            {/* Лайки и Ссылка */}
            <div className="flex items-center justify-start gap-3 mt-2 select-none">
              <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full text-gray-400 hover:text-red-400 transition-all text-xs font-bold">
                <Heart size={15} /> <span>0</span>
              </button>
              <button onClick={(e) => handleSharePost(e, selectedPost.id)} className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full text-gray-400 hover:text-[#c0ff00] transition-all text-xs font-bold">
                <Share2 size={15} /> <span>{copiedPostId === selectedPost.id ? 'Скопировано' : 'Ссылка'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Комментарии */}
        <div className="bg-[#14171c]/60 backdrop-blur-xl border border-white/5 rounded-[32px] p-5 md:p-6 shadow-xl" style={{ marginTop: '56px' }}>
          <h3 className="text-lg font-black text-white mb-5 flex items-center gap-2 select-none">
            <MessageCircle size={20} className="text-[#c0ff00]" /> <span>Комментарии</span>
          </h3>
          <div className="flex gap-3 items-center">
            <input type="text" placeholder="Напишите свое мнение..." className="w-full bg-black/30 border border-white/10 rounded-full p-4 px-6 text-sm text-white outline-none focus:border-[#c0ff00]/40 transition-all" />
            <button className="w-12 h-12 rounded-full flex items-center justify-center bg-[#c0ff00] hover:bg-[#a6e600] text-black shadow-lg shrink-0 transition-transform active:scale-90">
              <Send size={18} />
            </button>
          </div>
          <div className="text-center py-10 text-sm text-gray-500 font-medium select-none">Здесь пока нет обсуждений. Станьте первым!</div>
        </div>

        {/* Zoom обложки */}
        {isImageZoomOpen && selectedPost.cover_url && (
          <div onClick={() => setIsImageZoomOpen(false)} className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in cursor-zoom-out">
            <button className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white"><X size={24} /></button>
            <img src={selectedPost.cover_url} className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" />
          </div>
        )}
      </div>
    );
  }

  // --- ЭКРАН РЕДАКТИРОВАНИЯ/СОЗДАНИЯ ---
  if (isCreatingPost && !selectedPost) {
    return (
      <div className="w-full max-w-3xl mx-auto animate-fade-in pb-40 px-4 md:px-0 flex flex-col pt-6">
        <div className="flex items-center justify-between w-full mb-10 select-none">
          <button onClick={() => setIsCreatingPost(false)} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-gray-300 hover:text-white transition-all active:scale-90"><ArrowLeft size={20} /></button>
          <button onClick={publishPost} disabled={isUploadingPostCover || !newPostTitle.trim()} className="w-12 h-12 flex items-center justify-center bg-[#c0ff00] text-black rounded-full shadow-lg active:scale-90 disabled:opacity-50"><Send size={20} /></button>
        </div>

        <div className="text-[11px] font-black text-gray-500 mb-4 px-1 uppercase tracking-widest select-none">Вложения</div>
        <div className="grid grid-cols-2 gap-5 mb-10">
          <label className={`relative flex flex-col items-center justify-center gap-2 border transition-all cursor-pointer overflow-hidden group ${newPostCoverUrl ? 'border-[#c0ff00]/40' : 'bg-[#14171c] border-white/5'}`} style={{ height: '160px', borderRadius: '32px' }}>
            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={(e) => handleFileUpload(e, setNewPostCoverUrl, setIsUploadingPostCover)} disabled={isUploadingPostCover} />
            {newPostCoverUrl ? (
              <img src={newPostCoverUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" />
            ) : (
              <div className="flex flex-col items-center"><ImageIcon className="text-gray-400 mb-2" size={24} /><span className="text-xs font-bold text-gray-400">Фото</span></div>
            )}
          </label>
          <div onClick={() => setIsYoutubeModalOpen(true)} className={`relative flex flex-col items-center justify-center gap-2 border transition-all cursor-pointer bg-[#14171c] border-white/5 ${newPostYoutubeUrl ? 'border-[#c0ff00]/40' : ''}`} style={{ height: '160px', borderRadius: '32px' }}>
            <Youtube className={newPostYoutubeUrl ? 'text-[#c0ff00]' : 'text-gray-400'} size={24} />
            <span className="text-xs font-bold text-gray-400">YouTube</span>
          </div>
        </div>

        <input type="text" placeholder="Яркий заголовок..." value={newPostTitle} onChange={e => setNewPostTitle(e.target.value)} className="w-full bg-transparent text-3xl md:text-5xl font-black text-white placeholder-gray-800 border-none outline-none mb-8 focus:ring-0" />
        <div ref={editorRef} contentEditable className="w-full min-h-[40vh] bg-transparent text-lg text-gray-200 outline-none prose prose-invert max-w-none pt-2 focus:outline-none" data-placeholder="Текст вашей статьи..." />
      </div>
    );
  }

  // --- ГЛАВНАЯ ЛЕНТА ---
  return (
    <div className="space-y-6 animate-fade-in w-full max-w-3xl mx-auto px-2">
      <div className="flex items-center justify-between w-full select-none mb-2">
        <h2 className="text-xl md:text-2xl font-black text-white tracking-wide flex items-center gap-3">
          <Newspaper size={24} className="text-[#c0ff00]" /> .медиа
        </h2>
        {currentUser && <button onClick={() => setIsCreatingPost(true)} className="w-12 h-12 bg-[#c0ff00] text-black rounded-full flex items-center justify-center shadow-lg active:scale-90"><Plus size={26} /></button>}
      </div>

      <div className="flex flex-col gap-8 pb-10">
        {posts.map(post => (
          <div key={post.id} onClick={() => handleOpenPost(post)} className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden shadow-2xl transition-all hover:border-white/10 group cursor-pointer pt-2">
            <div className="p-5 md:p-6 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src={post.author?.avatar_url || 'https://via.placeholder.com/150'} className="w-12 h-12 rounded-full object-cover" />
                <div className="min-w-0">
                  <div className="text-base font-bold text-white truncate">{post.author?.rp_name}</div>
                  <div className="text-xs text-gray-500 font-medium">{new Date(post.created_at).toLocaleDateString('ru-RU')}</div>
                </div>
              </div>
            </div>

            {post.cover_url && (
              <div className="px-5 md:px-6 w-full mb-2">
                <div className="w-full relative h-0 rounded-2xl overflow-hidden bg-black/50" style={{ paddingBottom: '56.25%' }}>
                  <img src={post.cover_url} className="absolute inset-0 w-full h-full object-cover" />
                </div>
              </div>
            )}

            <div className="p-5 md:p-6 pt-2">
              <h3 className="text-xl font-black text-white mb-2 truncate">{post.title}</h3>
              <p className="text-gray-400 text-sm truncate">{stripHtml(post.content)}</p>
              <div className="flex gap-3 mt-4">
                <div className="px-3 py-1.5 bg-white/5 rounded-full text-xs font-bold text-gray-400 flex items-center gap-1.5"><Heart size={12} /> 0</div>
                <div className="px-3 py-1.5 bg-white/5 rounded-full text-xs font-bold text-gray-400 flex items-center gap-1.5"><MessageCircle size={12} /> 0</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isYoutubeModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#14171c] border border-white/10 p-8 rounded-[32px] w-full max-w-md flex flex-col gap-6 relative">
            <button onClick={() => setIsYoutubeModalOpen(false)} className="absolute top-6 right-6 text-gray-400"><X size={20} /></button>
            <h3 className="text-xl font-black text-white">Видео YouTube</h3>
            <input type="text" placeholder="Ссылка..." value={newPostYoutubeUrl} onChange={e => setNewPostYoutubeUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-red-500" />
            <button onClick={() => setIsYoutubeModalOpen(false)} className="w-full bg-[#c0ff00] text-black font-black py-4 rounded-2xl active:scale-95">Сохранить</button>
          </div>
        </div>
      )}
    </div>
  );
}
