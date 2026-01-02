"use client";

import { useState } from "react";
import { useFeed } from "@/hooks/domain/useFeed";
import MobileFeed from "../Feed";
import { ViewArticleReader } from "./ViewArticleReader";
import { AnimatePresence } from "framer-motion";

export const ViewScience = () => {
    const feedHook = useFeed();
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
                    />
                )}
            </AnimatePresence>
        </>
    );
};
