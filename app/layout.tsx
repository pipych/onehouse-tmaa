import type { Metadata } from "next";
import "./globals.css"; // Подключение глобальных стилей (шрифты, Tailwind)

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
      <body>{children}</body>
    </html>
  );
}
