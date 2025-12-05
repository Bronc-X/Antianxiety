'use client';

/**
 * DevTools Component
 * Shows development mode indicator and React Grab toggle button
 * React Grab is loaded via script tag in layout.tsx
 * 
 * Click the button or press Ctrl+Shift+C to activate
 * Alt+Click any element to copy component context
 * 
 * @module components/DevTools
 */

import { useEffect, useState } from 'react';

export function DevTools() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Only enable in development
    if (process.env.NODE_ENV !== 'development') return;

    // Listen for state changes from React Grab
    const checkState = () => {
      const grab = (window as any).__REACT_GRAB__;
      if (grab) {
        setIsActive(grab.isActive?.() || false);
      }
    };

    // Check state periodically
    const interval = setInterval(checkState, 500);
    
    // Keyboard shortcut: Ctrl+Shift+C
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        toggleGrab();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleGrab = () => {
    const grab = (window as any).__REACT_GRAB__;
    if (grab) {
      if (grab.isActive?.()) {
        grab.deactivate?.();
        setIsActive(false);
      } else {
        grab.activate?.();
        setIsActive(true);
      }
    }
  };

  // Hide in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <button
      onClick={toggleGrab}
      className={`fixed bottom-4 left-4 z-[9999] px-3 py-1.5 text-white text-xs rounded-full transition-all cursor-pointer ${
        isActive 
          ? 'bg-emerald-600 opacity-100 shadow-lg' 
          : 'bg-[#0B3D2E] opacity-60 hover:opacity-100'
      }`}
      title="Ctrl+Shift+C to toggle | Alt+Click to inspect"
    >
      🔍 {isActive ? 'Grab Active' : 'Dev Mode'}
    </button>
  );
}

export default DevTools;
