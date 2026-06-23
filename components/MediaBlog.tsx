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
    }
  };

  const publishPost = async () => {
    const postContent = editorRef.current?.innerHTML || '';
    if (!newPostTitle.trim() || !postContent.trim() || postContent === '<br>' || !currentUser) return alert('Заголовок и текст не могут быть пустыми!');
    
    const postData = { author_id: currentUser.id, title: newPostTitle, content: postContent, cover_url: newPostCoverUrl || null, youtube_url: newPostYoutubeUrl || null };

    if (editingPostId) {
      await supabase.from('posts').update(postData).eq('id', editingPostId);
    } else {
      await supabase.from('posts').insert([postData]);
    }
    setIsCreatingPost(false);
    setEditingPostId(null);
    loadPosts();
  };

  // --- Рендер ---
  if (selectedPost) {
    return (
      <div className="w-full max-w-3xl mx-auto animate-fade-in pb-32 px-4 md:px-0 flex flex-col">
        {/* Кнопка Назад с жестким внешним отступом mb-6 */}
        <div className="mb-6 select-none">
          <button onClick={handleClosePost} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-sm">
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden shadow-2xl flex flex-col pt-2 relative">
          <div className="p-5 md:p-6 pb-2 flex items-center justify-between select-none">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-black/50 border border-white/10 flex-shrink-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); if(selectedPost.author) onProfileClick(selectedPost.author); }}>
                <img src={selectedPost.author?.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold text-white truncate">{selectedPost.author?.rp_name || 'Неизвестный'}</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">{new Date(selectedPost.created_at).toLocaleDateString('ru-RU')}</div>
              </div>
            </div>
            {canManagePost(selectedPost) && (
              <button onClick={(e) => { e.stopPropagation(); setActiveMenuPostId(activeMenuPostId === selectedPost.id ? null : selectedPost.id); }} className="p-2 text-gray-400 hover:text-white transition-colors"><MoreVertical size={20} /></button>
            )}
          </div>

          {/* Media 16:9 контейнеры */}
          {selectedPost.youtube_url && (
            <div className="px-5 md:px-6 w-full mb-4">
              <div className="w-full relative h-0 rounded-2xl overflow-hidden bg-black/50 shadow-md" style={{ paddingBottom: '56.25%' }}>
                <iframe src={getYoutubeEmbedUrl(selectedPost.youtube_url)!} className="absolute inset-0 w-full h-full border-none" allowFullScreen />
              </div>
            </div>
          )}
          {selectedPost.cover_url && !selectedPost.youtube_url && (
            <div className="px-5 md:px-6 w-full mb-4">
              <div onClick={() => setIsImageZoomOpen(true)} className="w-full relative h-0 rounded-2xl overflow-hidden bg-black/50 shadow-md cursor-zoom-in" style={{ paddingBottom: '56.25%' }}>
                <img src={selectedPost.cover_url} className="absolute inset-0 w-full h-full object-cover" />
              </div>
            </div>
          )}

          <div className="p-6 md:p-8 pt-2">
            <h1 className="text-2xl md:text-4xl font-black text-white mb-6 leading-tight">{selectedPost.title}</h1>
            <div className="prose prose-invert max-w-none text-gray-300 text-base" dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
          </div>

          {/* Кнопки лайков налево + Отступ */}
          <div className="px-6 pb-6 pt-2 flex items-center justify-start gap-3 select-none">
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full text-gray-400 hover:text-red-400 transition-all text-xs font-bold font-mono">
              <Heart size={15} /> <span>0</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full text-gray-400 hover:text-[#c0ff00] transition-all text-xs font-bold font-mono">
              <Share2 size={15} /> <span>Поделиться</span>
            </button>
          </div>
        </div>

        {/* БЛОК КОММЕНТАРИЕВ (c mt-14) */}
        <div className="bg-[#14171c]/60 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 shadow-xl" style={{ marginTop: '56px' }}>
          <h3 className="text-lg font-black text-white mb-5 flex items-center gap-2">
            <MessageCircle size={20} className="text-[#c0ff00]" /> Комментарии
          </h3>
          <div className="flex gap-3 items-center">
            <input type="text" placeholder="Напишите свое мнение..." className="w-full bg-black/30 border border-white/10 rounded-full p-4 text-sm text-white focus:border-[#c0ff00]/40 outline-none" />
            <button className="w-12 h-12 rounded-full bg-[#c0ff00] text-black flex items-center justify-center shrink-0"><Send size={18} /></button>
          </div>
        </div>
      </div>
    );
  }

  // Рендер Ленты и Создания поста остался без изменений
  return (
    // ... остальной код ленты, как и был ранее
    <></> 
  );
}
