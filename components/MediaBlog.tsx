// components/MediaBlog.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // Убедись, что путь до supabase правильный
import { Newspaper, Edit2, Clock, Heart, MessageCircle, Image as ImageIcon, Youtube, X, Save, Upload } from 'lucide-react';

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
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCoverUrl, setNewPostCoverUrl] = useState('');
  const [newPostYoutubeUrl, setNewPostYoutubeUrl] = useState('');
  const [isUploadingPostCover, setIsUploadingPostCover] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:users(*)')
      .order('created_at', { ascending: false });
    
    if (data && !error) {
      setPosts(data);
    }
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

  const publishPost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim() || !currentUser) {
      alert('Заголовок и текст не могут быть пустыми!');
      return;
    }

    const { error } = await supabase.from('posts').insert([{
      author_id: currentUser.id,
      title: newPostTitle,
      content: newPostContent,
      cover_url: newPostCoverUrl || null,
      youtube_url: newPostYoutubeUrl || null
    }]);

    if (!error) {
      setIsCreatingPost(false);
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostCoverUrl('');
      setNewPostYoutubeUrl('');
      loadPosts(); 
    } else {
      alert(`Ошибка публикации: ${error.message}`);
    }
  };

  const getYoutubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in w-full max-w-2xl mx-auto">
        <div className="flex items-center justify-between w-full px-1">
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <Newspaper size={18} className="text-[#c0ff00]" />
            .медиа
          </h2>
          {currentUser && (
            <button 
              onClick={() => setIsCreatingPost(true)} 
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Edit2 size={12} /> Написать
            </button>
          )}
        </div>

        {/* ЛЕНТА ПОСТОВ */}
        <div className="space-y-6 pb-8">
          {posts.length === 0 ? (
            <div className="text-center py-12 px-4 bg-[#14171c]/50 rounded-[28px] border border-white/5 border-dashed">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Newspaper size={24} className="text-gray-500" />
              </div>
              <h3 className="text-gray-300 font-bold mb-1">Здесь пока пусто</h3>
              <p className="text-sm text-gray-500">Станьте первым, кто опубликует новость в блоге!</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[28px] overflow-hidden shadow-xl transition-all hover:border-white/10 group">
                
                <div className="p-4 md:p-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-black/50 border border-white/10 flex-shrink-0 cursor-pointer hover:border-[#c0ff00]/50 transition-colors" onClick={() => { if(post.author) onProfileClick(post.author); }}>
                    <img src={post.author?.avatar_url || 'https://via.placeholder.com/150'} alt="author" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white tracking-wide truncate">{post.author?.rp_name || 'Неизвестный'}</div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                      <Clock size={10} /> 
                      {new Date(post.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                </div>

                {post.youtube_url && getYoutubeEmbedUrl(post.youtube_url) ? (
                  <div className="w-full aspect-video bg-black/50 border-y border-white/5">
                    <iframe src={getYoutubeEmbedUrl(post.youtube_url)!} className="w-full h-full border-none" allowFullScreen />
                  </div>
                ) : post.cover_url ? (
                  <div className="w-full max-h-[300px] bg-black/50 border-y border-white/5 overflow-hidden">
                    <img src={post.cover_url} alt="cover" className="w-full h-full object-cover" />
                  </div>
                ) : null}

                <div className="p-4 md:p-5">
                  <h3 className="text-xl font-black text-white mb-2 leading-tight">{post.title}</h3>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                </div>

                <div className="px-4 md:px-5 pb-4 pt-1 flex items-center gap-4">
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 transition-colors active:scale-95 group/btn">
                    <div className="p-2 rounded-full group-hover/btn:bg-red-400/10 transition-colors"><Heart size={18} /></div>
                    <span className="text-xs font-bold">0</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-[#c0ff00] transition-colors active:scale-95 group/btn">
                    <div className="p-2 rounded-full group-hover/btn:bg-[#c0ff00]/10 transition-colors"><MessageCircle size={18} /></div>
                    <span className="text-xs font-bold">0 Комментариев</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Окно создания поста */}
      {isCreatingPost && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-32px)] max-w-xl p-6 bg-[#14171c]/95 backdrop-blur-3xl rounded-[32px] border border-white/10 shadow-2xl space-y-4 animate-profile-grow overflow-y-auto max-h-[85vh] no-scrollbar">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              <Newspaper size={20} className="text-[#c0ff00]" />
              Создание поста
            </h2>
            <button onClick={() => setIsCreatingPost(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all active:scale-90"><X size={16} /></button>
          </div>

          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Яркий заголовок..." 
              value={newPostTitle} 
              onChange={e => setNewPostTitle(e.target.value)} 
              className="w-full bg-black/30 border border-white/10 rounded-[20px] p-4 text-lg font-black text-white outline-none focus:border-[#c0ff00]/50 focus:bg-black/50 transition-all placeholder:text-gray-500"
            />
            
            <textarea 
              placeholder="О чем хотите рассказать?" 
              value={newPostContent} 
              onChange={e => setNewPostContent(e.target.value)} 
              className="w-full bg-black/30 border border-white/10 rounded-[20px] p-4 text-sm font-medium text-gray-200 outline-none focus:border-[#c0ff00]/50 focus:bg-black/50 transition-all min-h-[150px] placeholder:text-gray-500 whitespace-pre-wrap resize-none"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="w-full">
                <label className="flex items-center justify-center gap-2 p-3.5 bg-[#1c2026] border border-white/10 hover:border-[#c0ff00]/40 rounded-[20px] cursor-pointer transition-all active:scale-[0.98] group relative overflow-hidden">
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => handleFileUpload(e, setNewPostCoverUrl, setIsUploadingPostCover)} disabled={isUploadingPostCover} />
                  <ImageIcon size={18} className={newPostCoverUrl ? "text-[#c0ff00]" : "text-gray-400 group-hover:text-white"} />
                  <span className={`text-sm font-bold truncate ${newPostCoverUrl ? "text-[#c0ff00]" : "text-gray-400 group-hover:text-white"}`}>
                    {isUploadingPostCover ? 'Загрузка...' : (newPostCoverUrl ? 'Обложка загружена' : 'Прикрепить картинку')}
                  </span>
                </label>
              </div>
              
              <div className="w-full relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"><Youtube size={18} /></div>
                <input 
                  type="text" 
                  placeholder="Ссылка на YouTube..." 
                  value={newPostYoutubeUrl} 
                  onChange={e => setNewPostYoutubeUrl(e.target.value)} 
                  className="w-full bg-[#1c2026] border border-white/10 rounded-[20px] py-3.5 pl-11 pr-4 text-sm font-medium text-white outline-none focus:border-red-500/50 transition-all placeholder:text-gray-500"
                />
              </div>
            </div>

            {newPostYoutubeUrl && getYoutubeEmbedUrl(newPostYoutubeUrl) && (
              <div className="w-full rounded-[20px] overflow-hidden border border-white/10 aspect-video bg-black/50">
                <iframe src={getYoutubeEmbedUrl(newPostYoutubeUrl)!} className="w-full h-full border-none" allowFullScreen />
              </div>
            )}

            {newPostCoverUrl && !newPostYoutubeUrl && (
              <div className="w-full rounded-[20px] overflow-hidden border border-white/10 max-h-[200px] bg-black/50 relative">
                <img src={newPostCoverUrl} alt="Cover preview" className="w-full h-full object-cover" />
                <button onClick={() => setNewPostCoverUrl('')} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-red-500/80 text-white transition-all"><X size={14}/></button>
              </div>
            )}

            <button 
              onClick={publishPost} 
              disabled={isUploadingPostCover || !newPostTitle.trim() || !newPostContent.trim()}
              className="w-full flex items-center justify-center gap-2 bg-[#c0ff00] text-black py-4 rounded-[20px] font-black tracking-wide text-base hover:bg-[#a6e600] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(192,255,0,0.2)] disabled:opacity-50 disabled:grayscale"
            >
              <Save size={18} /> Опубликовать запись
            </button>
          </div>
        </div>
      )}
    </>
  );
}
