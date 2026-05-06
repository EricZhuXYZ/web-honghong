import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "哄哄模拟器",
  description: "你的对象生气了，快哄哄TA吧！",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-[#EDEDED] antialiased">
        {children}
      </body>
    </html>
  );
}
