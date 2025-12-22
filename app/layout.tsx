import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});
import RouteTransition from "@/components/RouteTransition";
import MotionProvider from "@/components/MotionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import GlobalNav from "@/components/GlobalNav";
import MobileBottomNav from "@/components/MobileBottomNav";
import { I18nProvider } from "@/lib/i18n";
import { ToastProvider } from "@/components/ui/toast";
import DevTools from "@/components/DevTools";
import AIAssistantFloatingButton from "@/components/AIAssistantFloatingButton";
import TraditionalChineseAutoConvert from "@/components/TraditionalChineseAutoConvert";



export const metadata: Metadata = {
  title: "AntiAnxiety™ - 对抗焦虑，解锁身体潜能",
  description: "通过建立微小、可持续的日常习惯来对抗新陈代谢衰退，核心是缓解心理焦虑，而非强制打卡。",
};

/**
 * Mobile Viewport Configuration
 * CRITICAL for iOS: user-scalable=no prevents zoom on input focus
 * viewport-fit=cover ensures safe area insets on notched devices
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        {/* 强制浅色模式 - 清除所有可能的深色模式设置 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // 强制清除 dark class
                  document.documentElement.classList.remove('dark');
                  // 强制设置为 light 主题
                  localStorage.setItem('theme', 'light');
                } catch (e) {}
              })();
            `,
          }}
        />
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* Global background - clean without noise texture */}

        <ThemeProvider>
          <I18nProvider>
            <TraditionalChineseAutoConvert />
            <MotionProvider>
              <ToastProvider>
                <GlobalNav />
                <RouteTransition>{children}</RouteTransition>
                <MobileBottomNav />
                <AIAssistantFloatingButton />
                <DevTools />
              </ToastProvider>
            </MotionProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
