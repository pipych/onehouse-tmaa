import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { OneIcon } from './ui/SFSymbol';
import { ActionMenu } from '../ui/overlays/ActionMenu';

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
}

interface MediaBlogProps {
  currentUser: Player | null;
  onProfileClick?: (player: Player) => void;
  isCreatingPost?: boolean;
  setIsCreatingPost?: (val: boolean) => void;
  seasonName?: string;
}

function PlayerAvatar({ src, size = 32 }: { src?: string | null; size?: number }) {
  if (src && src.trim().length > 0) {
    return (
      <img 
        src={src} 
        loading="lazy"
        decoding="async"
        style={{ width: size, height: size, objectFit: 'cover' }} 
        className="rounded-full object-cover border-none bg-[#181c23] shrink-0" 
        alt="avatar"
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  }
  return (
    <div 
      style={{ width: size, height: size }} 
      className="rounded-full bg-[#181c23] border-none flex items-center justify-center shrink-0"
    >
      <OneIcon name="person" size={Math.max(size * 0.45, 14)} className="text-[#8e8e93]" />
    </div>
  );
}

export default function MediaBlog({ currentUser, seasonName }: MediaBlogProps) {
  const POSTS_PER_PAGE = 4;
  const navigate = useNavigate();
  
  const [posts, setPosts] = useState<Post[]>([]);
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
      if (error) return;
      if (count !== null) setTotalCount(count);

      if (data) {
        setPosts(data as any);

        const postIds = data.map((p: any) => p.id);
        if (postIds.length > 0) {
          const { data: likesData } = await supabase
            .from('post_likes')
            .select('post_id, user_id')
            .in('post_id', postIds);

          const { data: commentsData } = await supabase
            .from('comments')
            .select('post_id')
            .in('post_id', postIds);

          const likesMap: Record<string, { count: number; liked: boolean }> = {};
          postIds.forEach(id => { likesMap[id] = { count: 0, liked: false }; });
          likesData?.forEach((like: any) => {
            if (likesMap[like.post_id]) {
              likesMap[like.post_id].count++;
              if (currentUser && like.user_id === currentUser.id) {
                likesMap[like.post_id].liked = true;
              }
            }
          });
          setPostLikes(likesMap);

          const commentsMap: Record<string, number> = {};
          commentsData?.forEach((comment: any) => {
            commentsMap[comment.post_id] = (commentsMap[comment.post_id] || 0) + 1;
          });
          setPostCommentCounts(commentsMap);
        }
      }
    } catch (err) {}
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
      setPostLikes((p: Record<string, { count: number; liked: boolean }>) => ({ ...p, [postId]: { count: (p[postId]?.count || 0) + 1, liked: true } }));
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm('Удалить пост?')) return;
    await supabase.from('posts').delete().eq('id', postId);
    fetchPosts(1, false);
  }

  useEffect(() => { fetchPosts(1, false); }, [seasonName]);

  return (
    <div className="w-full space-y-6 animate-fade-in select-none">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <OneIcon name="newspaper" size={20} className="text-[#c0ff00]" /> Медиа
        </h2>
        {currentUser && !currentUser.roles?.includes('guest') && (
          <button 
            onClick={() => navigate('/media/editor')} 
            className="flex items-center gap-2 px-5 py-2.5 bg-[#c0ff00] text-[#090b0e] rounded-full text-xs font-bold active:scale-95 hover:bg-[#aee600] transition-all border-none sf-tap"
          >
            <OneIcon name="add" size={16} />
            <span>Статья</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post: any) => (
          <div 
            key={post.id} 
            onClick={() => navigate(`/media/${post.id}`)} 
            className="bg-[#14171c] rounded-[28px] overflow-hidden cursor-pointer hover:bg-[#181c23] transition-all duration-200 shadow-xl flex flex-col group active:scale-[0.99] cv-media gpu-layer border-none"
          >
            {post.youtube_url ? (
              <div className="w-full aspect-video bg-black/30 relative">
                <iframe src={getYoutubeEmbedUrl(post.youtube_url)!} className="w-full h-full border-none pointer-events-none" loading="lazy" />
              </div>
            ) : post.cover_url ? (
              <div className="w-full aspect-video relative overflow-hidden bg-[#0d0f12]">
                <img src={post.cover_url} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="" />
              </div>
            ) : null}

            <div className="p-5 flex flex-col flex-grow space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PlayerAvatar src={post.author?.avatar_url} size={32} />
                  <div>
                    <span className="text-xs font-bold text-white">{post.author?.rp_name}</span>
                    {post.author?.mc_nickname && <span className="text-[10px] text-[#8e8e93] ml-1.5 font-mono">{post.author.mc_nickname}</span>}
                  </div>
                </div>

                {/* Adaptive ActionMenu: dropdown on desktop, bottom sheet on mobile */}
                {currentUser && (post.author_id === currentUser.id || currentUser.roles?.includes('admin')) && (
                  <div onClick={e => e.stopPropagation()}>
                    <ActionMenu
                      title="Управление статьей"
                      items={[
                        {
                          label: 'Редактировать',
                          icon: 'edit',
                          onClick: () => navigate(`/media/editor?edit=${post.id}`),
                        },
                        {
                          label: 'Удалить',
                          icon: 'delete',
                          danger: true,
                          onClick: () => handleDeletePost(post.id),
                        },
                      ]}
                    />
                  </div>
                )}
              </div>

              <h3 className="text-base sm:text-lg font-black text-white leading-tight group-hover:text-[#c0ff00] transition-colors">{post.title}</h3>
              <p className="text-xs sm:text-sm text-[#8e8e93] line-clamp-3 leading-relaxed">{stripHtml(post.content)}</p>

              <div className="flex items-center justify-between mt-auto pt-3">
                <span className="text-[11px] text-[#8e8e93] flex items-center gap-1 font-medium">
                  <OneIcon name="schedule" size={14} /> {new Date(post.created_at).toLocaleDateString('ru-RU')}
                </span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => handlePostLike(e, post.id)} 
                    className={`flex items-center gap-1 text-xs font-bold transition-all ${postLikes[post.id]?.liked ? 'text-red-400' : 'text-[#8e8e93] hover:text-white'}`}
                  >
                    <OneIcon name="favorite" size={16} fill={postLikes[post.id]?.liked} /> {postLikes[post.id]?.count || 0}
                  </button>
                  <span className="flex items-center gap-1 text-xs text-[#8e8e93] font-medium">
                    <OneIcon name="chat_bubble" size={16} /> {postCommentCounts[post.id] || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button 
              key={page} 
              onClick={() => { setCurrentPage(page); fetchPosts(page, false); }} 
              className={`w-9 h-9 rounded-full text-xs font-bold transition-all border-none sf-tap ${page === currentPage ? 'bg-[#c0ff00] text-[#090b0e]' : 'bg-[#14171c] text-[#8e8e93] hover:bg-[#181c23] hover:text-white'}`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {posts.length === 0 && (
        <div className="text-center py-16 text-xs text-[#8e8e93] font-mono bg-[#14171c] rounded-[28px] border-none">
          СТАТЕЙ ПОКА НЕТ
        </div>
      )}
    </div>
  );
}
