import React, { useState } from 'react';
import { Icon } from '@iconify/react';

// Import curated SF Symbols from @iconify-icons/f7 (Filled versions)
import houseFill from '@iconify-icons/f7/house-fill';
import docTextFill from '@iconify-icons/f7/doc-text-fill';
import bookFill from '@iconify-icons/f7/book-fill';
import buildingColumnsFill from '@iconify-icons/f7/building-columns-fill';
import archiveboxFill from '@iconify-icons/f7/archivebox-fill';
import arrowDownCircleFill from '@iconify-icons/f7/arrow-down-circle-fill';
import arrowUpCircleFill from '@iconify-icons/f7/arrow-up-circle-fill';
import cloudUploadFill from '@iconify-icons/f7/cloud-upload-fill';
import arrowUpDoc from '@iconify-icons/f7/arrow-up-doc';
import person2Fill from '@iconify-icons/f7/person-2-fill';
import personFill from '@iconify-icons/f7/person-fill';
import personCropCircleBadgePlus from '@iconify-icons/f7/person-crop-circle-badge-plus';
import shieldFill from '@iconify-icons/f7/shield-fill';
import shieldLefthalfFill from '@iconify-icons/f7/shield-lefthalf-fill';
import exclamationmarkShieldFill from '@iconify-icons/f7/exclamationmark-shield-fill';
import checkmarkShieldFill from '@iconify-icons/f7/checkmark-shield-fill';
import chevronLeft from '@iconify-icons/f7/chevron-left';
import chevronRight from '@iconify-icons/f7/chevron-right';
import chevronDown from '@iconify-icons/f7/chevron-down';
import chevronUp from '@iconify-icons/f7/chevron-up';
import arrowLeft from '@iconify-icons/f7/arrow-left';
import arrowRight from '@iconify-icons/f7/arrow-right';
import plusCircleFill from '@iconify-icons/f7/plus-circle-fill';
import minusCircleFill from '@iconify-icons/f7/minus-circle-fill';
import checkmarkCircleFill from '@iconify-icons/f7/checkmark-circle-fill';
import xmarkCircleFill from '@iconify-icons/f7/xmark-circle-fill';
import search from '@iconify-icons/f7/search';
import searchCircleFill from '@iconify-icons/f7/search-circle-fill';
import arrowClockwiseCircleFill from '@iconify-icons/f7/arrow-clockwise-circle-fill';
import arrowCounterclockwiseCircleFill from '@iconify-icons/f7/arrow-counterclockwise-circle-fill';
import clockFill from '@iconify-icons/f7/clock-fill';
import heartFill from '@iconify-icons/f7/heart-fill';
import heartSlashFill from '@iconify-icons/f7/heart-slash-fill';
import chatBubbleFill from '@iconify-icons/f7/chat-bubble-fill';
import chatBubbleTextFill from '@iconify-icons/f7/chat-bubble-text-fill';
import ellipsisVertical from '@iconify-icons/f7/ellipsis-vertical';
import ellipsisCircleFill from '@iconify-icons/f7/ellipsis-circle-fill';
import mapFill from '@iconify-icons/f7/map-fill';
import todayFill from '@iconify-icons/f7/today-fill';
import circleGridHexFill from '@iconify-icons/f7/circle-grid-hex-fill';
import trashFill from '@iconify-icons/f7/trash-fill';
import paperplaneFill from '@iconify-icons/f7/paperplane-fill';
import flameFill from '@iconify-icons/f7/flame-fill';
import boltFill from '@iconify-icons/f7/bolt-fill';
import arrowUpRight from '@iconify-icons/f7/arrow-up-right';
import arrowDownLeft from '@iconify-icons/f7/arrow-down-left';
import eyeFill from '@iconify-icons/f7/eye-fill';
import folderFill from '@iconify-icons/f7/folder-fill';
import folderFillBadgePlus from '@iconify-icons/f7/folder-fill-badge-plus';
import bold from '@iconify-icons/f7/bold';
import italic from '@iconify-icons/f7/italic';
import strikethrough from '@iconify-icons/f7/strikethrough';
import textformat from '@iconify-icons/f7/textformat';
import textformatSize from '@iconify-icons/f7/textformat-size';
import textAlignleft from '@iconify-icons/f7/text-alignleft';
import textAligncenter from '@iconify-icons/f7/text-aligncenter';
import playRectangleFill from '@iconify-icons/f7/play-rectangle-fill';
import photoFill from '@iconify-icons/f7/photo-fill';
import expand from '@iconify-icons/f7/expand';
import arrowTurnDownRight from '@iconify-icons/f7/arrow-turn-down-right';
import desktopcomputer from '@iconify-icons/f7/desktopcomputer';
import floppyDisk from '@iconify-icons/f7/floppy-disk';
import pencilCircleFill from '@iconify-icons/f7/pencil-circle-fill';
import docOnDocFill from '@iconify-icons/f7/doc-on-doc-fill';
import playFill from '@iconify-icons/f7/play-fill';
import squareFill from '@iconify-icons/f7/square-fill';
import paintbrushFill from '@iconify-icons/f7/paintbrush-fill';
import flagFill from '@iconify-icons/f7/flag-fill';
import cubeBoxFill from '@iconify-icons/f7/cube-box-fill';

// Authentic Apple SF Symbols 6/7/8 custom vector glyphs (Filled)
const newspaperFill = {
  width: 56,
  height: 56,
  body: '<path fill="currentColor" d="M4 11.5c0-3.037 2.463-5.5 5.5-5.5h33c3.037 0 5.5 2.463 5.5 5.5v30c0 3.037-2.463 5.5-5.5 5.5h-33A5.506 5.506 0 0 1 4 41.5Zm3.5 0v30c0 1.103.897 2 2 2h33c1.103 0 2-.897 2-2v-30c0-1.103-.897-2-2-2h-33c-1.103 0-2 .897-2 2Zm7.5 4.5h16c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5H15c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5Zm0 8h24c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5H15c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5Zm0 8h24c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5H15c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5Z"/>'
};

const skullFill = {
  width: 56,
  height: 56,
  body: '<path fill="currentColor" fill-rule="evenodd" d="M28 6C16.954 6 8 14.954 8 26c0 6.837 3.428 12.873 8.7 16.4V46a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-2h2v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2h2v2a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-3.6c5.272-3.527 8.7-9.563 8.7-16.4 0-11.046-8.954-20-20-20Zm-7 24a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm14 0a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-7 4.5a2 2 0 0 1 2 2v2h-4v-2a2 2 0 0 1 2-2Z"/>'
};

const swordsFill = {
  width: 56,
  height: 56,
  body: '<path fill="currentColor" d="m44.707 11.293-4-4a1 1 0 0 0-1.414 0l-9.879 9.879-3.293-3.293a1 1 0 0 0-1.414 0l-2 2a1 1 0 0 0 0 1.414l3.293 3.293-12.293 12.293H8a1 1 0 0 0-.707.293l-2 2a1 1 0 0 0 0 1.414l5.586 5.586-3.586 3.586a1 1 0 1 0 1.414 1.414l3.586-3.586 5.586 5.586a1 1 0 0 0 1.414 0l2-2a1 1 0 0 0 .293-.707v-5.707l12.293-12.293 3.293 3.293a1 1 0 0 0 1.414 0l2-2a1 1 0 0 0 0-1.414l-3.293-3.293 9.879-9.879a1 1 0 0 0 0-1.414Z"/>'
};

export const SF_ICONS_MAP: Record<string, any> = {
  // Navigation & Tabs (Always Filled)
  'house.fill': houseFill,
  'house': houseFill,
  'newspaper.fill': newspaperFill,
  'newspaper': newspaperFill,
  'doc.text.fill': docTextFill,
  'doc.text': docTextFill,
  'book.fill': bookFill,
  'book': bookFill,
  'building.columns.fill': buildingColumnsFill,
  'building.columns': buildingColumnsFill,
  'archivebox.fill': archiveboxFill,
  'archivebox': archiveboxFill,
  'arrow.down.circle.fill': arrowDownCircleFill,
  'arrow.down.circle': arrowDownCircleFill,
  'arrow.up.circle.fill': arrowUpCircleFill,
  'arrow.up.circle': arrowUpCircleFill,
  'cloud.upload.fill': cloudUploadFill,
  'cloud.upload': cloudUploadFill,
  'arrow.up.doc': arrowUpDoc,
  'person.2.fill': person2Fill,
  'person.2': person2Fill,
  'person.fill': personFill,
  'person': personFill,
  'person.crop.circle.badge.plus': personCropCircleBadgePlus,
  'person.badge.plus': personCropCircleBadgePlus,
  'shield.fill': shieldFill,
  'shield.lefthalf.fill': shieldLefthalfFill,
  'shield': shieldFill,
  'shield.slash': exclamationmarkShieldFill,
  'shield.alert': exclamationmarkShieldFill,
  'shield.checkmark': checkmarkShieldFill,

  // Common Controls (Filled)
  'chevron.left': chevronLeft,
  'chevron.right': chevronRight,
  'chevron.down': chevronDown,
  'chevron.up': chevronUp,
  'arrow.left': arrowLeft,
  'arrow.right': arrowRight,
  'plus': plusCircleFill,
  'plus.circle.fill': plusCircleFill,
  'minus': minusCircleFill,
  'minus.circle.fill': minusCircleFill,
  'checkmark': checkmarkCircleFill,
  'checkmark.circle.fill': checkmarkCircleFill,
  'xmark': xmarkCircleFill,
  'xmark.circle.fill': xmarkCircleFill,
  'magnifyingglass': search,
  'search': search,
  'search.circle.fill': searchCircleFill,
  'arrow.clockwise': arrowClockwiseCircleFill,
  'arrow.clockwise.circle.fill': arrowClockwiseCircleFill,
  'arrow.counterclockwise': arrowCounterclockwiseCircleFill,
  'arrow.counterclockwise.circle.fill': arrowCounterclockwiseCircleFill,
  'clock.fill': clockFill,
  'clock': clockFill,
  'heart.fill': heartFill,
  'heart': heartFill,
  'heart.slash.fill': heartSlashFill,
  'bubble.left.and.bubble.right.fill': chatBubbleTextFill,
  'chat.bubble.fill': chatBubbleFill,
  'ellipsis.vertical': ellipsisVertical,
  'ellipsis': ellipsisCircleFill,
  'ellipsis.circle.fill': ellipsisCircleFill,
  'map.fill': mapFill,
  'map': mapFill,
  'calendar': todayFill,
  'calendar.fill': todayFill,
  'today.fill': todayFill,
  'circle.grid.hex.fill': circleGridHexFill,
  'coins': circleGridHexFill,
  'trash.fill': trashFill,
  'trash': trashFill,
  'paperplane.fill': paperplaneFill,
  'paperplane': paperplaneFill,
  'flame.fill': flameFill,
  'bolt.fill': boltFill,
  'arrow.up.right': arrowUpRight,
  'arrow.down.left': arrowDownLeft,
  'eye.fill': eyeFill,
  'eye': eyeFill,
  'folder.fill': folderFill,
  'folder': folderFill,
  'folder.badge.plus': folderFillBadgePlus,
  'folder.fill.badge.plus': folderFillBadgePlus,
  'bold': bold,
  'italic': italic,
  'strikethrough': strikethrough,
  'textformat': textformat,
  'textformat.size': textformatSize,
  'text.alignleft': textAlignleft,
  'text.aligncenter': textAligncenter,
  'play.rectangle.fill': playRectangleFill,
  'photo.fill': photoFill,
  'photo': photoFill,
  'expand': expand,
  'arrow.turn.down.right': arrowTurnDownRight,
  'server': desktopcomputer,
  'floppy.disk': floppyDisk,
  'pencil': pencilCircleFill,
  'pencil.circle.fill': pencilCircleFill,
  'doc.on.doc': docOnDocFill,
  'doc.on.doc.fill': docOnDocFill,
  'play.fill': playFill,
  'square': squareFill,
  'square.fill': squareFill,
  'paintbrush': paintbrushFill,
  'paintbrush.fill': paintbrushFill,
  'flag.fill': flagFill,
  'flag': flagFill,
  'cube.box.fill': cubeBoxFill,
  'skull': skullFill,
  'skull.fill': skullFill,
  'swords': swordsFill,
  'swords.fill': swordsFill,
};

export interface SFSymbolProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: keyof typeof SF_ICONS_MAP | string;
  size?: number | string;
  color?: string;
  animated?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLSpanElement>) => void;
}

export const SFSymbol = React.forwardRef<HTMLSpanElement, SFSymbolProps>(({
  name,
  size = 20,
  color,
  animated = true,
  className = '',
  onClick,
  style,
  ...props
}, ref) => {
  const [bouncing, setBouncing] = useState(false);

  const iconData = SF_ICONS_MAP[name] || SF_ICONS_MAP['doc.text.fill'] || docTextFill;

  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (animated) {
      setBouncing(true);
      setTimeout(() => setBouncing(false), 450);

      // Trigger Telegram WebApp haptic vibration
      try {
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.HapticFeedback) {
          tg.HapticFeedback.impactOccurred('light');
        }
      } catch (err) {}
    }

    onClick?.(e);
  };

  return (
    <span
      ref={ref}
      className={`inline-flex items-center justify-center shrink-0 select-none ${
        bouncing ? 'animate-sf-bounce' : ''
      } ${className}`}
      onClick={handleClick}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        color: color || undefined,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      {...props}
    >
      <Icon
        icon={iconData}
        width={typeof size === 'number' ? size : undefined}
        height={typeof size === 'number' ? size : undefined}
        className="w-full h-full pointer-events-none transition-colors"
      />
    </span>
  );
});

SFSymbol.displayName = 'SFSymbol';

// Factory helper to create drop-in icon components replacing Lucide icons with Filled SF Symbols
export function createSFSymbolIcon(symbolName: string) {
  const Component = React.forwardRef<HTMLSpanElement, any>(({ size = 20, className = '', ...props }, ref) => {
    return <SFSymbol name={symbolName} size={size} className={className} ref={ref} {...props} />;
  });
  Component.displayName = `SFSymbol(${symbolName})`;
  return Component;
}

// Drop-in Lucide-compatible exports backed by authentic Filled SF Symbols
export const User = createSFSymbolIcon('person.fill');
export const Users = createSFSymbolIcon('person.2.fill');
export const UserPlus = createSFSymbolIcon('person.crop.circle.badge.plus');
export const Home = createSFSymbolIcon('house.fill');
export const HomeIcon = createSFSymbolIcon('house.fill');
export const Newspaper = createSFSymbolIcon('newspaper.fill');
export const BookOpen = createSFSymbolIcon('book.fill');
export const BookMarked = createSFSymbolIcon('book.fill');
export const Landmark = createSFSymbolIcon('building.columns.fill');
export const Library = createSFSymbolIcon('archivebox.fill');
export const Download = createSFSymbolIcon('arrow.down.circle.fill');
export const Upload = createSFSymbolIcon('arrow.up.circle.fill');
export const UploadCloud = createSFSymbolIcon('cloud.upload.fill');
export const Shield = createSFSymbolIcon('shield.fill');
export const ShieldAlert = createSFSymbolIcon('shield.slash');
export const ShieldCheck = createSFSymbolIcon('shield.checkmark');
export const Plus = createSFSymbolIcon('plus.circle.fill');
export const Minus = createSFSymbolIcon('minus.circle.fill');
export const Check = createSFSymbolIcon('checkmark.circle.fill');
export const X = createSFSymbolIcon('xmark.circle.fill');
export const Clock = createSFSymbolIcon('clock.fill');
export const Heart = createSFSymbolIcon('heart.fill');
export const MessageCircle = createSFSymbolIcon('chat.bubble.fill');
export const MoreVertical = createSFSymbolIcon('ellipsis.vertical');
export const MoreHorizontal = createSFSymbolIcon('ellipsis.circle.fill');
export const Search = createSFSymbolIcon('search');
export const Calendar = createSFSymbolIcon('calendar.fill');
export const Map = createSFSymbolIcon('map.fill');
export const MapIcon = createSFSymbolIcon('map.fill');
export const File = createSFSymbolIcon('doc.text.fill');
export const FileText = createSFSymbolIcon('doc.text.fill');
export const Folder = createSFSymbolIcon('folder.fill');
export const FolderArchive = createSFSymbolIcon('archivebox.fill');
export const FolderOpen = createSFSymbolIcon('folder.fill');
export const FolderPlus = createSFSymbolIcon('folder.fill.badge.plus');
export const Coins = createSFSymbolIcon('coins');
export const Trash2 = createSFSymbolIcon('trash.fill');
export const Send = createSFSymbolIcon('paperplane.fill');
export const Edit2 = createSFSymbolIcon('pencil.circle.fill');
export const Save = createSFSymbolIcon('floppy.disk');
export const Copy = createSFSymbolIcon('doc.on.doc.fill');
export const Play = createSFSymbolIcon('play.fill');
export const Square = createSFSymbolIcon('square.fill');
export const Server = createSFSymbolIcon('server');
export const ServerIcon = createSFSymbolIcon('server');
export const Palette = createSFSymbolIcon('paintbrush.fill');
export const Flag = createSFSymbolIcon('flag.fill');
export const RotateCcw = createSFSymbolIcon('arrow.counterclockwise.circle.fill');
export const RefreshCw = createSFSymbolIcon('arrow.clockwise.circle.fill');
export const ArrowLeft = createSFSymbolIcon('arrow.left');
export const ArrowRight = createSFSymbolIcon('arrow.right');
export const ArrowUpRight = createSFSymbolIcon('arrow.up.right');
export const ArrowDownLeft = createSFSymbolIcon('arrow.down.left');
export const CornerDownRight = createSFSymbolIcon('arrow.turn.down.right');
export const ChevronDown = createSFSymbolIcon('chevron.down');
export const ChevronUp = createSFSymbolIcon('chevron.up');
export const ChevronRight = createSFSymbolIcon('chevron.right');
export const ChevronLeft = createSFSymbolIcon('chevron.left');
export const Bold = createSFSymbolIcon('bold');
export const Italic = createSFSymbolIcon('italic');
export const Strikethrough = createSFSymbolIcon('strikethrough');
export const Heading1 = createSFSymbolIcon('textformat');
export const Heading2 = createSFSymbolIcon('textformat.size');
export const AlignLeft = createSFSymbolIcon('text.alignleft');
export const AlignCenter = createSFSymbolIcon('text.aligncenter');
export const ImageIcon = createSFSymbolIcon('photo.fill');
export const Image = createSFSymbolIcon('photo.fill');
export const Youtube = createSFSymbolIcon('play.rectangle.fill');
export const Maximize = createSFSymbolIcon('expand');
export const Eye = createSFSymbolIcon('eye.fill');
export const Package = createSFSymbolIcon('cube.box.fill');
export const Skull = createSFSymbolIcon('skull.fill');
export const Swords = createSFSymbolIcon('swords.fill');

export default SFSymbol;
