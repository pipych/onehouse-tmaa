'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, FolderArchive, ChevronDown, Newspaper, Clock, User, RefreshCw } from 'lucide-react';

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
  const router = useRouter();
  const [selectedSeason, setSelectedSeason] = useState<string>('Сезон 2');
  const [showSeasonSelector, setShowSeasonSelector] = useState(false);
  const [archivedPosts, setArchivedPosts] = useState<ArchivedPost[]>([]);
  const [loading, setLoading] = useState(false);

  const seasons = ['Сезон 1', 'Сезон 2'];

  function stripHtml(html: string) {
    if (typeof document === 'undefined') return html;
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  useEffect(() => {
    if (selectedSeason === 'Сезон 1') {
      setArchivedPosts([]);
      return;
    }

    async function loadRealMedia() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*, author:users(rp_name)')
          .eq('season', selectedSeason) // Автоматическая фильтрация из бд
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
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-24 pb-32 antialiased">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
        
        <div className="flex items-center justify-between w-full select-none">
          <button onClick={() => router.push('/')} className="w-12 h-12 flex items-center justify-center bg-[#14171c]/90 backdrop-blur-xl border border-white/10 rounded-full text-white shadow-2xl active:scale-90 transition-transform"><ArrowLeft size={20} /></button>

          <div className="relative">
            <button onClick={() => setShowSeasonSelector(!showSeasonSelector)} className="bg-[#14171c]/90 border border-white/15 py-2 px-4 rounded-full backdrop-blur-md flex items-center gap-2 text-xs font-bold text-gray-200 shadow-lg active:scale-95 transition-all">
              <FolderArchive size={14} className="text-[#c0ff00]" />
              <span>{selectedSeason}</span>
              <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${showSeasonSelector ? 'rotate-180' : ''}`} />
            </button>

            {showSeasonSelector && (
              <div className="absolute right-0 mt-2 bg-[#14171c]/95 border border-white/10 rounded-2xl p-1.5 z-50 shadow-2xl min-w-[140px] flex flex-col gap-1 animate-fade-in backdrop-blur-xl">
                {seasons.map((season) => (
                  <button key={season} onClick={() => { setSelectedSeason(season); setShowSeasonSelector(false); }} className={`text-xs text-left px-3 py-2.5 rounded-xl font-bold transition-all ${selectedSeason === season ? 'bg-[#c0ff00]/10 text-[#c0ff00]' : 'text-gray-400 hover:bg-white/5'}`}>{season}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 px-1">
          <Newspaper size={18} className="text-[#c0ff00]" />
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Архивные статьи прессы</h2>
        </div>

        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-[#c0ff00]" size={24} /></div>
          ) : selectedSeason === 'Сезон 1' ? (
            <div className="text-center py-12 text-xs font-mono font-bold text-red-400 bg-red-500/5 border border-red-500/10 rounded-[24px] tracking-wider">
              🚨 СТАТЬИ ПЕРВОГО СЕЗОНА УТЕРЯНЫ ПРИ МИГРАЦИИ ЯДРА
            </div>
          ) : archivedPosts.length === 0 ? (
            <div className="text-center py-12 text-xs font-mono text-gray-500 bg-[#14171c]/40 border border-white/5 rounded-2xl">СТАТЕЙ НЕ НАЙДЕНО</div>
          ) : (
            archivedPosts.map(post => (
              <div 
                key={post.id} 
                onClick={() => router.push(`/media/${post.id}`)}
                className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 p-5 rounded-[24px] shadow-xl space-y-3 hover:border-white/10 transition-colors cursor-pointer group"
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
