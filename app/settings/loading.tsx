'use client';

/**
 * Settings Page Loading Component
 * Shows while settings data is being fetched
 */
export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-[#FAF6EF] dark:bg-neutral-950 flex items-center justify-center transition-colors">
      <div className="text-center">
        {/* Organic breathing orb */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div 
            className="absolute inset-0 rounded-full bg-gradient-to-br from-[#0B3D2E]/20 to-[#1a5c47]/10 blur-xl"
            style={{ animation: 'float 2.5s ease-in-out infinite' }}
          />
          <div 
            className="absolute inset-6 rounded-full bg-[#0B3D2E]"
            style={{ animation: 'pulse-center 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
          />
        </div>

        <p 
          className="text-sm font-medium text-[#0B3D2E] dark:text-white"
          style={{ animation: 'fade 2s ease-in-out infinite' }}
        >
          Loading settings...
        </p>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
          50% { transform: translateY(-8px) scale(1.1); opacity: 0.5; }
        }
        @keyframes pulse-center {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes fade {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
