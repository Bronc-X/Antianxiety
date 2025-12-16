'use client';

/**
 * useLottie Hook - Lottie animation control
 * Requirements: 6.4
 * 
 * Provides animation data loading and playback control methods
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { LottieRefCurrentProps } from 'lottie-react';

export interface UseLottieOptions {
  autoPlay?: boolean;
  loop?: boolean;
}

export interface UseLottieReturn {
  animationData: object | null;
  lottieRef: React.RefObject<LottieRefCurrentProps | null>;
  isLoading: boolean;
  error: Error | null;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
  goToAndPlay: (frame: number) => void;
  goToAndStop: (frame: number) => void;
}

/**
 * Custom hook for loading and controlling Lottie animations
 * @param animationPath - Path to the Lottie JSON file (e.g., '/lottie/loading.json')
 * @param options - Optional configuration for autoPlay and loop
 */
export function useLottie(
  animationPath: string,
  options: UseLottieOptions = {}
): UseLottieReturn {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);

  // Load animation data
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(animationPath)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load animation: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setAnimationData(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [animationPath]);

  // Control methods
  const play = useCallback(() => {
    lottieRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    lottieRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    lottieRef.current?.stop();
  }, []);

  const setSpeed = useCallback((speed: number) => {
    lottieRef.current?.setSpeed(speed);
  }, []);

  const goToAndPlay = useCallback((frame: number) => {
    lottieRef.current?.goToAndPlay(frame, true);
  }, []);

  const goToAndStop = useCallback((frame: number) => {
    lottieRef.current?.goToAndStop(frame, true);
  }, []);

  return {
    animationData,
    lottieRef,
    isLoading,
    error,
    play,
    pause,
    stop,
    setSpeed,
    goToAndPlay,
    goToAndStop,
  };
}

export default useLottie;
