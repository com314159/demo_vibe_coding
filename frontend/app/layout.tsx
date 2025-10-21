import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IT 设备资产管理系统',
  description: '依据 PRD 的资产管理前端骨架'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
