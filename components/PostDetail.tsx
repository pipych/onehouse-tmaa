'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, MoreVertical, Clock, Heart, MessageCircle, Send, 
  CornerDownRight, ChevronUp, ChevronDown 
} from 'lucide-react';

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

interface BlogComment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author?: Player;
  parent_author_name?: string; 
}

interface PostDetailProps {
  post: Post;
  currentUser: Player | null;
  onClose: () => void;
  onProfileClick: (player: Player) => void;
  onStartEdit: (post: Post) => void;
  onDeletePost: (postId: string) => void;
}

export default function PostDetail({ post, currentUser, onClose, onProfileClick, onStartEdit, onDeletePost }: PostDetailProps) {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [newReplyText, setNewReplyText] = useState('');
  const [activeMenu, setActiveMenu] = useState(false);
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
        .select('*, author:characters(*)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (commentData) {
        const formatted = commentData.map((c: any) => ({
          ...c,
          parent_author_name: c.parent_id ? commentData.find((p: any) => p.id === c.parent_id)?.author?.rp_name || 'Удалено' : ''
        }));
        setComments(formatted);
      }

      const { data: likes } = await supabase.from('post_likes').select('user_id').eq('post_id', post.id);
      if (likes) {
        setLikesCount(likes.length);
        setIsLiked(currentUser ? likes.some(l => l.user_id === currentUser.id) : false);
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
    const text = parentId ? newReplyText : newCommentText;
    if (!text.trim() || !currentUser) return;

    const { error } = await supabase.from('comments').insert([{
      post_id: post.id, author_id: currentUser.id, parent_id: parentId, content: text.trim()
    }]);

    if (!error) {
      if (parentId) { setNewReplyText(''); setReplyingToId(null); } 
      else { setNewCommentText(''); }
      loadActivity();
    }
  }

  function handleShare() {
    const shareUrl = `${window.location.origin}${window.location.pathname}?post=${post.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    loadActivity();
  }, [post.id, currentUser]);

  const topLevelComments = comments.filter(c => !c.parent_id);

  function renderComment(comment: BlogComment, isReply = false) {
    const isLong = comment.content.length > 75;
    const isExpanded = expandedComments[comment.id];
    return (
      <div key={comment.id} className={`flex gap-3 items-start ${isReply ? 'mt-3 pl-4 border-l-2 border-white/5' : 'mt-5'}`}>
        {isReply && <CornerDownRight size={14} className="text-gray-600 mt-2 shrink-0" />}
        <img src={comment.author?.avatar_url || 'https://via.placeholder.com/150'} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} className="border border-white/5 shrink-0" />
        <div className="flex-1 bg-white/[0.02] border border-white/5 p-3 rounded-2xl relative min-w-0">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-black text-white">{comment.author?.rp_name}</span>
            <span className="text-[10px] text-gray-500 font-mono">{new Date(comment.created_at).toLocaleDateString('ru-RU')}</span>
          </div>
          <div className="text-sm text-gray-300 break-words leading-relaxed pr-6">
            {comment.parent_id && <span className="text-[#c0ff00] font-bold mr-1.5">@{comment.parent_author_name}</span>}
            <span className={isLong && !isExpanded ? 'line-clamp-1' : ''}>{comment.content}</span>
          </div>
          {isLong && (
            <button onClick={() => setExpandedComments(p => ({ ...p, [comment.id]: !p[comment.id] }))} className="absolute right-2 bottom-2 p-1 bg-white/5 rounded-full text-gray-400">
              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
          <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-gray-500">
            <button onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)} className="hover:text-[#c0ff00]">Ответить</button>
          </div>
          {replyingToId === comment.id && (
            <div className="mt-3 flex gap-2 items-center">
              <input type="text" placeholder="Ответ..." value={newReplyText} onChange={e => setNewReplyText(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-full p-2 px-4 text-xs text-white outline-none" />
              <button onClick={() => handleSendComment(comment.id)} className="w-8 h-8 rounded-full bg-[#c0ff00] text-black flex items-center justify-center shrink-0"><Send size={12} /></button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    // ФИКС: Жесткое принудительное включение вертикального скролла на мобильных
    <div 
      className="fixed inset-0 bg-[#090b0e] z-[99999] overflow-y-scroll h-[100dvh] w-full overscroll-contain" 
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* ФИКС: Изменено с flex на block, чтобы Safari корректно высчитывал высоту прокрутки */}
      <div className="w-full max-w-3xl mx-auto block p-4 pt-36 pb-32 md:pl-[120px] animate-fade-in">
        
        {/* Кнопка Назад */}
        <div className="w-full select-none flex mb-11">
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-gray-300 hover:text-white"><ArrowLeft size={20} /></button>
        </div>

        {/* Карточка поста */}
        <div className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden shadow-2xl flex flex-col pt-2 relative">
          <div className="p-5 md:p-6 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={post.author?.avatar_url || 'https://via.placeholder.com/150'} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} className="bg-black/50 border border-white/10" />
              <div>
                <div className="text-base font-bold text-white truncate">{post.author?.rp_name || 'Неизвестный'}</div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-0.5"><Clock size={12} /> {new Date(post.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
            {canManage()} && (
              <div className="relative">
                <button onClick={() => setActiveMenu(!activeMenu)} className="p-2 text-gray-400 hover:text-white"><MoreVertical size={20} /></button>
                {activeMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-[#1a1e24] border border-white/10 rounded-2xl p-1.5 z-[60] shadow-2xl flex flex-col gap-0.5">
                    <button onClick={() => onStartEdit(post)} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl text-sm font-bold text-gray-200 hover:text-[#c0ff00]">Редактировать</button>
                    <button onClick={() => onDeletePost(post.id)} className="w-full text-left px-3 py-2 hover:bg-red-500/10 rounded-xl text-sm font-bold text-red-400">Удалить</button>
                  </div>
                )}
              </div>
            )
          </div>

          {post.youtube_url && (
            <div className="px-5 md:px-6 w-full mb-4">
              <div className="w-full relative h-0 rounded-2xl overflow-hidden bg-black/50" style={{ paddingBottom: '56.25%' }}>
                <iframe src={getYoutubeEmbedUrl(post.youtube_url)!} className="absolute inset-0 w-full h-full border-none" allowFullScreen loading="lazy" />
              </div>
            </div>
          )}
          {post.cover_url && !post.youtube_url && (
            <div className="px-5 md:px-6 w-full mb-4">
              <div className="w-full relative h-0 rounded-2xl overflow-hidden bg-black/50 shadow-md" style={{ paddingBottom: '56.25%' }}>
                <img src={post.cover_url} className="absolute inset-0 w-full h-full object-cover" loading="lazy" alt="cover" />
              </div>
            </div>
          )}

          <div className="p-5 md:p-6 pt-2 flex flex-col gap-5 flex-grow">
            <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">{post.title}</h1>
            <div className="prose prose-invert max-w-none text-gray-300 text-base" dangerouslySetInnerHTML={{ __html: post.content }} />
            <div className="flex items-center justify-start gap-3 mt-2">
              <button onClick={handleLike} className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-full text-xs font-bold transition-all ${isLiked ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/5 text-gray-400'}`}><Heart size={15} fill={isLiked ? "currentColor" : "none"} /> <span>{likesCount}</span></button>
              <button onClick={handleShare} className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full text-gray-400 text-xs font-bold"><span>{copied ? 'Скопировано!' : 'Ссылка'}</span></button>
            </div>
          </div>
        </div>

        {/* Обсуждение */}
        <div className="bg-[#14171c]/60 backdrop-blur-xl border border-white/5 rounded-[32px] p-5 md:p-6 shadow-xl mt-14">
          <h3 className="text-lg font-black text-white mb-5 flex items-center gap-2"><MessageCircle size={20} className="text-[#c0ff00]" /> <span>Обсуждение ({comments.length})</span></h3>
          <div className="flex gap-3 items-center mb-9">
            <input type="text" placeholder="Напишите свое мнение..." value={newCommentText} onChange={e => setNewCommentText(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-full p-4 px-6 text-sm text-white outline-none focus:border-[#c0ff00]/40 shadow-inner" />
            <button onClick={() => handleSendComment(null)} className="w-12 h-12 rounded-full flex items-center justify-center bg-[#c0ff00] text-black shrink-0"><Send size={18} /></button>
          </div>

          <div className="divide-y divide-white/5">
            {topLevelComments.map(mainComment => {
              const replies = comments.filter(r => r.parent_id === mainComment.id);
              return (
                <div key={mainComment.id} className="pb-4">
                  {renderComment(mainComment, false)}
                  {replies.length > 0 && (
                    <div className="pl-12 mt-2">
                      <button onClick={() => setExpandedThreads(p => ({ ...p, [mainComment.id]: !p[mainComment.id] }))} className="flex items-center gap-1.5 text-xs font-black text-[#c0ff00] bg-[#c0ff00]/5 px-3 py-1.5 rounded-full">
                        <span>{expandedThreads[mainComment.id] ? 'Скрыть ответы' : `Ответы (${replies.length})`}</span>
                      </button>
                    </div>
                  )}
                  {replies.length > 0 && expandedThreads[mainComment.id] && <div className="pl-8 animate-fade-in">{replies.map(reply => renderComment(reply, true))}</div>}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
