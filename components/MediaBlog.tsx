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

export default function MediaBlog({ currentUser, onProfileClick, isCreatingPost, setIsCreatingPost }: any) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Состояния создания поста
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCoverUrl, setNewPostCoverUrl] = useState('');
  const [newPostYoutubeUrl, setNewPostYoutubeUrl] = useState('');
  const [isUploadingPostCover, setIsUploadingPostCover] = useState(false);

  const loadPosts = async () => {
    const { data } = await supabase.from('posts').select('*, author:users(*)').order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  useEffect(() => { loadPosts(); }, []);

  const getYoutubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setUrl: (u: string) => void, setLoading: (l: boolean) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const { data } = await supabase.storage.from('avatars').upload(`${Date.now()}_${file.name}`, file);
    if (data) {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path);
      setUrl(urlData.publicUrl);
    }
    setLoading(false);
  };

  const publishPost = async () => {
    const postData = { author_id: currentUser.id, title: newPostTitle, content: editorRef.current?.innerHTML, cover_url: newPostCoverUrl, youtube_url: newPostYoutubeUrl };
    if (editingPostId) await supabase.from('posts').update(postData).eq('id', editingPostId);
    else await supabase.from('posts').insert([postData]);
    setIsCreatingPost(false);
    loadPosts();
  };

  // --- ЭКРАН ПРОСМОТРА ОДНОГО ПОСТА ---
  if (selectedPost) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 pb-20">
        <div className="mb-8"> {/* Добавлен отступ */}
          <button onClick={() => setSelectedPost(null)} className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-full text-white hover:bg-white/10 transition-all">
            <ArrowLeft size={20} />
          </button>
        </div>
        
        <div className="bg-[#14171c] border border-white/5 rounded-[32px] overflow-hidden">
          {selectedPost.cover_url && <img src={selectedPost.cover_url} className="w-full aspect-video object-cover" />}
          <div className="p-6">
            <h1 className="text-3xl font-black text-white mb-4">{selectedPost.title}</h1>
            <div className="prose prose-invert" dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
          </div>
        </div>
      </div>
    );
  }

  // --- ЭКРАН СОЗДАНИЯ ПОСТА ---
  if (isCreatingPost) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 pb-20">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => setIsCreatingPost(false)} className="text-gray-400">Отмена</button>
          <button onClick={publishPost} className="bg-[#c0ff00] text-black px-6 py-2 rounded-full font-bold">Опубликовать</button>
        </div>
        <input className="w-full text-4xl bg-transparent font-black text-white mb-6" placeholder="Заголовок..." value={newPostTitle} onChange={e => setNewPostTitle(e.target.value)} />
        <label className="block w-full h-40 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center cursor-pointer mb-6">
          {newPostCoverUrl ? <img src={newPostCoverUrl} className="h-full object-cover" /> : "Загрузить обложку"}
          <input type="file" className="hidden" onChange={e => handleFileUpload(e, setNewPostCoverUrl, setIsUploadingPostCover)} />
        </label>
        <div ref={editorRef} contentEditable className="w-full min-h-[200px] bg-white/5 p-4 rounded-2xl text-white outline-none" />
      </div>
    );
  }

  // --- ГЛАВНАЯ ЛЕНТА ---
  return (
    <div className="space-y-6 w-full max-w-3xl mx-auto px-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-white">.медиа</h2>
        <button onClick={() => setIsCreatingPost(true)} className="bg-[#c0ff00] text-black p-3 rounded-full"><Plus /></button>
      </div>
      
      {posts.map(post => (
        <div key={post.id} onClick={() => setSelectedPost(post)} className="bg-[#14171c] p-6 rounded-[32px] cursor-pointer hover:bg-[#1a1e24] transition-colors border border-white/5">
          <h3 className="text-xl font-bold text-white mb-2">{post.title}</h3>
          <p className="text-gray-400 text-sm line-clamp-2" dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
      ))}
    </div>
  );
}
