import { useEffect, useState, useCallback } from 'react';

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export function applyTelegramSafeAreas(webApp: any): number {
  if (typeof document === 'undefined' || !webApp) return 0;

  try {
    const contentTop = Number(webApp.contentSafeAreaInset?.top) || 0;
    const safeTop = Number(webApp.safeAreaInset?.top) || 0;
    const topInset = Math.max(contentTop, safeTop);

    const root = document.documentElement;
    root.style.setProperty('--js-tg-top-inset', `${topInset}px`);
    if (contentTop > 0) {
      root.style.setProperty('--js-tg-content-top', `${contentTop}px`);
      root.style.setProperty('--tg-content-safe-area-inset-top', `${contentTop}px`);
    }
    if (safeTop > 0) {
      root.style.setProperty('--js-tg-safe-top', `${safeTop}px`);
      root.style.setProperty('--tg-safe-area-inset-top', `${safeTop}px`);
    }
    return topInset;
  } catch (e) {
    return 0;
  }
}

export function useTelegram() {
  const [tg, setTg] = useState<any>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [startParam, setStartParam] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [topInset, setTopInset] = useState<number>(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      return applyTelegramSafeAreas((window as any).Telegram.WebApp);
    }
    return 0;
  });

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
        if (typeof webApp.setBottomBarColor === 'function') {
          try { webApp.setBottomBarColor('#090b0e'); } catch (e) {}
        }

        // Немедленная и отложенная синхронизация отступов Safe Area
        const initialInset = applyTelegramSafeAreas(webApp);
        setTopInset(initialInset);

        const handleAreaChange = () => {
          const updated = applyTelegramSafeAreas(webApp);
          setTopInset(updated);
        };

        const t1 = setTimeout(handleAreaChange, 100);
        const t2 = setTimeout(handleAreaChange, 300);
        const t3 = setTimeout(handleAreaChange, 800);

        try {
          webApp.onEvent?.('contentSafeAreaChanged', handleAreaChange);
          webApp.onEvent?.('safeAreaChanged', handleAreaChange);
          webApp.onEvent?.('fullscreenChanged', handleAreaChange);
          webApp.onEvent?.('viewportChanged', handleAreaChange);
        } catch (e) {}

        window.addEventListener('resize', handleAreaChange);
        window.addEventListener('orientationchange', handleAreaChange);

        if (webApp.initDataUnsafe?.user) {
          setUser(webApp.initDataUnsafe.user);
        }

        if (webApp.initDataUnsafe?.start_param) {
          setStartParam(webApp.initDataUnsafe.start_param);
        }

        setIsReady(true);

        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
          try {
            webApp.offEvent?.('contentSafeAreaChanged', handleAreaChange);
            webApp.offEvent?.('safeAreaChanged', handleAreaChange);
            webApp.offEvent?.('fullscreenChanged', handleAreaChange);
            webApp.offEvent?.('viewportChanged', handleAreaChange);
          } catch (e) {}
          window.removeEventListener('resize', handleAreaChange);
          window.removeEventListener('orientationchange', handleAreaChange);
        };
      } catch (err) {
        console.error('Failed to initialize Telegram WebApp:', err);
        setIsReady(true);
      }
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
    topInset,
    haptic,
    showBackButton,
    hideBackButton,
  };
}
