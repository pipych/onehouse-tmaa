import React from 'react';
import { cn } from '../../utils/cn';
import { BentoGridProps } from './types';

/**
 * BentoGrid - Responsive container for Bento tiles and widgets.
 * Standard layout: 1 col on mobile, 2 cols on tablet, 3 cols on desktop.
 */
export const BentoGrid = React.forwardRef<HTMLDivElement, BentoGridProps>(
  ({ cols = 3, className, children, ...props }, ref) => {
    const colsClass = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
    }[cols];

    return (
      <div
        ref={ref}
        className={cn('grid gap-4 md:gap-5 items-stretch w-full', colsClass, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

BentoGrid.displayName = 'BentoGrid';
