import React from 'react';
import { DesktopNavbar, DesktopNavbarProps } from './DesktopNavbar';

export interface DesktopSidebarProps extends DesktopNavbarProps {}

export function DesktopSidebar(props: DesktopSidebarProps) {
  return <DesktopNavbar {...props} />;
}

export default DesktopSidebar;
