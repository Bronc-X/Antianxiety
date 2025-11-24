'use client';

/**
 * Global Loading Component
 * Simple, calming pulse animation with Cream/Green theme
 * Prevents "White Screen Flash" during page transitions
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center">
      <div className="text-center">
        {/* Breathing pulse circles */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          {/* Outer circle */}
          <div 
            className="absolute inset-0 rounded-full bg-[#0B3D2E] opacity-10"
            style={{
              animation: 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
          {/* Middle circle */}
          <div 
            className="absolute inset-3 rounded-full bg-[#0B3D2E] opacity-20"
            style={{
              animation: 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.4s',
            }}
          />
          {/* Inner circle */}
          <div 
            className="absolute inset-6 rounded-full bg-[#0B3D2E] opacity-30"
            style={{
              animation: 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.8s',
            }}
          />
          {/* Center dot */}
          <div className="absolute inset-9 rounded-full bg-[#0B3D2E]" />
        </div>

        {/* Loading text */}
        <p className="text-sm text-[#0B3D2E]/60 font-medium">Loading...</p>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.1;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}
