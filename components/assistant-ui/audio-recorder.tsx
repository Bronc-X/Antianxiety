'use client';

import { useState, useRef, useEffect, FC } from 'react';
import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TooltipIconButton } from './tooltip-icon-button';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface AudioRecorderProps {
    onText: (text: string) => void;
    onStart?: () => void;
    className?: string;
    disabled?: boolean;
}

export const AudioRecorder: FC<AudioRecorderProps> = ({ onText, onStart, className, disabled }) => {
    const [duration, setDuration] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const onTextRef = useRef(onText);
    const {
        isSupported,
        isListening,
        interimTranscript,
        error,
        start,
        stop,
        reset,
    } = useSpeechRecognition({
        locale: 'zh-CN',
        continuous: true,
        interimResults: true,
        onResult: (text) => onTextRef.current(text),
    });
    // To avoid appending same text multiple times or handling complex cursor positions,
    // we will accumulate the session's transcript here and pass it out on stop or final results.
    // Actually, for "real-time" filling into composer, we'd need the parent to handle "update" vs "append".
    // For safety and simplicity in this integration: 
    // We will accumulate text in this component and call `onText` with the *delta* or *final segment*.
    // Let's modify the contract slightly: onText appends. So we only call onText when we have a 'final' result.

    // Keep ref generated with latest onText prop
    useEffect(() => {
        onTextRef.current = onText;
    }, [onText]);

    useEffect(() => {
        if (!isListening) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        const resetTimer = setTimeout(() => {
            setDuration(0);
        }, 0);
        timerRef.current = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);

        return () => {
            clearTimeout(resetTimer);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isListening]);

    useEffect(() => {
        if (!error) return;
        alert('语音识别失败，请检查麦克风权限。');
    }, [error]);

    useEffect(() => {
        return () => {
            stop().catch(() => {});
        };
    }, [stop]);

    const startRecording = async () => {
        if (onStart) onStart();
        if (!isSupported) {
            alert('您的浏览器或设备不支持语音识别。');
            return;
        }

        reset();
        await start();
    };

    const handleStop = () => {
        void stop();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isListening) {
        return (
            <div className={cn("flex items-center gap-2 rounded-full bg-red-500/10 px-2 py-1 transition-all duration-300", className)}>
                <span className="text-xs font-mono text-red-500 animate-pulse px-1 min-w-[30px] text-center">
                    {formatTime(duration)}
                </span>
                {/* Show interim text preview if available */}
                {interimTranscript && (
                    <span className="text-xs text-red-500/70 max-w-[100px] truncate hidden sm:inline-block">
                        {interimTranscript}
                    </span>
                )}
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-full text-red-500 hover:bg-red-500/20 hover:text-red-600"
                        onClick={handleStop}
                    >
                        <Square className="size-3 fill-current" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <TooltipIconButton
            tooltip="语音输入 (实时)"
            className={cn("text-white/70 hover:text-white transition-colors", className)}
            variant="ghost"
            onClick={startRecording}
            disabled={disabled}
        >
            <Mic className={cn("size-5", isListening && "text-red-500")} />
        </TooltipIconButton>
    );
};
