'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Send, Clock, RefreshCw, CornerDownRight, MessageCircle, MoreVertical, X, Maximize } from 'lucide-react';

export default function StandalonePostDetail() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  
  const [newComment, setNewComment] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const [activeMenu, setActiveMenu] = useState(false);
  const [fullscreenAttachment, setFullscreenAttachment] = useState<'cover' | 'youtube' | null>(null);

  const canManage = currentUser && post && (post.author_id === currentUser.id || currentUser.roles?.includes('admin'));

  async function handleDeletePost() {
    if (!confirm('Удалить пост?')) return;
    await supabase.from('posts').delete().eq('id', postId);
    router.push('/');
  }

  async function loadActivity() {
    if (!postId) return;
    const { data: p } = await supabase.from('posts').select('*, author:users(*)').eq('id', postId).single();
    if (p) setPost(p);
    
    const { data: c } = await supabase.from('comments').select('*, author:users(*)').eq('post_id', postId).order('created_at', { ascending: true });
    if (c) setComments(c);
  }

  async function handleSendComment(parentId: string | null = null) {
    const content = parentId ? replyContent.trim() : newComment.trim();
    if (!content || !currentUser || isSubmitting) return;
    
    setIsSubmitting(true);
    const { error } = await supabase.from('comments').insert([{
      post_id: postId,
      author_id: currentUser.id,
      content: content,
      parent_id: parentId
    }]);

    if (!error) {
      if (parentId) {
        setReplyContent('');
        setReplyingToId(null);
        // Автоматически раскрываем ветку, куда отправили ответ
        setExpandedThreads(prev => ({ ...prev, [parentId]: true }));
      } else {
        setNewComment('');
      }
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

  // Фильтруем на корневые комменты и ответы
  const rootComments = comments.filter(c => !c.parent_id);
  const getCommentReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-24 pb-32">
      <div className="w-full max-w-3xl mx-auto flex flex-col">
        
        <div className="sticky top-24 z-50 w-full mb-6">
          <button onClick={() => router.push('/')} className="w-12 h-12 flex items-center justify-center bg-[#14171c]/90 backdrop-blur-xl border border-white/10 rounded-full text-white shadow-2xl active:scale-90 transition-transform">
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Карточка поста */}
        <div className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[40px] overflow-hidden shadow-2xl flex flex-col mb-6">
          {embedUrl ? (
            <div className="w-full aspect-video bg-black/50 relative group">
              <iframe src={embedUrl} className="w-full h-full border-none" allow="fullscreen; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
              <button onClick={() => setFullscreenAttachment('youtube')} className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 border border-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10" title="На весь экран"><Maximize size={14} /></button>
            </div>
          ) : hasCover ? (
            <div onClick={() => setFullscreenAttachment('cover')} className="w-full aspect-video relative cursor-pointer overflow-hidden bg-black/50">
              <img src={post.cover_url} className="w-full h-full object-cover" alt="cover" />
            </div>
          ) : null}

          <div className="p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-4">
              <img src={post.author?.avatar_url || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded-full border border-[#c0ff00]/20 object-cover" />
              <div className="flex-1">
                <div className="text-sm font-bold text-white">{post.author?.rp_name}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">{new Date(post.created_at).toLocaleDateString('ru-RU')}</div>
              </div>
              {canManage && (
                <div className="relative">
                  <button onClick={() => setActiveMenu(!activeMenu)} className="p-2 text-gray-400 hover:text-white"><MoreVertical size={20} /></button>
                  {activeMenu && (
                    <div className="absolute right-0 mt-2 w-40 bg-[#1a1e24] border border-white/10 rounded-2xl p-1.5 z-50 shadow-2xl" onClick={e => e.stopPropagation()}>
                      <button onClick={() => router.push(`/media/editor?edit=${post.id}`)} className="w-full text-left px-3 py-2 text-sm font-bold text-gray-200 hover:text-[#c0ff00]">Редактировать</button>
                      <button onClick={handleDeletePost} className="w-full text-left px-3 py-2 text-sm font-bold text-red-400">Удалить</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <h1 className="text-xl md:text-3xl font-black text-white leading-tight">{post.title}</h1>
            <div className="prose prose-invert max-w-none text-gray-200 text-base md:text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </div>

        {/* Блок древовидных комментариев */}
        <div id="comments" className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 shadow-2xl space-y-6 scroll-mt-32">
          <h3 className="text-sm font-black uppercase text-gray-400 tracking-wider">Комментарии ({comments.length})</h3>
          
          {/* Главная форма отправки */}
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
                  onClick={() => handleSendComment()} 
                  disabled={isSubmitting || !newComment.trim()}
                  className="p-2 bg-[#c0ff00] text-black rounded-xl disabled:opacity-30 active:scale-95 transition-all shrink-0"
                >
                  {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </div>
          )}

          {/* Дерево комментариев */}
          <div className="space-y-6">
            {rootComments.map(comment => {
              const replies = getCommentReplies(comment.id);
              const isExpanded = expandedThreads[comment.id];

              return (
                <div key={comment.id} className="space-y-4 border-b border-white/5 pb-4 last:border-none last:pb-0">
                  {/* Корневой комментарий */}
                  <div className="flex gap-3 items-start">
                    <img src={comment.author?.avatar_url || 'https://via.placeholder.com/150'} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#c0ff00]">{comment.author?.rp_name || 'Неизвестный'}</span>
                        <span className="text-[10px] text-gray-600 flex items-center gap-1"><Clock size={10} /> {new Date(comment.created_at).toLocaleDateString('ru-RU')}</span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed break-words">{comment.content}</p>
                      
                      {/* Кнопки взаимодействия */}
                      <div className="flex items-center gap-4 pt-1">
                        {currentUser && (
                          <button 
                            onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                            className="text-[11px] font-bold text-gray-500 hover:text-white transition-colors"
                          >
                            Ответить
                          </button>
                        )}
                        {replies.length > 0 && (
                          <button 
                            onClick={() => setExpandedThreads(p => ({ ...p, [comment.id]: !p[comment.id] }))}
                            className="text-[11px] font-bold text-[#c0ff00]/70 hover:text-[#c0ff00] transition-colors flex items-center gap-1"
                          >
                            <MessageCircle size={12} />
                            <span>{isExpanded ? 'Скрыть ответы' : `Показать ответы (${replies.length})`}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Форма ответа внутри треда */}
                  {replyingToId === comment.id && currentUser && (
                    <div className="flex gap-3 items-center bg-black/40 border border-white/5 p-3 rounded-2xl ml-6 animate-fade-in">
                      <CornerDownRight size={14} className="text-gray-600 shrink-0" />
                      <input 
                        type="text" 
                        placeholder={`Ответ жителю ${comment.author?.rp_name || ''}...`} 
                        value={replyContent}
                        onChange={e => setReplyContent(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSendComment(comment.id); }}
                        className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-gray-600 focus:ring-0"
                      />
                      <button 
                        onClick={() => handleSendComment(comment.id)} 
                        disabled={isSubmitting || !replyContent.trim()}
                        className="p-2 bg-[#c0ff00] text-black rounded-xl disabled:opacity-30"
                      >
                        <Send size={12} />
                      </button>
                    </div>
                  )}

                  {/* Вложенные ответы (Реплаи) */}
                  {isExpanded && replies.length > 0 && (
                    <div className="ml-6 pl-4 border-l border-white/5 space-y-4 pt-2 animate-fade-in">
                      {replies.map(reply => (
                        <div key={reply.id} className="flex gap-3 items-start">
                          <CornerDownRight size={14} className="text-gray-600 mt-2 shrink-0" />
                          <img src={reply.author?.avatar_url || 'https://via.placeholder.com/150'} className="w-7 h-7 rounded-full object-cover shrink-0" />
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-400">{reply.author?.rp_name || 'Неизвестный'}</span>
                              <span className="text-[9px] text-gray-600">{new Date(reply.created_at).toLocaleDateString('ru-RU')}</span>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed break-words">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {rootComments.length === 0 && (
              <div className="text-center py-6 text-xs text-gray-500 font-mono">КОММЕНТАРИЕВ ПОКА НЕТ</div>
            )}
          </div>
        </div>

      </div>

      {/* Полноэкранный просмотр вложения */}
      {fullscreenAttachment && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in" onClick={() => setFullscreenAttachment(null)}>
          <button onClick={() => setFullscreenAttachment(null)} className="absolute top-20 right-4 md:top-6 md:right-6 w-12 h-12 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full flex items-center justify-center text-white z-10 transition-all"><X size={22} /></button>
          {fullscreenAttachment === 'cover' ? (
            <img src={post.cover_url} className="max-w-full max-h-full object-contain rounded-xl" alt="cover" onClick={e => e.stopPropagation()} />
          ) : (
            <div className="w-full max-w-5xl aspect-video" onClick={e => e.stopPropagation()}>
              <iframe src={embedUrl} className="w-full h-full rounded-xl" allow="fullscreen; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            </div>
          )}
        </div>
      )}

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
