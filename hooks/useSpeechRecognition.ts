'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

type SpeechPermissionStatus = 'granted' | 'denied' | 'prompt';

interface SpeechRecognitionPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  requestPermissions(): Promise<{ speech: SpeechPermissionStatus; microphone: SpeechPermissionStatus }>;
  startListening(options: { locale?: string; partialResults?: boolean; onDevice?: boolean }): Promise<void>;
  stopListening(): Promise<{ transcript?: string }>;
  cancelListening(): Promise<void>;
}

const SpeechRecognition = registerPlugin<SpeechRecognitionPlugin>('SpeechRecognition');

export interface UseSpeechRecognitionOptions {
  locale?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (text: string) => void;
  onPartial?: (text: string) => void;
  onError?: (message: string) => void;
}

export interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  error: string | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  reset: () => void;
}

function appendTranscript(base: string, next: string): string {
  const trimmed = next.trim();
  if (!trimmed) return base;
  if (!base) return trimmed;
  return `${base} ${trimmed}`.trim();
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const { locale = 'zh-CN', continuous = false, interimResults = true } = options;
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isNative = Capacitor.isNativePlatform();

  const onResultRef = useRef(options.onResult);
  const onPartialRef = useRef(options.onPartial);
  const onErrorRef = useRef(options.onError);

  useEffect(() => {
    onResultRef.current = options.onResult;
  }, [options.onResult]);

  useEffect(() => {
    onPartialRef.current = options.onPartial;
  }, [options.onPartial]);

  useEffect(() => {
    onErrorRef.current = options.onError;
  }, [options.onError]);

  useEffect(() => {
    if (isNative) {
      let handles: PluginListenerHandle[] = [];
      let cancelled = false;

      const setup = async () => {
        try {
          const availability = await SpeechRecognition.isAvailable();
          if (cancelled) return;
          setIsSupported(Boolean(availability?.available));
        } catch {
          if (cancelled) return;
          setIsSupported(false);
        }

        const partialHandle = await SpeechRecognition.addListener(
          'speechPartial',
          (event: { text?: string }) => {
            const text = event?.text ?? '';
            setInterimTranscript(text);
            onPartialRef.current?.(text);
          }
        );

        const finalHandle = await SpeechRecognition.addListener(
          'speechFinal',
          (event: { text?: string }) => {
            const text = event?.text ?? '';
            setFinalTranscript((prev) => appendTranscript(prev, text));
            setInterimTranscript('');
            setIsListening(false);
            if (text) {
              onResultRef.current?.(text);
            }
          }
        );

        const errorHandle = await SpeechRecognition.addListener(
          'speechError',
          (event: { message?: string }) => {
            const message = event?.message ?? 'Speech recognition failed';
            setError(message);
            setIsListening(false);
            onErrorRef.current?.(message);
          }
        );

        handles = [partialHandle, finalHandle, errorHandle];
      };

      setup();

      return () => {
        cancelled = true;
        handles.forEach((handle) => handle.remove());
      };
    }

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(Boolean(SpeechRecognitionCtor));

    if (!SpeechRecognitionCtor) {
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = locale;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? '';
        if (result.isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (final) {
        setFinalTranscript((prev) => appendTranscript(prev, final));
        setInterimTranscript('');
        onResultRef.current?.(final);
      }

      if (interim) {
        setInterimTranscript(interim);
        onPartialRef.current?.(interim);
      }
    };

    recognition.onerror = (event: { error?: string }) => {
      const message = event?.error
        ? `Speech recognition error: ${event.error}`
        : 'Speech recognition error';
      setError(message);
      setIsListening(false);
      onErrorRef.current?.(message);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, [continuous, interimResults, isNative, locale]);

  const start = useCallback(async () => {
    if (!isSupported || isListening) {
      return;
    }

    setError(null);
    setFinalTranscript('');
    setInterimTranscript('');
    setIsListening(true);

    if (isNative) {
      try {
        const permission = await SpeechRecognition.requestPermissions();
        const speechAllowed = permission?.speech === 'granted';
        const micAllowed = permission?.microphone === 'granted';

        if (!speechAllowed || !micAllowed) {
          setIsListening(false);
          setError('Speech recognition permission denied');
          return;
        }

        await SpeechRecognition.startListening({
          locale,
          partialResults: interimResults,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Speech recognition failed to start';
        setIsListening(false);
        setError(message);
        onErrorRef.current?.(message);
      }
      return;
    }

    try {
      recognitionRef.current?.start();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Speech recognition failed to start';
      setIsListening(false);
      setError(message);
      onErrorRef.current?.(message);
    }
  }, [interimResults, isListening, isNative, isSupported, locale]);

  const stop = useCallback(async () => {
    if (!isListening) {
      return;
    }

    if (isNative) {
      try {
        const result = await SpeechRecognition.stopListening();
        if (result?.transcript) {
          setFinalTranscript((prev) => appendTranscript(prev, result.transcript ?? ''));
        }
      } catch (err) {
        console.warn('Failed to stop speech recognition:', err);
      } finally {
        setIsListening(false);
        setInterimTranscript('');
      }
      return;
    }

    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimTranscript('');
  }, [isListening, isNative]);

  const reset = useCallback(() => {
    setFinalTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  const transcript = finalTranscript + (interimTranscript ? ` ${interimTranscript}` : '');

  return {
    isSupported,
    isListening,
    transcript: transcript.trim(),
    interimTranscript,
    finalTranscript,
    error,
    start,
    stop,
    reset,
  };
}
