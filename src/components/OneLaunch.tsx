import { useState } from 'react';
import { OneIcon } from './ui/SFSymbol';
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
    <div className="w-full flex flex-col items-center justify-center gap-10 md:gap-14 px-4 py-8 md:py-12 animate-fade-in select-none">
      {/* Главный заголовок и логотип лаунчера */}
      <div className="flex items-center gap-5 sm:gap-7 md:gap-10 pt-2 md:pt-4">
        <img
          src="/OneLaunch_icon.webp"
          alt="OneLaunch"
          className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-44 lg:h-44 object-contain flex-shrink-0 drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)] transition-transform duration-300 hover:scale-105"
        />
        <div className="text-left flex flex-col justify-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none">
            OneLaunch
          </h1>
          <p className="text-sm sm:text-base md:text-xl text-[#8e8e93] font-medium mt-1.5 sm:mt-2.5">
            Фирменный лаунчер OneHouse
          </p>
        </div>
      </div>

      {/* Главная кнопка Скачать */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={handleDownload}
          disabled={status !== 'idle'}
          className={`inline-flex items-center gap-3 md:gap-4 px-8 md:px-12 py-4 md:py-5 rounded-full font-black text-lg md:text-xl transition-all duration-300 shadow-xl border-none sf-tap ${
            status === 'idle'
              ? 'bg-[#c0ff00] text-[#090b0e] hover:bg-[#aee600] active:scale-95'
              : status === 'loading'
              ? 'bg-yellow-400 text-black animate-pulse cursor-wait'
              : 'bg-green-500 text-white'
          }`}
        >
          {status === 'idle' && <OneIcon name="download" size={24} />}
          {status === 'loading' && <OneIcon name="download" size={24} className="animate-bounce" />}
          {status === 'done' && <OneIcon name="check" size={24} />}
          <span>
            {status === 'idle' && 'Скачать'}
            {status === 'loading' && 'Загрузка...'}
            {status === 'done' && 'Готово!'}
          </span>
        </button>
      </div>

      {/* Компонент предупреждения безопасности и инструкции по установке */}
      <SmartScreenGuide onDownload={handleDownload} status={status} />
    </div>
  );
}
