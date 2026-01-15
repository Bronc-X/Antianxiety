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
  void options;
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [loadedPath, setLoadedPath] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<{ path: string; error: Error } | null>(null);
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);
  const error = errorState?.path === animationPath ? errorState.error : null;
  const isLoading = loadedPath !== animationPath && error === null;

  // Load animation data
  useEffect(() => {
    let isMounted = true;

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
          setLoadedPath(animationPath);
          setErrorState(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setAnimationData(null);
          setLoadedPath(animationPath);
          setErrorState({
            path: animationPath,
            error: err instanceof Error ? err : new Error(String(err)),
          });
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
