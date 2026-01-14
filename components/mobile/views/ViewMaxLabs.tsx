"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MessageSquare, Bot, BookOpen, SlidersHorizontal } from "lucide-react";
import { CardGlass } from "@/components/mobile/HealthWidgets";
import { useAiConversation } from "@/hooks/domain/useAiConversation";
import { useChatConversation } from "@/hooks/domain/useChatConversation";
import { useChatAI } from "@/hooks/domain/useChatAI";
import { useMaxApi } from "@/hooks/domain/useMaxApi";
import type { ChatConversationRow } from "@/app/actions/chat-conversations";
import type { ConversationRow, RoleType } from "@/types/assistant";

interface ViewMaxLabsProps {
    onBack?: () => void;
}

export const ViewMaxLabs = ({ onBack }: ViewMaxLabsProps) => {
    const aiConversation = useAiConversation();
    const chatConversation = useChatConversation();
    const chatAI = useChatAI();
    const maxApi = useMaxApi();

    const [aiHistory, setAiHistory] = useState<ConversationRow[]>([]);
    const [aiRole, setAiRole] = useState<RoleType>("user");
    const [aiContent, setAiContent] = useState("");

    const [chatHistory, setChatHistory] = useState<ChatConversationRow[]>([]);
    const [chatRole, setChatRole] = useState<RoleType>("user");
    const [chatContent, setChatContent] = useState("");

    const [payloadJson, setPayloadJson] = useState("{\"message\":\"Hello\"}");
    const [chatAiResult, setChatAiResult] = useState<unknown | null>(null);
    const [papersQuery, setPapersQuery] = useState("stress");
    const [papersResult, setPapersResult] = useState<unknown | null>(null);

    const [maxPayload, setMaxPayload] = useState("{\"input\":\"sample\"}");
    const [maxResult, setMaxResult] = useState<unknown | null>(null);
    const [maxSettings, setMaxSettings] = useState("{}");

    const loadAiHistory = async () => {
        const data = await aiConversation.loadHistory(20);
        if (data) {
            setAiHistory(data);
        }
    };

    const saveAiMessage = async () => {
        if (!aiContent.trim()) return;
        const success = await aiConversation.saveMessage({ role: aiRole, content: aiContent });
        if (success) {
            setAiContent("");
            loadAiHistory();
        }
    };

    const loadChatHistory = async () => {
        const data = await chatConversation.loadHistory(20);
        if (data) {
            setChatHistory(data);
        }
    };

    const saveChatMessage = async () => {
        if (!chatContent.trim()) return;
        const success = await chatConversation.saveMessage({ role: chatRole, content: chatContent });
        if (success) {
            setChatContent("");
            loadChatHistory();
        }
    };

    const handleSendPayload = async () => {
        try {
            const payload = JSON.parse(payloadJson) as Record<string, unknown>;
            const result = await chatAI.sendPayload(payload);
            setChatAiResult(result);
        } catch (err) {
            setChatAiResult({ error: err instanceof Error ? err.message : "Invalid JSON" });
        }
    };

    const handleFetchPapers = async () => {
        const result = await chatAI.fetchPapers(papersQuery);
        setPapersResult(result);
    };

    const handleMaxAction = async (action: "response" | "belief" | "planChat" | "planReplace") => {
        try {
            const payload = JSON.parse(maxPayload) as Record<string, unknown>;
            const result =
                action === "response" ? await maxApi.getResponse(payload)
                    : action === "belief" ? await maxApi.submitBelief(payload)
                        : action === "planChat" ? await maxApi.planChat(payload)
                            : await maxApi.planReplace(payload);
            setMaxResult(result);
        } catch (err) {
            setMaxResult({ error: err instanceof Error ? err.message : "Invalid JSON" });
        }
    };

    const handleLoadSettings = async () => {
        const result = await maxApi.loadSettings();
        if (result) {
            setMaxSettings(JSON.stringify(result, null, 2));
        }
    };

    const handleSaveSettings = async () => {
        try {
            const payload = JSON.parse(maxSettings) as Record<string, unknown>;
            const result = await maxApi.saveSettings(payload);
            setMaxResult(result);
        } catch (err) {
            setMaxResult({ error: err instanceof Error ? err.message : "Invalid JSON" });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen pb-24 space-y-6"
        >
            <div className="flex items-center gap-4">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-stone-600 dark:text-stone-300" />
                    </button>
                )}
                <div>
                    <h2 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">Max Labs</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400">Conversation history + API tools</p>
                </div>
            </div>

            <CardGlass className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">AI Conversations</h3>
                </div>
                <div className="flex gap-2">
                    <select
                        value={aiRole}
                        onChange={(e) => setAiRole(e.target.value as RoleType)}
                        className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                    >
                        <option value="user">user</option>
                        <option value="assistant">assistant</option>
                    </select>
                    <input
                        value={aiContent}
                        onChange={(e) => setAiContent(e.target.value)}
                        placeholder="Message"
                        className="flex-1 px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                    />
                    <button
                        onClick={saveAiMessage}
                        className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
                    >
                        Save
                    </button>
                </div>
                <button
                    onClick={loadAiHistory}
                    className="w-full py-2 rounded-xl border border-emerald-200 text-emerald-600 text-sm font-semibold"
                >
                    Load History
                </button>
                {aiConversation.error && <div className="text-xs text-rose-500">{aiConversation.error}</div>}
                {aiHistory.length > 0 && (
                    <pre className="text-xs bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl overflow-x-auto">
                        {JSON.stringify(aiHistory, null, 2)}
                    </pre>
                )}
            </CardGlass>

            <CardGlass className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-sky-500" />
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Chat Conversations</h3>
                </div>
                <div className="flex gap-2">
                    <select
                        value={chatRole}
                        onChange={(e) => setChatRole(e.target.value as RoleType)}
                        className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                    >
                        <option value="user">user</option>
                        <option value="assistant">assistant</option>
                    </select>
                    <input
                        value={chatContent}
                        onChange={(e) => setChatContent(e.target.value)}
                        placeholder="Message"
                        className="flex-1 px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                    />
                    <button
                        onClick={saveChatMessage}
                        className="px-3 py-2 rounded-xl bg-sky-600 text-white text-sm font-semibold"
                    >
                        Save
                    </button>
                </div>
                <button
                    onClick={loadChatHistory}
                    className="w-full py-2 rounded-xl border border-sky-200 text-sky-600 text-sm font-semibold"
                >
                    Load History
                </button>
                {chatConversation.error && <div className="text-xs text-rose-500">{chatConversation.error}</div>}
                {chatHistory.length > 0 && (
                    <pre className="text-xs bg-sky-50 dark:bg-sky-900/20 p-3 rounded-xl overflow-x-auto">
                        {JSON.stringify(chatHistory, null, 2)}
                    </pre>
                )}
            </CardGlass>

            <CardGlass className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-violet-500" />
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Chat AI Payload</h3>
                </div>
                <textarea
                    value={payloadJson}
                    onChange={(e) => setPayloadJson(e.target.value)}
                    className="w-full min-h-[90px] px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-xs font-mono"
                />
                <button
                    onClick={handleSendPayload}
                    className="w-full py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold"
                >
                    Send Payload
                </button>
                {chatAI.error && <div className="text-xs text-rose-500">{chatAI.error}</div>}
                {chatAiResult && (
                    <pre className="text-xs bg-violet-50 dark:bg-violet-900/20 p-3 rounded-xl overflow-x-auto">
                        {JSON.stringify(chatAiResult, null, 2)}
                    </pre>
                )}
            </CardGlass>

            <CardGlass className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Research Papers</h3>
                </div>
                <div className="flex gap-2">
                    <input
                        value={papersQuery}
                        onChange={(e) => setPapersQuery(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-sm"
                    />
                    <button
                        onClick={handleFetchPapers}
                        className="px-3 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold"
                    >
                        Fetch
                    </button>
                </div>
                {papersResult && (
                    <pre className="text-xs bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl overflow-x-auto">
                        {JSON.stringify(papersResult, null, 2)}
                    </pre>
                )}
            </CardGlass>

            <CardGlass className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider">Max API</h3>
                </div>
                <textarea
                    value={maxPayload}
                    onChange={(e) => setMaxPayload(e.target.value)}
                    className="w-full min-h-[90px] px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-xs font-mono"
                />
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => handleMaxAction("response")}
                        className="py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                    >
                        Get Response
                    </button>
                    <button
                        onClick={() => handleMaxAction("belief")}
                        className="py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                    >
                        Submit Belief
                    </button>
                    <button
                        onClick={() => handleMaxAction("planChat")}
                        className="py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                    >
                        Plan Chat
                    </button>
                    <button
                        onClick={() => handleMaxAction("planReplace")}
                        className="py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                    >
                        Plan Replace
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={handleLoadSettings}
                        className="py-2 rounded-xl border border-emerald-200 text-emerald-600 text-xs font-semibold"
                    >
                        Load Settings
                    </button>
                    <button
                        onClick={handleSaveSettings}
                        className="py-2 rounded-xl border border-emerald-200 text-emerald-600 text-xs font-semibold"
                    >
                        Save Settings
                    </button>
                </div>
                <textarea
                    value={maxSettings}
                    onChange={(e) => setMaxSettings(e.target.value)}
                    className="w-full min-h-[90px] px-3 py-2 rounded-xl bg-stone-100 dark:bg-white/5 text-xs font-mono"
                />
                {maxApi.error && <div className="text-xs text-rose-500">{maxApi.error}</div>}
                {maxResult && (
                    <pre className="text-xs bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl overflow-x-auto">
                        {JSON.stringify(maxResult, null, 2)}
                    </pre>
                )}
            </CardGlass>
        </motion.div>
    );
};
