'use client';

/**
 * Analysis Page Loading Component
 * Specialized loading animation for data analysis
 */
export default function AnalysisLoading() {
  return (
    <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* Breathing analysis circles */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div 
            className="absolute inset-0 rounded-full border-4 border-[#0B3D2E]/10"
            style={{
              animation: 'breathe 2.5s ease-in-out infinite',
            }}
          />
          <div 
            className="absolute inset-4 rounded-full border-4 border-[#0B3D2E]/20"
            style={{
              animation: 'breathe 2.5s ease-in-out infinite 0.5s',
            }}
          />
          <div 
            className="absolute inset-8 rounded-full border-4 border-[#0B3D2E]/30"
            style={{
              animation: 'breathe 2.5s ease-in-out infinite 1s',
            }}
          />
          <div className="absolute inset-12 rounded-full bg-[#0B3D2E] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#FAF6EF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>

        {/* Loading stages */}
        <div className="space-y-3">
          <p className="text-lg font-medium text-[#0B3D2E]">Analyzing your metabolic data...</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#0B3D2E] animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-2 h-2 rounded-full bg-[#0B3D2E] animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 rounded-full bg-[#0B3D2E] animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
}
