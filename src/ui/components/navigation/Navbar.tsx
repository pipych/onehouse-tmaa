import React from 'react';
import { cn } from '../../utils/cn';
import { NavbarProps } from './types';
import { DesktopNavbar } from './DesktopNavbar';
import { MobileNavbar } from './MobileNavbar';

/**
 * Adaptive Navbar for OneWebUI
 * - Automatically renders DesktopNavbar on desktop screens (md:)
 * - Automatically renders MobileNavbar (floating bottom capsule) on mobile screens (<md)
 * - Adheres strictly to OneHouse aesthetic, animations, and tab limits.
 */
export const Navbar: React.FC<NavbarProps> = ({
  items,
  activeId,
  onChange,
  logo,
  title,
  className,
  desktopClassName,
  mobileClassName,
  isStatic = false,
  isCollapsed,
  defaultCollapsed,
  onToggleCollapse,
  extraAction,
}) => {
  return (
    <div className={cn('w-full', className)}>
      {/* Desktop view: OneDash vertical sidebar dock */}
      <div className={cn('hidden md:block', desktopClassName)}>
        <DesktopNavbar
          items={items}
          activeId={activeId}
          onChange={onChange}
          logo={logo}
          title={title}
          isStatic={isStatic}
          isCollapsed={isCollapsed}
          defaultCollapsed={defaultCollapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </div>

      {/* Mobile view: floating bottom tabbar */}
      <div className={cn('md:hidden', mobileClassName)}>
        <MobileNavbar
          items={items}
          activeId={activeId}
          onChange={onChange}
          isStatic={isStatic}
          extraAction={extraAction}
        />
      </div>
    </div>
  );
};
