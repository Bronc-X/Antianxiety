"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { useMousePosition } from "@/hooks/useMousePosition";

export default function CursorEffects() {
    const mousePosition = useMousePosition();
    const [isHovering, setIsHovering] = useState(false);

    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    const springConfig = { damping: 25, stiffness: 700 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);

    useEffect(() => {
        cursorX.set(mousePosition.x - 16);
        cursorY.set(mousePosition.y - 16);
    }, [mousePosition, cursorX, cursorY]);

    useEffect(() => {
        const handleMouseOver = (e: MouseEvent) => {
            if ((e.target as HTMLElement).tagName === "A" ||
                (e.target as HTMLElement).tagName === "BUTTON" ||
                (e.target as HTMLElement).closest("a") ||
                (e.target as HTMLElement).closest("button")) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        document.addEventListener("mouseover", handleMouseOver);
        return () => document.removeEventListener("mouseover", handleMouseOver);
    }, []);

    return (
        <>
            {/* Main Cursor Dot */}
            <motion.div
                className="fixed top-0 left-0 w-4 h-4 rounded-full pointer-events-none z-[9999] mix-blend-difference"
                style={{
                    x: cursorXSpring,
                    y: cursorYSpring,
                    backgroundColor: "white",
                    scale: isHovering ? 2.0 : 0.8,
                    opacity: 0.9,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
            />

            {/* Trailing Particle Effect (Subtle) */}
            <motion.div
                className="fixed top-0 left-0 w-4 h-4 rounded-full pointer-events-none z-[9998]"
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: 8,
                    translateY: 8,
                    backgroundColor: "rgba(212, 175, 55, 0.5)", // Gold tint
                    filter: "blur(8px)",
                }}
                animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
        </>
    );
}
