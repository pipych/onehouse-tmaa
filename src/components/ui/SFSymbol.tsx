import React, { useState } from 'react';
import { Icon } from '@iconify/react';

// Import curated SF Symbols from @iconify-icons/f7
import houseFill from '@iconify-icons/f7/house-fill';
import house from '@iconify-icons/f7/house';
import docTextFill from '@iconify-icons/f7/doc-text-fill';
import docText from '@iconify-icons/f7/doc-text';
import bookFill from '@iconify-icons/f7/book-fill';
import book from '@iconify-icons/f7/book';
import buildingColumnsFill from '@iconify-icons/f7/building-columns-fill';
import buildingColumns from '@iconify-icons/f7/building-columns';
import archiveboxFill from '@iconify-icons/f7/archivebox-fill';
import archivebox from '@iconify-icons/f7/archivebox';
import arrowDownCircleFill from '@iconify-icons/f7/arrow-down-circle-fill';
import arrowDownCircle from '@iconify-icons/f7/arrow-down-circle';
import arrowUpCircleFill from '@iconify-icons/f7/arrow-up-circle-fill';
import cloudUpload from '@iconify-icons/f7/cloud-upload';
import arrowUpDoc from '@iconify-icons/f7/arrow-up-doc';
import person2Fill from '@iconify-icons/f7/person-2-fill';
import personFill from '@iconify-icons/f7/person-fill';
import person from '@iconify-icons/f7/person';
import personCropCircleBadgePlus from '@iconify-icons/f7/person-crop-circle-badge-plus';
import shieldFill from '@iconify-icons/f7/shield-fill';
import shieldLefthalfFill from '@iconify-icons/f7/shield-lefthalf-fill';
import shield from '@iconify-icons/f7/shield';
import exclamationmarkShieldFill from '@iconify-icons/f7/exclamationmark-shield-fill';
import checkmarkShieldFill from '@iconify-icons/f7/checkmark-shield-fill';
import chevronLeft from '@iconify-icons/f7/chevron-left';
import chevronRight from '@iconify-icons/f7/chevron-right';
import chevronDown from '@iconify-icons/f7/chevron-down';
import chevronUp from '@iconify-icons/f7/chevron-up';
import arrowLeft from '@iconify-icons/f7/arrow-left';
import arrowRight from '@iconify-icons/f7/arrow-right';
import plus from '@iconify-icons/f7/plus';
import plusCircleFill from '@iconify-icons/f7/plus-circle-fill';
import minus from '@iconify-icons/f7/minus';
import checkmark from '@iconify-icons/f7/checkmark';
import checkmarkCircleFill from '@iconify-icons/f7/checkmark-circle-fill';
import xmark from '@iconify-icons/f7/xmark';
import xmarkCircleFill from '@iconify-icons/f7/xmark-circle-fill';
import search from '@iconify-icons/f7/search';
import arrowClockwise from '@iconify-icons/f7/arrow-clockwise';
import arrowCounterclockwise from '@iconify-icons/f7/arrow-counterclockwise';
import clockFill from '@iconify-icons/f7/clock-fill';
import clock from '@iconify-icons/f7/clock';
import heartFill from '@iconify-icons/f7/heart-fill';
import heart from '@iconify-icons/f7/heart';
import heartSlashFill from '@iconify-icons/f7/heart-slash-fill';
import chatBubbleFill from '@iconify-icons/f7/chat-bubble-fill';
import chatBubbleTextFill from '@iconify-icons/f7/chat-bubble-text-fill';
import ellipsisVertical from '@iconify-icons/f7/ellipsis-vertical';
import ellipsis from '@iconify-icons/f7/ellipsis';
import mapFill from '@iconify-icons/f7/map-fill';
import map from '@iconify-icons/f7/map';
import calendar from '@iconify-icons/f7/calendar';
import circleGridHexFill from '@iconify-icons/f7/circle-grid-hex-fill';
import trashFill from '@iconify-icons/f7/trash-fill';
import trash from '@iconify-icons/f7/trash';
import paperplaneFill from '@iconify-icons/f7/paperplane-fill';
import flameFill from '@iconify-icons/f7/flame-fill';
import boltFill from '@iconify-icons/f7/bolt-fill';
import arrowUpRight from '@iconify-icons/f7/arrow-up-right';
import arrowDownLeft from '@iconify-icons/f7/arrow-down-left';
import eyeFill from '@iconify-icons/f7/eye-fill';
import eye from '@iconify-icons/f7/eye';
import folderFill from '@iconify-icons/f7/folder-fill';
import folder from '@iconify-icons/f7/folder';
import folderBadgePlus from '@iconify-icons/f7/folder-badge-plus';
import bold from '@iconify-icons/f7/bold';
import italic from '@iconify-icons/f7/italic';
import strikethrough from '@iconify-icons/f7/strikethrough';
import textformat from '@iconify-icons/f7/textformat';
import textformatSize from '@iconify-icons/f7/textformat-size';
import textAlignleft from '@iconify-icons/f7/text-alignleft';
import textAligncenter from '@iconify-icons/f7/text-aligncenter';
import playRectangleFill from '@iconify-icons/f7/play-rectangle-fill';
import photoFill from '@iconify-icons/f7/photo-fill';
import photo from '@iconify-icons/f7/photo';
import expand from '@iconify-icons/f7/expand';
import arrowTurnDownRight from '@iconify-icons/f7/arrow-turn-down-right';
import desktopcomputer from '@iconify-icons/f7/desktopcomputer';
import floppyDisk from '@iconify-icons/f7/floppy-disk';
import pencil from '@iconify-icons/f7/pencil';
import docOnDoc from '@iconify-icons/f7/doc-on-doc';
import playFill from '@iconify-icons/f7/play-fill';
import square from '@iconify-icons/f7/square';
import paintbrushFill from '@iconify-icons/f7/paintbrush-fill';
import flagFill from '@iconify-icons/f7/flag-fill';
import cubeBoxFill from '@iconify-icons/f7/cube-box-fill';

// Authentic SF Symbols 6 custom vector glyphs
const newspaperFill = {
  width: 56,
  height: 56,
  body: '<path fill="currentColor" d="M4 11.5c0-3.037 2.463-5.5 5.5-5.5h33c3.037 0 5.5 2.463 5.5 5.5v30c0 3.037-2.463 5.5-5.5 5.5h-33A5.506 5.506 0 0 1 4 41.5Zm3.5 0v30c0 1.103.897 2 2 2h33c1.103 0 2-.897 2-2v-30c0-1.103-.897-2-2-2h-33c-1.103 0-2 .897-2 2Zm7.5 4.5h16c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5H15c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5Zm0 8h24c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5H15c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5Zm0 8h24c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5H15c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5Z"/>'
};

const newspaper = {
  width: 56,
  height: 56,
  body: '<path fill="currentColor" d="M7.5 11.5c0-1.103.897-2 2-2h33c1.103 0 2 .897 2 2v30c0 1.103-.897 2-2 2h-33c-1.103 0-2-.897-2-2Zm-3.5 0c0 3.037 2.463 5.5 5.5 5.5h33c3.037 0 5.5-2.463 5.5-5.5v-30c0-3.037-2.463-5.5-5.5-5.5h-33C6.463 6 4 8.463 4 11.5Zm11 4.5h16c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5H15c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5Zm0 8h24c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5H15c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5Zm0 8h24c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5H15c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5Z"/>'
};

const skullGlyph = {
  width: 56,
  height: 56,
  body: '<path fill="currentColor" d="M28 6C17.507 6 9 14.507 9 25c0 6.643 3.42 12.49 8.625 15.828V46a2 2 0 0 0 2 2h4v-3a1 1 0 0 1 2 0v3h4v-3a1 1 0 0 1 2 0v3h4a2 2 0 0 0 2-2v-5.172C43.58 37.49 47 31.643 47 25 47 14.507 38.493 6 28 6Zm-7 19a4 4 0 1 1 8 0 4 4 0 0 1-8 0Zm14 0a4 4 0 1 1 8 0 4 4 0 0 1-8 0Zm-7 9a2 2 0 0 1 2 2h-4a2 2 0 0 1 2-2Z"/>'
};

const swordsGlyph = {
  width: 56,
  height: 56,
  body: '<path fill="currentColor" d="m44.707 11.293-4-4a1 1 0 0 0-1.414 0l-9.879 9.879-3.293-3.293a1 1 0 0 0-1.414 0l-2 2a1 1 0 0 0 0 1.414l3.293 3.293-12.293 12.293H8a1 1 0 0 0-.707.293l-2 2a1 1 0 0 0 0 1.414l5.586 5.586-3.586 3.586a1 1 0 1 0 1.414 1.414l3.586-3.586 5.586 5.586a1 1 0 0 0 1.414 0l2-2a1 1 0 0 0 .293-.707v-5.707l12.293-12.293 3.293 3.293a1 1 0 0 0 1.414 0l2-2a1 1 0 0 0 0-1.414l-3.293-3.293 9.879-9.879a1 1 0 0 0 0-1.414Z"/>'
};

export const SF_ICONS_MAP: Record<string, any> = {
  // Navigation & Tabs
  'house.fill': houseFill,
  'house': house,
  'newspaper.fill': newspaperFill,
  'newspaper': newspaper,
  'doc.text.fill': docTextFill,
  'doc.text': docText,
  'book.fill': bookFill,
  'book': book,
  'building.columns.fill': buildingColumnsFill,
  'building.columns': buildingColumns,
  'archivebox.fill': archiveboxFill,
  'archivebox': archivebox,
  'arrow.down.circle.fill': arrowDownCircleFill,
  'arrow.down.circle': arrowDownCircle,
  'arrow.up.circle.fill': arrowUpCircleFill,
  'arrow.up.circle': arrowUpCircleFill,
  'cloud.upload': cloudUpload,
  'arrow.up.doc': arrowUpDoc,
  'person.2.fill': person2Fill,
  'person.2': person2Fill,
  'person.fill': personFill,
  'person': person,
  'person.crop.circle.badge.plus': personCropCircleBadgePlus,
  'person.badge.plus': personCropCircleBadgePlus,
  'shield.fill': shieldFill,
  'shield.lefthalf.fill': shieldLefthalfFill,
  'shield': shield,
  'shield.slash': exclamationmarkShieldFill,
  'shield.alert': exclamationmarkShieldFill,
  'shield.checkmark': checkmarkShieldFill,

  // Common Controls
  'chevron.left': chevronLeft,
  'chevron.right': chevronRight,
  'chevron.down': chevronDown,
  'chevron.up': chevronUp,
  'arrow.left': arrowLeft,
  'arrow.right': arrowRight,
  'plus': plus,
  'plus.circle.fill': plusCircleFill,
  'minus': minus,
  'checkmark': checkmark,
  'checkmark.circle.fill': checkmarkCircleFill,
  'xmark': xmark,
  'xmark.circle.fill': xmarkCircleFill,
  'magnifyingglass': search,
  'search': search,
  'arrow.clockwise': arrowClockwise,
  'arrow.counterclockwise': arrowCounterclockwise,
  'clock.fill': clockFill,
  'clock': clock,
  'heart.fill': heartFill,
  'heart': heart,
  'heart.slash.fill': heartSlashFill,
  'bubble.left.and.bubble.right.fill': chatBubbleTextFill,
  'chat.bubble.fill': chatBubbleFill,
  'ellipsis.vertical': ellipsisVertical,
  'ellipsis': ellipsis,
  'map.fill': mapFill,
  'map': map,
  'calendar': calendar,
  'circle.grid.hex.fill': circleGridHexFill,
  'coins': circleGridHexFill,
  'trash.fill': trashFill,
  'trash': trash,
  'paperplane.fill': paperplaneFill,
  'flame.fill': flameFill,
  'bolt.fill': boltFill,
  'arrow.up.right': arrowUpRight,
  'arrow.down.left': arrowDownLeft,
  'eye.fill': eyeFill,
  'eye': eye,
  'folder.fill': folderFill,
  'folder': folder,
  'folder.badge.plus': folderBadgePlus,
  'bold': bold,
  'italic': italic,
  'strikethrough': strikethrough,
  'textformat': textformat,
  'textformat.size': textformatSize,
  'text.alignleft': textAlignleft,
  'text.aligncenter': textAligncenter,
  'play.rectangle.fill': playRectangleFill,
  'photo.fill': photoFill,
  'photo': photo,
  'expand': expand,
  'arrow.turn.down.right': arrowTurnDownRight,
  'server': desktopcomputer,
  'floppy.disk': floppyDisk,
  'pencil': pencil,
  'doc.on.doc': docOnDoc,
  'play.fill': playFill,
  'square': square,
  'paintbrush': paintbrushFill,
  'paintbrush.fill': paintbrushFill,
  'flag.fill': flagFill,
  'flag': flagFill,
  'cube.box.fill': cubeBoxFill,
  'skull': skullGlyph,
  'swords': swordsGlyph,
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

  const iconData = SF_ICONS_MAP[name] || SF_ICONS_MAP['doc.text'] || docText;

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

// Factory helper to create drop-in icon components replacing Lucide icons
export function createSFSymbolIcon(symbolName: string) {
  const Component = React.forwardRef<HTMLSpanElement, any>(({ size = 20, className = '', ...props }, ref) => {
    return <SFSymbol name={symbolName} size={size} className={className} ref={ref} {...props} />;
  });
  Component.displayName = `SFSymbol(${symbolName})`;
  return Component;
}

// Drop-in Lucide-compatible exports backed by authentic SF Symbols
export const User = createSFSymbolIcon('person');
export const Users = createSFSymbolIcon('person.2');
export const UserPlus = createSFSymbolIcon('person.crop.circle.badge.plus');
export const Home = createSFSymbolIcon('house');
export const HomeIcon = createSFSymbolIcon('house');
export const Newspaper = createSFSymbolIcon('newspaper');
export const BookOpen = createSFSymbolIcon('book');
export const BookMarked = createSFSymbolIcon('book');
export const Landmark = createSFSymbolIcon('building.columns');
export const Library = createSFSymbolIcon('archivebox');
export const Download = createSFSymbolIcon('arrow.down.circle');
export const Upload = createSFSymbolIcon('arrow.up.circle');
export const UploadCloud = createSFSymbolIcon('cloud.upload');
export const Shield = createSFSymbolIcon('shield');
export const ShieldAlert = createSFSymbolIcon('shield.slash');
export const ShieldCheck = createSFSymbolIcon('shield.checkmark');
export const Plus = createSFSymbolIcon('plus');
export const Minus = createSFSymbolIcon('minus');
export const Check = createSFSymbolIcon('checkmark');
export const X = createSFSymbolIcon('xmark');
export const Clock = createSFSymbolIcon('clock');
export const Heart = createSFSymbolIcon('heart');
export const MessageCircle = createSFSymbolIcon('chat.bubble.fill');
export const MoreVertical = createSFSymbolIcon('ellipsis.vertical');
export const MoreHorizontal = createSFSymbolIcon('ellipsis');
export const Search = createSFSymbolIcon('search');
export const Calendar = createSFSymbolIcon('calendar');
export const Map = createSFSymbolIcon('map');
export const MapIcon = createSFSymbolIcon('map');
export const File = createSFSymbolIcon('doc.text');
export const FileText = createSFSymbolIcon('doc.text');
export const Folder = createSFSymbolIcon('folder');
export const FolderArchive = createSFSymbolIcon('archivebox');
export const FolderOpen = createSFSymbolIcon('folder');
export const FolderPlus = createSFSymbolIcon('folder.badge.plus');
export const Coins = createSFSymbolIcon('coins');
export const Trash2 = createSFSymbolIcon('trash');
export const Send = createSFSymbolIcon('paperplane.fill');
export const Edit2 = createSFSymbolIcon('pencil');
export const Save = createSFSymbolIcon('floppy.disk');
export const Copy = createSFSymbolIcon('doc.on.doc');
export const Play = createSFSymbolIcon('play.fill');
export const Square = createSFSymbolIcon('square');
export const Server = createSFSymbolIcon('server');
export const ServerIcon = createSFSymbolIcon('server');
export const Palette = createSFSymbolIcon('paintbrush');
export const Flag = createSFSymbolIcon('flag.fill');
export const RotateCcw = createSFSymbolIcon('arrow.counterclockwise');
export const RefreshCw = createSFSymbolIcon('arrow.clockwise');
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
export const ImageIcon = createSFSymbolIcon('photo');
export const Image = createSFSymbolIcon('photo');
export const Youtube = createSFSymbolIcon('play.rectangle.fill');
export const Maximize = createSFSymbolIcon('expand');
export const Eye = createSFSymbolIcon('eye');
export const Package = createSFSymbolIcon('cube.box.fill');
export const Skull = createSFSymbolIcon('skull');
export const Swords = createSFSymbolIcon('swords');

export default SFSymbol;
