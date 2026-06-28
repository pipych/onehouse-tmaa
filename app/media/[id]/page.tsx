'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, MoreVertical, Clock, Heart, MessageCircle, Send, CornerDownRight, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';

export default function StandalonePostDetail() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  async function loadActivity() {
    if (!postId) return;
    const { data: p } = await supabase.from('posts').select('*, author:users(*)').eq('id', postId).single();
    if (p) setPost(p);
    const { data: c } = await supabase.from('comments').select('*, author:users(*)').eq('post_id', postId).order('created_at', { ascending: true });
    if (c) setComments(c);
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
        <span className="text-xs text-gray-500 font-black uppercase tracking-widest">Загрузка...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-24 pb-32">
      <div className="w-full max-w-3xl mx-auto flex flex-col">
        
        <div className="sticky top-24 z-50 w-full mb-8">
          <button onClick={() => router.push('/')} className="w-12 h-12 flex items-center justify-center bg-[#14171c]/90 backdrop-blur-xl border border-white/10 rounded-full text-white shadow-2xl active:scale-90 transition-transform">
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[40px] overflow-hidden shadow-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-4">
            <img src={post.author?.avatar_url || 'https://via.placeholder.com/150'} className="w-12 h-12 rounded-full border border-[#c0ff00]/20" />
            <div>
              <div className="text-lg font-black text-white">{post.author?.rp_name}</div>
              <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{new Date(post.created_at).toLocaleDateString('ru-RU')}</div>
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white leading-[1.1]">{post.title}</h1>
          <div className="prose prose-invert max-w-none text-gray-200 text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
      </div>

      <style jsx global>{`
        body, html { font-family: var(--font-wix), sans-serif !important; background: #090b0e; }
        h1, h2, h3 { font-family: var(--font-wix), sans-serif !important; font-weight: 800 !important; color: #ffffff; }
        p, div, span { font-family: var(--font-wix), sans-serif !important; line-height: 1.6; }
      `}</style>
    </div>
  );
}
