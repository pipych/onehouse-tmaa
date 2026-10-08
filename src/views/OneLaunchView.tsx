import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '../components/ui/SFSymbol';
import OneLaunchContent from '../components/OneLaunch';

export default function OneLaunchView() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-8 md:pt-16 pb-28 antialiased">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
        {/* Кнопка «Назад» на главную */}
        <div className="flex items-center select-none">
          <button
            onClick={() => navigate('/')}
            className="w-12 h-12 flex items-center justify-center bg-[#14171c]/90 backdrop-blur-xl border border-white/10 rounded-full text-white shadow-2xl active:scale-90 transition-transform hover:border-white/20"
            title="На главную"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        <OneLaunchContent />
      </div>
    </div>
  );
}
