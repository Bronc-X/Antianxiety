import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RouteTransition from "@/components/RouteTransition";
import MotionProvider from "@/components/MotionProvider";
import AIAssistantFloatingButton from "@/components/AIAssistantFloatingButton";

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
        <MotionProvider>
          <RouteTransition>{children}</RouteTransition>
          <AIAssistantFloatingButton />
        </MotionProvider>
      </body>
    </html>
  );
}
