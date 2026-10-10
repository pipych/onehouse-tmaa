import React from 'react';

export type WidgetColSpan = 1 | 2 | 3 | 4;
export type WidgetRowSpan = 1 | 2;

export interface WidgetArtworkProps {
  /** URL of the 3D illustration or background image */
  artworkUrl?: string;
  /** Custom ReactNode for 3D graphic / illustration */
  artworkNode?: React.ReactNode;
  /** Custom classes for artwork container */
  artworkClassName?: string;
}

export interface WidgetBaseProps extends React.HTMLAttributes<HTMLDivElement>, WidgetArtworkProps {
  /** Column span within a BentoGrid */
  colSpan?: WidgetColSpan;
  /** Row span within a BentoGrid */
  rowSpan?: WidgetRowSpan;
  /** If provided, renders widget as an anchor link */
  href?: string;
  /** Custom link target */
  target?: string;
  /** Background surface color override (defaults to #14171c) */
  bgClassName?: string;
  /** Whether widget has interactive click/hover styling */
  interactive?: boolean;
}

/**
 * Props for Small / Row Widget (Reference 3)
 * Horizontal compact widget with icon in shape on left and vertical text stack.
 */
export interface SmallWidgetProps extends WidgetBaseProps {
  /** Material Symbols Rounded icon name */
  icon: string;
  /** Main title */
  title: string;
  /** Secondary subtitle / description below title */
  description?: string;
  /** Optional trailing element (chevron, badge, button) */
  trailing?: React.ReactNode;
  /** Icon color (defaults to '#c0ff00') */
  iconColor?: string;
  /** Icon shape background (defaults to '#181c23') */
  shapeBg?: string;
}

/**
 * Props for Square / Medium Widget (Reference 1)
 * 1:1 aspect ratio tile with icon shape top-left, shortcut arrow top-right, and text at bottom.
 */
export interface SquareWidgetProps extends WidgetBaseProps {
  /** Material Symbols Rounded icon name */
  icon: string;
  /** Large title at bottom */
  title: string;
  /** Uppercase subtitle below title */
  subtitle?: string;
  /** Shows arrow indicator top-right (defaults to true if href or onClick) */
  showArrow?: boolean;
  /** Custom action slot top-right (replaces arrow) */
  topAction?: React.ReactNode;
  /** Icon color (defaults to '#c0ff00') */
  iconColor?: string;
  /** Icon shape background (defaults to '#181c23') */
  shapeBg?: string;
}

/**
 * Props for Large / Bento Card Widget (Reference 2)
 * Full-size card spanning 1-2 columns. Header icon is strictly WITHOUT shape.
 */
export interface LargeWidgetProps extends WidgetBaseProps {
  /** Headline title */
  title: string;
  /** Material Symbols Rounded icon placed directly INLINE in header (strictly without shape) */
  icon?: string;
  /** Header badge (e.g. online count, status) */
  badge?: React.ReactNode;
  /** Actions on the right side of the header (buttons, switches, pills) */
  actions?: React.ReactNode;
  /** Enables internal scroll with clean hidden scrollbar */
  scrollable?: boolean;
  /** Max height when scrollable */
  maxScrollHeight?: string | number;
  /** Main interactive children content */
  children?: React.ReactNode;
}

/**
 * BentoGrid container props
 */
export interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum number of columns on desktop (defaults to 3) */
  cols?: 1 | 2 | 3 | 4;
  /** Children widgets */
  children: React.ReactNode;
}
