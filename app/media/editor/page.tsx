'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Send, Clock, Image as ImageIcon, Youtube, X, RefreshCw, Check } from 'lucide-react';

const BOT_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbw_u1zTK5C44FvRfldEuadVy4vs0MQzCsfutsyZf-roJwsg-oY3gvUZiRn8Jk190lpxtg/exec";

function EditorContent() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'success'>('idle');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user?.id) {
      supabase.from('users').select('*').eq('tg_id', tg.initDataUnsafe.user.id).single().then(({data}) => setCurrentUser(data));
    }
  }, []);

  async function handlePublish() {
    const content = editorRef.current?.innerHTML || '';
    if (!newPostTitle.trim() || !content.trim() || !currentUser) return;

    setPublishStatus('publishing');
    const { data: savedPost, error } = await supabase.from('posts').insert([{
      author_id: currentUser.id, title: newPostTitle, content: content
    }]).select().single();

    if (!error && savedPost) {
      try {
        await fetch(BOT_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ type: 'new_post', id: savedPost.id, title: savedPost.title })
        });
      } catch (e) {}
      setPublishStatus('success');
      setTimeout(() => router.push('/'), 1200);
    } else { setPublishStatus('idle'); }
  }

  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-24 pb-40">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <button onClick={() => router.push('/')} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center"><ArrowLeft size={20}/></button>
          <button onClick={handlePublish} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${publishStatus === 'publishing' ? 'bg-yellow-500' : publishStatus === 'success' ? 'bg-green-500' : 'bg-[#c0ff00] text-black'}`}>
            {publishStatus === 'publishing' ? <RefreshCw className="animate-spin" /> : publishStatus === 'success' ? <Check/> : <Send size={20}/>}
          </button>
        </div>

        <input 
          placeholder="Заголовок статьи" 
          value={newPostTitle} 
          onChange={e => setNewPostTitle(e.target.value)}
          className="bg-transparent text-4xl md:text-6xl font-black outline-none placeholder:text-gray-800"
        />

        <div 
          ref={editorRef} 
          contentEditable 
          className="min-h-[40vh] outline-none text-xl leading-relaxed text-gray-200" 
          data-placeholder="Начните писать..." 
        />
      </div>

      <style jsx global>{`
        body { font-family: var(--font-wix), sans-serif !important; }
        input, div { font-family: var(--font-wix), sans-serif !important; }
        [contenteditable]:empty:before { content: attr(data-placeholder); color: #374151; }
      `}</style>
    </div>
  );
}

export default function PostEditor() {
  return <Suspense><EditorContent /></Suspense>;
}
