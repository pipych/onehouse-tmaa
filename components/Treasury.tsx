'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Landmark, Plus, Minus, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

interface Player {
  id: string;
  tg_id: number;
  tg_username: string;
  mc_nickname: string;
  rp_name: string;
  avatar_url: string;
  roles: string[];
}

interface Props {
  currentUser: Player | null;
}

export default function Treasury({ currentUser }: Props) {
  const isManager = currentUser?.roles?.some(r =>
    ['admin', 'админ', 'президент', 'president'].includes(r.toLowerCase())
  ) ?? false;

  return (
    <div className="animate-fade-in w-full max-w-md mx-auto flex flex-col items-center">
      {/* Заголовок */}
      <div className="flex items-center justify-between w-full mb-12">
        <h2 className="text-xl md:text-2xl font-black text-white tracking-wide flex items-center gap-3">
          <Landmark size={24} className="text-[#c0ff00]" /> .казна
        </h2>
      </div>

      {/* Баланс — без фона, огромный шрифт */}
      <div className="text-center mb-16">
        <div className="text-[10px] text-gray-600 uppercase tracking-[0.3em] font-bold mb-4">Общий счёт казны</div>
        <div className="text-7xl md:text-8xl font-black text-white tracking-tight leading-none">
          <span className="text-[#c0ff00]">0</span>
        </div>
        <div className="text-2xl md:text-3xl font-black text-gray-400 mt-1">SPR</div>
        <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1 bg-[#c0ff00]/10 border border-[#c0ff00]/20 rounded-full text-[10px] font-bold text-[#c0ff00]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c0ff00] animate-pulse" />
          Государственная казна OneHouse
        </div>
      </div>

      {/* Кнопки действий */}
      {isManager && (
        <div className="grid grid-cols-2 gap-3 w-full mb-14">
          <button className="flex items-center justify-center gap-2 p-4 bg-[#c0ff00]/10 border border-[#c0ff00]/20 rounded-[20px] text-[#c0ff00] text-sm font-bold">
            <Plus size={16} /> Пополнить
          </button>
          <button className="flex items-center justify-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-[20px] text-red-400 text-sm font-bold">
            <Minus size={16} /> Списать
          </button>
        </div>
      )}

      {/* Транзакции */}
      <div className="w-full space-y-5">
        <div className="flex items-center gap-2 px-1">
          <Clock size={14} className="text-gray-500" />
          <span className="text-xs font-black uppercase tracking-wider text-gray-500">Транзакции</span>
        </div>

        <div className="space-y-3">
          <div className="bg-[#14171c]/90 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
              <ArrowDownLeft size={16} className="text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">Налоговый сбор</div>
              <div className="text-[10px] text-gray-500">12.06.2025 • Минфин</div>
            </div>
            <span className="text-sm font-black text-green-400 shrink-0">+500 SPR</span>
          </div>
          <div className="bg-[#14171c]/90 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
              <ArrowUpRight size={16} className="text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">Ремонт моста</div>
              <div className="text-[10px] text-gray-500">10.06.2025 • Президент</div>
            </div>
            <span className="text-sm font-black text-red-400 shrink-0">−200 SPR</span>
          </div>
          <div className="bg-[#14171c]/90 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
              <ArrowDownLeft size={16} className="text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">Штраф за гриферство</div>
              <div className="text-[10px] text-gray-500">08.06.2025 • Судья</div>
            </div>
            <span className="text-sm font-black text-green-400 shrink-0">+100 SPR</span>
          </div>
        </div>
      </div>
    </div>
  );
}
