/**
 * OneApp Telegram Bot for Cloudflare Workers
 * 
 * Features:
 * - Hosted on Cloudflare Workers / Pages Functions
 * - /app command with compact Inline Button
 * - /all command with Telegram Bot API 10.3 Rich Message Buttons (OneApp, OneDash, OneLaunch)
 * - Mini App deep link: https://t.me/onehserver_bot/oneapp
 * - /start with welcome message & keyboard cleanup
 * - /help with detailed instructions
 * - Webhook setup, command registration and chat menu button configuration
 * - Inline Query support (@onehserver_bot)
 * - Web dashboard at GET /
 */

export interface BotKVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface Env {
  BOT_TOKEN?: string;
  DEFAULT_BOT_TOKEN?: string;
  MINI_APP_URL?: string;
  DEFAULT_MINI_APP_URL?: string;
  WEBHOOK_SECRET?: string;
  DEFAULT_BUTTON_MODE?: 'rich' | 'inline' | 'both';
  BOT_STORAGE?: BotKVNamespace;
}

const FALLBACK_MINI_APP_URL = "https://onelaunch.pp.ua/";
const BOT_USERNAME = "onehserver_bot";
const DIRECT_APP_URL = `https://t.me/${BOT_USERNAME}/oneapp`;
const CUSTOM_EMOJI_ID = "5361841630502495253";
const ONEDASH_URL = "https://panel.onehouse.pp.ua";
const ONELAUNCH_DOWNLOAD_URL = "https://onelaunch.pp.ua/download";

// Target group & forum topic configuration:
// - Group: https://t.me/c/2997374585/35 & /1702
// - Topic 35: server and links commands (/app, /all, /start, /help)
// - Topic 1702: media articles broadcast feed (/media/:id)
export const TARGET_GROUP_RAW_ID = "2997374585";
export const TARGET_GROUP_CHAT_ID = -1002997374585;
export const SERVER_LINKS_TOPIC_ID = 35;
export const MEDIA_ARTICLES_TOPIC_ID = 1702;
export const FUTURE_FEATURE_TOPIC_ID = MEDIA_ARTICLES_TOPIC_ID;

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface ArticleBroadcastPayload {
  id: string;
  title: string;
  cover_url?: string | null;
  content?: string | null;
  youtube_url?: string | null;
  season?: string | null;
}

// --- Telegram Types ---

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  message_thread_id?: number;
  is_topic_message?: boolean;
  web_app_data?: {
    data: string;
    button_text: string;
  };
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramInlineQuery {
  id: string;
  from: TelegramUser;
  query: string;
  offset: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
  inline_query?: TelegramInlineQuery;
}

// Telegram standard keyboards
export interface KeyboardButton {
  text: string;
  web_app?: { url: string };
  request_contact?: boolean;
  request_location?: boolean;
}

export interface ReplyKeyboardMarkup {
  keyboard: KeyboardButton[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
  is_persistent?: boolean;
}

export interface InlineKeyboardButton {
  text: string;
  web_app?: { url: string };
  url?: string;
  callback_data?: string;
  switch_inline_query?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

// Telegram Bot API 10.3 Rich Message Types
export interface RichMessageButton {
  text: string;
  style?: 'primary' | 'danger' | 'success';
  web_app?: { url: string };
  url?: string;
  callback_data?: string;
}

export interface InputRichBlockButtons {
  type: 'buttons';
  align?: 'left' | 'center' | 'right';
  buttons: RichMessageButton[];
}

export interface InputRichBlockParagraph {
  type: 'paragraph';
  text: string;
}

export type InputRichBlock = InputRichBlockButtons | InputRichBlockParagraph | Record<string, unknown>;

export interface InputRichMessage {
  html?: string;
  markdown?: string;
  blocks?: InputRichBlock[];
}

// --- Helper Functions ---

function getBotToken(env: Env): string {
  const token = env.BOT_TOKEN || env.DEFAULT_BOT_TOKEN || '';
  if (!token) {
    console.warn('[Security Warning] BOT_TOKEN is not set in environment or secrets! Please configure it using "wrangler secret put BOT_TOKEN" or in .dev.vars.');
  }
  return token;
}

function getMiniAppUrl(env: Env): string {
  return env.MINI_APP_URL || env.DEFAULT_MINI_APP_URL || FALLBACK_MINI_APP_URL;
}

/**
 * Strip <tg-button-row> and <tg-button> custom tags when falling back to standard HTML sendMessage
 */
export function stripRichButtonTags(html: string): string {
  return html
    .replace(/<tg-button-row[\s\S]*?<\/tg-button-row>/gi, '')
    .trim();
}

/**
 * Generate Rich HTML with embedded Rich Button (<tg-button-row> and <tg-button>)
 * According to Telegram Bot API 10.3 and Habr #1075772 specifications.
 * 
 * NOTE: Using type="url" pointing to DIRECT_APP_URL (https://t.me/onehserver_bot/oneapp)
 * ensures that the button STAYS 100% ACTIVE even when the message is forwarded to other chats,
 * while still opening the native Telegram Mini App!
 */
export function getRichAppMessageHtml(miniAppUrl: string): string {
  return (
    `<h3><tg-emoji emoji-id="${CUSTOM_EMOJI_ID}">💎</tg-emoji> OneApp</h3>\n` +
    `<tg-button-row align="center">\n` +
    `  <tg-button type="url" url="${DIRECT_APP_URL}" style="primary">Открыть</tg-button>\n` +
    `</tg-button-row>`
  );
}

/**
 * Alternative Rich Blocks payload (JSON blocks structure supported in Bot API 10.3)
 */
export function getRichAppMessageBlocks(miniAppUrl: string): InputRichBlock[] {
  return [
    {
      type: 'paragraph',
      text: 'OneApp',
    },
    {
      type: 'buttons',
      align: 'center',
      buttons: [
        {
          text: 'Открыть',
          style: 'primary',
          url: DIRECT_APP_URL,
        },
      ],
    },
  ];
}

/**
 * Generate Rich HTML for /all command
 * - OneApp (green / success) -> DIRECT_APP_URL
 * - OneDash (white / default) -> ONEDASH_URL
 * - OneLaunch (blue / primary) -> ONELAUNCH_DOWNLOAD_URL
 */
export function getAllServicesRichHtml(): string {
  return (
    `<tg-button-row align="center">\n` +
    `  <tg-button type="url" url="${DIRECT_APP_URL}" style="success">&nbsp;&nbsp;&nbsp;&nbsp;OneApp&nbsp;&nbsp;&nbsp;&nbsp;</tg-button>\n` +
    `</tg-button-row>\n` +
    `<tg-button-row align="center">\n` +
    `  <tg-button type="url" url="${ONEDASH_URL}">&nbsp;&nbsp;&nbsp;OneDash&nbsp;&nbsp;&nbsp;</tg-button>\n` +
    `</tg-button-row>\n` +
    `<tg-button-row align="center">\n` +
    `  <tg-button type="url" url="${ONELAUNCH_DOWNLOAD_URL}" style="primary">&nbsp;OneLaunch&nbsp;</tg-button>\n` +
    `</tg-button-row>`
  );
}

/**
 * Typed blocks representation for /all command
 */
export function getAllServicesRichBlocks(): InputRichBlock[] {
  return [
    {
      type: 'buttons',
      align: 'center',
      buttons: [
        {
          text: '\u00A0\u00A0\u00A0\u00A0OneApp\u00A0\u00A0\u00A0\u00A0',
          style: 'success',
          url: DIRECT_APP_URL,
        },
      ],
    },
    {
      type: 'buttons',
      align: 'center',
      buttons: [
        {
          text: '\u00A0\u00A0\u00A0OneDash\u00A0\u00A0\u00A0',
          url: ONEDASH_URL,
        },
      ],
    },
    {
      type: 'buttons',
      align: 'center',
      buttons: [
        {
          text: '\u00A0OneLaunch\u00A0',
          style: 'primary',
          url: ONELAUNCH_DOWNLOAD_URL,
        },
      ],
    },
  ];
}

/**
 * Call Telegram Bot API
 */
export async function callTelegramApi(
  token: string,
  method: string,
  payload?: Record<string, unknown>
): Promise<any> {
  if (!token) {
    const errorMsg = 'BOT_TOKEN is missing. Please configure it via "wrangler secret put BOT_TOKEN" or in .dev.vars.';
    console.error(`[Telegram API Error] Method: ${method} failed - ${errorMsg}`);
    return { ok: false, error_code: 500, description: errorMsg };
  }

  const url = `https://api.telegram.org/bot${token}/${method}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const data = (await response.json()) as any;
  if (!data.ok) {
    console.error(`[Telegram API Error] Method: ${method}`, data);
  }
  return data;
}

/**
 * Rich Button Keyboard (ReplyKeyboardMarkup with Web App)
 * Pinned at the bottom of the chat
 */
export function getRichKeyboard(miniAppUrl: string): ReplyKeyboardMarkup {
  return {
    keyboard: [
      [
        {
          text: "🚀 Открыть OneApp",
          web_app: { url: miniAppUrl },
        },
      ],
    ],
    resize_keyboard: true,
    is_persistent: true,
    one_time_keyboard: false,
  };
}

/**
 * Inline Button Keyboard (InlineKeyboardMarkup)
 * Attached directly under the message (for /inline or fallback)
 */
export function getInlineKeyboard(miniAppUrl: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: "Открыть",
          url: DIRECT_APP_URL,
        },
      ],
    ],
  };
}

/**
 * Send Message to Telegram Chat
 */
export async function sendTelegramMessage(
  token: string,
  chatId: number,
  text: string,
  options: {
    parse_mode?: 'Markdown' | 'MarkdownV2' | 'HTML';
    reply_markup?: ReplyKeyboardMarkup | InlineKeyboardMarkup | { remove_keyboard: true };
    message_thread_id?: number;
  } = {}
) {
  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: options.parse_mode,
    reply_markup: options.reply_markup,
  };
  if (options.message_thread_id) {
    payload.message_thread_id = options.message_thread_id;
  }
  return callTelegramApi(token, 'sendMessage', payload);
}

/**
 * Delete Message from Telegram Chat
 */
export async function deleteTelegramMessage(
  token: string,
  chatId: number,
  messageId: number
): Promise<any> {
  if (!messageId) return { ok: false };
  try {
    return await callTelegramApi(token, 'deleteMessage', {
      chat_id: chatId,
      message_id: messageId,
    });
  } catch (err) {
    console.warn(`[deleteTelegramMessage] Failed to delete message ${messageId} in chat ${chatId}:`, err);
    return { ok: false };
  }
}

/**
 * Storage helpers for remembering last bot message IDs
 */
const inMemoryStore = new Map<string, string>();

export async function getStoredValue(env: Env, key: string): Promise<string | null> {
  try {
    if (env.BOT_STORAGE) {
      return await env.BOT_STORAGE.get(key);
    }
  } catch (err) {
    console.warn('[getStoredValue] KV get failed:', err);
  }
  return inMemoryStore.get(key) || null;
}

export async function setStoredValue(env: Env, key: string, value: string): Promise<void> {
  try {
    if (env.BOT_STORAGE) {
      await env.BOT_STORAGE.put(key, value);
    }
  } catch (err) {
    console.warn('[setStoredValue] KV put failed:', err);
  }
  inMemoryStore.set(key, value);
}

export async function deleteStoredValue(env: Env, key: string): Promise<void> {
  try {
    if (env.BOT_STORAGE) {
      await env.BOT_STORAGE.delete(key);
    }
  } catch (err) {
    console.warn('[deleteStoredValue] KV delete failed:', err);
  }
  inMemoryStore.delete(key);
}

/**
 * Check if commands are allowed in this chat and topic
 * - Private chats: always allowed
 * - Group/supergroup chats: ONLY allowed in target group 2997374585 on topic 35
 * - Topic 1702 is reserved for future features ("пока ничего не надо")
 */
export function isCommandAllowedInChat(chat: TelegramChat, threadId?: number): boolean {
  if (chat.type === 'private') {
    return true;
  }
  if (chat.type === 'group' || chat.type === 'supergroup') {
    const isTargetGroup =
      chat.id === TARGET_GROUP_CHAT_ID || String(chat.id).includes(TARGET_GROUP_RAW_ID);
    if (isTargetGroup && threadId === SERVER_LINKS_TOPIC_ID) {
      return true;
    }
  }
  return false;
}

/**
 * Send Rich Message to Telegram Chat with Rich Buttons (<tg-button-row>)
 * Supports Bot API 10.3 Rich HTML, JSON blocks and graceful fallback.
 */
export async function sendTelegramRichMessage(
  token: string,
  chatId: number,
  richHtml: string,
  options: {
    miniAppUrl: string;
    fallbackReplyMarkup?: InlineKeyboardMarkup;
    blocks?: InputRichBlock[];
    message_thread_id?: number;
  }
) {
  // 1. Attempt sendRichMessage with Rich HTML containing <tg-button-row> and <tg-button>
  const richPayload: Record<string, unknown> = {
    chat_id: chatId,
    rich_message: { html: richHtml },
    reply_markup: { remove_keyboard: true },
  };
  if (options.message_thread_id) {
    richPayload.message_thread_id = options.message_thread_id;
  }

  const result = await callTelegramApi(token, 'sendRichMessage', richPayload);

  if (result.ok) {
    return result;
  }

  // 2. If HTML markup failed, attempt with typed blocks (InputRichBlockButtons)
  if (options.blocks && options.blocks.length > 0) {
    console.warn('[sendTelegramRichMessage] Retrying with InputRichMessage blocks...');
    const blocksPayload: Record<string, unknown> = {
      chat_id: chatId,
      rich_message: { blocks: options.blocks },
      reply_markup: { remove_keyboard: true },
    };
    if (options.message_thread_id) {
      blocksPayload.message_thread_id = options.message_thread_id;
    }
    const blocksResult = await callTelegramApi(token, 'sendRichMessage', blocksPayload);
    if (blocksResult.ok) {
      return blocksResult;
    }
  }

  // 3. Fallback to standard sendMessage with inline keyboard
  console.warn('[sendTelegramRichMessage] sendRichMessage failed, falling back to sendMessage:', result);
  const cleanHtml = stripRichButtonTags(richHtml) || '\u200E';
  return sendTelegramMessage(token, chatId, cleanHtml, {
    parse_mode: 'HTML',
    reply_markup: options.fallbackReplyMarkup || getInlineKeyboard(options.miniAppUrl),
    message_thread_id: options.message_thread_id,
  });
}

/**
 * Execute command response with cleanup:
 * 1. Delete previous identical bot message for this command in this chat/thread.
 * 2. Send new bot message.
 * 3. Store new bot message ID.
 * 4. Delete user's command message.
 */
export async function handleBotCommandResponse(
  env: Env,
  token: string,
  chatId: number,
  commandName: string,
  userMessageId: number,
  threadId: number | undefined,
  sendAction: () => Promise<any>
): Promise<any> {
  const threadKey = threadId ? String(threadId) : 'root';
  const storageKey = `last_bot_msg:${chatId}:${threadKey}:${commandName}`;

  // 1. Delete previous identical message from bot (if any)
  const prevMsgIdStr = await getStoredValue(env, storageKey);
  if (prevMsgIdStr) {
    const prevMsgId = parseInt(prevMsgIdStr, 10);
    if (!isNaN(prevMsgId)) {
      await deleteTelegramMessage(token, chatId, prevMsgId);
    }
  }

  // 2. Send the new bot message
  const result = await sendAction();

  // 3. Save new bot message ID
  if (result?.ok && result?.result?.message_id) {
    await setStoredValue(env, storageKey, String(result.result.message_id));
  }

  // 4. Delete the user's command message
  await deleteTelegramMessage(token, chatId, userMessageId);

  return result;
}

/**
 * Broadcast New Media Article to Telegram Forum Topic (1702)
 * Features:
 * - Direct link to article page in OneApp: https://t.me/onehserver_bot/oneapp?startapp=article_<id>
 * - Photo preview (cover_url)
 * - Article Title
 * - Bot API 10.3 Rich Button "Читать" (style: "primary")
 * - Graceful fallback to sendPhoto or sendMessage if Rich Message fails
 */
export async function broadcastArticleToTelegram(
  env: Env,
  article: ArticleBroadcastPayload,
  options: {
    chatId?: number;
    threadId?: number;
  } = {}
): Promise<{ ok: boolean; message_id?: number; error?: string; result?: any }> {
  const token = getBotToken(env);
  const chatId = options.chatId || TARGET_GROUP_CHAT_ID;
  const threadId = options.threadId !== undefined ? options.threadId : MEDIA_ARTICLES_TOPIC_ID;
  const directArticleUrl = `https://t.me/${BOT_USERNAME}/oneapp?startapp=article_${article.id}`;
  const safeTitle = escapeHtml(article.title || 'Новая статья');
  const coverUrl = (article.cover_url || '').trim();

  // 1. Rich HTML with photo preview link and Rich Button
  const photoPreviewTag = coverUrl ? `<a href="${coverUrl}">&#8205;</a>` : '';
  const richHtml =
    `${photoPreviewTag}<h3>${safeTitle}</h3>\n` +
    `<tg-button-row align="center">\n` +
    `  <tg-button type="url" url="${directArticleUrl}" style="primary">Читать</tg-button>\n` +
    `</tg-button-row>`;

  // 2. Structured blocks fallback
  const blocks: InputRichBlock[] = [
    {
      type: 'paragraph',
      text: article.title || 'Новая статья',
    },
    {
      type: 'buttons',
      align: 'center',
      buttons: [
        {
          text: 'Читать',
          style: 'primary',
          url: directArticleUrl,
        },
      ],
    },
  ];

  const inlineKeyboardFallback: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        {
          text: 'Читать',
          url: directArticleUrl,
        },
      ],
    ],
  };

  // Step 1: Attempt sendRichMessage with link_preview_options
  try {
    const richPayload: Record<string, unknown> = {
      chat_id: chatId,
      message_thread_id: threadId,
      rich_message: { html: richHtml },
      reply_markup: { remove_keyboard: true },
    };

    if (coverUrl) {
      richPayload.link_preview_options = {
        url: coverUrl,
        prefer_large_media: true,
        show_above_text: true,
      };
    }

    const richResult = await callTelegramApi(token, 'sendRichMessage', richPayload);
    if (richResult.ok) {
      return { ok: true, message_id: richResult.result?.message_id, result: richResult.result };
    }

    // Step 2: Attempt with JSON blocks
    const blocksPayload: Record<string, unknown> = {
      chat_id: chatId,
      message_thread_id: threadId,
      rich_message: { blocks },
      reply_markup: { remove_keyboard: true },
    };
    if (coverUrl) {
      blocksPayload.link_preview_options = {
        url: coverUrl,
        prefer_large_media: true,
        show_above_text: true,
      };
    }
    const blocksResult = await callTelegramApi(token, 'sendRichMessage', blocksPayload);
    if (blocksResult.ok) {
      return { ok: true, message_id: blocksResult.result?.message_id, result: blocksResult.result };
    }
  } catch (err) {
    console.warn('[broadcastArticleToTelegram] sendRichMessage attempt error:', err);
  }

  // Step 3: Fallback - if image exists, call sendPhoto
  if (coverUrl) {
    try {
      const photoResult = await callTelegramApi(token, 'sendPhoto', {
        chat_id: chatId,
        message_thread_id: threadId,
        photo: coverUrl,
        caption: `<b>${safeTitle}</b>`,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboardFallback,
      });
      if (photoResult.ok) {
        return { ok: true, message_id: photoResult.result?.message_id, result: photoResult.result };
      }
    } catch (photoErr) {
      console.warn('[broadcastArticleToTelegram] sendPhoto fallback failed:', photoErr);
    }
  }

  // Step 4: Final fallback - sendMessage
  const messageResult = await sendTelegramMessage(token, chatId, `<b>${safeTitle}</b>`, {
    parse_mode: 'HTML',
    reply_markup: inlineKeyboardFallback,
    message_thread_id: threadId,
  });

  return {
    ok: Boolean(messageResult.ok),
    message_id: messageResult.result?.message_id,
    error: messageResult.description,
    result: messageResult.result,
  };
}

/**
 * Configure Bot Commands in Telegram
 */
export async function setupBotCommands(token: string) {
  return callTelegramApi(token, 'setMyCommands', {
    commands: [
      { command: 'app', description: '🚀 Запустить OneApp' },
      { command: 'all', description: '💎 Все сервисы OneHouse (OneApp, OneDash, OneLaunch)' },
      { command: 'start', description: 'ℹ️ Главное меню и приветствие' },
      { command: 'help', description: '❓ Справка по возможностям бота' },
    ],
  });
}

/**
 * Configure Bot Menu Button (Button next to message input)
 */
export async function setupMenuButton(token: string, miniAppUrl: string) {
  return callTelegramApi(token, 'setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: 'OneApp',
      web_app: { url: miniAppUrl },
    },
  });
}

/**
 * Handle incoming Telegram Update
 */
export async function handleTelegramUpdate(update: TelegramUpdate, env: Env): Promise<Response> {
  const token = getBotToken(env);
  const miniAppUrl = getMiniAppUrl(env);

  // 0. Handle Direct Article Broadcast payload ({ type: 'new_post', post: ... })
  if ((update as any).type === 'new_post' && (update as any).post) {
    const broadcastResult = await broadcastArticleToTelegram(env, (update as any).post);
    return new Response(JSON.stringify(broadcastResult), {
      status: broadcastResult.ok ? 200 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 1. Handle Inline Queries (@onehserver_bot in any chat)
  if (update.inline_query) {
    const iq = update.inline_query;
    const shareText =
      `🚀 <b>OneApp Mini App</b>\n\n` +
      `Инновационное веб-приложение экосистемы OneApp.\n` +
      `Нажмите на кнопку ниже для запуска:`;

    await callTelegramApi(token, 'answerInlineQuery', {
      inline_query_id: iq.id,
      cache_time: 10,
      results: [
        {
          type: 'article',
          id: 'oneapp_app',
          title: '🚀 OneApp Mini App',
          description: 'Открыть приложение OneApp',
          thumb_url: 'https://onelaunch.pp.ua/favicon.ico',
          input_message_content: {
            message_text: `${shareText}\n\n🔗 <a href="${DIRECT_APP_URL}">${DIRECT_APP_URL}</a>`,
            parse_mode: 'HTML',
          },
          reply_markup: getInlineKeyboard(miniAppUrl),
        },
      ],
    });

    return new Response(JSON.stringify({ ok: true, status: 'inline_query_handled' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Handle Callback Queries
  if (update.callback_query) {
    const query = update.callback_query;
    const data = query.data || '';

    if (data === 'open_app' || data === 'app') {
      await callTelegramApi(token, 'answerCallbackQuery', {
        callback_query_id: query.id,
        url: DIRECT_APP_URL,
      });
      return new Response(JSON.stringify({ ok: true, status: 'callback_handled' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await callTelegramApi(token, 'answerCallbackQuery', {
      callback_query_id: query.id,
      text: 'OneApp Mini App',
    });
    return new Response(JSON.stringify({ ok: true, status: 'callback_answered' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Handle Regular Chat Messages
  const message = update.message;
  if (!message) {
    return new Response(JSON.stringify({ ok: true, status: 'ignored_non_message' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const chatId = message.chat.id;
  const threadId = message.message_thread_id;
  const text = (message.text || '').trim();
  const userName = message.from?.first_name || 'друг';

  // 1. Forum Topic & Group restrictions:
  // In group chats, only topic 35 is authorized for server & link commands.
  // Topic 1702 is reserved for future features ("пока ничего не надо").
  // Non-topic group chats or unauthorized topics are ignored.
  if (!isCommandAllowedInChat(message.chat, threadId)) {
    return new Response(JSON.stringify({ ok: true, status: 'ignored_unauthorized_chat_or_topic' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. In groups, ignore any messages that are NOT bot commands
  const isCommand = text.startsWith('/');
  if ((message.chat.type === 'group' || message.chat.type === 'supergroup') && !isCommand) {
    return new Response(JSON.stringify({ ok: true, status: 'ignored_non_command_group_message' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Handle Mini App Data (if web app sends data back via Telegram.WebApp.sendData)
  if (message.web_app_data) {
    const appData = message.web_app_data.data;
    await sendTelegramMessage(
      token,
      chatId,
      `✅ <b>Данные из OneApp получены:</b>\n\n<code>${appData}</code>`,
      {
        parse_mode: 'HTML',
        reply_markup: getInlineKeyboard(miniAppUrl),
        message_thread_id: threadId,
      }
    );
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Command: /start
  if (text.startsWith('/start')) {
    const welcomeHtml =
      `👋 <b>Привет, ${userName}!</b>\n\n` +
      `Добро пожаловать в бота экосистемы <b>OneHouse</b>.\n\n` +
      `📌 <b>Команды бота:</b>\n` +
      `• /app — открыть OneApp\n` +
      `• /all — все сервисы OneHouse (OneApp, OneDash, OneLaunch)\n` +
      `• /help — подробная справка\n\n` +
      `🔗 Прямая ссылка OneApp: <a href="${DIRECT_APP_URL}">${DIRECT_APP_URL}</a>`;

    await handleBotCommandResponse(
      env,
      token,
      chatId,
      'start',
      message.message_id,
      threadId,
      () =>
        sendTelegramMessage(token, chatId, welcomeHtml, {
          parse_mode: 'HTML',
          reply_markup: { remove_keyboard: true },
          message_thread_id: threadId,
        })
    );

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Command: /app
  if (text.startsWith('/app')) {
    // Small inline button under heading with custom emoji
    const appHtml = `<b><tg-emoji emoji-id="${CUSTOM_EMOJI_ID}">💎</tg-emoji> OneApp</b>`;

    await handleBotCommandResponse(
      env,
      token,
      chatId,
      'app',
      message.message_id,
      threadId,
      () =>
        sendTelegramMessage(token, chatId, appHtml, {
          parse_mode: 'HTML',
          reply_markup: getInlineKeyboard(miniAppUrl),
          message_thread_id: threadId,
        })
    );

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Command: /all - Rich Message with 3 colored buttons
  if (text.startsWith('/all')) {
    const allRichHtml = getAllServicesRichHtml();
    const allBlocks = getAllServicesRichBlocks();
    const fallbackMarkup: InlineKeyboardMarkup = {
      inline_keyboard: [
        [{ text: '🟢 OneApp', url: DIRECT_APP_URL }],
        [{ text: '⚪ OneDash', url: ONEDASH_URL }],
        [{ text: '🔵 OneLaunch', url: ONELAUNCH_DOWNLOAD_URL }],
      ],
    };

    await handleBotCommandResponse(
      env,
      token,
      chatId,
      'all',
      message.message_id,
      threadId,
      () =>
        sendTelegramRichMessage(token, chatId, allRichHtml, {
          miniAppUrl,
          blocks: allBlocks,
          fallbackReplyMarkup: fallbackMarkup,
          message_thread_id: threadId,
        })
    );

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Command: /keyboard (deprecated - clean up and remove bottom keyboard)
  if (text.startsWith('/keyboard')) {
    await handleBotCommandResponse(
      env,
      token,
      chatId,
      'keyboard',
      message.message_id,
      threadId,
      () =>
        sendTelegramMessage(
          token,
          chatId,
          `⌨️ Нижняя клавиатура удалена. Используйте команды /all или /app.`,
          {
            reply_markup: { remove_keyboard: true },
            message_thread_id: threadId,
          }
        )
    );

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Command: /help
  if (text.startsWith('/help')) {
    const helpHtml =
      `ℹ️ <b>Справка по OneHouse боту</b>\n\n` +
      `Этот бот подключен к сервисам экосистемы OneHouse.\n\n` +
      `🔘 <b>Команды бота:</b>\n` +
      `1. <b>/app</b> — открыть OneApp Mini App (кнопка «Открыть» под сообщением)\n` +
      `2. <b>/all</b> — рич-сообщение со всеми сервисами и цветными кнопками:\n` +
      `   • 🟢 <b>OneApp</b> (зеленая кнопка)\n` +
      `   • ⚪ <b>OneDash</b> (обычная белая кнопка)\n` +
      `   • 🔵 <b>OneLaunch</b> (синяя кнопка)\n` +
      `3. <b>Menu Button</b> — кнопка «OneApp» в левом нижнем углу экрана возле поля ввода.\n\n` +
      `🌐 <b>Сервисы экосистемы:</b>\n` +
      `• OneApp: ${DIRECT_APP_URL}\n` +
      `• OneDash: ${ONEDASH_URL}\n` +
      `• OneLaunch: ${ONELAUNCH_DOWNLOAD_URL}`;

    await handleBotCommandResponse(
      env,
      token,
      chatId,
      'help',
      message.message_id,
      threadId,
      () =>
        sendTelegramMessage(token, chatId, helpHtml, {
          parse_mode: 'HTML',
          reply_markup: { remove_keyboard: true },
          message_thread_id: threadId,
        })
    );

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fallback for non-command text in private chat only
  if (message.chat.type === 'private') {
    const fallbackHtml = `<b><tg-emoji emoji-id="${CUSTOM_EMOJI_ID}">💎</tg-emoji> OneApp</b>`;
    await handleBotCommandResponse(
      env,
      token,
      chatId,
      'app',
      message.message_id,
      threadId,
      () =>
        sendTelegramMessage(token, chatId, fallbackHtml, {
          parse_mode: 'HTML',
          reply_markup: getInlineKeyboard(miniAppUrl),
          message_thread_id: threadId,
        })
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Render Dashboard HTML for browser viewing (GET /)
 */
function renderDashboardHtml(workerUrl: string, botToken: string, miniAppUrl: string): string {
  const maskedToken = botToken
    ? botToken.replace(/^(\d{4})\d+(:.*)$/, '$1••••$2')
    : '<span style="color:#ff6b6b; font-weight:700;">НЕ ЗАДАН (задайте через wrangler secret put BOT_TOKEN)</span>';

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OneApp Telegram Bot • Cloudflare Worker</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Wix+Madefor+Display:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Wix Madefor Display', -apple-system, BlinkMacSystemFont, sans-serif; }
    body { background-color: #090b0e; color: #ffffff; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background-color: #14171c; border-radius: 28px; width: 100%; max-width: 580px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(192, 255, 0, 0.1); color: #c0ff00; padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
    .badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #c0ff00; box-shadow: 0 0 10px #c0ff00; }
    h1 { font-size: 26px; font-weight: 800; margin-bottom: 10px; }
    p.desc { color: #8e8e93; font-size: 14px; line-height: 1.5; margin-bottom: 24px; }
    .info-box { background: #181c23; border-radius: 18px; padding: 18px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 12px; font-size: 14px; }
    .info-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
    .info-label { color: #8e8e93; }
    .info-value { font-weight: 600; color: #ffffff; word-break: break-all; text-align: right; }
    .actions { display: flex; flex-direction: column; gap: 12px; }
    .btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 24px; border-radius: 9999px; font-size: 15px; font-weight: 700; text-decoration: none; cursor: pointer; transition: all 0.2s ease; border: none; }
    .btn-primary { background-color: #c0ff00; color: #090b0e; }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-secondary { background-color: #1c222b; color: #ffffff; }
    .btn-secondary:hover { background-color: #232a36; transform: translateY(-1px); }
    .endpoints { margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 12px; color: #8e8e93; }
    .endpoints code { background: #1c222b; color: #c0ff00; padding: 2px 6px; border-radius: 6px; font-size: 11px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <div class="badge-dot"></div>
      Cloudflare Workers Active • Rich Buttons v10.3 & Inline
    </div>
    <h1>OneApp Telegram Bot</h1>
    <p class="desc">Бот экосистемы OneHouse с поддержкой рич-кнопок Telegram Bot API 10.3 (/all) и компактных инлайн-кнопок (/app).</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Бот:</span>
        <span class="info-value">@${BOT_USERNAME}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Mini App URL:</span>
        <span class="info-value"><a href="${miniAppUrl}" target="_blank" style="color: #c0ff00; text-decoration: none;">${miniAppUrl}</a></span>
      </div>
      <div class="info-row">
        <span class="info-label">Прямой App Link:</span>
        <span class="info-value"><a href="${DIRECT_APP_URL}" target="_blank" style="color: #c0ff00; text-decoration: none;">${DIRECT_APP_URL}</a></span>
      </div>
      <div class="info-row">
        <span class="info-label">Worker URL:</span>
        <span class="info-value">${workerUrl}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Токен:</span>
        <span class="info-value"><code>${maskedToken}</code></span>
      </div>
    </div>

    <div class="actions">
      <a href="/set-webhook" class="btn btn-primary">🔗 Установить Webhook и Команды</a>
      <a href="/get-webhook" class="btn btn-secondary">🔍 Проверить статус Webhook</a>
      <a href="https://t.me/${BOT_USERNAME}" target="_blank" class="btn btn-secondary">✈️ Открыть бота в Telegram</a>
      <a href="${DIRECT_APP_URL}" target="_blank" class="btn btn-secondary">🚀 Открыть OneApp Mini App</a>
    </div>

    <div class="endpoints">
      <p style="margin-bottom: 6px;"><b>Доступные эндпоинты:</b></p>
      <p>• <code>POST /webhook</code> — обработка вебхуков Telegram (сообщения, callback_query, inline_query)</p>
      <p>• <code>POST /publish-article</code> — рассылка новой статьи с фотопревью и рич-кнопкой «Читать» в топик 1702</p>
      <p>• <code>GET /set-webhook</code> — автоматическая привязка вебхука</p>
      <p>• <code>GET /get-webhook</code> — информация о текущем вебхуке</p>
      <p>• <code>GET /delete-webhook</code> — удаление вебхука</p>
    </div>
  </div>
</body>
</html>`;
}

// --- Cloudflare Worker Fetch Handler ---

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const token = getBotToken(env);
    const miniAppUrl = getMiniAppUrl(env);

    // 0. CORS preflight handler
    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Telegram-Bot-Api-Secret-Token',
    };

    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // 1. Dashboard: GET /
    if (method === 'GET' && (url.pathname === '/' || url.pathname === '')) {
      return new Response(renderDashboardHtml(url.origin, token, miniAppUrl), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // 2. Broadcast Media Article: POST /publish-article or POST /api/publish-article
    const isPublishEndpoint =
      url.pathname === '/publish-article' ||
      url.pathname === '/api/publish-article' ||
      url.pathname.endsWith('/publish-article') ||
      url.searchParams.get('action') === 'publish_article';

    if (method === 'POST' && isPublishEndpoint) {
      try {
        const body: any = await request.json();
        const article: ArticleBroadcastPayload = body.post || body.article || body;
        if (!article || !article.id || !article.title) {
          return new Response(
            JSON.stringify({ ok: false, error: 'Missing required article fields: id, title' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            }
          );
        }

        const targetChatId = body.chat_id ? Number(body.chat_id) : undefined;
        const targetThreadId =
          body.message_thread_id !== undefined ? Number(body.message_thread_id) : undefined;

        const broadcastResult = await broadcastArticleToTelegram(env, article, {
          chatId: targetChatId,
          threadId: targetThreadId,
        });

        return new Response(JSON.stringify(broadcastResult), {
          status: broadcastResult.ok ? 200 : 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ ok: false, error: err?.message || 'Invalid JSON body' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
    }

    // 3. Set Webhook: GET/POST /set-webhook
    if (url.pathname === '/set-webhook') {
      const targetWebhookUrl = url.searchParams.get('url') || `${url.origin}/webhook`;
      const secret = env.WEBHOOK_SECRET || undefined;

      const webhookPayload: Record<string, unknown> = {
        url: targetWebhookUrl,
        allowed_updates: ['message', 'callback_query', 'inline_query'],
      };
      if (secret) {
        webhookPayload.secret_token = secret;
      }

      const [webhookResult, commandsResult, menuResult] = await Promise.all([
        callTelegramApi(token, 'setWebhook', webhookPayload),
        setupBotCommands(token),
        setupMenuButton(token, miniAppUrl),
      ]);

      return new Response(
        JSON.stringify(
          {
            success: webhookResult.ok,
            webhook: webhookResult,
            commands: commandsResult,
            menuButton: menuResult,
            configuredUrl: targetWebhookUrl,
            miniAppUrl,
          },
          null,
          2
        ),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Get Webhook Info: GET /get-webhook
    if (url.pathname === '/get-webhook') {
      const webhookInfo = await callTelegramApi(token, 'getWebhookInfo');
      return new Response(JSON.stringify(webhookInfo, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 5. Delete Webhook: GET/POST /delete-webhook
    if (url.pathname === '/delete-webhook') {
      const result = await callTelegramApi(token, 'deleteWebhook', {
        drop_pending_updates: true,
      });
      return new Response(JSON.stringify(result, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 6. Incoming Webhook: POST /webhook or POST /
    if (method === 'POST') {
      if (env.WEBHOOK_SECRET) {
        const receivedSecret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
        if (receivedSecret !== env.WEBHOOK_SECRET) {
          return new Response('Unauthorized secret token', { status: 403 });
        }
      }

      try {
        const update = (await request.json()) as TelegramUpdate;
        return await handleTelegramUpdate(update, env);
      } catch (err: any) {
        console.error('[Webhook Processing Error]:', err);
        return new Response(
          JSON.stringify({ ok: false, error: err?.message || 'Invalid JSON body' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};
