"use client";

import { useState } from "react";
import MarketingPage from "./marketing/MarketingPage";
import BetaSignupModal from "./BetaSignupModal";

export default function WelcomePage() {
  const [showBetaModal, setShowBetaModal] = useState(false);

  const handleActivation = () => {
    // In beta mode, show signup modal instead of redirecting to login
    setShowBetaModal(true);
  };

  return (
    <main className="relative">
      <MarketingPage onStart={handleActivation} />

      {/* Beta Signup Modal */}
      <BetaSignupModal
        isOpen={showBetaModal}
        onClose={() => setShowBetaModal(false)}
      />
    </main>
  );
}
