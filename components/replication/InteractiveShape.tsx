"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

export default function InteractiveShape() {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth spring animation for mouse movement
    const mouseX = useSpring(x, { stiffness: 50, damping: 20 });
    const mouseY = useSpring(y, { stiffness: 50, damping: 20 });

    // Parallax transform for different layers
    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["15deg", "-15deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-15deg", "15deg"]);

    const layer1X = useTransform(mouseX, [-0.5, 0.5], [-20, 20]);
    const layer1Y = useTransform(mouseY, [-0.5, 0.5], [-20, 20]);

    const layer2X = useTransform(mouseX, [-0.5, 0.5], [30, -30]);
    const layer2Y = useTransform(mouseY, [-0.5, 0.5], [30, -30]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Normalize mouse position from -0.5 to 0.5
            const rect = document.body.getBoundingClientRect();
            const normX = (e.clientX - rect.left) / rect.width - 0.5;
            const normY = (e.clientY - rect.top) / rect.height - 0.5;
            x.set(normX);
            y.set(normY);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [x, y]);

    return (
        <div className="relative w-64 h-64 flex items-center justify-center perspective-1000">
            <motion.div
                style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                className="relative w-48 h-48"
            >
                {/* Main Orb - Gradient Sphere */}
                <motion.div
                    style={{ x: layer1X, y: layer1Y, z: 50 }}
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-300 via-emerald-400 to-violet-400 opacity-80 blur-xl"
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.8, 0.6, 0.8]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                {/* Glass Card 1 - Foreground */}
                <motion.div
                    style={{ x: layer2X, y: layer2Y, z: 100 }}
                    className="absolute md:-right-8 top-4 w-24 h-24 rounded-[2rem] bg-white/30 backdrop-blur-lg border border-white/50 shadow-xl"
                    animate={{
                        rotate: [0, 10, 0],
                        y: [0, -10, 0]
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                    }}
                />

                {/* Glass Card 2 - Background/Bottom */}
                <motion.div
                    style={{ x: layer1X, y: layer1Y, z: 20 }}
                    className="absolute -left-4 -bottom-4 w-32 h-32 rounded-full bg-indigo-300/30 backdrop-blur-md border border-white/20"
                    animate={{
                        scale: [1, 1.05, 1],
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                {/* Floating Ring */}
                <motion.div
                    className="absolute -inset-8 rounded-full border-2 border-white/20 border-dashed"
                    style={{ rotateX: 60, rotateY, z: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />

                {/* Central Core */}
                <div className="absolute inset-8 rounded-full bg-white/80 shadow-inner blur-sm z-10" />
            </motion.div>
        </div>
    );
}
