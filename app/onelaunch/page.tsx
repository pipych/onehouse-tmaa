'use client';

import { useState } from 'react';
import { Download, Check, Monitor } from 'lucide-react';

export default function OneLaunchPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const R2_URL = 'https://pub-f6e5d69d8dfd4ec194b0ebc7b4c3de96.r2.dev/OneLaunch_Setup.exe';

  const handleDownload = () => {
    if (status !== 'idle') return;

    setStatus('loading');

    const link = document.createElement('a');
    link.href = R2_URL;
    link.download = 'OneLaunch_Setup.exe';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setStatus('done');
    setTimeout(() => setStatus('idle'), 2000);
  };

  return (
    <div className="min-h-screen bg-[#090b0e] flex flex-col items-center justify-center gap-10 p-6">
      {/* Лого / иконка */}
      <div className="w-28 h-28 rounded-[28px] bg-[#14171c] border-2 border-[#c0ff00]/30 flex items-center justify-center shadow-2xl shadow-[#c0ff00]/5">
        <Monitor size={52} className="text-[#c0ff00]" />
      </div>

      <div className="text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-wide">OneLaunch</h1>
        <p className="text-sm text-gray-400 font-medium">Фирменный лаунчер OneHouse</p>
      </div>

      <button
        onClick={handleDownload}
        disabled={status !== 'idle'}
        className={`inline-flex items-center gap-3 px-8 py-4 rounded-full font-black text-lg transition-all duration-300 shadow-xl ${
          status === 'idle'
            ? 'bg-[#c0ff00] text-black hover:scale-105 active:scale-95 hover:shadow-[#c0ff00]/25'
            : status === 'loading'
            ? 'bg-yellow-400 text-black animate-pulse cursor-wait'
            : 'bg-green-500 text-white'
        }`}
      >
        {status === 'idle' && <Download size={22} />}
        {status === 'loading' && <Download size={22} className="animate-bounce" />}
        {status === 'done' && <Check size={22} />}
        <span>
          {status === 'idle' && 'Скачать'}
          {status === 'loading' && 'Загрузка...'}
          {status === 'done' && 'Готово!'}
        </span>
      </button>

      <p className="text-[10px] text-gray-600 font-mono mt-4">OneLaunch_Setup.exe • Cloudflare R2</p>
    </div>
  );
}
