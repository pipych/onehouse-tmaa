import React, { useState } from 'react';
import { OneIcon, Icon, IconProps } from '../../ui/components/Icon';
export { OneIcon, Icon };
export type { IconProps };

// Mapping for legacy SF Symbols and alias names to standard Material Symbols Rounded ligatures
export const SF_TO_MATERIAL_LIGATURE_MAP: Record<string, string> = {
  // Navigation & Core
  'home': 'home',
  'home.fill': 'home',
  'house': 'home',
  'house.fill': 'home',
  'newspaper': 'newspaper',
  'newspaper.fill': 'newspaper',
  'description': 'description',
  'doc.text': 'description',
  'doc.text.fill': 'description',
  'article': 'description',
  'menu_book': 'menu_book',
  'book': 'menu_book',
  'book.fill': 'menu_book',
  'account_balance': 'account_balance',
  'building.columns': 'account_balance',
  'building.columns.fill': 'account_balance',
  'inventory_2': 'inventory_2',
  'archive': 'inventory_2',
  'archivebox': 'inventory_2',
  'archivebox.fill': 'inventory_2',
  'download': 'download',
  'arrow_circle_down': 'arrow_circle_down',
  'arrow.down.circle': 'arrow_circle_down',
  'arrow.down.circle.fill': 'arrow_circle_down',
  'upload': 'upload',
  'cloud_upload': 'cloud_upload',
  'cloud.upload': 'cloud_upload',
  'cloud.upload.fill': 'cloud_upload',
  'upload_file': 'upload_file',
  'person': 'person',
  'person.fill': 'person',
  'group': 'group',
  'groups': 'group',
  'person.2': 'group',
  'person.2.fill': 'group',
  'person_add': 'person_add',
  'shield': 'shield',
  'shield.fill': 'shield',
  'shield.alert': 'gpp_bad',
  'shield.check': 'verified_user',
  'gpp_bad': 'gpp_bad',
  'verified_user': 'verified_user',
  'chevron_left': 'chevron_left',
  'chevron_right': 'chevron_right',
  'expand_more': 'expand_more',
  'expand_less': 'expand_less',
  'chevron.down': 'expand_more',
  'chevron.up': 'expand_less',
  'arrow_back': 'arrow_back',
  'arrow_forward': 'arrow_forward',
  'add_circle': 'add_circle',
  'add': 'add',
  'remove_circle': 'do_not_disturb_on',
  'remove': 'remove',
  'check_circle': 'check_circle',
  'check': 'check',
  'cancel': 'cancel',
  'close': 'close',
  'x': 'close',
  'search': 'search',
  'sync': 'sync',
  'refresh': 'sync',
  'replay': 'replay',
  'schedule': 'schedule',
  'clock': 'schedule',
  'favorite': 'favorite',
  'heart': 'favorite',
  'chat_bubble': 'chat_bubble',
  'more_vert': 'more_vert',
  'more_horiz': 'more_horiz',
  'map': 'map',
  'calendar_today': 'calendar_today',
  'monetization_on': 'monetization_on',
  'delete': 'delete',
  'send': 'send',
  'whatshot': 'whatshot',
  'bolt': 'bolt',
  'north_east': 'north_east',
  'south_west': 'south_west',
  'subdirectory_arrow_right': 'subdirectory_arrow_right',
  'visibility': 'visibility',
  'folder': 'folder',
  'folder_open': 'folder_open',
  'create_new_folder': 'create_new_folder',
  'format_bold': 'format_bold',
  'format_italic': 'format_italic',
  'format_strikethrough': 'format_strikethrough',
  'format_size': 'format_size',
  'format_align_left': 'format_align_left',
  'format_align_center': 'format_align_center',
  'smart_display': 'smart_display',
  'image': 'image',
  'fullscreen': 'fullscreen',
  'dns': 'dns',
  'save': 'save',
  'edit': 'edit',
  'content_copy': 'content_copy',
  'play_arrow': 'play_arrow',
  'square': 'square',
  'palette': 'palette',
  'flag': 'flag',
  'skull': 'skull',
  'swords': 'swords',
  'construction': 'construction',
  'info': 'info',
  'info.circle': 'info',
  'info.circle.fill': 'info',
};

export interface MaterialSymbolProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: number | string;
  color?: string;
  fill?: boolean;
  animated?: boolean;
  effect?: 'bounce' | 'wiggle' | 'breathe' | 'rotate';
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLSpanElement>) => void;
}

export const MaterialSymbol = React.forwardRef<HTMLSpanElement, MaterialSymbolProps>(({
  name,
  size = 20,
  color,
  fill = true,
  animated = false,
  effect = 'bounce',
  className = '',
  onClick,
  style,
  ...props
}, ref) => {
  const [animating, setAnimating] = useState(false);

  // Normalize name to Material Symbols ligature
  const rawKey = typeof name === 'string' ? name.trim() : '';
  const mapped = SF_TO_MATERIAL_LIGATURE_MAP[rawKey] || SF_TO_MATERIAL_LIGATURE_MAP[rawKey.toLowerCase()] || rawKey.toLowerCase().replace(/[-\s.]/g, '_');

  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (animated) {
      setAnimating(true);
      const duration = effect === 'rotate' ? 550 : effect === 'wiggle' ? 480 : 460;
      setTimeout(() => setAnimating(false), duration);

      try {
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.HapticFeedback) {
          tg.HapticFeedback.impactOccurred('light');
        }
      } catch (err) {}
    }

    onClick?.(e);
  };

  const animationClass = animating
    ? effect === 'wiggle'
      ? 'animate-sf-wiggle'
      : effect === 'rotate'
      ? 'animate-sf-rotate'
      : effect === 'breathe'
      ? 'animate-sf-breathe'
      : 'animate-sf-bounce'
    : '';

  return (
    <OneIcon
      ref={ref}
      name={mapped}
      size={size}
      fill={fill}
      className={`select-none ${animationClass} ${className}`}
      onClick={handleClick}
      style={{
        color: color || undefined,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      {...props}
    />
  );
});

MaterialSymbol.displayName = 'MaterialSymbol';

// Factory helper to create drop-in icon components
export function createMaterialSymbolIcon(symbolName: string) {
  const Component = React.forwardRef<HTMLSpanElement, any>(({ size = 20, className = '', ...props }, ref) => {
    return <MaterialSymbol name={symbolName} size={size} className={className} ref={ref} {...props} />;
  });
  Component.displayName = `MaterialSymbol(${symbolName})`;
  return Component;
}

// Drop-in icon exports backed by Google Material Symbols Rounded (Filled)
export const User = createMaterialSymbolIcon('person');
export const Users = createMaterialSymbolIcon('group');
export const UserPlus = createMaterialSymbolIcon('person_add');
export const Home = createMaterialSymbolIcon('home');
export const HomeIcon = createMaterialSymbolIcon('home');
export const Newspaper = createMaterialSymbolIcon('newspaper');
export const BookOpen = createMaterialSymbolIcon('menu_book');
export const BookMarked = createMaterialSymbolIcon('menu_book');
export const Landmark = createMaterialSymbolIcon('account_balance');
export const Library = createMaterialSymbolIcon('inventory_2');
export const Download = createMaterialSymbolIcon('download');
export const Upload = createMaterialSymbolIcon('upload');
export const UploadCloud = createMaterialSymbolIcon('cloud_upload');
export const Shield = createMaterialSymbolIcon('shield');
export const ShieldAlert = createMaterialSymbolIcon('gpp_bad');
export const ShieldCheck = createMaterialSymbolIcon('verified_user');
export const Plus = createMaterialSymbolIcon('add_circle');
export const Minus = createMaterialSymbolIcon('remove_circle');
export const Check = createMaterialSymbolIcon('check_circle');
export const X = createMaterialSymbolIcon('cancel');
export const Clock = createMaterialSymbolIcon('schedule');
export const Heart = createMaterialSymbolIcon('favorite');
export const MessageCircle = createMaterialSymbolIcon('chat_bubble');
export const MoreVertical = createMaterialSymbolIcon('more_vert');
export const MoreHorizontal = createMaterialSymbolIcon('more_horiz');
export const Search = createMaterialSymbolIcon('search');
export const Calendar = createMaterialSymbolIcon('calendar_today');
export const Map = createMaterialSymbolIcon('map');
export const MapIcon = createMaterialSymbolIcon('map');
export const File = createMaterialSymbolIcon('description');
export const FileText = createMaterialSymbolIcon('description');
export const Folder = createMaterialSymbolIcon('folder');
export const FolderArchive = createMaterialSymbolIcon('inventory_2');
export const FolderOpen = createMaterialSymbolIcon('folder_open');
export const FolderPlus = createMaterialSymbolIcon('create_new_folder');
export const Coins = createMaterialSymbolIcon('monetization_on');
export const Trash2 = createMaterialSymbolIcon('delete');
export const Send = createMaterialSymbolIcon('send');
export const Edit2 = createMaterialSymbolIcon('edit');
export const Save = createMaterialSymbolIcon('save');
export const Copy = createMaterialSymbolIcon('content_copy');
export const Play = createMaterialSymbolIcon('play_arrow');
export const Square = createMaterialSymbolIcon('square');
export const Server = createMaterialSymbolIcon('dns');
export const ServerIcon = createMaterialSymbolIcon('dns');
export const Palette = createMaterialSymbolIcon('palette');
export const Flag = createMaterialSymbolIcon('flag');
export const RotateCcw = createMaterialSymbolIcon('replay');
export const RefreshCw = createMaterialSymbolIcon('sync');
export const ArrowLeft = createMaterialSymbolIcon('arrow_back');
export const ArrowRight = createMaterialSymbolIcon('arrow_forward');
export const ArrowUpRight = createMaterialSymbolIcon('north_east');
export const ArrowDownLeft = createMaterialSymbolIcon('south_west');
export const CornerDownRight = createMaterialSymbolIcon('subdirectory_arrow_right');
export const ChevronDown = createMaterialSymbolIcon('expand_more');
export const ChevronUp = createMaterialSymbolIcon('expand_less');
export const ChevronRight = createMaterialSymbolIcon('chevron_right');
export const ChevronLeft = createMaterialSymbolIcon('chevron_left');
export const Bold = createMaterialSymbolIcon('format_bold');
export const Italic = createMaterialSymbolIcon('format_italic');
export const Strikethrough = createMaterialSymbolIcon('format_strikethrough');
export const Heading1 = createMaterialSymbolIcon('format_size');
export const Heading2 = createMaterialSymbolIcon('format_size');
export const AlignLeft = createMaterialSymbolIcon('format_align_left');
export const AlignCenter = createMaterialSymbolIcon('format_align_center');
export const ImageIcon = createMaterialSymbolIcon('image');
export const Image = createMaterialSymbolIcon('image');
export const Youtube = createMaterialSymbolIcon('smart_display');
export const Maximize = createMaterialSymbolIcon('fullscreen');
export const Eye = createMaterialSymbolIcon('visibility');
export const Package = createMaterialSymbolIcon('inventory_2');
export const Skull = createMaterialSymbolIcon('skull');
export const Swords = createMaterialSymbolIcon('swords');
export const Construction = createMaterialSymbolIcon('construction');
export const Info = createMaterialSymbolIcon('info');

export const MATERIAL_SYMBOLS_MAP = SF_TO_MATERIAL_LIGATURE_MAP;
export default MaterialSymbol;
