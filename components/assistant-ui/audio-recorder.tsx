'use client';

import { useState, useRef, useEffect, FC } from 'react';
import { Mic, Square, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TooltipIconButton } from './tooltip-icon-button';
import { cn } from '@/lib/utils';

interface AudioRecorderProps {
    onText: (text: string) => void;
    onStart?: () => void;
    className?: string;
    disabled?: boolean;
}

export const AudioRecorder: FC<AudioRecorderProps> = ({ onText, onStart, className, disabled }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [interimText, setInterimText] = useState('');

    const recognitionRef = useRef<any>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const onTextRef = useRef(onText);
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
        return () => {
            stopRecordingService();
        };
    }, []);

    const startRecording = () => {
        if (onStart) onStart();

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("您的浏览器不支持语音识别，请尝试使用 Chrome 或 Edge。");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'zh-CN'; // Default to Chinese

        recognition.onstart = () => {
            setIsRecording(true);
            setDuration(0);
            setInterimText('');
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        };

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let currentInterim = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    currentInterim += event.results[i][0].transcript;
                }
            }

            // If we have final text, push it to composer immediately
            // Use ref to call latest prop
            if (finalTranscript) {
                onTextRef.current(finalTranscript);
            }

            setInterimText(currentInterim);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            if (event.error === 'not-allowed') {
                alert('无法访问麦克风，请检查权限。');
            }
            stopRecordingService();
        };

        recognition.onend = () => {
            // If stopped naturally or error, ensure state is clean.
            // If we wanted "always listening", we'd restart here. 
            // But for this UI, stopping is expected.
            if (isRecording) {
                // This handles case where it stops by itself (e.g. silence)
                setIsRecording(false);
                if (timerRef.current) clearInterval(timerRef.current);
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopRecordingService = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsRecording(false);
        setInterimText('');
    };

    const handleStop = () => {
        // Force stop (will trigger onresult/onend)
        stopRecordingService();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isRecording) {
        return (
            <div className={cn("flex items-center gap-2 rounded-full bg-red-500/10 px-2 py-1 transition-all duration-300", className)}>
                <span className="text-xs font-mono text-red-500 animate-pulse px-1 min-w-[30px] text-center">
                    {formatTime(duration)}
                </span>
                {/* Show interim text preview if available */}
                {interimText && (
                    <span className="text-xs text-red-500/70 max-w-[100px] truncate hidden sm:inline-block">
                        {interimText}
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
            <Mic className={cn("size-5", isRecording && "text-red-500")} />
        </TooltipIconButton>
    );
};
