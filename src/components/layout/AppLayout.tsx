import React from 'react';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileTabBar } from './MobileTabBar';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  seasonEnded?: boolean;
  currentUser?: any;
  isAdmin?: boolean;
  onAdminClick?: () => void;
  onProfileClick?: () => void;
  hideNavigation?: boolean;
}

export function AppLayout({
  children,
  activeTab,
  onTabChange,
  seasonEnded = false,
  currentUser,
  isAdmin = false,
  onAdminClick,
  onProfileClick,
  hideNavigation = false,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[#090b0e] text-white flex flex-col relative overflow-x-hidden antialiased">
      {/* Фоновые декоративные элементы для ПК */}
      <div className="fixed inset-0 -z-10 hidden md:block bg-[#090b0e] pointer-events-none" />

      {/* ПК Сайдбар */}
      {!hideNavigation && (
        <div className="hidden md:flex flex-col items-center fixed left-6 top-1/2 -translate-y-1/2 z-50">
          <DesktopSidebar
            activeTab={activeTab}
            onTabChange={onTabChange}
            seasonEnded={seasonEnded}
            currentUser={currentUser}
            isAdmin={isAdmin}
            onAdminClick={onAdminClick}
            onProfileClick={onProfileClick}
          />
        </div>
      )}

      {/* Контентная область: ограничена на ПК, чтобы не растягиваться на сверхшироких экранах */}
      <main className={`flex-1 w-full max-w-4xl mx-auto px-4 pt-6 pb-28 md:pb-12 ${!hideNavigation ? 'md:pl-28' : ''} transition-all`}>
        {children}
      </main>

      {/* Мобильный нижний таббар */}
      {!hideNavigation && (
        <div className="md:hidden fixed bottom-7 pb-[env(safe-area-inset-bottom,0px)] left-0 right-0 px-3 z-50 flex items-center justify-center pointer-events-none transition-all duration-300">
          <div className="w-full max-w-md pointer-events-auto">
            <MobileTabBar
              activeTab={activeTab}
              onTabChange={onTabChange}
              seasonEnded={seasonEnded}
            />
          </div>
        </div>
      )}
    </div>
  );
}
