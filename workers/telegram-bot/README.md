# OneApp Telegram Bot (Cloudflare Workers)

Бот Telegram для экосистемы **OneApp Mini App** (`@onehserver_bot`), оптимизированный для работы на **Cloudflare Workers** (или **Cloudflare Pages Functions**).

---

## 🎯 Возможности

- 🚀 **Команда `/app`**:
  - **Основной режим (Рич-кнопка)**: отправляет сообщение с постоянной кнопкой `ReplyKeyboardMarkup` (`web_app`), закрепленной на панели клавиатуры внизу экрана.
  - **Инлайн-режим (`/app inline`)**: отправляет сообщение с кнопкой `InlineKeyboardMarkup` (`web_app`) прямо под текстом сообщения.
  - **Двойной режим (`/app both`)**: активирует нижнюю рич-кнопку и одновременно прикрепляет инлайн-кнопку.
- ⚡ **Команда `/inline`**: прямой вызов инлайн-кнопки без параметров.
- 👋 **Команда `/start`**: приветствие пользователя с инициализацией рич-кнопки.
- ❓ **Команда `/help`**: подробное описание способов запуска Mini App.
- 🔄 **Автоматическая настройка вебхука (`/set-webhook`)**:
  - Регистрирует вебхук в Telegram Bot API.
  - Автоматически настраивает меню команд через `setMyCommands`.
  - Настраивает постоянную кнопку `Menu Button` через `setChatMenuButton`.
- 📊 **Веб-дашборд (`GET /`)**: красивый интерфейс в стиле OneWeb-UI для проверки статуса, управления вебхуком и тестирования.

---

## ⚙️ Переменные окружения

В [wrangler.toml](file:///c:/Users/pshen/.gemini/antigravity/scratch/onehouse-tmaa/workers/telegram-bot/wrangler.toml) уже заданы значения по умолчанию:

| Переменная | Описание | Значение по умолчанию |
|---|---|---|
| `BOT_TOKEN` | Токен бота от [@BotFather](https://t.me/BotFather) | *(Задается через secret / env)* |
| `MINI_APP_URL` | URL веб-приложения Mini App | `https://onelaunch.pp.ua/` |
| `WEBHOOK_SECRET` | *(Опционально)* Секретный токен для проверки заголовка `X-Telegram-Bot-Api-Secret-Token` | — |

---

## 🚀 Варианты развертывания

### Вариант 1: Отдельный Cloudflare Worker (рекомендуется)

1. **Локальный запуск (тестирование):**
   ```bash
   npm run bot:dev
   ```

2. **Запуск тестов:**
   ```bash
   npm run bot:test
   ```

3. **Деплой в Cloudflare:**
   ```bash
   npm run bot:deploy
   ```
   *(Если требуется авторизоваться в Cloudflare: `npx wrangler login`)*

4. **Активация вебхука:**
   После деплоя откройте в браузере URL вашего воркера:
   `https://<ваш-worker>.workers.dev/set-webhook`
   Либо откройте главную страницу `https://<ваш-worker>.workers.dev/` и нажмите зеленую кнопку **«Установить Webhook и Команды»**.

---

### Вариант 2: В составе существующего Cloudflare Pages (`onehouse-tmaa`)

В проекте уже создан эндпоинт [functions/api/bot.ts](file:///c:/Users/pshen/.gemini/antigravity/scratch/onehouse-tmaa/functions/api/bot.ts).
Если вы развертываете весь репозиторий `onehouse-tmaa` на Cloudflare Pages (например, на `https://onelaunch.pp.ua`):
- Эндпоинт бота автоматически доступен по адресу: `https://onelaunch.pp.ua/api/bot`
- Для привязки вебхука перейдите по ссылке:
  `https://onelaunch.pp.ua/api/bot/set-webhook?url=https://onelaunch.pp.ua/api/bot`

---

## 📋 Эндпоинты воркера

- `GET /` — Интерактивный дашборд статуса бота и вебхука.
- `GET /set-webhook` — Привязать вебхук к текущему URL воркера и обновить команды бота.
- `GET /get-webhook` — Получить текущую информацию о вебхуке из Telegram API.
- `GET /delete-webhook` — Удалить вебхук из Telegram API.
- `POST /webhook` (или `POST /`) — Прием обновлений (Updates) от Telegram.
