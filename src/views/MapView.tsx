import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { Icon } from '../ui/components/Icon';

const MAP_URL = 'https://map.onehouse.pp.ua/#world:-56:60:-235:123:0:0:0:1:flat';

export default function MapView() {
  const navigate = useNavigate();
  const { showBackButton, hideBackButton } = useTelegram();

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    showBackButton(handleBack);
    return () => hideBackButton();
  }, [showBackButton, hideBackButton]);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#090b0e] z-50 overflow-hidden flex flex-col">
      {/* Кнопка назад сверху слева: опущена ниже интерфейса Telegram (safe-area + tma padding) */}
      <div 
        className="absolute z-50 pointer-events-auto"
        style={{
          top: 'max(calc(var(--tma-top-padding) + 10px), 72px)',
          left: 'max(env(safe-area-inset-left, 0px) + 16px, 16px)',
        }}
      >
        <button
          onClick={handleBack}
          className="w-11 h-11 flex items-center justify-center bg-[#14171c]/90 hover:bg-[#1c222b] text-white rounded-full backdrop-blur-md shadow-2xl border border-white/10 transition-all active:scale-95 cursor-pointer"
          aria-label="Назад"
        >
          <Icon name="arrow_back" size={20} className="text-white" />
        </button>
      </div>

      {/* Интерактивная карта без рамок и навбара */}
      <iframe
        src={MAP_URL}
        className="w-full h-full border-0 flex-1"
        title="Онлайн-карта сервера OneHouse"
        allow="fullscreen"
      />
    </div>
  );
}
