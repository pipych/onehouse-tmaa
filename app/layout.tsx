import type { Metadata } from "next";
import { Wix_Madefor_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css"; 

// Подключаем шрифт Wix Madefor Display через встроенный загрузчик
const wixFont = Wix_Madefor_Display({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-wix",
});

export const metadata: Metadata = {
  title: "OneApp",
  description: "Панель управления сервером и профилями игроков",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Добавляем переменную шрифта в тег html
    <html lang="ru" className={wixFont.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        {/* Этот скрипт жизненно необходим для работы внутри Telegram */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      {/* Принудительно задаем класс шрифта для всего приложения */}
      <body className={`${wixFont.className} h-full w-full m-0 p-0 overflow-x-hidden`}>{children}</body>
    </html>
  );
}
