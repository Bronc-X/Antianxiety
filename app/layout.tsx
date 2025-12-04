import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RouteTransition from "@/components/RouteTransition";
import MotionProvider from "@/components/MotionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import AIAssistantFloatingButton from "@/components/AIAssistantFloatingButton";
import GlobalNav from "@/components/GlobalNav";
import { I18nProvider } from "@/lib/i18n";
import { ToastProvider } from "@/components/ui/toast";
import DevTools from "@/components/DevTools";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "No More anxious™ - 对抗焦虑，解锁身体潜能",
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <I18nProvider>
            <MotionProvider>
              <ToastProvider>
                <GlobalNav />
                <RouteTransition>{children}</RouteTransition>
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
