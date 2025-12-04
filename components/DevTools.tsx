'use client';

/**
 * DevTools Component
 * Integrates React Grab for component inspection in development mode
 * 
 * Click any component while holding Alt/Option to open source in Kiro IDE
 * 
 * @module components/DevTools
 */

import { useEffect, useState } from 'react';

export function DevTools() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Only enable in development
    if (process.env.NODE_ENV !== 'development') return;

    // Dynamic import to avoid bundling in production
    const initReactGrab = async () => {
      try {
        const { grab } = await import('react-grab');
        
        // Configure for Kiro IDE
        // kiro:// URL scheme opens files in Kiro
        grab({
          // Use kiro:// URL scheme for Kiro IDE
          // Format: kiro://file/{path}:{line}:{column}
          editor: (file, line, column) => {
            // Try kiro:// scheme first, fallback to vscode://
            const kiroUrl = `kiro://file/${file}:${line}:${column}`;
            const vscodeUrl = `vscode://file/${file}:${line}:${column}`;
            
            // Attempt to open in Kiro, fallback to VS Code
            window.location.href = kiroUrl;
          }
        });
        
        setIsEnabled(true);
        console.log('🔍 React Grab enabled - Alt+Click to inspect components');
      } catch (error) {
        console.warn('React Grab initialization failed:', error);
      }
    };

    initReactGrab();
  }, []);

  // Show indicator in development
  if (!isEnabled || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 left-4 z-[9999] px-2 py-1 bg-[#0B3D2E] text-white text-xs rounded-full opacity-50 hover:opacity-100 transition-opacity pointer-events-none"
      title="Alt+Click to inspect components"
    >
      🔍 Dev Mode
    </div>
  );
}

export default DevTools;
