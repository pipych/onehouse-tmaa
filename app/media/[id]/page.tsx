'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, RefreshCw } from 'lucide-react';

export default function StandalonePostDetail() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const [post, setPost] = useState<any>(null);

  async function loadActivity() {
    if (!postId) return;
    const { data: p } = await supabase.from('posts').select('*, author:users(*)').eq('id', postId).single();
    if (p) setPost(p);
  }

  useEffect(() => {
    loadActivity();
  }, [postId]);

  if (!post) {
    return (
      <div className="min-h-screen bg-[#090b0e] flex flex-col items-center justify-center">
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

        <div className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[40px] overflow-hidden shadow-2xl flex flex-col">
          
          {/* ИСПРАВЛЕНО: Точная и безотказная логика вывода обложек и ютуба */}
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

            {/* ИСПРАВЛЕНО: Главный заголовок статьи стал намного аккуратнее (text-xl md:text-3xl) */}
            <h1 className="text-xl md:text-3xl font-black text-white leading-tight">{post.title}</h1>
            <div className="prose prose-invert max-w-none text-gray-200 text-base md:text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </div>
      </div>

      <style jsx global>{`
        body { font-family: var(--font-wix), sans-serif !important; background: #090b0e; }
        .prose h1 { font-size: 1.25rem !important; font-weight: 800 !important; color: #ffffff !important; }
        .prose h2 { font-size: 1.1rem !important; font-weight: 800 !important; color: #c0ff00 !important; }
        .prose p { color: #d1d5db !important; }
        .prose b, .prose strong { color: #d1d5db !important; }
        .prose i, .prose em { color: #d1d5db !important; }
      `}</style>
    </div>
  );
}
