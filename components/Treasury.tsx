'use client';

import { useState, useEffect, useCallback } from 'react';
import { Landmark, Plus, Minus, ArrowUpRight, ArrowDownLeft, Clock, X, Coins } from 'lucide-react';
import { getBalance, getTransactions, addTransaction, TreasuryTransaction } from '../lib/treasury';

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

const DEPOSIT_AMOUNTS = [50, 100, 300, 500, 1000, 5000, 10000];
const WITHDRAW_AMOUNTS = [50, 100, 300, 500, 1000, 5000];

function getBankImage(balance: number): string {
  if (balance >= 10000) return '/bank 10000+.webp';
  if (balance >= 5000) return '/bank 5000+.webp';
  if (balance >= 1000) return '/bank 1000+.webp';
  if (balance >= 300) return '/bank 300+.webp';
  if (balance >= 50) return '/bank 50+.webp';
  return '/bank 0.webp';
}

function formatSpr(n: number): string {
  return n.toLocaleString('ru-RU');
}

export default function Treasury({ currentUser }: Props) {
  const isManager = currentUser?.roles?.some(r =>
    ['admin', 'админ', 'президент', 'president'].includes(r.toLowerCase())
  ) ?? false;

  const authorName = currentUser?.rp_name || currentUser?.mc_nickname || currentUser?.tg_username || 'Неизвестный';

  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Модалки
  const [modal, setModal] = useState<'deposit' | 'withdrawal' | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    const [bal, txs] = await Promise.all([getBalance(), getTransactions()]);
    setBalance(bal);
    setTransactions(txs);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshAfterTx = () => {
    fetchData();
  };

  const handleSubmit = async (amount: number) => {
    const type = modal!;
    setError('');
    setSubmitting(true);

    const tx = await addTransaction({
      amount,
      type,
      description: description.trim() || (type === 'deposit' ? 'Пополнение казны' : 'Списание из казны'),
      author_name: authorName,
      author_tg_id: currentUser?.tg_id,
    });

    setSubmitting(false);

    if (!tx) {
      setError('Ошибка при сохранении. Попробуй ещё раз.');
      return;
    }

    // Закрыть модалку и обновить данные
    setModal(null);
    setCustomAmount('');
    setDescription('');
    refreshAfterTx();
  };

  const handleCustomSubmit = () => {
    const n = parseInt(customAmount);
    if (isNaN(n) || n <= 0) {
      setError('Введи корректное число > 0');
      return;
    }
    handleSubmit(n);
  };

  const closeModal = () => {
    setModal(null);
    setCustomAmount('');
    setDescription('');
    setError('');
  };

  if (loading) {
    return (
      <div className="animate-fade-in w-full max-w-md mx-auto text-center py-20">
        <div className="w-8 h-8 border-2 border-[#c0ff00]/30 border-t-[#c0ff00] rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in w-full max-w-md mx-auto">
      {/* Заголовок */}
      <div className="flex items-center justify-between w-full pb-6">
        <h2 className="text-xl md:text-2xl font-black text-white tracking-wide flex items-center gap-3">
          <Landmark size={24} className="text-[#c0ff00]" /> .казна
        </h2>
      </div>

      {/* Банка */}
      <div className="flex justify-center py-6">
        <img
          src={getBankImage(balance ?? 0)}
          alt="Казна"
          className="w-48 h-48 object-contain drop-shadow-[0_0_40px_rgba(192,255,0,0.15)]"
        />
      </div>

      {/* Баланс */}
      <div className="text-center pb-8">
        <div className="font-black tracking-tight leading-none" style={{ fontSize: 'clamp(3rem, 12vw, 6rem)' }}>
          <span className="text-[#c0ff00]">{balance !== null ? formatSpr(balance) : '…'}</span>
          <span className="text-gray-600 text-[0.4em] align-top ml-1">SPR</span>
        </div>
      </div>

      {/* Кнопки действий */}
      {isManager && (
        <div className="grid grid-cols-2 gap-3 w-full pb-8">
          <button
            onClick={() => setModal('deposit')}
            className="flex items-center justify-center gap-2 p-4 bg-[#c0ff00]/10 border border-[#c0ff00]/20 rounded-[20px] text-[#c0ff00] text-sm font-bold active:scale-95 transition-transform"
          >
            <Plus size={16} /> Пополнить
          </button>
          <button
            onClick={() => setModal('withdrawal')}
            className="flex items-center justify-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-[20px] text-red-400 text-sm font-bold active:scale-95 transition-transform"
          >
            <Minus size={16} /> Списать
          </button>
        </div>
      )}

      {/* Транзакции */}
      <div className="w-full pb-8 space-y-5">
        <div className="flex items-center gap-2 px-1">
          <Clock size={14} className="text-gray-500" />
          <span className="text-xs font-black uppercase tracking-wider text-gray-500">Транзакции</span>
          {transactions.length > 0 && (
            <span className="text-[10px] text-gray-600 ml-auto">{transactions.length}</span>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            <Coins size={32} className="mx-auto mb-3 opacity-30" />
            Транзакций пока нет
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-[#14171c]/90 border border-white/5 rounded-2xl p-4 flex items-center gap-4"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    tx.type === 'deposit' ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}
                >
                  {tx.type === 'deposit' ? (
                    <ArrowDownLeft size={16} className="text-green-400" />
                  ) : (
                    <ArrowUpRight size={16} className="text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{tx.description}</div>
                  <div className="text-[10px] text-gray-500">
                    {new Date(tx.created_at).toLocaleDateString('ru-RU')} • {tx.author_name}
                  </div>
                </div>
                <span
                  className={`text-sm font-black shrink-0 ${
                    tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {tx.type === 'deposit' ? '+' : '−'}
                  {formatSpr(tx.amount)} SPR
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модалка */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Оверлей */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />

          {/* Контент */}
          <div className="relative bg-[#1a1d24] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm p-6 animate-slide-up">
            {/* Шапка */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-white">
                {modal === 'deposit' ? 'Пополнить казну' : 'Списать из казны'}
              </h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Быстрые суммы */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(modal === 'deposit' ? DEPOSIT_AMOUNTS : WITHDRAW_AMOUNTS).map((n) => (
                <button
                  key={n}
                  onClick={() => handleSubmit(n)}
                  disabled={submitting}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 ${
                    modal === 'deposit'
                      ? 'bg-[#c0ff00]/10 text-[#c0ff00] border border-[#c0ff00]/20 hover:bg-[#c0ff00]/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                  }`}
                >
                  {modal === 'deposit' ? '+' : '−'}{formatSpr(n)}
                </button>
              ))}
            </div>

            {/* Кастомная сумма */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 block">
                Своя сумма
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Введи сумму"
                  className="flex-1 bg-[#0d0f12] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold placeholder:text-gray-600 outline-none focus:border-[#c0ff00]/50 transition-colors"
                />
                <button
                  onClick={handleCustomSubmit}
                  disabled={submitting || !customAmount}
                  className={`px-5 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-30 ${
                    modal === 'deposit'
                      ? 'bg-[#c0ff00] text-black'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {modal === 'deposit' ? 'Пополнить' : 'Списать'}
                </button>
              </div>
            </div>

            {/* Описание */}
            <div className="mb-1">
              <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 block">
                Описание (необязательно)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={modal === 'deposit' ? 'Налоговый сбор, штраф...' : 'Ремонт, закупка...'}
                maxLength={100}
                className="w-full bg-[#0d0f12] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 outline-none focus:border-[#c0ff00]/50 transition-colors"
              />
            </div>

            {/* Ошибка */}
            {error && (
              <div className="mt-3 text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2">{error}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
