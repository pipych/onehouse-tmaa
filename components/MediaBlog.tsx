'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Newspaper, Clock, Heart, MessageCircle, Image as ImageIcon, 
  Youtube, X, Send, Bold, Italic, Strikethrough, 
  Heading1, Heading2, AlignLeft, AlignCenter, Plus, ArrowLeft,
  Check, RefreshCw, MoreVertical, Share2, ChevronDown, ChevronUp, CornerDownRight
} from 'lucide-react';

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
  published_at: string | null;
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

interface MediaBlogProps {
  currentUser: Player | null;
  onProfileClick: (player: Player) => void;
  isCreatingPost: boolean;
  setIsCreatingPost: (val: boolean) => void;
}

export default function MediaBlog({ currentUser, onProfileClick, isCreatingPost, setIsCreatingPost }: MediaBlogProps) {
  const POSTS_PER_PAGE = 4;
  
  // Состояния (States)
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null); 
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false); 
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCoverUrl, setNewPostCoverUrl] = useState('');
  const [newPostYoutubeUrl, setNewPostYoutubeUrl] = useState('');
  const [isUploadingPostCover, setIsUploadingPostCover] = useState(false);
  const [newPostPublishedAtInput, setNewPostPublishedAtInput] = useState<string>(''); 

  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [postLikes, setPostLikes] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [postCommentCounts, setPostCommentCounts] = useState<Record<string, number>>({}); 
  const [commentLikes, setCommentLikes] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [newReplyText, setNewReplyText] = useState('');
  
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [expandedThreads, setExpandedReplyThreads] = useState<Record<string, boolean>>({});

  // Вычисляемые свойства глобального уровня
  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  // Ссылки (Refs)
  const editorRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  
  const [formats, setFormats] = useState({
    bold: false, italic: false, strikeThrough: false, h1: false, h2: false, justifyLeft: false, justifyCenter: false
  });

  // --------------------------------------------------------
  // НАТИВНЫЕ ХОЙСТИНГ-ФУНКЦИИ
  // --------------------------------------------------------
  
  // Новая функция: Конвертация любого изображения в WebP blob на клиенте
  function convertToWebP(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Не удалось создать контекст Canvas'));
          
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Ошибка конвертации в WebP'));
          }, 'image/webp', 0.85); // Качество сжатия 85%
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  function getYoutubeEmbedUrl(url: string) {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  }

  function stripHtml(html: string) {
    if (typeof document === 'undefined') return html.replace(/<[^>]*>?/gm, '');
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  function formatPillDate(val: string) {
    if (!val) return 'Дата';
    try {
      return new Date(val).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Дата';
    }
  }

  function handleDatePillClick() {
    if (dateInputRef.current) {
      try { dateInputRef.current.showPicker(); } catch (e) { dateInputRef.current.click(); }
    }
  }

  function canManagePost(post: Post) {
    if (!currentUser) return false;
    return post.author_id === currentUser.id || currentUser.roles?.includes('admin');
  }

  function checkFormatting() {
    if (typeof document === 'undefined') return;
    try {
      const formatBlock = document.queryCommandValue('formatBlock')?.toLowerCase() || '';
      setFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        h1: formatBlock.includes('h1'),
        h2: formatBlock.includes('h2'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
      });
    } catch (e) {}
  }

  function execEditorCommand(command: string, value: string = '') {
    if (typeof document !== 'undefined') {
      if (command === 'formatBlock') {
        const currentBlock = document.queryCommandValue('formatBlock')?.toLowerCase() || '';
        const valLower = value.toLowerCase();
        if ((valLower === 'h1' && currentBlock.includes('h1')) || (valLower === 'h2' && currentBlock.includes('h2'))) {
          document.execCommand(command, false, 'P');
        } else {
          document.execCommand(command, false, value);
        }
      } else {
        document.execCommand(command, false, value);
      }
      if (editorRef.current) editorRef.current.focus();
      setTimeout(checkFormatting, 50);
    }
  }

  async function loadLikesForPosts(postIds: string[]) {
    try {
      if (!postIds.length) return;
      const { data: counts } = await supabase.from('post_likes').select('post_id');
      let myLikes: string[] = [];
      if (currentUser) {
        const { data: userLikes } = await supabase.from('post_likes').select('post_id').eq('user_id', currentUser.id);
        if (userLikes) myLikes = userLikes.map(l => l.post_id);
      }

      const likesMap: Record<string, { count: number; liked: boolean }> = {};
      postIds.forEach(id => {
        const count = counts?.filter(c => c.post_id === id).length || 0;
        likesMap[id] = { count, liked: myLikes.includes(id) };
      });
      setPostLikes(prev => ({ ...prev, ...likesMap }));
    } catch (e) {}
  }

  async function loadCommentCounts(postIds: string[]) {
    try {
      if (!postIds.length) return;
      const { data, error } = await supabase.from('comments').select('post_id');
      if (data && !error) {
        const countsMap: Record<string, number> = {};
        postIds.forEach(id => {
          countsMap[id] = data.filter(c => c.post_id === id).length;
        });
        setPostCommentCounts(prev => ({ ...prev, ...countsMap }));
      }
    } catch (e) {}
  }

  async function handlePostLike(e: React.MouseEvent, postId: string) {
    e.stopPropagation();
    if (!currentUser) return alert('Авторизуйтесь, чтобы ставить лайки!');

    try {
      const isLiked = postLikes[postId]?.liked;
      if (isLiked) {
        await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', currentUser.id);
        setPostLikes(prev => ({
          ...prev,
          [postId]: { count: Math.max(0, (prev[postId]?.count || 1) - 1), liked: false }
        }));
      } else {
        await supabase.from('post_likes').insert([{ post_id: postId, user_id: currentUser.id }]);
        setPostLikes(prev => ({
          ...prev,
          [postId]: { count: (prev[postId]?.count || 0) + 1, liked: true }
        }));
      }
    } catch (e) {}
  }

  async function loadCommentsAndTheirLikes(postId: string) {
    try {
      const { data: commentData } = await supabase
        .from('comments')
        .select('*, author:users(*)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentData) {
        const formattedComments = commentData.map((c: any) => {
          let parentName = '';
          if (c.parent_id) {
            const parentComment = commentData.find((p: any) => p.id === c.parent_id);
            parentName = parentComment?.author?.rp_name || 'Удалено';
          }
          return { ...c, parent_author_name: parentName };
        });
        setComments(formattedComments);

        const { data: clCounts } = await supabase.from('comment_likes').select('comment_id');
        let myCLikes: string[] = [];
        if (currentUser) {
          const { data: userCLikes } = await supabase.from('comment_likes').select('comment_id').eq('user_id', currentUser.id);
          if (userCLikes) myCLikes = userCLikes.map(l => l.comment_id);
        }

        const clMap: Record<string, { count: number; liked: boolean }> = {};
        commentData.forEach((c: any) => {
          const count = clCounts?.filter(cl => cl.comment_id === c.id).length || 0;
          clMap[c.id] = { count, liked: myCLikes.includes(c.id) };
        });
        setCommentLikes(clMap);
        setPostCommentCounts(prev => ({ ...prev, [postId]: formattedComments.length }));
      }
    } catch (e) {}
  }

  async function handleSendComment(parentId: string | null = null) {
    if (!currentUser) return alert('Только авторизованные игроки могут писать комментарии!');
    const text = parentId ? newReplyText : newCommentText;
    if (!text.trim() || !selectedPost) return;

    try {
      const { error } = await supabase.from('comments').insert([{
        post_id: selectedPost.id,
        author_id: currentUser.id,
        parent_id: parentId,
        content: text.trim()
      }]);

      if (!error) {
        if (parentId) {
          setNewReplyText('');
          setReplyingToId(null);
        } else {
          setNewCommentText('');
        }
        loadCommentsAndTheirLikes(selectedPost.id);
      }
    } catch (e) {}
  }

  async function handleCommentLike(commentId: string) {
    if (!currentUser) return alert('Авторизуйтесь, чтобы оценивать комментарии!');
    try {
      const isLiked = commentLikes[commentId]?.liked;
      if (isLiked) {
        await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', currentUser.id);
        setCommentLikes(prev => ({
          ...prev,
          [commentId]: { count: Math.max(0, (prev[commentId]?.count || 1) - 1), liked: false }
        }));
      } else {
        await supabase.from('comment_likes').insert([{ comment_id: commentId, user_id: currentUser.id }]);
        setCommentLikes(prev => ({
          ...prev,
          [commentId]: { count: (prev[commentId]?.count || 0) + 1, liked: true }
        }));
      }
    } catch (e) {}
  }

  async function fetchPosts(page: number, append: boolean = false) {
    const from = (page - 1) * POSTS_PER_PAGE;
    const to = page * POSTS_PER_PAGE - 1;

    try {
      const { data, error, count } = await supabase
        .from('posts')
        .select('*, author:users(*)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (data && !error) {
        if (append) {
          setPosts(prev => [...prev, ...data]);
        } else {
          setPosts(data);
        }
        if (count !== null) setTotalCount(count);
        
        const ids = data.map(p => p.id);
        loadLikesForPosts(ids);
        loadCommentCounts(ids);
        return data;
      }
    } catch (e) {}
    return [];
  }

  // ИСПРАВЛЕНО: Теперь загрузка файла перехватывает изображение, конвертирует в WebP и отправляет в Supabase
  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>, setUrlCallback: (url: string) => void, setLoadingState: (loading: boolean) => void) {
    try {
      setLoadingState(true);
      const file = event.target.files?.[0];
      if (!file) return;

      // Конвертируем файл в формат WebP прямо на клиенте
      const webpBlob = await convertToWebP(file);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.webp`;

      const { error } = await supabase.storage.from('avatars').upload(fileName, webpBlob, {
        contentType: 'image/webp'
      });
      
      if (error) return alert(`Ошибка загрузки: ${error.message}`);
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      if (urlData) setUrlCallback(urlData.publicUrl);
    } catch (e: any) {
      alert(`Сбой при загрузке: ${e.message}`);
    } finally {
      setLoadingState(false);
    }
  }

  async function publishPost() {
    const postContent = editorRef.current?.innerHTML || '';
    if (!newPostTitle.trim() || !postContent.trim() || postContent === '<br>' || !currentUser) {
      alert('Заголовок и текст не могут быть пустыми!');
      return;
    }

    let finalCreatedAt = newPostPublishedAtInput ? new Date(newPostPublishedAtInput).toISOString() : new Date().toISOString();

    const postData = {
      author_id: currentUser.id,
      title: newPostTitle,
      content: postContent,
      cover_url: newPostCoverUrl || null,
      youtube_url: newPostYoutubeUrl || null,
      created_at: finalCreatedAt
    };

    let error;
    if (editingPostId) {
      const { error: updateError } = await supabase.from('posts').update(postData).eq('id', editingPostId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('posts').insert([postData]);
      error = insertError;
    }

    if (!error) {
      setIsCreatingPost(false);
      setEditingPostId(null);
      setCurrentPage(1);
      fetchPosts(1, false); 
    } else {
      alert(`Ошибка сохранения: ${error.message}`);
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm('Вы действительно хотите удалить эту публикацию?')) return;
    
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (!error) {
      setActiveMenuPostId(null);
      handleClosePost();
      fetchPosts(currentPage, false);
    } else {
      alert(`Ошибка при удалении: ${error.message}`);
    }
  }

  function loadMorePosts() {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchPosts(nextPage, true);
  }

  function handlePageSelect(pageIdx: number) {
    setCurrentPage(pageIdx);
    fetchPosts(pageIdx, false);
  }

  function renderCommentBlock(comment: BlogComment, isReply: boolean = false) {
    const isLongText = comment.content.length > 75;
    const isExpanded = expandedComments[comment.id];
    
    return (
      <div key={comment.id} className={`flex gap-3 items-start group/comment ${isReply ? 'mt-3 pl-4 border-l-2 border-white/5' : 'mt-5'}`}>
        {isReply && <CornerDownRight size={14} className="text-gray-600 mt-2 shrink-0" />}
        
        <img 
          src={comment.author?.avatar_url || 'https://via.placeholder.com/150'} 
          alt="avatar" 
          style={{
            width: '36px',
            height: '36px',
            minWidth: '36px',
            minHeight: '36px',
            maxWidth: '36px',
            maxHeight: '36px',
            borderRadius: '50%',
            objectFit: 'cover',
            display: 'block',
            flexShrink: 0
          }}
          className="border border-white/5 select-none"
        />
        
        <div className="flex-1 bg-white/[0.02] border border-white/5 p-3 rounded-2xl relative min-w-0">
          <div className="flex justify-between items-center mb-1 select-none">
            <span className="text-xs font-black text-white">{comment.author?.rp_name}</span>
            <span className="text-[10px] text-gray-500 font-mono">{new Date(comment.created_at).toLocaleDateString('ru-RU')}</span>
          </div>

          <div className="text-sm text-gray-300 break-words leading-relaxed pr-6">
            {comment.parent_id && <span className="text-[#c0ff00] font-bold mr-1.5">@{comment.parent_author_name}</span>}
            <span className={isLongText && !isExpanded ? 'line-clamp-1' : ''}>{comment.content}</span>
          </div>

          {isLongText && (
            <button 
              onClick={() => setExpandedComments(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}
              className="absolute right-2 bottom-2 p-1 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}

          <div className="flex items-center gap-3 mt-2 select-none text-[11px] font-bold">
            <button 
              onClick={() => handleCommentLike(comment.id)} 
              className={`flex items-center gap-1 transition-colors ${commentLikes[comment.id]?.liked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'}`}
            >
              <Heart size={12} fill={commentLikes[comment.id]?.liked ? "currentColor" : "none"} />
              <span>{commentLikes[comment.id]?.count || 0}</span>
            </button>

            {!isReply && currentUser && (
              <button onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)} className="text-gray-500 hover:text-[#c0ff00]">
                Ответить
              </button>
            )}
          </div>

          {replyingToId === comment.id && (
            <div className="mt-3 flex gap-2 items-center animate-fade-in">
              <input 
                type="text" 
                placeholder={`Ответ для ${comment.author?.rp_name}...`}
                value={newReplyText}
                onChange={e => setNewReplyText(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-full p-2 px-4 text-xs text-white outline-none focus:border-[#c0ff00]/40"
              />
              <button onClick={() => handleSendComment(comment.id)} className="w-8 h-8 rounded-full bg-[#c0ff00] text-black flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                <Send size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  useEffect(() => {
    const initBlog = async () => {
      const fetched = await fetchPosts(1, false);

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const postIdFromUrl = params.get('post');
        if (postIdFromUrl) {
          const targetPost = fetched.find(p => p.id === postIdFromUrl);
          if (targetPost) {
            handleOpenPost(targetPost);
          } else {
            const { data } = await supabase.from('posts').select('*, author:users(*)').eq('id', postIdFromUrl).single();
            if (data) handleOpenPost(data);
          }
        }
      }
    };
    initBlog();
  }, []);

  return (
    <>
      {/* ЭКРАН ОТДЕЛЬНОГО ПОСТА */}
      {selectedPost && (
        <div className="w-full max-w-3xl mx-auto animate-fade-in pb-32 px-4 md:px-0 flex flex-col">
          <div className="w-full select-none flex" style={{ paddingTop: '20px', marginBottom: '44px' }}>
            <button onClick={handleClosePost} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-gray-300 hover:text-white transition-all active:scale-90 shadow-lg shrink-0"><ArrowLeft size={20} /></button>
          </div>

          <div className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden shadow-2xl flex flex-col pt-2 relative">
            <div className="p-5 md:p-6 pb-2 flex items-center justify-between select-none">
              <div className="flex items-center gap-4">
                <img src={selectedPost.author?.avatar_url || 'https://via.placeholder.com/150'} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onClick={() => onProfileClick(selectedPost.author!)} className="bg-black/50 border border-white/10 cursor-pointer" alt="avatar" />
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-white truncate">{selectedPost.author?.rp_name || 'Неизвестный'}</div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-0.5"><Clock size={12} /> {selectedPost.created_at ? new Date(selectedPost.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</div>
                </div>
              </div>
              {canManagePost(selectedPost) && <button onClick={() => handleDeletePost(selectedPost.id)} className="p-2 text-red-400 hover:text-red-300 text-xs font-bold bg-red-500/10 rounded-xl">Удалить</button>}
            </div>

            {selectedPost.youtube_url && (
              <div className="px-5 md:px-6 w-full mb-4">
                <div className="w-full relative h-0 rounded-2xl overflow-hidden bg-black/50 shadow-md" style={{ paddingBottom: '56.25%' }}>
                  <iframe src={getYoutubeEmbedUrl(selectedPost.youtube_url)!} className="absolute inset-0 w-full h-full border-none" allowFullScreen loading="lazy" />
                </div>
              </div>
            )}
            {selectedPost.cover_url && !selectedPost.youtube_url && (
              <div className="px-5 md:px-6 w-full mb-4">
                <div onClick={() => setIsImageZoomOpen(true)} className="w-full relative h-0 rounded-2xl overflow-hidden bg-black/50 shadow-md cursor-zoom-in" style={{ paddingBottom: '56.25%' }}>
                  <img src={selectedPost.cover_url} className="absolute inset-0 w-full h-full object-cover" loading="lazy" alt="cover" />
                </div>
              </div>
            )}

            <div className="p-5 md:p-6 pt-2 flex flex-col gap-5 flex-grow">
              <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">{selectedPost.title}</h1>
              <div className="prose prose-invert max-w-none text-gray-300 text-base" dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
              <div className="flex items-center justify-start gap-3 mt-2 select-none">
                <button onClick={(e) => handlePostLike(e, selectedPost.id)} className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-full text-xs font-bold transition-all ${postLikes[selectedPost.id]?.liked ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/5 text-gray-400 hover:text-red-400'}`}><Heart size={15} fill={postLikes[selectedPost.id]?.liked ? "currentColor" : "none"} /> <span>{postLikes[selectedPost.id]?.count || 0}</span></button>
                <button onClick={(e) => handleSharePost(e, selectedPost.id)} className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full text-gray-400 hover:text-[#c0ff00] text-xs font-bold"><Share2 size={15} /> <span>{copiedPostId === selectedPost.id ? 'Скопировано!' : 'Ссылка'}</span></button>
              </div>
            </div>
          </div>

          {/* КОММЕНТАРИИ */}
          <div className="bg-[#14171c]/60 backdrop-blur-xl border border-white/5 rounded-[32px] p-5 md:p-6 shadow-xl" style={{ marginTop: '56px' }}>
            <h3 className="text-lg font-black text-white mb-5 flex items-center gap-2"><MessageCircle size={20} className="text-[#c0ff00]" /> <span>Обсуждение ({comments.length})</span></h3>
            <div className="flex gap-3 items-center" style={{ marginBottom: '36px' }}>
              <input type="text" placeholder="Напишите свое мнение..." value={newCommentText} onChange={e => setNewCommentText(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-full p-4 px-6 text-sm text-white outline-none focus:border-[#c0ff00]/40 placeholder:text-gray-600 shadow-inner" />
              <button onClick={() => handleSendComment(null)} className="w-12 h-12 rounded-full flex items-center justify-center bg-[#c0ff00] text-black shadow-lg shrink-0 active:scale-90"><Send size={18} /></button>
            </div>

            <div className="divide-y divide-white/5">
              {comments.filter(c => !c.parent_id).map(mainComment => {
                const replies = comments.filter(r => r.parent_id === mainComment.id);
                return (
                  <div key={mainComment.id} className="pb-4">
                    {renderCommentBlock(mainComment, false)}
                    {replies.length > 0 && (
                      <div className="pl-12 mt-2">
                        <button onClick={() => setExpandedReplyThreads(prev => ({ ...prev, [mainComment.id]: !prev[mainComment.id] }))} className="flex items-center gap-1.5 text-xs font-black text-[#c0ff00] bg-[#c0ff00]/5 px-3 py-1.5 rounded-full">
                          <span>{expandedThreads[mainComment.id] ? 'Скрыть ответы' : `Ответы (${replies.length})`}</span>
                        </button>
                      </div>
                    )}
                    {replies.length > 0 && expandedThreads[mainComment.id] && <div className="pl-8 animate-fade-in">{replies.map(reply => renderCommentBlock(reply, true))}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* РЕДАКТОР СТАТЬИ */}
      {isCreatingPost && !selectedPost && (
        <div className="w-full max-w-3xl mx-auto animate-fade-in pb-40 px-4 md:px-0 flex flex-col pt-6">
          <div className="flex items-center justify-between w-full select-none" style={{ marginBottom: '48px' }}>
            <button onClick={() => setIsCreatingPost(false)} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-gray-300 hover:text-white transition-all"><ArrowLeft size={20} /></button>
            <button onClick={publishPost} disabled={isUploadingPostCover || !newPostTitle.trim()} className="w-12 h-12 flex items-center justify-center bg-[#c0ff00] text-black rounded-full shadow-lg"><Send size={20} /></button>
          </div>

          <div className="w-full" style={{ marginBottom: '54px' }}>
            <div className="text-[11px] font-black text-gray-500 mb-3 px-1 uppercase tracking-widest">Параметры</div>
            <div className="flex flex-wrap items-center gap-3">
              <div onClick={handleDatePillClick} className="relative flex items-center gap-2 border px-4 py-2 rounded-full cursor-pointer bg-white/5 border-white/10 text-gray-400"><Clock size={14} /> <span>{formatPillDate(newPostPublishedAtInput)}</span><input ref={dateInputRef} type="datetime-local" value={newPostPublishedAtInput} onChange={e => setNewPostPublishedAtInput(e.target.value)} style={{ colorScheme: 'dark' }} className="absolute pointer-events-none opacity-0 w-0 h-0" /></div>
              <label className="relative flex items-center gap-2 border px-4 py-2 rounded-full cursor-pointer bg-white/5 border-white/10 text-gray-400"><input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, setNewPostCoverUrl, setIsUploadingPostCover)} /><ImageIcon size={14} /> <span>Фото</span></label>
              <button onClick={() => setIsYoutubeModalOpen(true)} className="flex items-center gap-2 border px-4 py-2 rounded-full bg-white/5 border-white/10 text-gray-400"><Youtube size={14} /> <span>YouTube</span></button>
            </div>
          </div>

          <input type="text" placeholder="Яркий заголовок..." value={newPostTitle} onChange={e => setNewPostTitle(e.target.value)} className="w-full bg-transparent text-3xl md:text-5xl font-black text-white border-none outline-none mb-8" />
          {newPostCoverUrl && <div className="w-full rounded-[24px] overflow-hidden relative mb-8" style={{ aspectRatio: '16/9' }}><img src={newPostCoverUrl} className="w-full h-full object-cover" alt="Cover preview" /></div>}
          <div ref={editorRef} contentEditable className="w-full min-h-[40vh] bg-transparent text-lg text-gray-200 outline-none prose prose-invert max-w-none focus:outline-none" data-placeholder="Текст вашей статьи..." />
        </div>
      )}

      {/* ГЛАВНАЯ ЛЕНТА */}
      {!isCreatingPost && !selectedPost && (
        <div className="space-y-6 animate-fade-in w-full max-w-3xl mx-auto px-2">
          <div className="flex items-center justify-between w-full select-none">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-wide flex items-center gap-3"><Newspaper size={24} className="text-[#c0ff00]" /> .медиа</h2>
            {currentUser && <button onClick={() => setIsCreatingPost(true)} className="w-12 h-12 bg-[#c0ff00] text-black rounded-full flex items-center justify-center shadow-lg"><Plus size={26} /></button>}
          </div>

          <div className="flex flex-col gap-8 pb-8">
            {posts.map(post => (
              <div key={post.id} onClick={() => handleOpenPost(post)} className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden shadow-2xl transition-all hover:border-white/10 group cursor-pointer flex flex-col pt-2 relative">
                <div className="p-5 md:p-6 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={post.author?.avatar_url || 'https://via.placeholder.com/150'} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} className="bg-black/50 border border-white/10" alt="author" />
                    <div>
                      <div className="text-base font-bold text-white truncate">{post.author?.rp_name}</div>
                      <div className="text-xs text-gray-500 font-medium">{post.created_at ? new Date(post.created_at).toLocaleDateString('ru-RU') : ''}</div>
                    </div>
                  </div>
                </div>

                {post.cover_url && <div className="px-5 md:px-6 w-full mb-2"><div className="w-full relative h-0 rounded-2xl overflow-hidden bg-black/50" style={{ paddingBottom: '56.25%' }}><img src={post.cover_url} alt="cover" className="absolute inset-0 w-full h-full object-cover" loading="lazy" /></div></div>}

                <div className="p-5 md:p-6 pt-4 flex flex-col gap-4 flex-grow">
                  <h3 className="text-2xl font-black text-white mb-2 truncate">{post.title}</h3>
                  <p className="text-gray-400 text-sm truncate">{stripHtml(post.content)}</p>
                  <div className="flex items-center justify-start gap-3 bg-transparent select-none" onClick={e => e.stopPropagation()}>
                    <button onClick={(e) => handlePostLike(e, post.id)} className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-full text-xs font-bold transition-all ${postLikes[post.id]?.liked ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/5 text-gray-400 hover:text-red-400'}`}><Heart size={15} fill={postLikes[post.id]?.liked ? "currentColor" : "none"} /> <span>{postLikes[post.id]?.count || 0}</span></button>
                    <button onClick={() => handleOpenPost(post)} className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-full text-gray-400 hover:text-[#c0ff00] text-xs font-bold font-mono"><MessageCircle size={15} /> <span>{postCommentCounts[post.id] || 0}</span></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ПАГИНАЦИЯ */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <button key={pageNum} onClick={() => handlePageSelect(pageNum)} className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-black ${currentPage === pageNum ? 'bg-[#c0ff00] text-black shadow-md scale-105' : 'bg-white/5 text-gray-500 hover:text-white'}`}>{pageNum}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
