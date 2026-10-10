import React from 'react';
import { cn } from '../../utils/cn';
import { WidgetArtworkProps } from './types';

export const WidgetArtwork: React.FC<WidgetArtworkProps> = ({
  artworkUrl,
  artworkNode,
  artworkClassName,
}) => {
  if (!artworkUrl && !artworkNode) return null;

  return (
    <div
      className={cn(
        'absolute right-0 bottom-0 pointer-events-none z-0 overflow-hidden select-none',
        'opacity-40 group-hover:opacity-80 transition-opacity duration-300 ease-out',
        artworkClassName
      )}
      aria-hidden="true"
    >
      {artworkUrl ? (
        <img
          src={artworkUrl}
          alt=""
          loading="lazy"
          className="w-full h-full object-contain object-bottom-right"
        />
      ) : (
        artworkNode
      )}
    </div>
  );
};
