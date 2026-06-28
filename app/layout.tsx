import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css"; 

// Подключаем шрифт один раз здесь
const openSans = Open_Sans({
  subsets: ["cyrillic", "latin"],
  variable: "--font-open-sans",
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
    // Применяем переменную шрифта к html
    <html lang="ru" className={openSans.variable}>
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      {/* Применяем класс шрифта ко всему body */}
      <body className={openSans.className}>{children}</body>
    </html>
  );
}
