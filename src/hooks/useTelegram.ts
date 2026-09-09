import { useEffect, useState, useCallback } from 'react';

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export function useTelegram() {
  const [tg, setTg] = useState<any>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [startParam, setStartParam] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const webApp = (window as any).Telegram?.WebApp;
    if (webApp) {
      setTg(webApp);

      try {
        webApp.ready();
        webApp.expand();

        // Повторный expand для надежности в Telegram Desktop
        setTimeout(() => {
          try { webApp.expand(); } catch (e) {}
        }, 150);

        // Отключаем вертикальный свайп для закрытия (Pull-to-close)
        if (typeof webApp.disableVerticalSwipes === 'function') {
          webApp.disableVerticalSwipes();
        } else if ('isVerticalSwipesEnabled' in webApp) {
          webApp.isVerticalSwipesEnabled = false;
        }

        // Полноэкранный режим
        if (typeof webApp.requestFullscreen === 'function') {
          try { webApp.requestFullscreen(); } catch (e) {}
        }

        // Цвета заголовка и фона темы
        if (typeof webApp.setHeaderColor === 'function') {
          try { webApp.setHeaderColor('#090b0e'); } catch (e) {}
        }
        if (typeof webApp.setBackgroundColor === 'function') {
          try { webApp.setBackgroundColor('#090b0e'); } catch (e) {}
        }

        if (webApp.initDataUnsafe?.user) {
          setUser(webApp.initDataUnsafe.user);
        }

        if (webApp.initDataUnsafe?.start_param) {
          setStartParam(webApp.initDataUnsafe.start_param);
        }
      } catch (err) {
        console.error('Failed to initialize Telegram WebApp:', err);
      }

      setIsReady(true);
    } else {
      setIsReady(true);
    }
  }, []);

  const haptic = useCallback((type: 'success' | 'warning' | 'error' | 'light' | 'medium' | 'heavy' | 'selection' = 'light') => {
    try {
      const feedback = tg?.HapticFeedback;
      if (!feedback) return;

      if (['success', 'warning', 'error'].includes(type)) {
        feedback.notificationOccurred(type);
      } else if (type === 'selection') {
        feedback.selectionChanged();
      } else {
        feedback.impactOccurred(type);
      }
    } catch (e) {
      // Ignored outside Telegram
    }
  }, [tg]);

  const showBackButton = useCallback((onClick: () => void) => {
    if (!tg?.BackButton) return;
    try {
      tg.BackButton.show();
      tg.BackButton.onClick(onClick);
    } catch (e) {}
  }, [tg]);

  const hideBackButton = useCallback(() => {
    if (!tg?.BackButton) return;
    try {
      tg.BackButton.hide();
      tg.BackButton.offClick();
    } catch (e) {}
  }, [tg]);

  return {
    tg,
    user,
    startParam,
    isReady,
    haptic,
    showBackButton,
    hideBackButton,
  };
}
