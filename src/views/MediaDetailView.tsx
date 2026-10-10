import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTelegram } from '../hooks/useTelegram';
import { OneIcon } from '../components/ui/SFSymbol';
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

export default function StandalonePostDetail() {
  const navigate = useNavigate();
  const params = useParams();
  const postId = params.id as string;
  const { showBackButton, hideBackButton } = useTelegram();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  
  const [newComment, setNewComment] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const [fullscreenAttachment, setFullscreenAttachment] = useState<'cover' | 'youtube' | null>(null);

  const canManage = currentUser && post && (post.author_id === currentUser.id || currentUser.roles?.includes('admin'));

  async function handleDeletePost() {
    if (!confirm('Удалить пост?')) return;
    await supabase.from('posts').delete().eq('id', postId);
    navigate('/');
  }

  async function loadActivity() {
    if (!postId) return;
    const { data: p } = await supabase.from('posts').select('*, author:characters(*, player:players(mc_nickname))').eq('id', postId).single();
    if (p) setPost(p);
    
    const { data: c } = await supabase.from('comments').select('*, author_player:players(id, mc_nickname, avatar_url)').eq('post_id', postId).order('created_at', { ascending: true });
    if (c) setComments(c || []);
  }

  async function handleSendComment(parentId: string | null = null) {
    const content = parentId ? replyContent.trim() : newComment.trim();
    if (!content || !currentUser || isSubmitting) return;
    
    setIsSubmitting(true);
    const { data: char } = await supabase.from('characters').select('player_id').eq('id', currentUser.id).single();
    const playerId = char?.player_id || currentUser.player_id || currentUser.id;

    const { error } = await supabase.from('comments').insert([{
      post_id: postId, author_id: playerId, player_id: playerId, content: content, parent_id: parentId
    }]);

    if (!error) {
      if (parentId) {
        setReplyContent('');
        setReplyingToId(null);
        setExpandedThreads(prev => ({ ...prev, [parentId]: true }));
      } else {
        setNewComment('');
      }
      loadActivity();
    }
    setIsSubmitting(false);
  }

  useEffect(() => {
    showBackButton(() => navigate('/'));
    return () => hideBackButton();
  }, [showBackButton, hideBackButton, navigate]);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user?.id) {
      supabase.from('players').select('id').eq('tg_id', tg.initDataUnsafe.user.id).single().then(async ({data: player}) => {
        if (player) {
          const { data: charId } = await supabase.rpc('get_active_character', { p_player_id: player.id });
          if (charId) {
            const { data: char } = await supabase.from('characters').select('*').eq('id', charId).single();
            if (char) setCurrentUser(char);
          }
        }
      });
    }
    loadActivity();
  }, [postId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !comments.length) return;
    if (window.location.hash === '#comments') {
      const timer = setTimeout(() => {
        const el = document.getElementById('comments');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [comments]);

  if (!post) {
    return (
      <div className="min-h-screen bg-[#090b0e] flex items-center justify-center">
        <OneIcon name="sync" size={32} className="animate-spin text-[#c0ff00]" />
      </div>
    );
  }

  const embedUrl = post.youtube_url ? (post.youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/) ? `https://www.youtube.com/embed/${post.youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/)![1]}` : null) : null;
  const hasCover = post.cover_url && !embedUrl;

  const rootComments = comments.filter((c: any) => !c.parent_id);
  const getCommentReplies = (parentId: string) => comments.filter((c: any) => c.parent_id === parentId);

  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-tma-safe md:pt-10 pb-32 select-none antialiased">
      <div className="w-full max-w-3xl mx-auto flex flex-col">
        {/* Кнопка назад */}
        <div className="w-full mb-6">
          <button 
            onClick={() => navigate('/')} 
            className="w-11 h-11 flex items-center justify-center bg-[#14171c] hover:bg-[#181c23] rounded-full text-white transition-all border-none sf-tap"
          >
            <OneIcon name="arrow_back" size={20} />
          </button>
        </div>

        {/* Главная карточка статьи */}
        <div className="bg-[#14171c] rounded-[32px] overflow-hidden shadow-2xl flex flex-col mb-6 border-none">
          {embedUrl ? (
            <div className="w-full aspect-video bg-black/50 relative group">
              <iframe src={embedUrl} className="w-full h-full border-none" allow="fullscreen; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
              <button 
                onClick={() => setFullscreenAttachment('youtube')} 
                className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10 border-none sf-tap" 
                title="На весь экран"
              >
                <OneIcon name="fullscreen" size={16} />
              </button>
            </div>
          ) : hasCover ? (
            <div onClick={() => setFullscreenAttachment('cover')} className="w-full aspect-video relative cursor-pointer overflow-hidden bg-black/50">
              <img src={post.cover_url} className="w-full h-full object-cover" alt="cover" />
            </div>
          ) : null}

          <div className="p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <Av src={post.author?.avatar_url} size={40} />
                <div className="flex-1">
                  <div className="text-sm font-bold text-white">{post.author?.rp_name}</div>
                  {post.author?.mc_nickname && <div className="text-[10px] text-[#8e8e93] font-mono">{post.author.mc_nickname}</div>}
                  <div className="text-[10px] text-[#8e8e93] font-bold uppercase">{new Date(post.created_at).toLocaleDateString('ru-RU')}</div>
                </div>
              </div>

              {canManage && (
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
                      onClick: handleDeletePost,
                    },
                  ]}
                />
              )}
            </div>

            <h1 className="text-xl md:text-3xl font-black text-white leading-tight">{post.title}</h1>
            <div className="prose prose-invert max-w-none text-gray-300 text-sm md:text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </div>

        {/* Секция комментариев */}
        <div id="comments" className="bg-[#14171c] rounded-[32px] p-6 shadow-2xl space-y-6 scroll-mt-32 border-none">
          <h3 className="text-xs font-black uppercase text-[#8e8e93] tracking-wider">Комментарии ({comments.length})</h3>
          
          {currentUser && (
            <div className="relative flex items-center w-full">
              <input 
                type="text" 
                placeholder="Написать комментарий..." 
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSendComment(); }}
                className="w-full bg-[#181c23] border-none outline-none ring-0 focus:ring-0 rounded-full h-12 pl-5 pr-14 text-sm text-white placeholder-[#8e8e93]"
              />
              <button 
                onClick={() => handleSendComment()} 
                disabled={isSubmitting || !newComment.trim()}
                className="absolute right-2 w-8 h-8 rounded-full flex items-center justify-center bg-[#c0ff00] text-[#090b0e] disabled:opacity-30 active:scale-90 transition-transform shrink-0 border-none sf-tap"
                title="Отправить"
              >
                {isSubmitting ? <OneIcon name="sync" size={14} className="animate-spin" /> : <OneIcon name="send" size={14} />}
              </button>
            </div>
          )}

          <div className="space-y-4">
            {rootComments.map((comment: any) => {
              const replies = getCommentReplies(comment.id);
              const isExpanded = expandedThreads[comment.id];

              return (
                <div key={comment.id} className="space-y-3 pb-3">
                  <div className="flex gap-3 items-start">
                    <Av src={comment.author_player?.avatar_url} size={36} />
                    <div className="flex-1 space-y-1 bg-[#181c23] p-3.5 rounded-2xl border-none">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#c0ff00]">{comment.author_player?.mc_nickname || 'Неизвестный'}</span>
                        <span className="text-[10px] text-[#8e8e93] flex items-center gap-1 font-mono">
                          <OneIcon name="schedule" size={10} /> {new Date(comment.created_at).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed break-words">{comment.content}</p>
                      
                      <div className="flex items-center gap-4 pt-1">
                        {currentUser && (
                          <button 
                            onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                            className="text-[11px] font-bold text-[#8e8e93] hover:text-[#c0ff00] transition-colors"
                          >
                            Ответить
                          </button>
                        )}
                        {replies.length > 0 && (
                          <button 
                            onClick={() => setExpandedThreads(p => ({ ...p, [comment.id]: !p[comment.id] }))}
                            className="text-[11px] font-bold text-[#c0ff00] flex items-center gap-1"
                          >
                            <OneIcon name="chat_bubble" size={12} />
                            <span>{isExpanded ? 'Скрыть ответы' : `Показать ответы (${replies.length})`}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {replyingToId === comment.id && currentUser && (
                    <div className="relative flex items-center w-full ml-11 max-w-[calc(100%-44px)]">
                      <input 
                        type="text" 
                        placeholder={`Ответ жителю ${comment.author_player?.mc_nickname || ''}...`} 
                        value={replyContent}
                        onChange={e => setReplyContent(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSendComment(comment.id); }}
                        className="w-full bg-[#14171c] border-none outline-none ring-0 focus:ring-0 rounded-full h-10 pl-4 pr-12 text-xs text-white placeholder-[#8e8e93]"
                      />
                      <button 
                        onClick={() => handleSendComment(comment.id)} 
                        disabled={isSubmitting || !replyContent.trim()}
                        className="absolute right-1 w-8 h-8 rounded-full flex items-center justify-center bg-[#c0ff00] text-[#090b0e] disabled:opacity-30 border-none sf-tap"
                      >
                        <OneIcon name="send" size={12} />
                      </button>
                    </div>
                  )}

                  {isExpanded && replies.length > 0 && (
                    <div className="ml-11 space-y-3 pt-1 animate-fade-in">
                      {replies.map((reply: any) => (
                        <div key={reply.id} className="flex gap-3 items-start">
                          <Av src={reply.author_player?.avatar_url} size={30} />
                          <div className="flex-1 bg-[#14171c] p-3 rounded-2xl border-none space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">{reply.author_player?.mc_nickname || 'Неизвестный'}</span>
                              <span className="text-[10px] text-[#8e8e93] font-mono">{new Date(reply.created_at).toLocaleDateString('ru-RU')}</span>
                            </div>
                            <p className="text-xs text-gray-300 leading-relaxed break-words">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {fullscreenAttachment && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4">
          <button 
            onClick={() => setFullscreenAttachment(null)} 
            className="absolute top-6 right-6 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white z-10 transition-all border-none sf-tap"
          >
            <OneIcon name="close" size={20} />
          </button>
          {fullscreenAttachment === 'cover' && (
            <img src={post.cover_url} className="max-w-full max-h-full object-contain rounded-2xl" alt="fullscreen cover" />
          )}
          {fullscreenAttachment === 'youtube' && (
            <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden">
              <iframe src={embedUrl!} className="w-full h-full border-none" allow="fullscreen; autoplay" allowFullScreen />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
