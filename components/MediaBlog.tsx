'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Newspaper, Edit2, Clock, Heart, MessageCircle, Image as ImageIcon, 
  Youtube, X, Save, Upload, Bold, Italic, Strikethrough, 
  Heading1, Heading2, AlignLeft, AlignCenter 
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

  // Для текстового редактора
  const editorRef = useRef<HTMLDivElement>(null);
  const [formats, setFormats] = useState({
    bold: false, italic: false, strikeThrough: false, h1: false, h2: false, justifyLeft: false, justifyCenter: false
  });

  useEffect(() => {
    loadPosts();
  }, []);

  // Очистка редактора при закрытии/открытии окна
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

  // Проверка активных форматов текста
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

  // Применение форматирования
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

  return (
    <>
      {/* ГЛАВНАЯ СТРАНИЦА БЛОГА */}
      <div className="space-y-6 animate-fade-in w-full max-w-2xl mx-auto">
        {/* Шапка */}
        <div className="flex items-center justify-between w-full px-1">
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <Newspaper size={18} className="text-[#c0ff00]" />
            .медиа
          </h2>
          {currentUser && (
            <button 
              onClick={() => setIsCreatingPost(true)} 
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
            >
              <Edit2 size={12} /> Написать
            </button>
          )}
        </div>

        {/* ЛЕНТА ПОСТОВ */}
        <div className="space-y-6 pb-8">
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
              <div key={post.id} className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[28px] overflow-hidden shadow-xl transition-all hover:border-white/10 group">
                
                {/* Автор */}
                <div className="p-4 md:p-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-black/50 border border-white/10 flex-shrink-0 cursor-pointer hover:border-[#c0ff00]/50 transition-colors" onClick={() => { if(post.author) onProfileClick(post.author); }}>
                    <img src={post.author?.avatar_url || 'https://via.placeholder.com/150'} alt="author" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white tracking-wide truncate">{post.author?.rp_name || 'Неизвестный'}</div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                      <Clock size={10} /> 
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
                  <div className="w-full max-h-[400px] bg-black/50 border-y border-white/5 overflow-hidden">
                    <img src={post.cover_url} alt="cover" className="w-full h-full object-cover" />
                  </div>
                ) : null}

                {/* Текст поста (Рендерим HTML) */}
                <div className="p-4 md:p-5 pt-5">
                  <h3 className="text-2xl font-black text-white mb-4 leading-tight">{post.title}</h3>
                  <div 
                    className="prose prose-invert max-w-none text-gray-300 text-sm md:text-base leading-relaxed break-words"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </div>

                {/* Подвал (Кнопки) */}
                <div className="px-4 md:px-5 pb-4 pt-1 flex items-center gap-4 border-t border-white/5 mt-2 pt-4">
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 transition-colors active:scale-95 group/btn">
                    <div className="p-2 rounded-full group-hover/btn:bg-red-400/10 transition-colors"><Heart size={18} /></div>
                    <span className="text-xs font-bold">0</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-[#c0ff00] transition-colors active:scale-95 group/btn">
                    <div className="p-2 rounded-full group-hover/btn:bg-[#c0ff00]/10 transition-colors"><MessageCircle size={18} /></div>
                    <span className="text-xs font-bold">0 Комментариев</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ПОЛНОЭКРАННОЕ ОКНО СОЗДАНИЯ ПОСТА */}
      {isCreatingPost && (
        <div className="fixed inset-0 z-[60] bg-[#090b0e] overflow-y-auto no-scrollbar animate-fade-in flex flex-col">
          
          {/* Плавающая шапка */}
          <div className="sticky top-0 z-50 bg-[#090b0e]/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
              <Newspaper size={18} className="text-[#c0ff00]" />
              Создание поста
            </h2>
            <button onClick={() => setIsCreatingPost(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all active:scale-90">
              <X size={18} />
            </button>
          </div>

          <div className="p-4 md:p-8 max-w-3xl mx-auto w-full flex-grow flex flex-col space-y-4">
            
            {/* Заголовок */}
            <input 
              type="text" 
              placeholder="Яркий заголовок..." 
              value={newPostTitle} 
              onChange={e => setNewPostTitle(e.target.value)} 
              className="w-full bg-transparent border-none text-2xl md:text-4xl font-black text-white outline-none placeholder:text-gray-600 px-2"
            />

            {/* Медиа-кнопки (Обложка + YouTube) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-2">
              <div className="w-full">
                <label className="flex items-center justify-center gap-2 py-3 px-4 bg-white/5 border border-white/10 hover:border-[#c0ff00]/40 rounded-[16px] cursor-pointer transition-all active:scale-[0.98] group relative overflow-hidden">
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => handleFileUpload(e, setNewPostCoverUrl, setIsUploadingPostCover)} disabled={isUploadingPostCover} />
                  <ImageIcon size={16} className={newPostCoverUrl ? "text-[#c0ff00]" : "text-gray-400 group-hover:text-white"} />
                  <span className={`text-xs font-bold truncate ${newPostCoverUrl ? "text-[#c0ff00]" : "text-gray-400 group-hover:text-white"}`}>
                    {isUploadingPostCover ? 'Загрузка...' : (newPostCoverUrl ? 'Обложка загружена' : 'Картинка обложки')}
                  </span>
                </label>
              </div>
              
              <div className="w-full relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><Youtube size={16} /></div>
                <input 
                  type="text" 
                  placeholder="Ссылка на YouTube..." 
                  value={newPostYoutubeUrl} 
                  onChange={e => setNewPostYoutubeUrl(e.target.value)} 
                  className="w-full bg-white/5 border border-white/10 rounded-[16px] py-3 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-red-500/50 transition-all placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Превью прикрепленного YouTube */}
            {newPostYoutubeUrl && getYoutubeEmbedUrl(newPostYoutubeUrl) && (
              <div className="w-full rounded-[20px] overflow-hidden border border-white/10 aspect-video bg-black/50 mx-2">
                <iframe src={getYoutubeEmbedUrl(newPostYoutubeUrl)!} className="w-full h-full border-none" allowFullScreen />
              </div>
            )}

            {/* Превью прикрепленной картинки */}
            {newPostCoverUrl && !newPostYoutubeUrl && (
              <div className="w-full rounded-[20px] overflow-hidden border border-white/10 max-h-[300px] bg-black/50 relative mx-2">
                <img src={newPostCoverUrl} alt="Cover preview" className="w-full h-full object-cover" />
                <button onClick={() => setNewPostCoverUrl('')} className="absolute top-3 right-3 p-2 bg-black/60 rounded-full hover:bg-red-500/80 text-white transition-all"><X size={16}/></button>
              </div>
            )}

            {/* Панель форматирования текста (Липкая внутри редактора) */}
            <div className="sticky top-[68px] z-40 bg-[#14171c] border border-white/10 p-1.5 rounded-[18px] flex items-center gap-1 overflow-x-auto no-scrollbar mx-2 shadow-lg">
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('bold')} className={`p-2 rounded-xl transition-all active:scale-75 flex-shrink-0 ${formats.bold ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><Bold size={16}/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('italic')} className={`p-2 rounded-xl transition-all active:scale-75 flex-shrink-0 ${formats.italic ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><Italic size={16}/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('strikeThrough')} className={`p-2 rounded-xl transition-all active:scale-75 flex-shrink-0 ${formats.strikeThrough ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><Strikethrough size={16}/></button>
              <div className="w-[1px] h-4 bg-white/10 mx-1 flex-shrink-0" />
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('formatBlock', 'H1')} className={`p-2 rounded-xl transition-all active:scale-75 flex-shrink-0 ${formats.h1 ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><Heading1 size={16}/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('formatBlock', 'H2')} className={`p-2 rounded-xl transition-all active:scale-75 flex-shrink-0 ${formats.h2 ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><Heading2 size={16}/></button>
              <div className="w-[1px] h-4 bg-white/10 mx-1 flex-shrink-0" />
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('justifyLeft')} className={`p-2 rounded-xl transition-all active:scale-75 flex-shrink-0 ${formats.justifyLeft ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><AlignLeft size={16}/></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => execEditorCommand('justifyCenter')} className={`p-2 rounded-xl transition-all active:scale-75 flex-shrink-0 ${formats.justifyCenter ? 'bg-[#c0ff00]/20 text-[#c0ff00]' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}><AlignCenter size={16}/></button>
            </div>

            {/* Текстовый редактор (ContentEditable) */}
            <div 
              ref={editorRef} 
              contentEditable 
              suppressContentEditableWarning 
              onKeyUp={checkFormatting}
              onMouseUp={checkFormatting}
              onInput={checkFormatting}
              className="w-full flex-grow min-h-[300px] bg-transparent text-base md:text-lg leading-relaxed text-gray-200 outline-none prose prose-invert max-w-none break-words px-2 pb-24" 
              data-placeholder="Текст вашей статьи..." 
            />

          </div>

          {/* Плавающая кнопка публикации внизу */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#090b0e] via-[#090b0e] to-transparent z-50">
            <div className="max-w-3xl mx-auto w-full">
              <button 
                onClick={publishPost} 
                disabled={isUploadingPostCover}
                className="w-full flex items-center justify-center gap-2 bg-[#c0ff00] text-black py-4 rounded-[20px] font-black tracking-wide text-base hover:bg-[#a6e600] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(192,255,0,0.15)] disabled:opacity-50 disabled:grayscale"
              >
                <Save size={18} /> Опубликовать запись
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  );
}
