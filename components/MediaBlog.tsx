'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { Newspaper, Plus, Clock, Heart, MessageCircle, MoreVertical } from 'lucide-react';

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

interface MediaBlogProps {
  currentUser: Player | null;
  onProfileClick: (player: Player) => void;
  isCreatingPost: boolean;
  setIsCreatingPost: (val: boolean) => void;
}

export default function MediaBlog({ currentUser, onProfileClick, isCreatingPost, setIsCreatingPost }: MediaBlogProps) {
  const POSTS_PER_PAGE = 4;
  const router = useRouter();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [postLikes, setPostLikes] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [postCommentCounts, setPostCommentCounts] = useState<Record<string, number>>({});

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  function getYoutubeEmbedUrl(url: string) {
    if (!url || url.trim().length === 0) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  }

  function stripHtml(html: string) {
    if (typeof document === 'undefined') return html.replace(/<[^>]*>?/gm, '');
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  async function fetchPosts(page: number, append = false) {
    const from = (page - 1) * POSTS_PER_PAGE;
    const to = page * POSTS_PER_PAGE - 1;
    try {
      const { data, count, error } = await supabase
        .from('posts')
        .select('*, author:users(*)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (data && !error) {
        setPosts(prev => append ? [...prev, ...data] : data);
        if (count !== null) setTotalCount(count);
        
        const ids = data.map(p => p.id);
        const { data: cData } = await supabase.from('comments').select('post_id').in('post_id', ids);
        const { data: lData } = await supabase.from('post_likes').select('post_id, user_id');
        
        const cMap: Record<string, number> = {};
        const lMap: Record<string, { count: number; liked: boolean }> = {};
        
        ids.forEach(id => {
          cMap[id] = cData?.filter(c => c.post_id === id).length || 0;
          const postL = lData?.filter(l => l.post_id === id) || [];
          lMap[id] = {
            count: postL.length,
            liked: currentUser ? postL.some(l => l.user_id === currentUser.id) : false
          };
        });
        setPostCommentCounts(p => ({ ...p, ...cMap }));
        setPostLikes(p => ({ ...p, ...lMap }));
      }
    } catch (e) {}
  }

  async function handlePostLike(e: React.MouseEvent, postId: string) {
    e.stopPropagation();
    if (!currentUser) return alert('Авторизуйтесь!');
    const active = postLikes[postId]?.liked;
    if (active) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', currentUser.id);
      setPostLikes(p => ({ ...p, [postId]: { count: Math.max(0, p[postId].count - 1), liked: false } }));
    } else {
      await supabase.from('post_likes').insert([{ post_id: postId, user_id: currentUser.id }]);
      setPostLikes(p => ({ ...p, [postId]: { count: p[postId].count + 1, liked: true } }));
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm('Удалить пост?')) return;
    await supabase.from('posts').delete().eq('id', postId);
    fetchPosts(1, false);
  }

  useEffect(() => {
    fetchPosts(1, false);
  }, [currentUser]);

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-3xl mx-auto px-2">
      <div className="flex items-center justify-between w-full select-none">
        <h2 className="text-xl md:text-2xl font-black text-white tracking-wide flex items-center gap-3"><Newspaper size={24} className="text-[#c0ff00]" /> .медиа</h2>
        {currentUser && !currentUser?.roles?.includes('guest') && (
          <button onClick={() => router.push('/media/editor')} className="hidden md:flex w-12 h-12 bg-[#c0ff00] text-black rounded-full items-center justify-center shadow-lg transition-transform active:scale-90">
            <Plus size={26} />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-8 pb-8">
        {posts.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-[#14171c]/50 rounded-[32px] border border-white/5">Лента пуста</div>
        ) : (
          posts.map(post => {
            const embedUrl = getYoutubeEmbedUrl(post.youtube_url);
            const hasVideo = post.youtube_url && post.youtube_url.trim().length > 0 && embedUrl;
            const hasCover = post.cover_url && post.cover_url.trim().length > 0;

            return (
              <div key={post.id} onClick={() => router.push(`/media/${post.id}`)} className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden shadow-2xl transition-all hover:border-white/10 group cursor-pointer flex flex-col pt-2 relative">
                <div className="p-5 md:p-6 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img 
                      src={post.author?.avatar_url || 'https://via.placeholder.com/150'} 
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} 
                      className="bg-black/50 border border-white/10" 
                      alt="avatar" 
                      onClick={(e) => { e.stopPropagation(); if (post.author) onProfileClick(post.author); }}
                    />
                    <div className="min-w-0">
                      <div className="text-base font-bold text-white truncate">{post.author?.rp_name || 'Неизвестный'}</div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-0.5"><Clock size={12} /> {new Date(post.created_at).toLocaleDateString('ru-RU')}</div>
                    </div>
                  </div>
                  {currentUser && (post.author_id === currentUser.id || currentUser.roles?.includes('admin')) && (
                    <div className="relative">
                      <button onClick={(e) => { e.stopPropagation(); setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id); }} className="p-2 text-gray-400 hover:text-white"><MoreVertical size={20} /></button>
                      {activeMenuPostId === post.id && (
                        <div className="absolute right-0 mt-2 w-40 bg-[#1a1e24] border border-white/10 rounded-2xl p-1.5 z-50 shadow-2xl" onClick={e => e.stopPropagation()}>
                          <button onClick={() => router.push(`/media/editor?edit=${post.id}`)} className="w-full text-left px-3 py-2 text-sm font-bold text-gray-200 hover:text-[#c0ff00]">Редактировать</button>
                          <button onClick={() => handleDeletePost(post.id)} className="w-full text-left px-3 py-2 text-sm font-bold text-red-400">Удалить</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {hasVideo ? (
                  <div className="px-5 md:px-6 w-full mb-2">
                    <div className="w-full relative h-0 rounded-2xl overflow-hidden bg-black/50" style={{ paddingBottom: '56.25%' }}>
                      <iframe src={embedUrl} className="absolute inset-0 w-full h-full border-none" allowFullScreen />
                    </div>
                  </div>
                ) : hasCover ? (
                  <div className="px-5 md:px-6 w-full mb-2">
                    <div className="w-full relative h-0 rounded-2xl overflow-hidden bg-black/50" style={{ paddingBottom: '56.25%' }}>
                      <img src={post.cover_url} alt="cover" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    </div>
                  </div>
                ) : null}

                <div className="p-5 md:p-6 pt-4 flex flex-col gap-4 flex-grow">
                  <h3 className="text-lg md:text-2xl font-black text-white truncate leading-tight">{post.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed truncate">{stripHtml(post.content)}</p>
                  <div className="flex items-center justify-start gap-3 select-none" onClick={e => e.stopPropagation()}>
                    <button onClick={(e) => handlePostLike(e, post.id)} style={postLikes[post.id]?.liked ? { borderColor: '#7f1d1d', backgroundColor: 'rgba(127,29,29,0.1)' } : undefined} className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-full text-xs font-bold transition-all ${postLikes[post.id]?.liked ? 'text-red-400' : 'bg-white/5 border-white/5 text-gray-400'}`}><Heart size={15} fill={postLikes[post.id]?.liked ? "currentColor" : "none"} /> <span>{postLikes[post.id]?.count || 0}</span></button>
                    <button onClick={(e) => { e.stopPropagation(); router.push(`/media/${post.id}#comments`); }} className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full text-gray-400 text-xs font-bold font-mono"><MessageCircle size={15} /> <span>{postCommentCounts[post.id] || 0}</span></button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {currentPage < totalPages && (
        <div className="flex justify-center mt-2 mb-4">
          <button onClick={() => { const n = currentPage + 1; setCurrentPage(n); fetchPosts(n, true); }} className="flex items-center gap-2 px-6 py-3 bg-[#14171c]/90 border border-white/10 rounded-full text-xs font-bold text-gray-400">Показать еще</button>
        </div>
      )}
    </div>
  );
}
