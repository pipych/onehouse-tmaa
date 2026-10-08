import React, { useState } from 'react';
import { Icon } from '@iconify/react';

// Google Material Symbols Rounded (Filled) from @iconify-icons/material-symbols
import homeRounded from '@iconify-icons/material-symbols/home-rounded';
import newspaperRounded from '@iconify-icons/material-symbols/newspaper-rounded';
import descriptionRounded from '@iconify-icons/material-symbols/description-rounded';
import menuBookRounded from '@iconify-icons/material-symbols/menu-book-rounded';
import accountBalanceRounded from '@iconify-icons/material-symbols/account-balance-rounded';
import inventory2Rounded from '@iconify-icons/material-symbols/inventory-2-rounded';
import arrowCircleDownRounded from '@iconify-icons/material-symbols/arrow-circle-down-rounded';
import arrowCircleUpRounded from '@iconify-icons/material-symbols/arrow-circle-up-rounded';
import downloadRounded from '@iconify-icons/material-symbols/download-rounded';
import uploadRounded from '@iconify-icons/material-symbols/upload-rounded';
import cloudUploadRounded from '@iconify-icons/material-symbols/cloud-upload-rounded';
import uploadFileRounded from '@iconify-icons/material-symbols/upload-file-rounded';
import personRounded from '@iconify-icons/material-symbols/person-rounded';
import groupRounded from '@iconify-icons/material-symbols/group-rounded';
import personAddRounded from '@iconify-icons/material-symbols/person-add-rounded';
import shieldRounded from '@iconify-icons/material-symbols/shield-rounded';
import gppBadRounded from '@iconify-icons/material-symbols/gpp-bad-rounded';
import verifiedUserRounded from '@iconify-icons/material-symbols/verified-user-rounded';
import chevronLeftRounded from '@iconify-icons/material-symbols/chevron-left-rounded';
import chevronRightRounded from '@iconify-icons/material-symbols/chevron-right-rounded';
import expandMoreRounded from '@iconify-icons/material-symbols/expand-more-rounded';
import expandLessRounded from '@iconify-icons/material-symbols/expand-less-rounded';
import arrowBackRounded from '@iconify-icons/material-symbols/arrow-back-rounded';
import arrowForwardRounded from '@iconify-icons/material-symbols/arrow-forward-rounded';
import addCircleRounded from '@iconify-icons/material-symbols/add-circle-rounded';
import addRounded from '@iconify-icons/material-symbols/add-rounded';
import doNotDisturbOnRounded from '@iconify-icons/material-symbols/do-not-disturb-on-rounded';
import removeRounded from '@iconify-icons/material-symbols/remove-rounded';
import checkCircleRounded from '@iconify-icons/material-symbols/check-circle-rounded';
import checkRounded from '@iconify-icons/material-symbols/check-rounded';
import cancelRounded from '@iconify-icons/material-symbols/cancel-rounded';
import closeRounded from '@iconify-icons/material-symbols/close-rounded';
import searchRounded from '@iconify-icons/material-symbols/search-rounded';
import syncRounded from '@iconify-icons/material-symbols/sync-rounded';
import replayRounded from '@iconify-icons/material-symbols/replay-rounded';
import scheduleRounded from '@iconify-icons/material-symbols/schedule-rounded';
import favoriteRounded from '@iconify-icons/material-symbols/favorite-rounded';
import heartBrokenRounded from '@iconify-icons/material-symbols/heart-broken-rounded';
import chatBubbleRounded from '@iconify-icons/material-symbols/chat-bubble-rounded';
import moreVertRounded from '@iconify-icons/material-symbols/more-vert-rounded';
import moreHorizRounded from '@iconify-icons/material-symbols/more-horiz-rounded';
import mapRounded from '@iconify-icons/material-symbols/map-rounded';
import calendarTodayRounded from '@iconify-icons/material-symbols/calendar-today-rounded';
import monetizationOnRounded from '@iconify-icons/material-symbols/monetization-on-rounded';
import deleteRounded from '@iconify-icons/material-symbols/delete-rounded';
import sendRounded from '@iconify-icons/material-symbols/send-rounded';
import whatshotRounded from '@iconify-icons/material-symbols/whatshot-rounded';
import boltRounded from '@iconify-icons/material-symbols/bolt-rounded';
import northEastRounded from '@iconify-icons/material-symbols/north-east-rounded';
import southWestRounded from '@iconify-icons/material-symbols/south-west-rounded';
import subdirectoryArrowRightRounded from '@iconify-icons/material-symbols/subdirectory-arrow-right-rounded';
import visibilityRounded from '@iconify-icons/material-symbols/visibility-rounded';
import folderRounded from '@iconify-icons/material-symbols/folder-rounded';
import folderOpenRounded from '@iconify-icons/material-symbols/folder-open-rounded';
import createNewFolderRounded from '@iconify-icons/material-symbols/create-new-folder-rounded';
import formatBoldRounded from '@iconify-icons/material-symbols/format-bold-rounded';
import formatItalicRounded from '@iconify-icons/material-symbols/format-italic-rounded';
import formatStrikethroughRounded from '@iconify-icons/material-symbols/format-strikethrough-rounded';
import formatSizeRounded from '@iconify-icons/material-symbols/format-size-rounded';
import formatAlignLeftRounded from '@iconify-icons/material-symbols/format-align-left-rounded';
import formatAlignCenterRounded from '@iconify-icons/material-symbols/format-align-center-rounded';
import smartDisplayRounded from '@iconify-icons/material-symbols/smart-display-rounded';
import imageRounded from '@iconify-icons/material-symbols/image-rounded';
import fullscreenRounded from '@iconify-icons/material-symbols/fullscreen-rounded';
import dnsRounded from '@iconify-icons/material-symbols/dns-rounded';
import saveRounded from '@iconify-icons/material-symbols/save-rounded';
import editRounded from '@iconify-icons/material-symbols/edit-rounded';
import contentCopyRounded from '@iconify-icons/material-symbols/content-copy-rounded';
import playArrowRounded from '@iconify-icons/material-symbols/play-arrow-rounded';
import squareRounded from '@iconify-icons/material-symbols/square-rounded';
import paletteRounded from '@iconify-icons/material-symbols/palette-rounded';
import flagRounded from '@iconify-icons/material-symbols/flag-rounded';
import skullRounded from '@iconify-icons/material-symbols/skull-rounded';
import swordsRounded from '@iconify-icons/material-symbols/swords-rounded';
import constructionRounded from '@iconify-icons/material-symbols/construction-rounded';

export const MATERIAL_SYMBOLS_MAP: Record<string, any> = {
  // Navigation & Core Sections (Google Material Symbols Rounded Filled)
  'home': homeRounded,
  'home.fill': homeRounded,
  'house.fill': homeRounded,
  'house': homeRounded,

  'newspaper': newspaperRounded,
  'newspaper.fill': newspaperRounded,

  'description': descriptionRounded,
  'doc.text.fill': descriptionRounded,
  'doc.text': descriptionRounded,
  'article': descriptionRounded,

  'menu_book': menuBookRounded,
  'book.fill': menuBookRounded,
  'book': menuBookRounded,

  'account_balance': accountBalanceRounded,
  'building.columns.fill': accountBalanceRounded,
  'building.columns': accountBalanceRounded,

  'inventory_2': inventory2Rounded,
  'archive': inventory2Rounded,
  'archivebox.fill': inventory2Rounded,
  'archivebox': inventory2Rounded,

  'arrow_circle_down': arrowCircleDownRounded,
  'arrow.down.circle.fill': arrowCircleDownRounded,
  'arrow.down.circle': arrowCircleDownRounded,

  'arrow_circle_up': arrowCircleUpRounded,
  'arrow.up.circle.fill': arrowCircleUpRounded,
  'arrow.up.circle': arrowCircleUpRounded,

  'download': downloadRounded,
  'upload': uploadRounded,
  'cloud_upload': cloudUploadRounded,
  'cloud.upload.fill': cloudUploadRounded,
  'cloud.upload': cloudUploadRounded,
  'upload_file': uploadFileRounded,
  'arrow.up.doc': uploadFileRounded,

  'person': personRounded,
  'person.fill': personRounded,
  'group': groupRounded,
  'groups': groupRounded,
  'person.2.fill': groupRounded,
  'person.2': groupRounded,
  'person_add': personAddRounded,
  'person.crop.circle.badge.plus': personAddRounded,
  'person.badge.plus': personAddRounded,

  'shield': shieldRounded,
  'shield.fill': shieldRounded,
  'shield.lefthalf.fill': shieldRounded,
  'gpp_bad': gppBadRounded,
  'shield.slash': gppBadRounded,
  'shield.alert': gppBadRounded,
  'verified_user': verifiedUserRounded,
  'shield.checkmark': verifiedUserRounded,

  // Common Controls & Actions
  'chevron_left': chevronLeftRounded,
  'chevron.left': chevronLeftRounded,
  'chevron_right': chevronRightRounded,
  'chevron.right': chevronRightRounded,
  'expand_more': expandMoreRounded,
  'chevron.down': expandMoreRounded,
  'expand_less': expandLessRounded,
  'chevron.up': expandLessRounded,

  'arrow_back': arrowBackRounded,
  'arrow.left': arrowBackRounded,
  'arrow_forward': arrowForwardRounded,
  'arrow.right': arrowForwardRounded,

  'add_circle': addCircleRounded,
  'plus.circle.fill': addCircleRounded,
  'add': addRounded,
  'plus': addRounded,

  'remove_circle': doNotDisturbOnRounded,
  'minus.circle.fill': doNotDisturbOnRounded,
  'remove': removeRounded,
  'minus': removeRounded,

  'check_circle': checkCircleRounded,
  'checkmark.circle.fill': checkCircleRounded,
  'check': checkRounded,
  'checkmark': checkRounded,

  'cancel': cancelRounded,
  'xmark.circle.fill': cancelRounded,
  'close': closeRounded,
  'xmark': closeRounded,

  'search': searchRounded,
  'magnifyingglass': searchRounded,
  'search.circle.fill': searchRounded,

  'sync': syncRounded,
  'refresh': syncRounded,
  'arrow.clockwise': syncRounded,
  'arrow.clockwise.circle.fill': syncRounded,

  'replay': replayRounded,
  'undo': replayRounded,
  'arrow.counterclockwise': replayRounded,
  'arrow.counterclockwise.circle.fill': replayRounded,

  'schedule': scheduleRounded,
  'clock': scheduleRounded,
  'clock.fill': scheduleRounded,

  'favorite': favoriteRounded,
  'heart': favoriteRounded,
  'heart.fill': favoriteRounded,

  'heart_broken': heartBrokenRounded,
  'heart.slash.fill': heartBrokenRounded,

  'chat_bubble': chatBubbleRounded,
  'bubble.left.and.bubble.right.fill': chatBubbleRounded,
  'chat.bubble.fill': chatBubbleRounded,

  'more_vert': moreVertRounded,
  'ellipsis.vertical': moreVertRounded,

  'more_horiz': moreHorizRounded,
  'ellipsis': moreHorizRounded,
  'ellipsis.circle.fill': moreHorizRounded,

  'map': mapRounded,
  'map.fill': mapRounded,

  'calendar_today': calendarTodayRounded,
  'calendar': calendarTodayRounded,
  'calendar.fill': calendarTodayRounded,
  'today.fill': calendarTodayRounded,

  'monetization_on': monetizationOnRounded,
  'coins': monetizationOnRounded,
  'circle.grid.hex.fill': monetizationOnRounded,

  'delete': deleteRounded,
  'trash': deleteRounded,
  'trash.fill': deleteRounded,

  'send': sendRounded,
  'paperplane': sendRounded,
  'paperplane.fill': sendRounded,

  'whatshot': whatshotRounded,
  'flame.fill': whatshotRounded,

  'bolt': boltRounded,
  'bolt.fill': boltRounded,

  'north_east': northEastRounded,
  'arrow.up.right': northEastRounded,

  'south_west': southWestRounded,
  'arrow.down.left': southWestRounded,

  'subdirectory_arrow_right': subdirectoryArrowRightRounded,
  'arrow.turn.down.right': subdirectoryArrowRightRounded,

  'visibility': visibilityRounded,
  'eye': visibilityRounded,
  'eye.fill': visibilityRounded,

  'folder': folderRounded,
  'folder.fill': folderRounded,
  'folder_open': folderOpenRounded,
  'create_new_folder': createNewFolderRounded,
  'folder.badge.plus': createNewFolderRounded,
  'folder.fill.badge.plus': createNewFolderRounded,

  'format_bold': formatBoldRounded,
  'bold': formatBoldRounded,

  'format_italic': formatItalicRounded,
  'italic': formatItalicRounded,

  'format_strikethrough': formatStrikethroughRounded,
  'strikethrough': formatStrikethroughRounded,

  'format_size': formatSizeRounded,
  'textformat': formatSizeRounded,
  'textformat.size': formatSizeRounded,

  'format_align_left': formatAlignLeftRounded,
  'text.alignleft': formatAlignLeftRounded,

  'format_align_center': formatAlignCenterRounded,
  'text.aligncenter': formatAlignCenterRounded,

  'smart_display': smartDisplayRounded,
  'play.rectangle.fill': smartDisplayRounded,

  'image': imageRounded,
  'photo': imageRounded,
  'photo.fill': imageRounded,

  'fullscreen': fullscreenRounded,
  'expand': fullscreenRounded,

  'dns': dnsRounded,
  'server': dnsRounded,
  'desktopcomputer': dnsRounded,

  'save': saveRounded,
  'floppy.disk': saveRounded,

  'edit': editRounded,
  'pencil': editRounded,
  'pencil.circle.fill': editRounded,

  'content_copy': contentCopyRounded,
  'doc.on.doc': contentCopyRounded,
  'doc.on.doc.fill': contentCopyRounded,

  'play_arrow': playArrowRounded,
  'play.fill': playArrowRounded,

  'square': squareRounded,
  'square.fill': squareRounded,

  'palette': paletteRounded,
  'paintbrush': paletteRounded,
  'paintbrush.fill': paletteRounded,

  'flag': flagRounded,
  'flag.fill': flagRounded,

  'cube.box.fill': inventory2Rounded,

  'skull': skullRounded,
  'skull.fill': skullRounded,

  'swords': swordsRounded,
  'swords.fill': swordsRounded,

  'construction': constructionRounded,
  'anvil': constructionRounded,
};

export interface MaterialSymbolProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: keyof typeof MATERIAL_SYMBOLS_MAP | string;
  size?: number | string;
  color?: string;
  animated?: boolean;
  effect?: 'bounce' | 'wiggle' | 'breathe' | 'rotate';
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLSpanElement>) => void;
}

export const MaterialSymbol = React.forwardRef<HTMLSpanElement, MaterialSymbolProps>(({
  name,
  size = 20,
  color,
  animated = true,
  effect = 'bounce',
  className = '',
  onClick,
  style,
  ...props
}, ref) => {
  const [animating, setAnimating] = useState(false);

  const iconData = MATERIAL_SYMBOLS_MAP[name] || MATERIAL_SYMBOLS_MAP['description'] || descriptionRounded;

  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (animated) {
      setAnimating(true);
      const duration = effect === 'rotate' ? 550 : effect === 'wiggle' ? 480 : 460;
      setTimeout(() => setAnimating(false), duration);

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
    <span
      ref={ref}
      className={`inline-flex items-center justify-center shrink-0 select-none ${animationClass} ${className}`}
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

MaterialSymbol.displayName = 'MaterialSymbol';

// Factory helper to create drop-in icon components with Material Symbols Rounded Filled
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

export default MaterialSymbol;
