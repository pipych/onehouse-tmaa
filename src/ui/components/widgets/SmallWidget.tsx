import React from 'react';
import { cn } from '../../utils/cn';
import { Icon } from '../Icon';
import { SmallWidgetProps } from './types';
import { WidgetArtwork } from './WidgetArtwork';

/**
 * SmallWidget (Row / Reference 3)
 * - Compact horizontal row layout
 * - Left: rounded square shape with #c0ff00 icon
 * - Middle: vertical text stack (bold title + muted description)
 * - Optional right: trailing element / chevron
 * - Interactive tap physics (active:scale-[0.98])
 * - Pinned 3D illustration support with hover illumination
 */
export const SmallWidget = React.forwardRef<HTMLDivElement, SmallWidgetProps>(
  (
    {
      icon,
      title,
      description,
      trailing,
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
          // Container & Shape
          'relative w-full py-4 px-5 rounded-[24px] md:rounded-[28px] overflow-hidden select-none',
          bgClassName,
          'border-none ring-0 outline-none',
          // Flex layout
          'flex items-center justify-between',
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
          artworkClassName={cn('w-28 h-28 max-h-full', artworkClassName)}
        />

        {/* Left + Center content */}
        <div className="flex items-center min-w-0 relative z-10 flex-1 pr-2">
          {/* 1. Square shape with icon */}
          <div
            className={cn(
              'w-12 h-12 rounded-[16px] aspect-square flex items-center justify-center shrink-0 border-none transition-transform duration-200 group-hover:scale-105',
              shapeBg
            )}
            style={{ color: iconColor }}
          >
            <Icon name={icon} size={24} fill={true} />
          </div>

          {/* 2. Text stack */}
          <div className="ml-4 flex-1 min-w-0 flex flex-col justify-center">
            <h3 className="text-white font-bold text-base md:text-lg leading-tight truncate tracking-tight">
              {title}
            </h3>
            {description && (
              <p className="text-[#8e8e93] text-xs md:text-sm mt-0.5 truncate leading-normal">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* 3. Trailing slot (arrow, badge or custom action) */}
        {trailing ? (
          <div className="relative z-10 shrink-0 ml-3">{trailing}</div>
        ) : isInteractive ? (
          <div className="relative z-10 shrink-0 ml-3 text-[#8e8e93] group-hover:text-white transition-colors">
            <Icon
              name="chevron_right"
              size={22}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </div>
        ) : null}
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

SmallWidget.displayName = 'SmallWidget';
