import React, { useState, useEffect } from 'react';
import { OneIcon } from './ui/SFSymbol';
import { Badge } from '../ui/components/Badge';

interface SmartScreenGuideProps {
  onDownload: () => void;
  status: 'idle' | 'loading' | 'done';
}

const VIRUSTOTAL_URL =
  'https://www.virustotal.com/gui/file/b554432c118ab98977e6c7fbbe463803690067431613344e0362d098b69f71a3/summary';

export default function SmartScreenGuide({ onDownload, status }: SmartScreenGuideProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Закрытие модального окна по Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  return (
    <section className="w-full max-w-4xl mx-auto flex flex-col gap-16 md:gap-24 pt-4 pb-12 animate-fade-in select-none">
      {/* 1. БЛОК ПРЕДУПРЕЖДЕНИЯ (ALERT) */}
      <div className="w-full bg-transparent grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        {/* Слева: 3D щит SmartScreen с прозрачным фоном */}
        <div className="hidden md:flex justify-center items-center relative order-1">
          <div className="absolute inset-0 max-w-[280px] max-h-[280px] m-auto bg-[#38bdf8]/10 rounded-full blur-3xl pointer-events-none" />
          <img
            src="/onelaunch-shield.webp"
            alt="Windows SmartScreen Security Shield"
            className="w-48 sm:w-56 md:w-72 h-auto object-contain relative z-10 drop-shadow-[0_20px_35px_rgba(56,189,248,0.25)] transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* Справа: Текстовый блок + кнопки действий */}
        <div className="flex flex-col gap-4 md:gap-5 text-left order-1 md:order-2">
          {/* Плашка «Безопасность Windows» */}
          <div className="inline-flex md:hidden items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 w-fit shadow-md border-none">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-200">
              Безопасность Windows
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">
            Предупреждение Windows при установке — это норма
          </h2>

          <p className="text-sm md:text-base text-[#8e8e93] font-normal leading-relaxed">
            При первом запуске Windows может показать синий экран SmartScreen («Система защитила ваш
            компьютер»). Это стандартная реакция системы на новые независимые программы без
            коммерческой цифровой подписи. В лаунчере нет вредоносного кода, скрытых майнеров или
            троянов.
          </p>

          {/* Кнопки действий (Strictly Pill, No Borders) */}
          <div className="flex items-center gap-3 pt-2 flex-wrap sm:flex-nowrap">
            {/* Кнопка 1 (VirusTotal) */}
            <a
              href={VIRUSTOTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-11 md:h-12 px-6 rounded-full text-xs md:text-sm font-bold transition-all duration-200 bg-[#14171c] hover:bg-[#181c23] text-white active:scale-95 shadow-lg whitespace-nowrap border-none sf-tap"
              title="Открыть отчет VirusTotal в новом окне"
            >
              <OneIcon name="shield" size={18} className="text-[#38bdf8] flex-shrink-0" />
              <span>Проверить на VirusTotal</span>
            </a>

            {/* Кнопка 2 (Инфо) */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 h-11 md:h-12 px-6 rounded-full text-xs md:text-sm font-bold transition-all duration-200 bg-[#181c23] hover:bg-[#1c222b] text-[#8e8e93] hover:text-white active:scale-95 shadow-lg cursor-pointer whitespace-nowrap border-none sf-tap"
            >
              <OneIcon name="info" size={18} className="text-[#8e8e93] flex-shrink-0" />
              <span>Подробнее</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. БЛОК ИНСТРУКЦИИ ПО ЗАПУСКУ (HOW-TO) */}
      <div className="w-full flex flex-col gap-14 md:gap-20">
        <div className="flex flex-col items-center text-center gap-2">
          <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Инструкция по первому запуску
          </h3>
          <p className="text-xs md:text-sm text-[#8e8e93] max-w-lg">
            Всего два простых шага для запуска OneLaunch на вашем компьютере.
          </p>
        </div>

        {/* 1 Пункт инструкции: Нажмите «Подробнее» */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="flex flex-col gap-4 text-left">
            <div className="flex items-center gap-3.5">
              <span className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#c0ff00]/10 flex items-center justify-center text-xl md:text-2xl font-black text-[#c0ff00] shadow-lg shadow-[#c0ff00]/15 flex-shrink-0 border-none">
                1
              </span>
              <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-[#8e8e93]">
                Шаг первый
              </span>
            </div>

            <h4 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
              Нажмите «Подробнее»
            </h4>

            <p className="text-base sm:text-lg md:text-xl text-gray-300 font-normal leading-relaxed">
              В синем окне SmartScreen нажмите на текстовую ссылку{' '}
              <span className="text-white font-bold underline decoration-[#c0ff00] underline-offset-4">
                «Подробнее»
              </span>{' '}
              под описанием.
            </p>
          </div>

          <div className="flex justify-center items-center p-2">
            <div className="relative group max-w-md w-full transition-transform duration-300">
              <img
                src="/onelaunch-step1.webp?v=4"
                alt="Окно SmartScreen - кликните Подробнее"
                className="relative z-10 w-full h-auto rounded-[24px] shadow-2xl block"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* 2 Пункт инструкции: Нажмите «Выполнить в любом случае» */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="flex flex-col gap-4 text-left">
            <div className="flex items-center gap-3.5">
              <span className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#c0ff00]/10 flex items-center justify-center text-xl md:text-2xl font-black text-[#c0ff00] shadow-lg shadow-[#c0ff00]/15 flex-shrink-0 border-none">
                2
              </span>
              <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-[#8e8e93]">
                Шаг второй
              </span>
            </div>

            <h4 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
              Нажмите «Выполнить в любом случае»
            </h4>

            <p className="text-base sm:text-lg md:text-xl text-gray-300 font-normal leading-relaxed">
              В правом нижнем углу окна нажмите кнопку{' '}
              <span className="text-white font-bold bg-[#181c23] px-3 py-1 rounded-full">
                «Выполнить в любом случае»
              </span>
              .
            </p>
          </div>

          <div className="flex justify-center items-center p-2">
            <div className="relative group max-w-md w-full transition-transform duration-300">
              <img
                src="/onelaunch-step2.webp?v=4"
                alt="Окно SmartScreen - Выполнить в любом случае"
                className="relative z-10 w-full h-auto rounded-[24px] shadow-2xl block"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. ФИНАЛЬНЫЙ CTA */}
      <div className="flex flex-col items-center justify-center gap-4 pt-4 text-center">
        <p className="text-xs md:text-sm font-bold text-[#8e8e93]">
          Готовы начать игру на сервере?
        </p>

        <button
          onClick={onDownload}
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
            {status === 'idle' && 'Скачать лаунчер'}
            {status === 'loading' && 'Загрузка...'}
            {status === 'done' && 'Готово!'}
          </span>
        </button>

        <span className="text-[11px] text-[#8e8e93] font-mono">
          Версия 1.0 · Windows 10 / 11 · x64
        </span>
      </div>

      {/* МОДАЛЬНОЕ ОКНО «ПОДРОБНЕЕ» (OneWebUI Centered Modal on Desktop / Bottom Sheet on Mobile) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#14171c] rounded-[32px] p-6 sm:p-7 shadow-2xl flex flex-col gap-5 text-left relative border-none select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Кнопка закрытия */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#181c23] flex items-center justify-center text-[#8e8e93] hover:text-white transition-colors border-none sf-tap"
              title="Закрыть"
            >
              <OneIcon name="close" size={18} />
            </button>

            {/* Заголовок */}
            <div className="flex items-center gap-3 pr-8">
              <div className="w-10 h-10 rounded-full bg-[#38bdf8]/10 flex items-center justify-center text-[#38bdf8] flex-shrink-0 border-none">
                <OneIcon name="shield" size={20} />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                Почему Windows показывает предупреждение?
              </h3>
            </div>

            {/* Содержимое: карточки на приподнятой поверхности #181c23 без обводок */}
            <div className="space-y-3 text-xs sm:text-sm text-gray-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-4 rounded-2xl bg-[#181c23] space-y-1 border-none">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-[#c0ff00]">●</span> Дорогие сертификаты подписи (EV Code Signing)
                </div>
                <p className="text-[#8e8e93] text-xs">
                  Корпорация Microsoft требует от разработчиков ежегодную покупку цифровой подписи
                  стоимостью от $500 в год. Для независимых фанатских лаунчеров эта сумма не имеет
                  смысла.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#181c23] space-y-1 border-none">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-[#38bdf8]">●</span> Репутационный фильтр SmartScreen
                </div>
                <p className="text-[#8e8e93] text-xs">
                  Каждый раз, когда выходит свежее обновление, Microsoft SmartScreen считает его
                  «незнакомым», пока его не скачают тысячи пользователей. Это автоматическая защита
                  от любого нового софта.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#181c23] space-y-1 border-none">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-emerald-400">●</span> Гарантия чистоты и безопасности
                </div>
                <p className="text-[#8e8e93] text-xs">
                  В OneLaunch нет вирусов, рекламных модулей и скрытых майнеров. Вы можете в любой
                  момент нажать «Проверить на VirusTotal» и убедиться в вердикте 70+ антивирусных лабораторий.
                </p>
              </div>
            </div>

            {/* Кнопка закрытия внизу */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#c0ff00] text-[#090b0e] hover:bg-[#aee600] active:scale-95 transition-all shadow-md border-none sf-tap"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
