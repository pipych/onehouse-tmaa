'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { Newspaper, Plus, Clock, Heart, MessageCircle, MoreVertical } from 'lucide-react';

interface Player {
  id: string;
  player_id: string;
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
  author_player?: { mc_nickname: string };
}

interface MediaBlogProps {
  currentUser: Player | null;
  onProfileClick: (player: Player) => void;
  isCreatingPost: boolean;
  setIsCreatingPost: (val: boolean) => void;
  seasonName?: string;
}

export default function MediaBlog({ currentUser, onProfileClick, isCreatingPost, setIsCreatingPost, seasonName }: MediaBlogProps) {
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
      let query = supabase
        .from('posts')
        .select('*, author:characters(*, player:players(mc_nickname))', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (seasonName) query = query.eq('season', seasonName);

      const { data, count, error } = await query;

      if (data && !error) {
        setPosts(prev => append ? [...prev, ...data] : data);
        if (count !== null) setTotalCount(count);
        
        const ids = data.map((p: any) => p.id);
        const { data: cData } = await supabase.from('comments').select('post_id').in('post_id', ids);
        const { data: lData } = await supabase.from('post_likes').select('post_id, user_id');
        
        const cMap: Record<string, number> = {};
        const lMap: Record<string, { count: number; liked: boolean }> = {};
        
        ids.forEach(id => {
          cMap[id] = cData?.filter((c: any) => c.post_id === id).length || 0;
          const postL = lData?.filter((l: any) => l.post_id === id) || [];
          lMap[id] = {
            count: postL.length,
            liked: currentUser ? postL.some((l: any) => l.user_id === currentUser.id) : false
          };
        });
        setPostCommentCounts((p: Record<string, number>) => ({ ...p, ...cMap }));
        setPostLikes((p: Record<string, { count: number; liked: boolean }>) => ({ ...p, ...lMap }));
      }
    } catch (e) {}
  }

  async function handlePostLike(e: React.MouseEvent, postId: string) {
    e.stopPropagation();
    if (!currentUser) return alert('Авторизуйтесь!');
    const active = postLikes[postId]?.liked;
    if (active) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', currentUser.id);
      setPostLikes((p: Record<string, { count: number; liked: boolean }>) => ({ ...p, [postId]: { count: Math.max(0, p[postId].count - 1), liked: false } }));
    } else {
      await supabase.from('post_likes').insert([{ post_id: postId, user_id: currentUser.id }]);
      setPostLikes((p: Record<string, { count: number; liked: boolean }>) => ({ ...p, [postId]: { count: p[postId].count + 1, liked: true } }));
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm('Удалить пост?')) return;
    await supabase.from('posts').delete().eq('id', postId);
    fetchPosts(1, false);
  }

  useEffect(() => {
    fetchPosts(1, false);
  }, [seasonName]);

  useEffect(() => {
    const handleClick = () => setActiveMenuPostId(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white flex items-center gap-2"><Newspaper size={20} className="text-[#c0ff00]" /> Медиа</h2>
        {currentUser && !currentUser.roles?.includes('guest') && (
          <button onClick={() => router.push('/media/editor')} className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#c0ff00] text-black rounded-full text-sm font-bold active:scale-95 transition-transform"><Plus size={16} /><span>Статья</span></button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post: any) => (
          <div key={post.id} onClick={() => router.push(`/media/${post.id}`)} className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[28px] overflow-hidden cursor-pointer hover:border-white/10 transition-all shadow-xl flex flex-col group">
            {post.youtube_url ? (
              <div className="w-full aspect-video bg-black/30 relative">
                <iframe src={getYoutubeEmbedUrl(post.youtube_url)!} className="w-full h-full border-none pointer-events-none" />
              </div>
            ) : post.cover_url ? (
              <div className="w-full aspect-video relative overflow-hidden">
                <img src={post.cover_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
              </div>
            ) : null}

            <div className="p-5 flex flex-col flex-grow space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={post.author?.avatar_url || 'https://via.placeholder.com/150'} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                  <div>
                    <span className="text-xs font-bold text-white">{post.author?.rp_name}</span>
                    {post.author?.mc_nickname && <span className="text-[10px] text-gray-500 ml-1.5 font-mono">{post.author.mc_nickname}</span>}
                  </div>
                </div>
                <div className="relative" onClick={e => e.stopPropagation()}>
                  {currentUser && (post.author_id === currentUser.id || currentUser.roles?.includes('admin')) && (
                    <button onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)} className="p-1 text-gray-500 hover:text-white"><MoreVertical size={16} /></button>
                  )}
                  {activeMenuPostId === post.id && (
                    <div className="absolute right-0 mt-1 bg-[#1a1e24] border border-white/10 rounded-xl p-1 z-50 shadow-xl flex flex-col gap-0.5 min-w-[120px]">
                      <button onClick={() => router.push(`/media/editor?edit=${post.id}`)} className="text-left px-3 py-1.5 hover:bg-white/5 rounded-lg text-xs font-bold text-gray-200">Редактировать</button>
                      <button onClick={() => handleDeletePost(post.id)} className="text-left px-3 py-1.5 hover:bg-red-500/10 rounded-lg text-xs font-bold text-red-400">Удалить</button>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-black text-white leading-tight group-hover:text-[#c0ff00] transition-colors">{post.title}</h3>
              <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">{stripHtml(post.content)}</p>

              <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                <span className="text-[10px] text-gray-500 flex items-center gap-1"><Clock size={10} /> {new Date(post.created_at).toLocaleDateString('ru-RU')}</span>
                <div className="flex items-center gap-3">
                  <button onClick={(e) => handlePostLike(e, post.id)} className={`flex items-center gap-1 text-[10px] font-bold ${postLikes[post.id]?.liked ? 'text-red-400' : 'text-gray-500'}`}><Heart size={12} fill={postLikes[post.id]?.liked ? 'currentColor' : 'none'} /> {postLikes[post.id]?.count || 0}</button>
                  <span className="flex items-center gap-1 text-[10px] text-gray-500"><MessageCircle size={12} /> {postCommentCounts[post.id] || 0}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button key={page} onClick={() => { setCurrentPage(page); fetchPosts(page, false); }} className={`w-10 h-10 rounded-full text-xs font-bold transition-all ${page === currentPage ? 'bg-[#c0ff00] text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{page}</button>
          ))}
        </div>
      )}

      {posts.length === 0 && (
        <div className="text-center py-12 text-xs text-gray-500 font-mono bg-[#14171c]/40 border border-white/5 rounded-2xl">СТАТЕЙ ПОКА НЕТ</div>
      )}
    </div>
  );
}
