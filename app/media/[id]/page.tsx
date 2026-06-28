'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Send, Clock, RefreshCw } from 'lucide-react';

export default function StandalonePostDetail() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadActivity() {
    if (!postId) return;
    const { data: p } = await supabase.from('posts').select('*, author:users(*)').eq('id', postId).single();
    if (p) setPost(p);
    
    const { data: c } = await supabase.from('comments').select('*, author:users(*)').eq('post_id', postId).order('created_at', { ascending: true });
    if (c) setComments(c);
  }

  async function handleSendComment() {
    if (!newComment.trim() || !currentUser || isSubmitting) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('comments').insert([{
      post_id: postId,
      author_id: currentUser.id,
      content: newComment.trim()
    }]);
    if (!error) {
      setNewComment('');
      loadActivity();
    }
    setIsSubmitting(false);
  }

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user?.id) {
      supabase.from('users').select('*').eq('tg_id', tg.initDataUnsafe.user.id).single().then(({data}) => setCurrentUser(data));
    }
    loadActivity();
  }, [postId]);

  if (!post) {
    return (
      <div className="min-h-screen bg-[#090b0e] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="animate-spin text-[#c0ff00]" size={36} />
      </div>
    );
  }

  const embedUrl = post.youtube_url && post.youtube_url.trim().length > 0 
    ? `https://www.youtube.com/embed/${post.youtube_url.split('v=')[1]?.substring(0, 11) || post.youtube_url.split('/').pop()}`
    : null;
  const hasCover = post.cover_url && post.cover_url.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-24 pb-32">
      <div className="w-full max-w-3xl mx-auto flex flex-col">
        
        <div className="sticky top-24 z-50 w-full mb-6">
          <button onClick={() => router.push('/')} className="w-12 h-12 flex items-center justify-center bg-[#14171c]/90 backdrop-blur-xl border border-white/10 rounded-full text-white shadow-2xl active:scale-90 transition-transform">
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[40px] overflow-hidden shadow-2xl flex flex-col mb-6">
          {embedUrl ? (
            <div className="w-full aspect-video bg-black/50">
              <iframe src={embedUrl} className="w-full h-full border-none" allowFullScreen />
            </div>
          ) : hasCover ? (
            <div className="w-full h-64 md:h-96 relative">
              <img src={post.cover_url} className="w-full h-full object-cover" alt="cover" />
            </div>
          ) : null}

          <div className="p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-4">
              <img src={post.author?.avatar_url || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded-full border border-[#c0ff00]/20 object-cover" />
              <div>
                <div className="text-sm font-bold text-white">{post.author?.rp_name}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">{new Date(post.created_at).toLocaleDateString('ru-RU')}</div>
              </div>
            </div>

            <h1 className="text-xl md:text-3xl font-black text-white leading-tight">{post.title}</h1>
            <div className="prose prose-invert max-w-none text-gray-200 text-base md:text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </div>

        {/* ВЕРНУЛИ НА БАЗУ: Весь функциональный блок комментариев */}
        <div className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 shadow-2xl space-y-6">
          <h3 className="text-sm font-black uppercase text-gray-400 tracking-wider">Комментарии ({comments.length})</h3>
          
          {/* Поле ввода комментария */}
          {currentUser && (
            <div className="flex gap-3 items-center bg-black/25 border border-white/5 p-3 rounded-2xl">
              <img src={currentUser.avatar_url || 'https://via.placeholder.com/150'} className="w-8 h-8 rounded-full object-cover shrink-0" />
              <div className="flex-1 flex gap-2">
                <input 
                  type="text" 
                  placeholder="Написать комментарий..." 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSendComment(); }}
                  className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-gray-600 focus:ring-0"
                />
                <button 
                  onClick={handleSendComment} 
                  disabled={isSubmitting || !newComment.trim()}
                  className="p-2 bg-[#c0ff00] text-black rounded-xl disabled:opacity-30 active:scale-95 transition-all shrink-0"
                >
                  {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </div>
          )}

          {/* Список комментариев */}
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="flex gap-3 items-start border-b border-white/5 pb-4 last:border-none last:pb-0">
                <img src={comment.author?.avatar_url || 'https://via.placeholder.com/150'} className="w-8 h-8 rounded-full object-cover shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#c0ff00]">{comment.author?.rp_name || 'Неизвестный'}</span>
                    <span className="text-[10px] text-gray-600 flex items-center gap-1"><Clock size={10} /> {new Date(comment.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed break-words">{comment.content}</p>
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <div className="text-center py-6 text-xs text-gray-500 font-mono">КОММЕНТАРИЕВ ПОКА НЕТ</div>
            )}
          </div>
        </div>

      </div>

      <style jsx global>{`
        body { font-family: var(--font-wix), sans-serif !important; background: #090b0e; }
        .prose h1 { font-size: 1.25rem !important; font-weight: 800 !important; color: #ffffff !important; }
        .prose h2 { font-size: 1.1rem !important; font-weight: 800 !important; color: #c0ff00 !important; }
        .prose p { margin-bottom: 0.75rem; color: #d1d5db !important; transition: all 0.3s ease; }
        .prose b, .prose strong { color: #d1d5db !important; font-weight: 700; }
        .prose i, .prose em { color: #d1d5db !important; font-style: italic; }
      `}</style>
    </div>
  );
}
