import React from 'react';
import { cn } from '../../utils/cn';
import { Icon } from '../Icon';
import { LargeWidgetProps } from './types';
import { WidgetArtwork } from './WidgetArtwork';

/**
 * LargeWidget (Large / Bento Card / Reference 2)
 * - Full-size 1-column, 2-column or 3-column bento card
 * - Header (STRICT RULE):
 *   - Icon is directly INLINE in the text string (STRICTLY WITHOUT SHAPE)
 *   - Title: uppercase bold with tracking-wider
 *   - Right: actions slot (badge, pill button, status indicator, switch)
 * - Content area: flexible children slot for interactive controls (gauges, player lists, buttons)
 * - Built-in scroll support (scrollable={true}) with hidden scrollbar
 * - Pinned 3D illustration support with smooth hover illumination
 */
export const LargeWidget = React.forwardRef<HTMLDivElement, LargeWidgetProps>(
  (
    {
      title,
      icon,
      badge,
      actions,
      children,
      scrollable = false,
      maxScrollHeight = '320px',
      artworkUrl,
      artworkNode,
      artworkClassName,
      href,
      target,
      colSpan,
      rowSpan,
      bgClassName = 'bg-[#14171c]',
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const isInteractive = Boolean(href || onClick);

    const colSpanClasses = {
      1: 'col-span-1',
      2: 'col-span-1 md:col-span-2',
      3: 'col-span-1 md:col-span-2 xl:col-span-3',
      4: 'col-span-1 md:col-span-2 xl:col-span-4',
    };

    const rowSpanClasses = {
      1: 'row-span-1',
      2: 'row-span-1 md:row-span-2',
    };

    const content = (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          // Container
          'relative w-full p-5 md:p-6 rounded-[28px] md:rounded-[32px] overflow-hidden select-none',
          bgClassName,
          'border-none ring-0 outline-none',
          // Flex layout
          'flex flex-col justify-between',
          // Interactive states
          'group transition-all duration-200',
          isInteractive && 'cursor-pointer sf-tap active:scale-[0.99] hover:bg-[#181c22]',
          colSpan && colSpanClasses[colSpan],
          rowSpan && rowSpanClasses[rowSpan],
          className
        )}
        {...props}
      >
        {/* Optional 3D Artwork in bottom right */}
        <WidgetArtwork
          artworkUrl={artworkUrl}
          artworkNode={artworkNode}
          artworkClassName={cn('w-44 h-44 max-w-[50%]', artworkClassName)}
        />

        {/* 1. Header (STRICT: icon is INLINE with text, NO SHAPE) */}
        <div className="flex items-center justify-between pb-3 relative z-10 w-full min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
            {icon && (
              <Icon
                name={icon}
                size={18}
                className="text-[#c0ff00] shrink-0"
                fill={true}
              />
            )}
            <span className="text-white font-bold text-xs sm:text-sm tracking-wider uppercase truncate">
              {title}
            </span>
            {badge && <div className="shrink-0 ml-1">{badge}</div>}
          </div>

          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </div>

        {/* 2. Content Zone */}
        <div
          className={cn(
            'relative z-10 flex-1 min-w-0 w-full mt-2',
            scrollable && 'overflow-y-auto no-scrollbar pr-1'
          )}
          style={scrollable ? { maxHeight: maxScrollHeight } : undefined}
        >
          {children}
        </div>
      </div>
    );

    if (href) {
      return (
        <a
          href={href}
          target={target}
          rel={target === '_blank' ? 'noreferrer noopener' : undefined}
          className="block w-full no-underline"
        >
          {content}
        </a>
      );
    }

    return content;
  }
);

LargeWidget.displayName = 'LargeWidget';
