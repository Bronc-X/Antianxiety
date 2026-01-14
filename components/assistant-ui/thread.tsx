"use client";

/**
 * Assistant-UI Thread Component
 * 
 * Green-themed chat interface using assistant-ui primitives.
 * Color scheme based on user's gradient image:
 * - Primary: #4ADE80 (bright green)
 * - Background: #0B3D2E (deep green)
 */

import { MarkdownText } from "./markdown-text";
import { TooltipIconButton } from "./tooltip-icon-button";
import { ThinkingProcess } from "./thinking-process";
import { ImageUploadButton, ImagePreviewList } from "./image-upload";
import { AudioRecorder } from "./audio-recorder";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
    ActionBarPrimitive,
    ComposerPrimitive,
    MessagePrimitive,
    ThreadPrimitive,
    useComposer,
    useComposerRuntime,
    useThreadRuntime,
} from "@assistant-ui/react";
import {
    ArrowDown,
    ArrowUp,
    Check,
    Copy,
    Square,
} from "lucide-react";
import type { FC } from "react";

// Props for starter questions
interface ThreadProps {
    starterQuestions?: string[];
    onSuggestionClick?: (question: string) => void;
}

export const Thread: FC<ThreadProps> = ({ starterQuestions = [], onSuggestionClick }) => {
    return (
        <ThreadPrimitive.Root
            className="aui-root aui-thread-root flex h-full flex-col"
            style={{
                ["--thread-max-width" as string]: "48rem",
                ["--aui-primary" as string]: "#4ADE80",
                ["--aui-primary-foreground" as string]: "#052E16",
            }}
        >
            <ThreadPrimitive.Viewport turnAnchor="bottom"
                className="aui-thread-viewport relative flex flex-1 flex-col overflow-y-auto scroll-smooth px-8 pt-8"
            >
                <ThreadPrimitive.Empty>
                    <ThreadWelcome starterQuestions={starterQuestions} onSuggestionClick={onSuggestionClick} />
                </ThreadPrimitive.Empty>

                <ThreadPrimitive.Messages
                    components={{
                        UserMessage,
                        AssistantMessage,
                    }}
                />

                <ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer sticky bottom-0 mx-auto mt-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 overflow-visible pb-4 pt-2">
                    <ThreadScrollToBottom />
                    <Composer />
                </ThreadPrimitive.ViewportFooter>
            </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
    );
};

const ThreadScrollToBottom: FC = () => {
    return (
        <ThreadPrimitive.ScrollToBottom asChild>
            <TooltipIconButton
                tooltip="滚动到底部"
                variant="outline"
                className="aui-thread-scroll-to-bottom absolute -top-10 z-10 self-center rounded-full border-white/10 bg-black/20 p-3 text-white/70 hover:bg-black/40 hover:text-white disabled:invisible backdrop-blur-sm"
            >
                <ArrowDown className="size-4" />
            </TooltipIconButton>
        </ThreadPrimitive.ScrollToBottom>
    );
};

interface ThreadWelcomeProps {
    starterQuestions?: string[];
    onSuggestionClick?: (question: string) => void;
}

const ThreadWelcome: FC<ThreadWelcomeProps> = ({ starterQuestions = [], onSuggestionClick }) => {
    return (
        <div className="aui-thread-welcome-root mx-auto my-auto flex w-full max-w-[var(--thread-max-width)] grow flex-col">
            <div className="aui-thread-welcome-center flex w-full grow flex-col items-center justify-center">
                {/* Max Avatar */}
                {/* Max Avatar */}
                <div className="relative mb-6 size-24">
                    {/* Deep Breathing Glow - Extended Blur */}
                    <div className="absolute inset-[-50%] z-0 rounded-full bg-[#4ADE80] animate-pulse blur-3xl opacity-50" style={{ animationDuration: '4s' }} />

                    {/* Image Container - Aggressive Crop */}
                    <div className="relative z-10 size-full overflow-hidden rounded-full shadow-2xl">
                        <Image
                            src="/max-avatar.png"
                            alt="Max"
                            width={96}
                            height={96}
                            /* Scale up to 1.8 to ensure NO white border remains. */
                            className="size-full object-cover scale-[1.8]"
                            priority
                        />
                    </div>
                </div>

                <h1 className="aui-thread-welcome-message mb-2 text-2xl font-semibold text-white">
                    Hello, I&apos;m Max.
                </h1>
                <p className="text-lg text-white/50">
                    需要我为你做些什么？
                </p>
            </div>

            {/* Starter Suggestions */}
            {starterQuestions.length > 0 && (
                <div className="aui-thread-welcome-suggestions mt-8 grid w-full grid-cols-1 gap-2 pb-4 md:grid-cols-2">
                    {starterQuestions.slice(0, 4).map((question, index) => (
                        <button
                            key={index}
                            onClick={() => onSuggestionClick?.(question)}
                            className="flex h-auto w-full items-start justify-start gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            {question}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const Composer: FC = () => {
    return (
        <ComposerPrimitive.Root className="aui-composer-root relative flex w-full flex-col gap-2">
            <ComposerAttachments />
            <div className="relative flex w-full items-end gap-2 rounded-3xl bg-black/20 px-4 py-3 shadow-sm transition-colors focus-within:bg-black/30 backdrop-blur-md">
                <ComposerPrimitive.Input
                    placeholder="问问 Max..."
                    className="aui-composer-input min-h-[24px] w-full flex-1 resize-none bg-transparent !bg-transparent text-base text-white !text-white placeholder:text-white/50 focus:outline-none !border-none !ring-0 !shadow-none"
                    rows={1}
                    autoFocus
                />
                <ComposerAction />
            </div>
        </ComposerPrimitive.Root>
    );
};

const ComposerAttachments: FC = () => {
    const composer = useComposerRuntime();
    const attachments = useComposer((s) => s.attachments);

    return (
        <ImagePreviewList
            files={attachments.map(a => a.file).filter((f): f is File => !!f)}
            onRemove={(index) => {
                const attachment = attachments[index];
                if (attachment) composer.removeAttachment(attachment.id);
            }}
        />
    );
};

const ComposerAction: FC = () => {
    const composer = useComposerRuntime();
    const thread = useThreadRuntime();
    const currentText = useComposer(s => s.text);

    return (
        <div className="aui-composer-action-wrapper flex items-center gap-1">
            <AudioRecorder
                onText={(text) => composer.setText(currentText + (currentText ? " " : "") + text)}
                onStart={() => thread.cancelRun()}
            />
            <ThreadPrimitive.If running={false}>
                <ImageUploadButton
                    onFilesSelected={(files) => files.forEach(file => composer.addAttachment(file))}
                />
                <ComposerPrimitive.Send asChild>
                    <Button
                        type="submit"
                        size="icon"
                        className="aui-composer-send size-9 rounded-full bg-white text-[#0B3D2E] hover:bg-white/90"
                    >
                        <ArrowUp className="size-4" />
                    </Button>
                </ComposerPrimitive.Send>
            </ThreadPrimitive.If>
            <ThreadPrimitive.If running>
                <ComposerPrimitive.Cancel asChild>
                    <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="aui-composer-cancel size-9 rounded-full"
                    >
                        <Square className="size-3 fill-current" />
                    </Button>
                </ComposerPrimitive.Cancel>
            </ThreadPrimitive.If>
        </div>
    );
};

// BranchPicker usages removed

const AssistantMessage: FC = () => {
    return (
        <MessagePrimitive.Root
            className="aui-assistant-message-root relative mx-auto grid w-full max-w-[var(--thread-max-width)] grid-cols-[auto_1fr] gap-4 py-4"
        >
            {/* Avatar Column */}
            <div className="pt-0.5">
                <div className="relative size-10">
                    {/* Breathing/Pulse Effect - Scaled down version of Welcome */}
                    <ThreadPrimitive.If running>
                        <div className="absolute inset-[-50%] z-0 rounded-full bg-[#4ADE80] animate-pulse blur-lg opacity-60" style={{ animationDuration: '2s' }} />
                    </ThreadPrimitive.If>

                    <div className="relative size-full overflow-hidden rounded-full shadow-sm">
                        <Image
                            src="/max-avatar.png"
                            alt="Max"
                            width={40}
                            height={40}
                            className="size-full object-cover scale-[1.8]"
                        />
                    </div>
                </div>
            </div>

            {/* Content Column */}
            <div className="min-w-0 flex-1">
                <div className="aui-assistant-message-content text-white/90 text-sm leading-8 tracking-wide">
                    <MessagePrimitive.Content
                        components={{
                            Text: MarkdownText,
                        }}
                    />

                    {/* Thinking Indicator - Controlled by CSS (:empty selector in globals.css) */}
                    <ThreadPrimitive.If running>
                        <div className="thinking-indicator-container mt-4 w-full">
                            <ThinkingProcess />
                        </div>
                    </ThreadPrimitive.If>
                </div>
                <div className="aui-assistant-message-footer mt-3 flex">
                    <AssistantActionBar />
                </div>
            </div>
        </MessagePrimitive.Root>
    );
};

const AssistantActionBar: FC = () => {
    return (
        <ActionBarPrimitive.Root
            hideWhenRunning
            autohide="not-last"
            className="aui-assistant-action-bar-root flex gap-1 text-white/50"
        >
            <ActionBarPrimitive.Copy asChild>
                <TooltipIconButton tooltip="复制" className="hover:text-white">
                    <MessagePrimitive.If copied>
                        <Check className="size-4" />
                    </MessagePrimitive.If>
                    <MessagePrimitive.If copied={false}>
                        <Copy className="size-4" />
                    </MessagePrimitive.If>
                </TooltipIconButton>
            </ActionBarPrimitive.Copy>
        </ActionBarPrimitive.Root>
    );
};

const UserMessage: FC = () => {
    return (
        <MessagePrimitive.Root
            className="aui-user-message-root mx-auto grid w-full max-w-[var(--thread-max-width)] auto-rows-auto grid-cols-[1fr_auto] gap-y-2 py-4"
        >
            <div className="aui-user-message-content col-start-2 flex flex-col items-end gap-2">
                <MessagePrimitive.Attachments components={{
                    Image: ({ src }) => (
                        <div className="relative mb-1 h-32 w-32 overflow-hidden rounded-xl border border-white/20 bg-black/20">
                            <Image src={src} alt="Attachment" width={128} height={128} className="h-full w-full object-cover" />
                        </div>
                    )
                }} />
                <div className="rounded-2xl bg-[#4ADE80]/30 border border-[#4ADE80]/20 px-4 py-2.5 text-white shadow-sm">
                    <MessagePrimitive.Content />
                </div>
            </div>
        </MessagePrimitive.Root>
    );
};

export default Thread;
