"use client";

import { useState } from "react";
import { useFeed } from "@/hooks/domain/useFeed";
import { useI18n } from "@/lib/i18n";
import MobileFeed from "../Feed";
import { ViewArticleReader } from "./ViewArticleReader";
import { AnimatePresence } from "framer-motion";

export const ViewScience = () => {
    const { language } = useI18n();
    const feedLanguage = language === "en" ? "en" : "zh";
    const feedHook = useFeed({ language: feedLanguage, cacheDaily: true, cacheNamespace: "mobile-science-feed" });
    const [readingId, setReadingId] = useState<string | null>(null);

    // Proxy the read function to intercept the click and show the reader
    const proxiedFeed = {
        ...feedHook,
        read: (id: string) => {
            feedHook.read(id);
            setReadingId(id);
        }
    };

    const activeArticle = readingId ? feedHook.items.find(i => i.id === readingId) : null;

    return (
        <>
            <MobileFeed feed={proxiedFeed} />
            <AnimatePresence>
                {activeArticle && (
                    <ViewArticleReader
                        article={activeArticle}
                        onClose={() => setReadingId(null)}
                        onSave={feedHook.save}
                        onFeedback={feedHook.feedback}
                    />
                )}
            </AnimatePresence>
        </>
    );
};
