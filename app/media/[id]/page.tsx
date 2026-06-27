'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, MoreVertical, Clock, Heart, MessageCircle, Send, CornerDownRight, ChevronUp, ChevronDown } from 'lucide-react';

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

export default function StandalonePostDetail() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [post, setPost] = useState<Post | null>(null);
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

  async function loadActivity() {
    if (!postId) return;
    try {
      const { data: postData } = await supabase.from('posts').select('*, author:users(*)').eq('id', postId).single();
      if (postData) setPost(postData);

      const { data: commentData } = await supabase
        .from('comments')
        .select('*, author:users(*)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentData) {
        const formatted = commentData.map((c: any) => ({
          ...c,
          parent_author_name: c.parent_id ? commentData.find((p: any) => p.id === c.parent_id)?.author?.rp_name || 'Удалено' : ''
        }));
        setComments(formatted);
      }

      const { data: likes } = await supabase.from('post_likes').select('user_id').eq('post_id', postId);
      if (likes) {
        setLikesCount(likes.length);
        if (currentUser) setIsLiked(likes.some(l => l.user_id === currentUser.id));
      }
    } catch (e) {}
  }

  async function handleLike() {
    if (!currentUser || !post) return alert('Авторизуйтесь!');
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
    if (!currentUser || !post) return;
    const text = parentId ? newReplyText : newCommentText;
    if (!text.trim()) return;

    const { error } = await supabase.from('comments').insert([{
      post_id: post.id, author_id: currentUser.id, parent_id: parentId, content: text.trim()
    }]);

    if (!error) {
      if (parentId) { setNewReplyText(''); setReplyingToId(null); } 
      else { setNewCommentText(''); }
      loadActivity();
    }
  }

  async function handleDeletePost() {
    if (!post || !confirm('Удалить пост?')) return;
    await supabase.from('posts').delete().eq('id', post.id);
    router.push('/');
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user?.id) {
      supabase.from('users').select('*').eq('tg_id', tg.initDataUnsafe.user.id).single().then(({ data }) => {
        if (data) setCurrentUser(data);
      });
    }
  }, []);

  useEffect(() => {
    loadActivity();
  }, [postId, currentUser]);

  if (!post) {
    return <div className="min-h-screen bg-[#090b0e] text-gray-500 flex items-center justify-center font-mono text-xs">ЗАГРУЗКА ПУБЛИКАЦИИ...</div>;
  }

  const topLevelComments = comments.filter(c => !c.parent_id);

  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-12 pb-32 selection:bg-[#c0ff00] selection:text-black">
      <div className="w-full max-w-3xl mx-auto flex flex-col">
        
        <div className="w-full flex mb-8">
          <button onClick={() => router.push('/')} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-gray-300 hover:text-white transition-transform active:scale-90"><ArrowLeft size={20} /></button>
        </div>

        <div className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden shadow-2xl flex flex-col pt-2 relative">
          <div className="p-5 md:p-6 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={post.author?.avatar_url || 'https://via.placeholder.com/150'} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} className="bg-black/50 border border-white/10" />
              <div>
                <div className="text-base font-bold text-white truncate">{post.author?.rp_name || 'Неизвестный'}</div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-0.5"><Clock size={12} /> {new Date(post.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
            
            {/* ИСПРАВЛЕНО: Безопасное логическое ветвление для выпадающего меню без текстовых артефактов */}
            {currentUser && (post.author_id === currentUser.id || currentUser.roles?.includes('admin')) && (
              <div className="relative">
                <button onClick={() => setActiveMenu(!activeMenu)} className="p-2 text-gray-400 hover:text-white"><MoreVertical size={20} /></button>
                {activeMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-[#1a1e24] border border-white/10 rounded-2xl p-1.5 z-[60] shadow-2xl flex flex-col gap-0.5">
                    <button onClick={() => router.push(`/media/editor?edit=${post.id}`)} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl text-sm font-bold text-gray-200 hover:text-[#c0ff00]">Редактировать</button>
                    <button onClick={handleDeletePost} className="w-full text-left px-3 py-2 hover:bg-red-500/10 rounded-xl text-sm font-bold text-red-400">Удалить</button>
                  </div>
                )}
              </div>
            )}
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
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full text-gray-400 text-xs font-bold"><span>{copied ? 'Скопировано!' : 'Ссылка'}</span></button>
            </div>
          </div>
        </div>

        <div className="bg-[#14171c]/60 backdrop-blur-xl border border-white/5 rounded-[32px] p-5 md:p-6 shadow-xl mt-14">
          <h3 className="text-lg font-black text-white mb-5 flex items-center gap-2"><MessageCircle size={20} className="text-[#c0ff00]" /> <span>Обсуждение ({comments.length})</span></h3>
          <div className="flex gap-3 items-center mb-9">
            <input type="text" placeholder="Напишите свое мнение..." value={newCommentText} onChange={e => setNewCommentText(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-full p-4 px-6 text-sm text-white outline-none focus:border-[#c0ff00]/40 shadow-inner" />
            <button onClick={() => handleSendComment(null)} className="w-12 h-12 rounded-full flex items-center justify-center bg-[#c0ff00] text-black shrink-0 active:scale-90"><Send size={18} /></button>
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
