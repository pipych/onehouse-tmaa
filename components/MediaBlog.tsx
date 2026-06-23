'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Newspaper, Clock, Heart, MessageCircle, Image as ImageIcon, 
  Youtube, X, Save, Bold, Italic, Strikethrough, 
  Heading1, Heading2, AlignLeft, AlignCenter, Plus, ArrowLeft,
  Check, RefreshCw
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
  author?: Player;
}

interface MediaBlogProps {
  currentUser: Player | null;
  onProfileClick: (player: Player) => void;
  isCreatingPost: boolean;
  setIsCreatingPost: (val: boolean) => void;
}

export default function MediaBlog({ currentUser, onProfileClick, isCreatingPost, setIsCreatingPost }: MediaBlogProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCoverUrl, setNewPostCoverUrl] = useState('');
  const [newPostYoutubeUrl, setNewPostYoutubeUrl] = useState('');
  const [isUploadingPostCover, setIsUploadingPostCover] = useState(false);

  // Стейт для всплывающего окна YouTube
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);

  // Для текстового редактора
  const editorRef = useRef<HTMLDivElement>(null);
  const [formats, setFormats] = useState({
    bold: false, italic: false, strikeThrough: false, h1: false, h2: false, justifyLeft: false, justifyCenter: false
  });

  useEffect(() => {
    loadPosts();
  }, []);

  // Очистка редактора при закрытии
  useEffect(() => {
    if (!isCreatingPost && editorRef.current) {
      editorRef.current.innerHTML = '';
      setNewPostTitle('');
      setNewPostCoverUrl('');
      setNewPostYoutubeUrl('');
    }
  }, [isCreatingPost]);

  const loadPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:users(*)')
      .order('created_at', { ascending: false });
    
    if (data && !error) {
      setPosts(data);
    }
  };

  const checkFormatting = () => {
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
  };

  const execEditorCommand = (command: string, value: string = '') => {
    if (typeof document !== 'undefined') {
      if (command === 'formatBlock') {
        const currentBlock = document.queryCommandValue('formatBlock')?.toLowerCase() || '';
        const valLower = value.toLowerCase();
        
        if ((valLower === 'h1' && currentBlock.includes('h1')) || 
            (valLower === 'h2' && currentBlock.includes('h2'))) {
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
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, setUrlCallback: (url: string) => void, setLoadingState: (loading: boolean) => void) => {
    try {
      setLoadingState(true);
      const file = event.target.files?.[0];
      if (!file) return;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const { error } = await supabase.storage.from('avatars').upload(fileName, file);
      if (error) return alert(`Ошибка загрузки: ${error.message}`);
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      if (urlData) setUrlCallback(urlData.publicUrl);
    } catch (e: any) {
      alert(`Сбой при загрузке: ${e.message}`);
    } finally {
      setLoadingState(false);
    }
  };

  const publishPost = async () => {
    const postContent = editorRef.current?.innerHTML || '';

    if (!newPostTitle.trim() || !postContent.trim() || postContent === '<br>' || !currentUser) {
      alert('Заголовок и текст не могут быть пустыми!');
      return;
    }

    const { error } = await supabase.from('posts').insert([{
      author_id: currentUser.id,
      title: newPostTitle,
      content: postContent,
      cover_url: newPostCoverUrl || null,
      youtube_url: newPostYoutubeUrl || null
    }]);

    if (!error) {
      setIsCreatingPost(false);
      loadPosts(); 
    } else {
      alert(`Ошибка публикации: ${error.message}`);
    }
  };

  const getYoutubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  // --------------------------------------------------------
  // ПОЛНОЭКРАННЫЙ РЕДАКТОР ПОСТА
  // --------------------------------------------------------
  if (isCreatingPost) {
    return (
      <div className="w-full max-w-3xl mx-auto animate-fade-in pb-40 pt-4 md:pt-10 px-2 md:px-0 relative">
        
        {/* Шапка: Кнопка Назад (слева) и Опубликовать (справа) */}
        <div className="flex items-center justify-between mb-8 px-1">
          <button 
            onClick={() => setIsCreatingPost(false)} 
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-sm"
          >
            <ArrowLeft size={18} />
            <span className="text-xs font-black uppercase tracking-wider hidden sm:block">Назад</span>
          </button>

          <button 
            onClick={publishPost} 
            disabled={isUploadingPostCover || !newPostTitle.trim()}
            className="px-6 py-2.5 bg-[#c0ff00] text-black font-black text-xs md:text-sm uppercase tracking-wider rounded-full shadow-[0_0_20px_rgba(192,255,0,0.15)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
          >
            <Save size={16} className="hidden sm:block" /> Опубликовать
          </button>
        </div>

        {/* Раздел Вложений (Большие виджеты сверху) */}
        <div className="mb-8">
          <div className="text-[11px] font-black text-gray-500 mb-3 px-2 uppercase tracking-widest">Вложения</div>
          
          <div className="grid grid-cols-2 gap-4 md:gap-5 px-1">
            {/* Виджет 1: ОБЛОЖКА */}
            <label className={`relative flex flex-col items-center justify-center gap-2 h-36 md:h-48 rounded-[28px] border transition-all cursor-pointer overflow-hidden active:scale-[0.98] group ${newPostCoverUrl ? 'border-[#c0ff00]/40 shadow-[0_0_30px_rgba(192,255,0,0.15)]' : 'bg-[#14171c] border-white/5 hover:border-white/20 hover:bg-[#1a1e24]'}`}>
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20" onChange={(e) => handleFileUpload(e, setNewPostCoverUrl, setIsUploadingPostCover)} disabled={isUploadingPostCover} />
              
              {/* Крестик удаления обложки */}
              {newPostCoverUrl && (
                <button onClick={(e) => { e.preventDefault(); setNewPostCoverUrl(''); }} className="absolute top-3 right-3 z-30 p-2 bg-black/60 hover:bg-red-500 rounded-full text-white transition-all active:scale-90 backdrop-blur-md">
                  <X size={16}/>
                </button>
              )}

              {/* Размытый фон обложки */}
              {newPostCoverUrl && (
                <>
                  <div className="absolute inset-0 z-0 bg-cover bg-center opacity-40 blur-md scale-110" style={{ backgroundImage: `url(${newPostCoverUrl})` }} />
                  <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#c0ff00]/20 to-[#090b0e]/50 opacity-80" />
                </>
              )}

              <div className="relative z-10 flex flex-col items-center pointer-events-none">
                {isUploadingPostCover ? (
                  <RefreshCw className="animate-spin text-[#c0ff00] mb-2" size={28} />
                ) : newPostCoverUrl ? (
                  <div className="bg-[#c0ff00] text-black w-12 h-12 rounded-full flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(192,255,0,0.4)]">
                    <Check size={24} strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-2 group-hover:bg-white/10 transition-colors">
                    <ImageIcon className="text-gray-400 group-hover:text-white transition-colors" size={24} />
                  </div>
                )}
                
                <span className={`text-sm md:text-base font-black tracking-wide ${newPostCoverUrl ? 'text-[#c0ff00] drop-shadow-md' : 'text-gray-400 group-hover:text-white transition-colors'}`}>
                  {isUploadingPostCover ? 'Загрузка...' : newPostCoverUrl ? 'Обложка' : 'Фото'}
                </span>
              </div>
            </label>

            {/* Виджет 2: YOUTUBE */}
            <div 
              onClick={() => setIsYoutubeModalOpen(true)}
              className={`relative flex flex-col items-center justify-center gap-2 h-36 md:h-48 rounded-[28px] border transition-all cursor-pointer overflow-hidden active:scale-[0.98] group ${newPostYoutubeUrl ? 'border-[#c0ff00]/40 shadow-[0_0_30px_rgba(192,255,0,0.15)] bg-gradient-to-tr from-[#14171c] to-[#c0ff00]/10' : 'bg-[#14171c] border-white/5 hover:border-white/20 hover:bg-[#1a1e24]'}`}
            >
              {/* Крестик удаления ютуба */}
              {newPostYoutubeUrl && (
                <button onClick={(e) => { e.stopPropagation(); setNewPostYoutubeUrl(''); }} className="absolute top-3 right-3 z-30 p-2 bg-black/40 hover:bg-red-500 rounded-full text-white transition-all active:scale-90 backdrop-blur-md">
                  <X size={16}/>
                </button>
              )}

              <div className="relative z-10 flex flex-col items-center pointer-events-none">
                {newPostYoutubeUrl ? (
                  <div className="bg-[#c0ff00] text-black w-12 h-12 rounded-full flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(192,255,0,0.4)]">
                    <Check size={24} strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-2 group-hover:bg-red-500/20 transition-colors">
                    <Youtube className="text-gray-400 group-hover:text-red-500 transition-colors" size={24} />
                  </div>
                )}
                
                <span className={`text-sm md:text-base font-black tracking-wide ${newPostYoutubeUrl ? 'text-[#c0ff00] drop-shadow-md' : 'text-gray-400 group-hover:text-white transition-colors'}`}>
                  YouTube
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Заголовок (Перенесен под вложения) */}
        <input 
          type="text" 
          placeholder="Яркий заголовок..." 
          value={newPostTitle} 
          onChange={e => setNewPostTitle(e.target.value)} 
          className="w-full bg-transparent text-3xl md:text-5xl font-black text-white placeholder-gray-700 border-none outline-none mb-8 px-2"
        />

        {/* Превью прикрепленного YouTube */}
        {newPostYoutubeUrl && getYoutubeEmbedUrl(newPostYoutubeUrl) && (
          <div className="w-full rounded-[24px] overflow-hidden border border-white/10 aspect-video bg-black/50 mb-10 shadow-xl mx-1">
            <iframe src={getYoutubeEmbedUrl(newPostYoutubeUrl)!} className="w-full h-full border-none" allowFullScreen />
          </div>
        )}

        {/* Превью прикрепленной картинки */}
        {newPostCoverUrl && !newPostYoutubeUrl && (
          <div className="w-full rounded-[24px] overflow-hidden border border-white/10 max-h-[450px] bg-black/50 relative mb-10 shadow-xl flex justify-center items-center mx-1">
            <img src={newPostCoverUrl} alt="Cover preview" className="w-full h-auto object-cover" />
          </div>
        )}

        {/* Панель форматирования текста (Липкая) */}
        <div className="sticky top-[80px] md:top-[20px] z-40 bg-[#1a1e24]/95 backdrop-blur-xl border border-white/10 p-2 rounded-[20px] flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-2xl mb-6 mx-1">
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('bold')} className={`p-2.5 rounded-[14px] transition-all active:scale-75 flex-shrink-0 ${formats.bold ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><Bold size={18}/></button>
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('italic')} className={`p-2.5 rounded-[14px] transition-all active:scale-75 flex-shrink-0 ${formats.italic ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><Italic size={18}/></button>
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('strikeThrough')} className={`p-2.5 rounded-[14px] transition-all active:scale-75 flex-shrink-0 ${formats.strikeThrough ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><Strikethrough size={18}/></button>
          <div className="w-[2px] h-6 bg-white/10 mx-2 flex-shrink-0 rounded-full" />
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('formatBlock', 'H1')} className={`p-2.5 rounded-[14px] transition-all active:scale-75 flex-shrink-0 ${formats.h1 ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><Heading1 size={18}/></button>
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('formatBlock', 'H2')} className={`p-2.5 rounded-[14px] transition-all active:scale-75 flex-shrink-0 ${formats.h2 ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><Heading2 size={18}/></button>
          <div className="w-[2px] h-6 bg-white/10 mx-2 flex-shrink-0 rounded-full" />
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('justifyLeft')} className={`p-2.5 rounded-[14px] transition-all active:scale-75 flex-shrink-0 ${formats.justifyLeft ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><AlignLeft size={18}/></button>
          <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('justifyCenter')} className={`p-2.5 rounded-[14px] transition-all active:scale-75 flex-shrink-0 ${formats.justifyCenter ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><AlignCenter size={18}/></button>
        </div>

        {/* Текстовый редактор (ContentEditable) */}
        <div 
          ref={editorRef} 
          contentEditable 
          suppressContentEditableWarning 
          onKeyUp={checkFormatting}
          onMouseUp={checkFormatting}
          onInput={checkFormatting}
          className="w-full flex-grow min-h-[40vh] bg-transparent text-lg md:text-xl leading-relaxed text-gray-200 outline-none prose prose-invert max-w-none break-words px-3 pb-10" 
          data-placeholder="Текст вашей статьи..." 
        />

        {/* Модальное окно для YouTube (В САМОМ НИЗУ КОМПОНЕНТА ЧТОБЫ БЫТЬ ПОВЕРХ ВСЕГО) */}
        {isYoutubeModalOpen && (
          <div className="fixed inset-0 z-[9999] bg-[#090b0e]/95 backdrop-blur-md flex items-center justify-center px-4 animate-fade-in">
            <div className="bg-[#14171c] border border-white/10 p-6 md:p-8 rounded-[32px] w-full max-w-md shadow-2xl relative flex flex-col gap-6">
              <button onClick={() => setIsYoutubeModalOpen(false)} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all active:scale-90">
                <X size={20}/>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                  <Youtube size={24} />
                </div>
                <h3 className="text-xl font-black text-white">Видео с YouTube</h3>
              </div>

              <input 
                type="text" 
                placeholder="Вставьте ссылку сюда..." 
                value={newPostYoutubeUrl} 
                onChange={e => setNewPostYoutubeUrl(e.target.value)} 
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-medium text-white outline-none focus:border-red-500/50 transition-all placeholder:text-gray-600"
              />
              <button 
                onClick={() => setIsYoutubeModalOpen(false)} 
                className="w-full bg-[#c0ff00] text-black font-black text-sm uppercase tracking-wider py-4 rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(192,255,0,0.15)] hover:bg-[#a8e600]"
              >
                Сохранить ссылку
              </button>
            </div>
          </div>
        )}

      </div>
    );
  }

  // --------------------------------------------------------
  // ГЛАВНАЯ СТРАНИЦА БЛОГА (ЛЕНТА)
  // --------------------------------------------------------
  return (
    <>
      <div className="space-y-6 animate-fade-in w-full max-w-3xl mx-auto px-2">
        {/* Шапка Ленты */}
        <div className="flex items-center justify-between w-full">
          <h2 className="text-xl md:text-2xl font-black text-white tracking-wide flex items-center gap-3">
            <Newspaper size={24} className="text-[#c0ff00]" />
            .медиа
          </h2>
          
          {/* ПК-Кнопка создания поста (Кружок с плюсом сверху справа) */}
          {currentUser && (
            <button 
              onClick={() => setIsCreatingPost(true)} 
              className="hidden md:flex w-12 h-12 bg-[#c0ff00] text-black rounded-full items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(192,255,0,0.25)]"
            >
              <Plus size={26} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* ЛЕНТА ПОСТОВ */}
        <div className="space-y-8 pb-8">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 bg-[#14171c]/50 rounded-[32px] border border-white/5 shadow-inner mt-4">
              <div className="w-20 h-20 bg-black/40 border border-white/5 rounded-full flex items-center justify-center mb-5 shadow-lg">
                <Newspaper size={32} className="text-gray-500" />
              </div>
              <h3 className="text-lg font-black text-white mb-2 tracking-wide">Здесь пока пусто</h3>
              <p className="text-sm text-gray-400 text-center max-w-[250px]">Станьте первым, кто опубликует новость или статью в блоге сервера!</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden shadow-2xl transition-all hover:border-white/10 group">
                
                {/* Автор */}
                <div className="p-5 md:p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-black/50 border border-white/10 flex-shrink-0 cursor-pointer hover:border-[#c0ff00]/50 transition-colors" onClick={() => { if(post.author) onProfileClick(post.author); }}>
                    <img src={post.author?.avatar_url || 'https://via.placeholder.com/150'} alt="author" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-bold text-white tracking-wide truncate">{post.author?.rp_name || 'Неизвестный'}</div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-0.5">
                      <Clock size={12} /> 
                      {new Date(post.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Медиа */}
                {post.youtube_url && getYoutubeEmbedUrl(post.youtube_url) ? (
                  <div className="w-full aspect-video bg-black/50 border-y border-white/5">
                    <iframe src={getYoutubeEmbedUrl(post.youtube_url)!} className="w-full h-full border-none" allowFullScreen />
                  </div>
                ) : post.cover_url ? (
                  <div className="w-full max-h-[450px] bg-black/50 border-y border-white/5 overflow-hidden flex items-center justify-center">
                    <img src={post.cover_url} alt="cover" className="w-full h-auto object-cover" />
                  </div>
                ) : null}

                {/* Текст поста */}
                <div className="p-5 md:p-6 pt-6">
                  <h3 className="text-2xl md:text-3xl font-black text-white mb-5 leading-tight">{post.title}</h3>
                  <div 
                    className="prose prose-invert max-w-none text-gray-300 text-sm md:text-base leading-relaxed break-words"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </div>

                {/* Подвал */}
                <div className="px-5 md:px-6 pb-5 pt-2 flex items-center gap-6 border-t border-white/5 mt-2 pt-5">
                  <button className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors active:scale-95 group/btn">
                    <div className="p-2.5 rounded-full group-hover/btn:bg-red-400/10 transition-colors"><Heart size={20} /></div>
                    <span className="text-sm font-bold">0</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-400 hover:text-[#c0ff00] transition-colors active:scale-95 group/btn">
                    <div className="p-2.5 rounded-full group-hover/btn:bg-[#c0ff00]/10 transition-colors"><MessageCircle size={20} /></div>
                    <span className="text-sm font-bold">0 Комментариев</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* МОБИЛЬНАЯ КНОПКА СОЗДАНИЯ ПОСТА (Кружок с плюсом справа снизу) */}
      {currentUser && !isCreatingPost && (
        <button 
          onClick={() => setIsCreatingPost(true)}
          className="md:hidden fixed bottom-[90px] right-5 w-14 h-14 bg-[#c0ff00] text-black rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(192,255,0,0.35)] z-40 active:scale-90 transition-transform"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      )}
    </>
  );
}
