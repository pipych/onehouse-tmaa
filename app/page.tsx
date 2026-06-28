'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';

interface Player {
  id: string;
  tg_id: number;
  tg_username: string;
  mc_nickname: string;
  rp_name: string;
  avatar_url: string;
  roles: string[];
}

export default function RootPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<Player | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user?.id) {
      supabase.from('users').select('*').eq('tg_id', tg.initDataUnsafe.user.id).single().then(({ data }) => {
        if (data) setCurrentUser(data);
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-24 pb-32">
      <div className="w-full max-w-3xl mx-auto flex flex-col">
        
        {/* КОНТЕНТ ГЛАВНОЙ СТРАНИЦЫ */}
        <div className="bg-[#14171c]/90 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 shadow-2xl text-center">
          <h1 className="text-2xl font-black mb-4">Добро пожаловать в OneHouse</h1>
          <p className="text-gray-400 text-sm">Это основная вкладка вашего приложения.</p>
        </div>

      </div>

      {/* НИЖНИЙ НАВБАР ДЛЯ ФИЗИЧЕСКИХ СТРАНИЦ */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#14171c]/90 backdrop-blur-xl p-4 flex justify-around z-40 border-t border-white/5 select-none">
        <button onClick={() => router.push('/')} className={`text-xs font-bold transition-colors ${pathname === '/' ? 'text-[#c0ff00]' : 'text-gray-400'}`}>Главная</button>
        <button onClick={() => router.push('/media')} className={`text-xs font-bold transition-colors ${pathname === '/media' ? 'text-[#c0ff00]' : 'text-gray-400'}`}>Медиа</button>
        <button onClick={() => router.push('/laws')} className={`text-xs font-bold transition-colors ${pathname === '/laws' ? 'text-[#c0ff00]' : 'text-gray-400'}`}>Законы</button>
        <button onClick={() => router.push('/players')} className={`text-xs font-bold transition-colors ${pathname === '/players' ? 'text-[#c0ff00]' : 'text-gray-400'}`}>Игроки</button>
      </div>
    </div>
  );
}
