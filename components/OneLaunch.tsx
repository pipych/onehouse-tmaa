'use client';

import { useState } from 'react';
import { Download, Check, Shield } from 'lucide-react';

export default function OneLaunchContent() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const R2_URL = 'https://pub-f6e5d69d8dfd4ec194b0ebc7b4c3de96.r2.dev/OneLaunch_Setup.exe';

  const handleDownload = () => {
    if (status !== 'idle') return;

    setStatus('loading');

    window.open(R2_URL, '_blank');

    setStatus('done');
    setTimeout(() => setStatus('idle'), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 md:gap-14 p-6">
      <div className="flex items-center gap-6 md:gap-8">
        <img
          src="/OneLaunch_icon.webp"
          alt="OneLaunch"
          className="w-20 h-20 md:w-28 md:h-28 object-contain flex-shrink-0"
        />
        <div className="text-left">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-wide">OneLaunch</h1>
          <p className="text-sm md:text-base text-gray-400 font-medium mt-1">Фирменный лаунчер OneHouse</p>
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={status !== 'idle'}
        className={`inline-flex items-center gap-3 md:gap-4 px-8 md:px-12 py-4 md:py-5 rounded-full font-black text-lg md:text-xl transition-all duration-300 shadow-xl ${
          status === 'idle'
            ? 'bg-[#c0ff00] text-black hover:scale-105 active:scale-95 hover:shadow-[#c0ff00]/25'
            : status === 'loading'
            ? 'bg-yellow-400 text-black animate-pulse cursor-wait'
            : 'bg-green-500 text-white'
        }`}
      >
        {status === 'idle' && <Download size={22} className="md:w-7 md:h-7" />}
        {status === 'loading' && <Download size={22} className="md:w-7 md:h-7 animate-bounce" />}
        {status === 'done' && <Check size={22} className="md:w-7 md:h-7" />}
        <span>
          {status === 'idle' && 'Скачать'}
          {status === 'loading' && 'Загрузка...'}
          {status === 'done' && 'Готово!'}
        </span>
      </button>

      {/* VirusTotal + подпись */}
      <div className="flex flex-col items-center gap-1">
        <a
          href="https://www.virustotal.com/gui/file/b554432c118ab98977e6c7fbbe463803690067431613344e0362d098b69f71a3/summary"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all bg-[#14171c]/80 border-white/10 text-gray-500 hover:text-white hover:border-white/20"
        >
          <Shield size={14} />
          <span>VirusTotal</span>
        </a>

        <p className="text-[10px] text-gray-600 font-mono">Для Кабана</p>
      </div>

    </div>
  );
}
