import React, { useState, useEffect } from 'react';
import { Download, Check, Shield, Info, X } from './ui/SFSymbol';

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
    <section className="w-full max-w-4xl mx-auto flex flex-col gap-16 md:gap-24 pt-6 pb-12 animate-fade-in select-none">
      {/* ========================================================================= */}
      {/* 1. БЛОК ПРЕДУПРЕЖДЕНИЯ (ALERT) */}
      {/* ========================================================================= */}
      <div className="w-full bg-transparent grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        {/* Слева: 3D щит SmartScreen с прозрачным фоном */}
        <div className="flex justify-center items-center relative order-2 md:order-1">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 w-fit">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
              Безопасность Windows
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">
            Предупреждение Windows при установке — это норма
          </h2>

          <p className="text-sm md:text-base text-gray-400 font-normal leading-relaxed">
            При первом запуске Windows может показать синий экран SmartScreen («Система защитила ваш
            компьютер»). Это стандартная реакция системы на новые независимые программы без
            коммерческой цифровой подписи. В лаунчере нет вредоносного кода, скрытых майнеров или
            троянов.
          </p>

          {/* Кнопки действий в ряд (pill / rounded-full) */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Кнопка 1 (VirusTotal) */}
            <a
              href={VIRUSTOTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs md:text-sm font-bold border transition-all duration-200 bg-[#14171c]/90 border-white/10 text-gray-300 hover:text-white hover:border-[#c0ff00]/40 hover:bg-[#1c2026] active:scale-95 shadow-lg"
              title="Открыть отчет VirusTotal в новом окне"
            >
              <Shield size={16} className="text-[#38bdf8]" />
              <span>Проверить на VirusTotal</span>
            </a>

            {/* Кнопка 2 (Инфо) */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs md:text-sm font-bold border transition-all duration-200 bg-white/5 border-white/10 text-gray-300 hover:text-white hover:border-white/25 hover:bg-white/10 active:scale-95 shadow-lg cursor-pointer"
            >
              <Info size={16} className="text-gray-400" />
              <span>Подробнее</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. БЛОК ИНСТРУКЦИИ ПО ЗАПУСКУ (HOW-TO) */}
      {/* ========================================================================= */}
      <div className="w-full flex flex-col gap-14 md:gap-20">
        <div className="flex flex-col items-center text-center gap-2">
          <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Инструкция по первому запуску
          </h3>
          <p className="text-xs md:text-sm text-gray-500 max-w-lg">
            Выберите удобный для вас вариант запуска установщика OneLaunch на вашем компьютере.
          </p>
        </div>

        {/* Пункт 1: Способ 1. Через окно SmartScreen (в 2 клика) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Текст слева */}
          <div className="flex flex-col gap-4 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c0ff00]/10 border border-[#c0ff00]/20 w-fit">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#c0ff00]">
                Рекомендуемый вариант
              </span>
            </div>

            <h4 className="text-xl md:text-2xl font-black text-white leading-snug">
              Способ 1. Через окно SmartScreen (в 2 клика)
            </h4>

            <div className="flex flex-col gap-3.5 pt-1">
              <div className="flex items-start gap-3.5">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs font-black text-[#c0ff00]">
                  1
                </span>
                <p className="text-sm md:text-base text-gray-300 leading-relaxed pt-0.5">
                  В синем окне нажмите на текстовую ссылку{' '}
                  <span className="text-white font-bold underline decoration-[#c0ff00] underline-offset-4">
                    «Подробнее»
                  </span>{' '}
                  под описанием.
                </p>
              </div>

              <div className="flex items-start gap-3.5">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs font-black text-[#c0ff00]">
                  2
                </span>
                <p className="text-sm md:text-base text-gray-300 leading-relaxed pt-0.5">
                  В правом нижнем углу нажмите кнопку{' '}
                  <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded-md">
                    «Выполнить в любом случае»
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* Справа: Изображение 2 (SmartScreen с кнопкой «Подробнее») */}
          <div className="flex justify-center items-center p-2">
            <div className="relative group perspective-1000 max-w-md w-full">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#38bdf8]/20 to-[#c0ff00]/20 rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition duration-500" />
              <img
                src="/onelaunch-step1.webp"
                alt="Окно SmartScreen - кликните Подробнее"
                className="w-full h-auto rounded-2xl border border-white/10 shadow-2xl shadow-black/80 transform -rotate-2 md:-rotate-3 group-hover:rotate-0 group-hover:scale-[1.02] transition-all duration-300 ease-out"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Пункт 2: Способ 2. Через свойства файла (если кнопки нет) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center pt-4">
          {/* Текст слева */}
          <div className="flex flex-col gap-4 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 w-fit">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Альтернативный вариант
              </span>
            </div>

            <h4 className="text-xl md:text-2xl font-black text-white leading-snug">
              Способ 2. Через свойства файла (если кнопки нет)
            </h4>

            <div className="flex flex-col gap-3.5 pt-1">
              <div className="flex items-start gap-3.5">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs font-black text-white">
                  1
                </span>
                <p className="text-sm md:text-base text-gray-300 leading-relaxed pt-0.5">
                  Нажмите правой кнопкой мыши по скачанному <span className="font-mono text-xs bg-white/10 px-1.5 py-0.5 rounded text-[#c0ff00]">.exe</span> файлу и откройте{' '}
                  <span className="text-white font-bold">«Свойства»</span>.
                </p>
              </div>

              <div className="flex items-start gap-3.5">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs font-black text-white">
                  2
                </span>
                <p className="text-sm md:text-base text-gray-300 leading-relaxed pt-0.5">
                  Во вкладке <span className="text-white font-bold">«Общие»</span> в блоке{' '}
                  <span className="text-white font-bold">«Безопасность»</span> поставьте галочку{' '}
                  <span className="text-white font-bold underline decoration-[#c0ff00] underline-offset-4">
                    «Разблокировать»
                  </span>{' '}
                  и нажмите <span className="text-white font-bold">«Применить»</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Справа: Изображение 3 (SmartScreen с кнопкой «Выполнить в любом случае») */}
          <div className="flex justify-center items-center p-2">
            <div className="relative group perspective-1000 max-w-md w-full">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#c0ff00]/20 to-[#38bdf8]/20 rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition duration-500" />
              <img
                src="/onelaunch-step2.webp"
                alt="Окно SmartScreen - Выполнить в любом случае"
                className="w-full h-auto rounded-2xl border border-white/10 shadow-2xl shadow-black/80 transform -rotate-2 md:-rotate-3 group-hover:rotate-0 group-hover:scale-[1.02] transition-all duration-300 ease-out"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ФИНАЛЬНЫЙ CTA (ДУБЛИРУЕТСЯ АКЦЕНТНАЯ КНОПКА СКАЧИВАНИЯ) */}
      {/* ========================================================================= */}
      <div className="flex flex-col items-center justify-center gap-4 pt-6 text-center">
        <p className="text-xs md:text-sm font-bold text-gray-400">
          Готовы начать игру на сервере?
        </p>

        <button
          onClick={onDownload}
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
            {status === 'idle' && 'Скачать лаунчер'}
            {status === 'loading' && 'Загрузка...'}
            {status === 'done' && 'Готово!'}
          </span>
        </button>

        <span className="text-[11px] text-gray-600 font-mono">
          Версия 1.0 · Windows 10 / 11 · x64
        </span>
      </div>

      {/* ========================================================================= */}
      {/* МОДАЛЬНОЕ ОКНО «ПОДРОБНЕЕ» */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#14171c]/95 border border-white/10 rounded-[28px] p-6 sm:p-7 shadow-2xl flex flex-col gap-5 text-left relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Кнопка закрытия */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Закрыть"
            >
              <X size={16} />
            </button>

            {/* Заголовок */}
            <div className="flex items-center gap-3 pr-8">
              <div className="w-10 h-10 rounded-full bg-[#38bdf8]/10 border border-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8] flex-shrink-0">
                <Shield size={20} />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                Почему Windows показывает предупреждение?
              </h3>
            </div>

            {/* Содержимое */}
            <div className="space-y-4 text-xs sm:text-sm text-gray-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-[#c0ff00]">●</span> Дорогие сертификаты подписи (EV Code Signing)
                </div>
                <p className="text-gray-400 text-xs">
                  Корпорация Microsoft требует от разработчиков ежегодную покупку цифровой подписи
                  стоимостью от $500 в год. Для независимых фанатских лаунчеров эта сумма не имеет
                  смысла.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-[#38bdf8]">●</span> Репутационный фильтр SmartScreen
                </div>
                <p className="text-gray-400 text-xs">
                  Каждый раз, когда выходит свежее обновление, Microsoft SmartScreen считает его
                  «незнакомым», пока его не скачают тысячи пользователей. Это автоматическая защита
                  от любого нового софта.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-green-400">●</span> Гарантия чистоты и безопасности
                </div>
                <p className="text-gray-400 text-xs">
                  В OneLaunch нет вирусов, рекламных модулей и скрытых майнеров. Вы можете в любой
                  момент нажать «Проверить на VirusTotal» и убедиться в вердикте 70+ антивирусных лабораторий.
                </p>
              </div>
            </div>

            {/* Кнопка закрытия внизу */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#c0ff00] text-black hover:opacity-90 active:scale-95 transition-all shadow-md"
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
