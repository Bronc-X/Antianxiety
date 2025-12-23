"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MarketingPage from "./marketing/MarketingPage";
import { useI18n } from "@/lib/i18n";

export default function WelcomePage() {
  const router = useRouter();
  const { t } = useI18n();
  const [isActivated, setIsActivated] = useState(false);

  const handleActivation = () => {
    setIsActivated(true);

    // 1. Play Sound
    const audio = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"
    );
    audio.volume = 0.5;
    audio.play().catch((e) => console.log("Audio play failed", e));

    // 2. Redirect to login
    // Add a slight delay for a transition effect if needed, frame the exit
    setTimeout(() => {
      router.push("/login");
    }, 1200);
  };

  return (
    <main className={`relative transition-opacity duration-1000 ${isActivated ? 'opacity-0' : 'opacity-100'}`}>
      <MarketingPage onStart={handleActivation} />

      {/* Optional: Add a subtle overlay or flash on activation */}
      {isActivated && (
        <div className="fixed inset-0 bg-white z-50 animate-pulse duration-1000 pointer-events-none mix-blend-overlay" />
      )}
    </main>
  );
}
