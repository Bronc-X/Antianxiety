"use client";

/**
 * useMax Runtime Adapter for assistant-ui
 * 
 * Bridges the useMax domain hook with assistant-ui's runtime system.
 */

import { useMemo } from "react";
import {
    useExternalStoreRuntime,
    ThreadMessageLike,
    AppendMessage,
    CompositeAttachmentAdapter,
    SimpleImageAttachmentAdapter,
} from "@assistant-ui/react";
import type { LocalMessage, UseMaxReturn } from "@/hooks/domain/useMax";

/**
 * Convert useMax messages to assistant-ui format
 */
function convertToThreadMessages(messages: LocalMessage[]): ThreadMessageLike[] {
    return messages
        .filter((msg) => (msg.role === "user" || msg.role === "assistant") && msg.content)
        .map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: [{ type: "text" as const, text: msg.content || "" }],
            attachments: msg.attachments?.map((a, idx) => ({
                id: `att-${msg.id}-${idx}`,
                type: 'image' as const,
                name: a.name || 'Image',
                contentType: a.contentType || 'image/jpeg',
                status: { type: "complete" } as const,
                file: undefined, // Local file not available from history
                content: [],
                url: a.url
            })),
            createdAt: msg.created_at ? new Date(msg.created_at) : undefined,
        }));
}

/**
 * Create assistant-ui runtime from useMax hook
 */
export function useMaxRuntime(maxHook: UseMaxReturn) {
    const {
        messages,
        isSending,
        sendMessage,
    } = maxHook;

    const threadMessages = useMemo(
        () => convertToThreadMessages(messages),
        [messages]
    );

    const onNew = async (message: AppendMessage) => {
        if (message.content.length === 0 && (!message.attachments || message.attachments.length === 0)) return;

        // Extract text content
        const textContent = message.content
            .filter((part): part is { type: "text"; text: string } => part.type === "text")
            .map((part) => part.text)
            .join("\n");

        // Extract files from attachments
        const files: File[] = [];
        if (message.attachments) {
            message.attachments.forEach(att => {
                if (att.file) {
                    files.push(att.file);
                }
            });
        }

        if (textContent.trim() || files.length > 0) {
            await sendMessage(textContent, files, "zh");
        }
    };

    const runtime = useExternalStoreRuntime({
        isRunning: isSending,
        messages: threadMessages,
        onNew,
        onCancel: maxHook.stopGeneration,
        convertMessage: (msg) => msg,
        adapters: {
            attachments: new CompositeAttachmentAdapter([
                new SimpleImageAttachmentAdapter(),
            ]),
        },
    });

    return runtime;
}
