"use client";

import React, { useRef, useEffect } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  useAnimationFrame,
} from "framer-motion";

// Wrap utility function (replaces @motionone/utils dependency)
function wrap(min: number, max: number, v: number): number {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
}

// Mock news data with hacker/tech themes
const mockNews = [
  {
    id: 1,
    title: "Neural Networks Achieve Consciousness Threshold",
    category: "AI_RESEARCH",
    date: "2025.12.06",
  },
  {
    id: 2,
    title: "Quantum Encryption Protocol Breaks 4096-bit Barrier",
    category: "CRYPTOGRAPHY",
    date: "2025.12.05",
  },
  {
    id: 3,
    title: "Mitochondrial Optimization Through Gene Editing",
    category: "BIOTECH",
    date: "2025.12.05",
  },
  {
    id: 4,
    title: "Zero-Day Vulnerability Discovered in Global DNS",
    category: "SECURITY",
    date: "2025.12.04",
  },
  {
    id: 5,
    title: "Brain-Computer Interface Reaches 10Gbps Transfer",
    category: "NEUROTECH",
    date: "2025.12.04",
  },
  {
    id: 6,
    title: "Autonomous Systems Pass Turing Test Unanimously",
    category: "AI_ETHICS",
    date: "2025.12.03",
  },
  {
    id: 7,
    title: "Dark Matter Computing Enables Infinite Storage",
    category: "PHYSICS",
    date: "2025.12.03",
  },
  {
    id: 8,
    title: "Cellular Regeneration Protocol Reverses Aging",
    category: "LONGEVITY",
    date: "2025.12.02",
  },
];

// Hacker Loader Component
const HackerLoader = () => (
  <div className="flex items-center justify-center py-8">
    <svg
      className="animate-spin w-8 h-8 text-green-500"
      viewBox="0 0 24 24"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className="opacity-20"
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeDasharray="10 16"
        strokeLinecap="square"
      />
    </svg>
    <span className="ml-3 font-mono text-xs text-green-500/70">
      LOADING_FEED...
    </span>
  </div>
);

// Individual News Item with Dissolve Effect
interface HackerItemProps {
  title: string;
  category: string;
  date: string;
  index: number;
}

const HackerItem = ({ title, category, date, index }: HackerItemProps) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const [dissolveAmount, setDissolveAmount] = React.useState(0);

  useEffect(() => {
    const checkPosition = () => {
      if (!itemRef.current) return;
      
      const rect = itemRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const itemCenter = rect.top + rect.height / 2;
      
      // Calculate distance from viewport center
      const distanceFromCenter = Math.abs(itemCenter - viewportHeight / 2);
      const maxDistance = viewportHeight / 2;
      
      // Dissolve starts at 60% from center, full dissolve at edges
      const dissolveStart = maxDistance * 0.6;
      const dissolve = Math.max(0, (distanceFromCenter - dissolveStart) / (maxDistance - dissolveStart));
      
      setDissolveAmount(Math.min(1, dissolve));
    };

    const interval = setInterval(checkPosition, 50);
    return () => clearInterval(interval);
  }, []);

  // Generate dots string based on title length
  const dotsString = ".".repeat(Math.min(title.length * 2, 80));
  const hashString = "/".repeat(Math.min(title.length, 40));

  return (
    <div
      ref={itemRef}
      className="relative py-10 md:py-14 border-b border-gray-900/50 group overflow-hidden"
    >
      {/* The Text Layer (Fades out at edges) */}
      <motion.div
        className="relative z-10"
        style={{
          opacity: 1 - dissolveAmount * 0.9,
          filter: `blur(${dissolveAmount * 4}px)`,
        }}
      >
        <div className="font-mono text-xs text-green-500 mb-3 tracking-wider">
          <span className="text-green-500/50">[</span>
          {category}
          <span className="text-green-500/50">]</span>
          <span className="text-gray-600 mx-2">::</span>
          <span className="text-gray-500">{date}</span>
          <span className="text-green-500/30 ml-4">#{String(index).padStart(4, "0")}</span>
        </div>
        <h2
          className="text-3xl md:text-5xl lg:text-6xl text-white leading-[0.95] tracking-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {title}
        </h2>
      </motion.div>

      {/* The Dots Layer (Reveals at edges - The Matrix Effect) */}
      <motion.div
        className="absolute inset-0 flex flex-col justify-center pointer-events-none overflow-hidden"
        style={{
          opacity: dissolveAmount * 0.8,
        }}
      >
        <div
          className="font-mono text-green-500/40 text-lg md:text-xl tracking-[0.3em] break-all leading-relaxed"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {dotsString}
        </div>
        <div
          className="font-mono text-green-500/20 text-sm tracking-[0.5em] mt-2"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {hashString}
        </div>
      </motion.div>

      {/* Hover accent line */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-[2px] bg-green-500"
        initial={{ scaleY: 0 }}
        whileHover={{ scaleY: 1 }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
};

// Velocity-based Parallax Container
interface ParallaxProps {
  children: React.ReactNode;
  baseVelocity: number;
}

function ParallaxFeed({ children, baseVelocity = 1 }: ParallaxProps) {
  const baseY = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false,
  });

  const y = useTransform(baseY, (v) => `${wrap(-25, -75, v)}%`);

  const directionFactor = useRef<number>(1);

  useAnimationFrame((t, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

    // React to scroll velocity
    if (velocityFactor.get() < 0) {
      directionFactor.current = -1;
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = 1;
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get();

    baseY.set(baseY.get() + moveBy);
  });

  return (
    <div className="overflow-hidden">
      <motion.div className="flex flex-col" style={{ y }}>
        {children}
        {children}
        {children}
        {children}
      </motion.div>
    </div>
  );
}


// Main Component
export default function InfiniteHackerFeed() {
  return (
    <div
      className="relative min-h-screen bg-black overflow-hidden"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* Top gradient mask */}
      <div
        className="fixed top-0 left-0 right-0 h-32 z-20 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, #000000 0%, #000000 30%, transparent 100%)",
        }}
      />

      {/* Bottom gradient mask */}
      <div
        className="fixed bottom-0 left-0 right-0 h-32 z-20 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, #000000 0%, #000000 30%, transparent 100%)",
        }}
      />

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="font-mono text-xs text-green-500/70">
            <span className="text-green-500">&gt;</span> FEED_ACTIVE
          </div>
          <div className="font-mono text-xs text-gray-600">
            {new Date().toISOString().split("T")[0].replace(/-/g, ".")}
          </div>
        </div>
      </div>

      {/* Decorative side elements */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-10 hidden md:block">
        <div className="font-mono text-[10px] text-green-500/20 writing-mode-vertical transform -rotate-180">
          {"STREAM::VELOCITY::ACTIVE".split("").join(" ")}
        </div>
      </div>

      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-10 hidden md:block">
        <div className="font-mono text-[10px] text-green-500/20 writing-mode-vertical">
          {"DATA::FLOW::ENCRYPTED".split("").join(" ")}
        </div>
      </div>

      {/* Main Feed Container */}
      <div className="relative z-10 px-6 md:px-12 lg:px-20 pt-20 pb-32 max-w-5xl mx-auto">
        <ParallaxFeed baseVelocity={-0.5}>
          {mockNews.map((item, index) => (
            <HackerItem
              key={`${item.id}-${index}`}
              title={item.title}
              category={item.category}
              date={item.date}
              index={item.id}
            />
          ))}
        </ParallaxFeed>
      </div>

      {/* Loader at bottom */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30">
        <HackerLoader />
      </div>

      {/* Scanline effect overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-40 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.1) 2px, rgba(0, 255, 0, 0.1) 4px)",
        }}
      />

      {/* Corner decorations */}
      <div className="fixed top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-green-500/20 z-30" />
      <div className="fixed top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-green-500/20 z-30" />
      <div className="fixed bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-green-500/20 z-30" />
      <div className="fixed bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-green-500/20 z-30" />

      {/* Global styles for vertical text */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap");

        .writing-mode-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
    </div>
  );
}
