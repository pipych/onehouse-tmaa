import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css"; 

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
    <html lang="ru">
      <head>
        {/* Этот скрипт жизненно необходим для работы внутри Telegram */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  );
}
