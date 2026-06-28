'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import MediaBlog from '../../components/MediaBlog'; // Твой компонент ленты
import { supabase } from '../../lib/supabase';

export default function MediaPage() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Получаем юзера
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user?.id) {
        supabase.from('users').select('*').eq('tg_id', tg.initDataUnsafe.user.id).single()
        .then(({data}) => setCurrentUser(data));
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#090b0e] pb-24">
      <div className="pt-6">
        <MediaBlog currentUser={currentUser} />
      </div>
      <Navbar />
    </div>
  );
}
