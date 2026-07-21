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
        {/* Этот скрипт жизненно необходим для работы внутри Telegram */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      {/* Принудительно задаем класс шрифта для всего приложения */}
      <body className={wixFont.className}>{children}</body>
    </html>
  );
}
