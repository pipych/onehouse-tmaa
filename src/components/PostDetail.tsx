import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { OneIcon } from './ui/SFSymbol';
import { ActionMenu } from '../ui/overlays/ActionMenu';

function Av({ src, size = 36 }: { src?: string | null; size?: number }) {
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

interface Post {
  id: string;
  author_id: string;
  title: string;
  content: string;
  cover_url: string;
  youtube_url: string;
  created_at: string;
  author?: { rp_name?: string; mc_nickname?: string; avatar_url?: string; roles?: string[] };
}

interface BlogComment {
  id: string;
  post_id: string;
  author_id: string;
  player_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author_player?: { mc_nickname?: string; avatar_url?: string };
  parent_author_name?: string; 
}

interface PostDetailProps {
  post: Post;
  currentUser: any | null;
  onClose: () => void;
  onProfileClick: (player: any) => void;
  onStartEdit: (post: Post) => void;
  onDeletePost: (postId: string) => void;
}

export default function PostDetail({ post, currentUser, onClose, onProfileClick: _onProfileClick, onStartEdit, onDeletePost }: PostDetailProps) {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [newReplyText, setNewReplyText] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});

  function getYoutubeEmbedUrl(url: string) {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  }

  function canManage() {
    if (!currentUser) return false;
    return post.author_id === currentUser.id || currentUser.roles?.includes('admin');
  }

  async function loadActivity() {
    try {
      const { data: commentData } = await supabase
        .from('comments')
        .select('*, author_player:players(id, mc_nickname, avatar_url)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (commentData) {
        const formatted = commentData.map((c: any) => ({
          ...c,
          parent_author_name: c.parent_id ? commentData.find((p: any) => p.id === c.parent_id)?.author_player?.mc_nickname || 'Удалено' : ''
        }));
        setComments(formatted);
      }

      const { data: likes } = await supabase.from('post_likes').select('user_id').eq('post_id', post.id);
      if (likes) {
        setLikesCount(likes.length);
        setIsLiked(currentUser ? likes.some((l: any) => l.user_id === currentUser.id) : false);
      }
    } catch (e) {}
  }

  async function handleLike() {
    if (!currentUser) return alert('Авторизуйтесь!');
    if (isLiked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUser.id);
      setLikesCount(p => Math.max(0, p - 1));
      setIsLiked(false);
    } else {
      await supabase.from('post_likes').insert([{ post_id: post.id, user_id: currentUser.id }]);
      setLikesCount(p => p + 1);
      setIsLiked(true);
    }
  }

  async function handleSendComment(parentId: string | null = null) {
    const text = parentId ? newReplyText.trim() : newCommentText.trim();
    if (!text || !currentUser) return;

    const { data: char } = await supabase.from('characters').select('player_id').eq('id', currentUser.id).single();
    const playerId = char?.player_id || currentUser.player_id || currentUser.id;

    const { error } = await supabase.from('comments').insert([{
      post_id: post.id,
      author_id: playerId,
      player_id: playerId,
      content: text,
      parent_id: parentId
    }]);

    if (!error) {
      if (parentId) {
        setNewReplyText('');
        setReplyingToId(null);
        setExpandedThreads(p => ({ ...p, [parentId]: true }));
      } else {
        setNewCommentText('');
      }
      loadActivity();
    }
  }

  function handleShare() {
    const shareUrl = `${window.location.origin}${window.location.pathname}?post=${post.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => { loadActivity(); }, [post.id, currentUser]);

  const topLevelComments = comments.filter((c: BlogComment) => !c.parent_id);

  function renderComment(comment: BlogComment, isReply = false) {
    const isLong = comment.content.length > 75;
    const isExpanded = expandedComments[comment.id];
    return (
      <div key={comment.id} className={`flex gap-3 items-start ${isReply ? 'mt-3 pl-4' : 'mt-4'}`}>
        {isReply && <OneIcon name="subdirectory_arrow_right" size={14} className="text-[#8e8e93] mt-2 shrink-0" />}
        <Av src={comment.author_player?.avatar_url} size={36} />
        <div className="flex-1 bg-[#181c23] p-3.5 rounded-2xl relative min-w-0 border-none">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-black text-white">{comment.author_player?.mc_nickname || 'Неизвестный'}</span>
            <span className="text-[10px] text-[#8e8e93] font-mono">{new Date(comment.created_at).toLocaleDateString('ru-RU')}</span>
          </div>
          <div className="text-sm text-gray-300 break-words leading-relaxed pr-6">
            {comment.parent_id && <span className="text-[#c0ff00] font-bold mr-1.5">@{comment.parent_author_name}</span>}
            <span className={isLong && !isExpanded ? 'line-clamp-1' : ''}>{comment.content}</span>
          </div>
          {isLong && (
            <button onClick={() => setExpandedComments(p => ({ ...p, [comment.id]: !p[comment.id] }))} className="absolute right-2 bottom-2 p-1 bg-white/5 rounded-full text-[#8e8e93] hover:text-white border-none">
              <OneIcon name={isExpanded ? 'expand_less' : 'expand_more'} size={14} />
            </button>
          )}
          <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-[#8e8e93]">
            <button onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)} className="hover:text-[#c0ff00] transition-colors">Ответить</button>
          </div>
          {replyingToId === comment.id && (
            <div className="mt-3 relative flex items-center w-full">
              <input 
                type="text" 
                placeholder="Ответ..." 
                value={newReplyText} 
                onChange={e => setNewReplyText(e.target.value)} 
                className="w-full bg-[#14171c] border-none outline-none ring-0 focus:ring-0 rounded-full py-2.5 pl-4 pr-12 text-xs text-white placeholder-[#8e8e93]" 
              />
              <button 
                onClick={() => handleSendComment(comment.id)} 
                className="absolute right-1 w-8 h-8 rounded-full bg-[#c0ff00] text-[#090b0e] flex items-center justify-center shrink-0 border-none sf-tap"
              >
                <OneIcon name="send" size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#090b0e] z-[99999] overflow-y-scroll h-[100dvh] w-full overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="vignette-top pointer-events-none" aria-hidden="true" />
      <div className="vignette-bottom pointer-events-none" aria-hidden="true" />
      <div className="w-full max-w-3xl mx-auto block p-4 pt-tma-safe md:pt-12 pb-32 animate-fade-in select-none">
        <div className="w-full flex items-center justify-between mb-6">
          <button 
            onClick={onClose} 
            className="w-11 h-11 flex items-center justify-center bg-[#14171c] hover:bg-[#181c23] rounded-full text-white transition-all border-none sf-tap"
          >
            <OneIcon name="arrow_back" size={20} />
          </button>
        </div>

        <div className="bg-[#14171c] rounded-[32px] overflow-hidden shadow-2xl flex flex-col p-6 relative border-none">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3.5">
              <Av src={post.author?.avatar_url} size={44} />
              <div>
                <div className="text-sm sm:text-base font-bold text-white truncate">{post.author?.rp_name || 'Неизвестный'}</div>
                {post.author?.mc_nickname && <div className="text-xs text-[#8e8e93] font-mono">{post.author.mc_nickname}</div>}
                <div className="flex items-center gap-1.5 text-xs text-[#8e8e93] font-medium mt-0.5">
                  <OneIcon name="schedule" size={14} /> {new Date(post.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            {canManage() && (
              <ActionMenu
                title="Управление статьей"
                items={[
                  {
                    label: 'Редактировать',
                    icon: 'edit',
                    onClick: () => onStartEdit(post),
                  },
                  {
                    label: 'Удалить',
                    icon: 'delete',
                    danger: true,
                    onClick: () => onDeletePost(post.id),
                  },
                ]}
              />
            )}
          </div>

          {post.youtube_url && (
            <div className="w-full mb-4">
              <div className="w-full relative h-0 rounded-2xl overflow-hidden bg-black/50" style={{ paddingBottom: '56.25%' }}>
                <iframe src={getYoutubeEmbedUrl(post.youtube_url)!} className="absolute inset-0 w-full h-full border-none" allowFullScreen loading="lazy" />
              </div>
            </div>
          )}
          {post.cover_url && !post.youtube_url && (
            <div className="w-full mb-4">
              <div className="w-full relative h-0 rounded-2xl overflow-hidden bg-black/50 shadow-md" style={{ paddingBottom: '56.25%' }}>
                <img src={post.cover_url} className="absolute inset-0 w-full h-full object-cover" loading="lazy" alt="cover" />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 flex-grow">
            <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">{post.title}</h1>
            <div className="prose prose-invert max-w-none text-gray-300 text-sm sm:text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
            <div className="flex items-center justify-start gap-2.5 mt-2">
              <button 
                onClick={handleLike} 
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border-none sf-tap ${isLiked ? 'bg-red-500/10 text-red-400' : 'bg-[#181c23] text-[#8e8e93] hover:text-white'}`}
              >
                <OneIcon name="favorite" size={16} fill={isLiked} /> 
                <span>{likesCount}</span>
              </button>
              <button 
                onClick={handleShare} 
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#181c23] rounded-full text-[#8e8e93] hover:text-white text-xs font-bold border-none sf-tap"
              >
                <OneIcon name="content_copy" size={16} />
                <span>{copied ? 'Скопировано!' : 'Ссылка'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Секция обсуждения */}
        <div className="bg-[#14171c] rounded-[32px] p-5 sm:p-6 shadow-xl mt-8 border-none">
          <h3 className="text-base sm:text-lg font-black text-white mb-5 flex items-center gap-2">
            <OneIcon name="chat_bubble" size={18} className="text-[#c0ff00]" /> 
            <span>Обсуждение ({comments.length})</span>
          </h3>

          {/* Поле ввода комментария (Pill, Elevated #181c23 inside card, Round right button) */}
          <div className="relative flex items-center w-full mb-6">
            <input 
              type="text" 
              placeholder="Напишите свое мнение..." 
              value={newCommentText} 
              onChange={e => setNewCommentText(e.target.value)} 
              onKeyDown={e => { if (e.key === 'Enter') handleSendComment(null); }}
              className="w-full bg-[#181c23] border-none outline-none ring-0 focus:ring-0 rounded-full h-12 pl-5 pr-14 text-sm text-white placeholder-[#8e8e93]" 
            />
            <button 
              onClick={() => handleSendComment(null)} 
              className="absolute right-2 w-8 h-8 rounded-full flex items-center justify-center bg-[#c0ff00] text-[#090b0e] hover:bg-[#aee600] active:scale-90 transition-transform shrink-0 border-none sf-tap"
              title="Отправить комментарий"
            >
              <OneIcon name="send" size={16} />
            </button>
          </div>

          <div className="space-y-4">
            {topLevelComments.map((mainComment: BlogComment) => {
              const replies = comments.filter((r: BlogComment) => r.parent_id === mainComment.id);
              return (
                <div key={mainComment.id} className="pb-2">
                  {renderComment(mainComment, false)}
                  {replies.length > 0 && (
                    <div className="pl-12 mt-2">
                      <button 
                        onClick={() => setExpandedThreads(p => ({ ...p, [mainComment.id]: !p[mainComment.id] }))} 
                        className="flex items-center gap-1.5 text-xs font-black text-[#c0ff00] bg-[#c0ff00]/10 px-3 py-1.5 rounded-full border-none sf-tap"
                      >
                        <span>{expandedThreads[mainComment.id] ? 'Скрыть ответы' : `Ответы (${replies.length})`}</span>
                      </button>
                    </div>
                  )}
                  {replies.length > 0 && expandedThreads[mainComment.id] && (
                    <div className="pl-6 animate-fade-in space-y-2">
                      {replies.map((reply: BlogComment) => renderComment(reply, true))}
                    </div>
                  )}
                </div>
              );
            })}

            {comments.length === 0 && (
              <p className="text-center py-6 text-xs text-[#8e8e93]">Пока нет комментариев. Будьте первым!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
