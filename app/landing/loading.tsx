'use client';

/**
 * Landing Page Loading Component
 * Calming pulse animation matching the organic design theme
 */
export default function LandingLoading() {
  return (
    <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center">
      <div className="text-center">
        {/* Organic breathing orbs */}
        <div className="relative w-28 h-28 mx-auto mb-8">
          {/* Gradient background orbs */}
          <div 
            className="absolute inset-0 rounded-full bg-gradient-to-br from-[#0B3D2E]/20 to-[#1a5c47]/10 blur-2xl"
            style={{
              animation: 'float 3s ease-in-out infinite',
            }}
          />
          <div 
            className="absolute inset-0 rounded-full bg-gradient-to-br from-[#1a5c47]/10 to-[#0B3D2E]/20 blur-2xl"
            style={{
              animation: 'float 3s ease-in-out infinite 1.5s',
            }}
          />
          
          {/* Center pulse */}
          <div 
            className="absolute inset-10 rounded-full bg-[#0B3D2E]"
            style={{
              animation: 'pulse-center 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
        </div>

        {/* Loading text with fade */}
        <div className="space-y-2">
          <p 
            className="text-sm font-medium text-[#0B3D2E]"
            style={{
              animation: 'fade 2s ease-in-out infinite',
            }}
          >
            Preparing your dashboard...
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-10px) scale(1.1);
            opacity: 0.5;
          }
        }

        @keyframes pulse-center {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        @keyframes fade {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
