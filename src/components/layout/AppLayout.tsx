import React from 'react';
import { DesktopNavbar } from './DesktopNavbar';
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
    <div className="min-h-screen bg-[#090b0e] text-white flex flex-col md:flex-row relative overflow-x-hidden antialiased selection:bg-[#c0ff00] selection:text-black">
      {/* Десктопная панель навигации слева */}
      {!hideNavigation && (
        <DesktopNavbar
          activeTab={activeTab}
          onTabChange={onTabChange}
          seasonEnded={seasonEnded}
          currentUser={currentUser}
          isAdmin={isAdmin}
          onAdminClick={onAdminClick}
          onProfileClick={onProfileClick}
        />
      )}

      {/* Контентная область */}
      <div className="flex-1 min-w-0 flex flex-col w-full">
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-tma-safe md:pt-8 pb-28 md:pb-12 transition-all">
          {children}
        </main>
      </div>

      {/* Мобильный плавающий нижний таббар */}
      {!hideNavigation && (
        <MobileTabBar
          activeTab={activeTab}
          onTabChange={onTabChange}
          seasonEnded={seasonEnded}
        />
      )}
    </div>
  );
}

export default AppLayout;
