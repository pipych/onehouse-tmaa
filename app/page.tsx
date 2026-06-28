// app/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import MediaBlog from '../components/MediaBlog';
// Сюда ты импортируешь остальные свои вкладки, когда вынесешь их в отдельные файлы:
// import HomeTab from '../components/HomeTab';
// import ProfileTab from '../components/ProfileTab';

interface Player {
  id: string;
  tg_id: number;
  tg_username: string;
  mc_nickname: string;
  rp_name: string;
  avatar_url: string;
  roles: string[];
}

function MainTabsHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Читаем активную вкладку прямо из URL строки браузера. Если параметра нет — открываем 'home'
  const activeTab = searchParams.get('tab') || 'home';
  
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

  // Функция переключения вкладок теперь меняет URL, а не просто стейт в памяти
  function setActiveTab(tabName: string) {
    router.push(`/?tab=${tabName}`);
  }

  return (
    <div className="min-h-screen bg-[#090b0e] text-white">
      {/* Твоё боковое или нижнее меню навигации */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#14171c] p-4 flex justify-around z-50 border-t border-white/5">
        <button onClick={() => setActiveTab('home')} className={`text-xs font-bold ${activeTab === 'home' ? 'text-[#c0ff00]' : 'text-gray-400'}`}>Главная</button>
        <button onClick={() => setActiveTab('media')} className={`text-xs font-bold ${activeTab === 'media' ? 'text-[#c0ff00]' : 'text-gray-400'}`}>Медиа</button>
        <button onClick={() => setActiveTab('profile')} className={`text-xs font-bold ${activeTab === 'profile' ? 'text-[#c0ff00]' : 'text-gray-400'}`}>Профиль</button>
      </div>

      {/* Декларативно рендерим нужный компонент в зависимости от URL */}
      <div className="pb-24 pt-6">
        {activeTab === 'home' && (
          <div className="text-center py-20 text-gray-500">
            {/* Здесь будет твой <HomeTab /> */}
            Контент главной страницы (Вынеси его в components/HomeTab.tsx)
          </div>
        )}

        {activeTab === 'media' && (
          <MediaBlog 
            currentUser={currentUser} 
            onProfileClick={(p) => setActiveTab('profile')} 
            isCreatingPost={false} 
            setIsCreatingPost={() => {}} 
          />
        )}

        {activeTab === 'profile' && (
          <div className="text-center py-20 text-gray-500">
            {/* Здесь будет твой <ProfileTab /> */}
            Контент профиля (Вынеси его в components/ProfileTab.tsx)
          </div>
        )}
      </div>
    </div>
  );
}

export default function RootPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090b0e] text-gray-500 flex items-center justify-center font-mono text-xs">ЗАГРУЗКА ИНТЕРФЕЙСА...</div>}>
      <MainTabsHub />
    </Suspense>
  );
}
