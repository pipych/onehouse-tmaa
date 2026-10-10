import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { supabase } from '../lib/supabase';
import { getSeasonState, getAllPastSeasons, seasonName } from '../lib/season';
import { ArrowLeft, Newspaper, Clock, User, RefreshCw } from '../components/ui/SFSymbol';
import SeasonSelector from '../components/SeasonSelector';

interface ArchivedPost {
  id: string;
  title: string;
  content: string;
  created_at: string;
  season: string;
  author: {
    rp_name: string;
  } | null;
}

export default function ArchiveMediaPage() {
  const navigate = useNavigate();
  const { showBackButton, hideBackButton } = useTelegram();
  const [selectedSeason, setSelectedSeason] = useState<string>('Сезон 2');
  const [archivedPosts, setArchivedPosts] = useState<ArchivedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [seasons, setSeasons] = useState<string[]>(['Сезон 2']);

  // Загружаем список сезонов
  useEffect(() => {
    async function loadSeasons() {
      const state = await getSeasonState();
      const past = await getAllPastSeasons();
      const nums = new Set<number>();
      nums.add(state.season_number);
      past.forEach(s => nums.add(s.season_number));
      const list = Array.from(nums).sort((a, b) => b - a).map(n => seasonName(n));
      setSeasons(list);
      if (list.length > 0) setSelectedSeason(list[0]);
    }
    loadSeasons();
  }, []);

  function stripHtml(html: string) {
    if (typeof document === 'undefined') return html;
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  useEffect(() => {
    async function loadRealMedia() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*, author:characters(rp_name)')
          .eq('season', selectedSeason)
          .order('created_at', { ascending: false });
        
        if (data && !error) {
          setArchivedPosts(data);
        }
      } catch (e) {}
      setLoading(false);
    }

    loadRealMedia();
  }, [selectedSeason]);

  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-tma-safe md:pt-8 pb-32 antialiased">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
        
        <div className="flex items-center justify-between w-full select-none">
          <button onClick={() => navigate('/')} className="w-10 h-10 flex items-center justify-center bg-[#14171c] rounded-full text-white shadow-lg active:scale-90 transition-transform"><ArrowLeft size={20} /></button>

          <SeasonSelector
            seasons={seasons}
            selectedSeason={selectedSeason}
            onSelectSeason={setSelectedSeason}
          />
        </div>

        <div className="flex items-center gap-2 px-1">
          <Newspaper size={18} className="text-[#c0ff00]" />
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Архивные статьи прессы</h2>
        </div>

        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-[#c0ff00]" size={24} /></div>
          ) : selectedSeason === 'Сезон 1' ? (
            <div className="text-center py-12 text-xs font-mono font-bold text-red-400 bg-red-500/10 rounded-[28px] tracking-wider">
              🚨 СТАТЬИ ПЕРВОГО СЕЗОНА УТЕРЯНЫ ПРИ МИГРАЦИИ ЯДРА
            </div>
          ) : archivedPosts.length === 0 ? (
            <div className="text-center py-12 text-xs font-mono text-[#8e8e93] bg-[#14171c] rounded-[28px]">СТАТЕЙ НЕ НАЙДЕНО</div>
          ) : (
            archivedPosts.map(post => (
              <div 
                key={post.id} 
                onClick={() => navigate(`/media/${post.id}`)}
                className="bg-[#14171c] p-5 rounded-[28px] shadow-xl space-y-3 hover:bg-[#181c23] transition-colors cursor-pointer group cv-card gpu-layer"
              >
                <div className="flex items-center justify-between text-[10px] font-bold font-mono text-gray-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1"><User size={12} className="text-[#c0ff00]" /> {post.author?.rp_name || 'Неизвестный'}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {new Date(post.created_at).toLocaleDateString('ru-RU')}</span>
                </div>
                <h3 className="text-base font-black text-white group-hover:text-[#c0ff00] transition-colors leading-tight">{post.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{stripHtml(post.content)}</p>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
