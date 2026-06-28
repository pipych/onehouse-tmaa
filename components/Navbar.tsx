'use client';

import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#14171c]/90 backdrop-blur-xl p-4 flex justify-around z-50 border-t border-white/5">
      <button onClick={() => router.push('/')} className={`text-xs font-bold ${isActive('/') ? 'text-[#c0ff00]' : 'text-gray-400'}`}>Главная</button>
      <button onClick={() => router.push('/media')} className={`text-xs font-bold ${isActive('/media') ? 'text-[#c0ff00]' : 'text-gray-400'}`}>Медиа</button>
      <button onClick={() => router.push('/laws')} className={`text-xs font-bold ${isActive('/laws') ? 'text-[#c0ff00]' : 'text-gray-400'}`}>Законы</button>
      <button onClick={() => router.push('/players')} className={`text-xs font-bold ${isActive('/players') ? 'text-[#c0ff00]' : 'text-gray-400'}`}>Игроки</button>
    </div>
  );
}
