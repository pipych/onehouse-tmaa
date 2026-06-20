import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneHouse App",
  description: "Telegram Mini App для сервера OneHouse",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
