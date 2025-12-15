'use client';

/**
 * DevTools Component
 * Shows development mode indicator and React Grab toggle button
 * React Grab is loaded via script tag in layout.tsx
 * 
 * DRAGGABLE: Can be moved around the screen
 * Click the button or press Ctrl+Shift+C to activate
 * Alt+Click any element to copy component context
 * 
 * @module components/DevTools
 */

import { useEffect, useState, useRef, useCallback } from 'react';

export function DevTools() {
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: -1 }); // -1 means use bottom positioning
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLButtonElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });

  const toggleGrab = useCallback(() => {
    if (isDragging) return; // Don't toggle if dragging
    
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
  }, [isDragging]);

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
  }, [toggleGrab]);

  // Handle drag events
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.startX;
      const deltaY = e.clientY - dragStartRef.current.startY;
      
      setPosition({
        x: dragStartRef.current.x + deltaX,
        y: dragStartRef.current.y + deltaY,
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStartRef.current.startX;
      const deltaY = touch.clientY - dragStartRef.current.startY;
      
      setPosition({
        x: dragStartRef.current.x + deltaX,
        y: dragStartRef.current.y + deltaY,
      });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  // Initialize position on first render (bottom-left)
  useEffect(() => {
    if (position.y === -1 && typeof window !== 'undefined') {
      setPosition({ x: 16, y: window.innerHeight - 100 });
    }
  }, [position.y]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    dragStartRef.current = {
      x: position.x,
      y: position.y,
      startX: clientX,
      startY: clientY,
    };
    
    setIsDragging(true);
  };

  // Hide in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <button
      ref={dragRef}
      onClick={toggleGrab}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      style={{
        left: position.x,
        top: position.y === -1 ? 'auto' : position.y,
        bottom: position.y === -1 ? 16 : 'auto',
        touchAction: 'none',
      }}
      className={`fixed z-[9999] px-3 py-1.5 text-white text-xs rounded-full transition-colors cursor-grab active:cursor-grabbing select-none ${
        isActive 
          ? 'bg-emerald-600 opacity-100 shadow-lg' 
          : 'bg-[#0B3D2E] opacity-80 hover:opacity-100'
      } ${isDragging ? 'scale-110 shadow-xl' : ''}`}
      title="拖动移动 | Ctrl+Shift+C 切换 | Alt+Click 检查"
    >
      🔍 {isActive ? 'Grab Active' : 'Dev Mode'}
    </button>
  );
}

export default DevTools;
