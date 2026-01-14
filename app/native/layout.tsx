/**
 * Native App Layout
 * 
 * 简化的布局，专门用于 iOS/Android 原生 App
 * 不包含 GlobalNav、MobileBottomNav 等组件，避免冲突
 */

import type { Metadata, Viewport } from "next";
import "../globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { I18nProvider } from "@/lib/i18n";
import { ToastProvider } from "@/components/ui/toast";
import MotionProvider from "@/components/MotionProvider";

export const metadata: Metadata = {
    title: "AntiAnxiety™ - Native App",
    description: "通过建立微小、可持续的日常习惯来对抗新陈代谢衰退",
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
};

export default function NativeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="zh" suppressHydrationWarning>
            <head>
                {/* 强制浅色模式 */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              (function() {
                try {
                  document.documentElement.classList.remove('dark');
                  localStorage.setItem('theme', 'light');
                } catch (e) {}
              })();
            `,
                    }}
                />
            </head>
            <body className="antialiased bg-[#F9F9F7]" suppressHydrationWarning>
                <ThemeProvider>
                    <I18nProvider>
                        <MotionProvider>
                            <ToastProvider>
                                {/* 仅渲染页面内容，不包含全局导航和底部栏 */}
                                {children}
                            </ToastProvider>
                        </MotionProvider>
                    </I18nProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
