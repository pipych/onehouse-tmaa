import React from 'react';

/**
 * Universal Navigation Item definition across OneWebUI
 */
export interface NavItem {
  id: string;
  label: string;
  /** Name of the Material Symbols Rounded icon */
  icon: string;
  /** Optional link URL (if used as anchor) */
  href?: string;
  /** Optional badge value (counter or text) */
  badge?: number | string;
  /** Optional disabled state */
  disabled?: boolean;
}

/**
 * Props for MobileNavbar component
 */
export interface MobileNavbarProps {
  /** Navigation items (strictly up to 5 items) */
  items: NavItem[];
  /** ID of current active item */
  activeId: string;
  /** Callback fired when a tab is selected */
  onChange: (id: string) => void;
  /** Custom container class */
  className?: string;
  /** Whether the navbar should be statically placed instead of fixed bottom (useful for previews/cards) */
  isStatic?: boolean;
  /** Custom max width class (default 'max-w-md') */
  maxWidthClass?: string;
  /** Optional extra action slot separated by divider (like in OneHouse) */
  extraAction?: {
    id: string;
    label: string;
    icon: string;
    badge?: number | string;
    onClick?: () => void;
  };
}

/**
 * Props for DesktopNavbar component (OneDash 1:1)
 */
export interface DesktopNavbarProps {
  /** Navigation items */
  items: NavItem[];
  /** ID of current active item */
  activeId: string;
  /** Callback fired when a tab is selected */
  onChange: (id: string) => void;
  /** Brand / Logo element placed at the top (defaults to AppLogo) */
  logo?: React.ReactNode;
  /** Title text next to logo in expanded view (defaults to 'OneDash') */
  title?: string;
  /** Additional container class */
  className?: string;
  /** Whether the navbar should be statically placed instead of sticky (useful for previews) */
  isStatic?: boolean;
  /** Controlled or initial collapsed state */
  isCollapsed?: boolean;
  /** Default collapsed state if uncontrolled */
  defaultCollapsed?: boolean;
  /** Callback when collapse/expand toggle is clicked */
  onToggleCollapse?: () => void;
}

/**
 * Props for adaptive Navbar (renders DesktopNavbar on md: and MobileNavbar on mobile)
 */
export interface NavbarProps {
  items: NavItem[];
  activeId: string;
  onChange: (id: string) => void;
  logo?: React.ReactNode;
  title?: string;
  className?: string;
  desktopClassName?: string;
  mobileClassName?: string;
  isStatic?: boolean;
  isCollapsed?: boolean;
  defaultCollapsed?: boolean;
  onToggleCollapse?: () => void;
  extraAction?: MobileNavbarProps['extraAction'];
}
