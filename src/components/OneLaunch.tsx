import { useState } from 'react';
import { Download, Check } from './ui/SFSymbol';
import SmartScreenGuide from './SmartScreenGuide';

export default function OneLaunchContent() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const R2_URL = 'https://update.onelaunch.pp.ua/OneLaunch_Setup.exe';

  const handleDownload = () => {
    if (status !== 'idle') return;

    setStatus('loading');

    // cache-busting чтобы не отдавал старый файл из кеша CDN
    window.open(`${R2_URL}?t=${Date.now()}`, '_blank');

    setStatus('done');
    setTimeout(() => setStatus('idle'), 2000);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center gap-10 md:gap-14 px-4 py-8 md:py-12 animate-fade-in">
      {/* Главный заголовок и логотип лаунчера */}
      <div className="flex items-center gap-6 md:gap-8 pt-4">
        <img
          src="/OneLaunch_icon.webp"
          alt="OneLaunch"
          className="w-20 h-20 md:w-28 md:h-28 object-contain flex-shrink-0 drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]"
        />
        <div className="text-left">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-wide">OneLaunch</h1>
          <p className="text-sm md:text-base text-gray-400 font-medium mt-1">Фирменный лаунчер OneHouse</p>
        </div>
      </div>

      {/* Главная кнопка Скачать */}
      <div className="flex flex-col items-center gap-2">
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
      </div>

      {/* Компонент предупреждения безопасности и инструкции по установке (строго под кнопкой Скачать) */}
      <SmartScreenGuide onDownload={handleDownload} status={status} />
    </div>
  );
}
