'use client';

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

interface Card {
    id: number | string;
    content: React.ReactNode;
    color?: string;
}

interface CardStackProps {
    items: Card[];
    offset?: number;
    scaleFactor?: number;
}

export default function CardStack({
    items,
    offset = 10,
    scaleFactor = 0.06,
}: CardStackProps) {
    const [cards, setCards] = useState<Card[]>(items);

    const removeCard = (id: number | string) => {
        setCards((prev) => prev.filter((item) => item.id !== id));
    };

    return (
        <div className="relative h-60 w-60 md:h-96 md:w-96">
            {cards.map((card, index) => {
                return (
                    <Card
                        key={card.id}
                        card={card}
                        index={index}
                        total={cards.length}
                        removeCard={removeCard}
                        offset={offset}
                        scaleFactor={scaleFactor}
                    />
                );
            })}
        </div>
    );
}

function Card({
    card,
    index,
    total,
    removeCard,
    offset,
    scaleFactor,
}: {
    card: Card;
    index: number;
    total: number;
    removeCard: (id: number | string) => void;
    offset: number;
    scaleFactor: number;
}) {
    const x = useMotionValue(0);
    const opacity = useTransform(x, [-200, 0, 200], [0, 1, 0]);
    const rotate = useTransform(x, [-200, 200], [-18, 18]);

    // Calculate stacking position
    const isFront = index === 0;
    const zIndex = total - index;

    // Stacking transform
    // We make cards appear "behind" by scaling them down and moving them down (or up).
    // "Peeking out": We want to see the top/bottom of cards behind. 
    // Let's create a clear visual stack descending.
    const currentScale = 1 - index * scaleFactor;
    const currentY = index * (offset * 1.5); // Increase offset for better visibility
    const currentOpacity = 1 - index * 0.1; // Less aggressive opacity fade

    function handleDragEnd(_: any, info: PanInfo) {
        if (Math.abs(info.offset.x) > 100) {
            removeCard(card.id);
        }
    }

    return (
        <motion.div
            style={{
                zIndex,
                x: isFront ? x : 0,
                opacity: isFront ? opacity : currentOpacity,
                rotate: isFront ? rotate : 0, // Only front card rotates on drag; background cards could have random rotation if desired, but keeping straight is cleaner.
                scale: isFront ? 1 : currentScale,
                y: currentY,
                transformOrigin: 'top center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // Add consistent shadow
            }}
            drag={isFront ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            animate={{
                scale: isFront ? 1 : currentScale,
                y: currentY,
                opacity: isFront ? 1 : currentOpacity,
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className={`absolute top-0 left-0 h-full w-full rounded-2xl border border-[#E7E1D6] p-8 flex flex-col justify-center items-center text-center cursor-grab active:cursor-grabbing hover:shadow-xl transition-shadow bg-white`}
        >
            <div className="absolute top-2 right-4 text-xs font-mono text-gray-300">#{index + 1}</div>
            {card.content}
        </motion.div>
    );
}
