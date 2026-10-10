import React from 'react';
import { cn } from '../../utils/cn';
import { Icon } from '../Icon';
import { SquareWidgetProps } from './types';
import { WidgetArtwork } from './WidgetArtwork';

/**
 * SquareWidget (Square / Shortcut Widget / Reference 1)
 * - Compact 1:1 Aspect ratio square tile
 * - Top-left: compact rounded square shape (w-9 h-9 or w-10 h-10 rounded-[14px]) with #c0ff00 icon
 * - Top-right: subtle arrow (size-4 / size-5, text-white/30)
 * - Bottom-left: strictly anchored text group (mt-auto text-left flex flex-col items-start)
 * - Dense bold title + uppercase tracking-wider subtitle
 */
export const SquareWidget = React.forwardRef<HTMLDivElement, SquareWidgetProps>(
  (
    {
      icon,
      title,
      subtitle,
      showArrow,
      topAction,
      iconColor = '#c0ff00',
      shapeBg = 'bg-[#181c23]',
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
    const shouldShowArrow = showArrow !== undefined ? showArrow : isInteractive;

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
          // Container & Compact 1:1 Shape
          'relative aspect-square w-full p-3.5 sm:p-4 rounded-[22px] sm:rounded-[26px] md:rounded-[28px] overflow-hidden select-none',
          bgClassName,
          'border-none ring-0 outline-none',
          // Flex layout with strictly anchored bottom-left content
          'flex flex-col justify-between items-start',
          // Interactive states
          'group transition-all duration-200',
          isInteractive && 'cursor-pointer sf-tap active:scale-[0.98] hover:bg-[#181c22]',
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
          artworkClassName={cn('w-2/3 h-2/3 max-w-[120px] max-h-[120px]', artworkClassName)}
        />

        {/* Top bar: Icon shape on left, Arrow on right */}
        <div className="flex items-start justify-between relative z-10 w-full">
          {/* Compact square shape with icon */}
          <div
            className={cn(
              'w-9 h-9 sm:w-10 sm:h-10 rounded-[12px] sm:rounded-[14px] aspect-square flex items-center justify-center shrink-0 border-none transition-transform duration-200 group-hover:scale-105',
              shapeBg
            )}
            style={{ color: iconColor }}
          >
            <Icon name={icon} size={20} fill={true} />
          </div>

          {/* Top-right action / shortcut arrow */}
          {topAction ? (
            <div className="shrink-0">{topAction}</div>
          ) : shouldShowArrow ? (
            <div className="w-6 h-6 flex items-center justify-center text-white/30 group-hover:text-white transition-colors shrink-0">
              <Icon
                name="north_east"
                size={16}
                className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              />
            </div>
          ) : null}
        </div>

        {/* Bottom text group: STRICTLY anchored to bottom-left corner */}
        <div className="mt-auto relative z-10 pt-3 flex flex-col items-start text-left w-full">
          <h3 className="text-white font-bold text-sm md:text-base leading-snug tracking-tight group-hover:text-white transition-colors truncate w-full text-left">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[#8e8e93] text-[10px] md:text-xs tracking-wider uppercase font-semibold mt-0.5 truncate w-full text-left">
              {subtitle}
            </p>
          )}
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

SquareWidget.displayName = 'SquareWidget';
