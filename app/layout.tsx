import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneHouse App",
  description: "Telegram Mini App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-[#090b0e] text-white">
        {children}
      </body>
    </html>
  );
}
