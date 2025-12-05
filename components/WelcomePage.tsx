"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ImageComparisonSlider from "./ImageComparisonSlider";
import { motion } from "framer-motion";

export default function WelcomePage() {
  const router = useRouter();
  const [isActivated, setIsActivated] = useState(false);
  const [imageId, setImageId] = useState<number | null>(null);
  const [sliderProgress, setSliderProgress] = useState(0);

  // 组件挂载时生成随机图片ID，确保黑白和彩色是同一张图
  useEffect(() => {
    const randomId = Math.floor(Math.random() * 1000) + 1;
    setImageId(randomId);
  }, []);

  // 使用固定 seed 确保同一张图片的黑白和彩色版本
  const imgBw = imageId ? `https://picsum.photos/seed/${imageId}/800/450?grayscale` : "";
  const imgColor = imageId ? `https://picsum.photos/seed/${imageId}/800/450` : "";

  const handleActivation = () => {
    setIsActivated(true);

    // 1. 播放音效
    const audio = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"
    );
    audio.volume = 0.5;
    audio.play().catch((e) => console.log("Audio play failed", e));

    // 2. 延迟后跳转到 Landing
    setTimeout(() => {
      router.push("/landing");
    }, 1800);
  };

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-1000 overflow-hidden bg-[#FAF6EF]"
    >
      {/* 科技波点背景 - 随滑动变化 */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="tech-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle 
                cx="20" 
                cy="20" 
                r="1.5" 
                fill="#0B3D2E"
                opacity={0.1 + sliderProgress * 0.3}
              />
            </pattern>
            <radialGradient id="dot-fade" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0B3D2E" stopOpacity={0.2 + sliderProgress * 0.3} />
              <stop offset="100%" stopColor="#0B3D2E" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#tech-dots)" />
          <circle 
            cx="50%" 
            cy="50%" 
            r="40%" 
            fill="url(#dot-fade)"
            style={{ transform: `scale(${0.8 + sliderProgress * 0.4})`, transformOrigin: 'center' }}
          />
        </svg>
      </div>

      {/* 背景氛围光：激活时爆发 */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${
          isActivated ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-[#E8DFD0] via-[#9CAF88] to-[#C4A77D] rounded-full blur-[100px] opacity-60" />
      </div>

      <div className="z-10 w-full max-w-2xl flex flex-col items-center space-y-8">
        {/* 标题文案变化 */}
        <div className="text-center space-y-2">
          <motion.h1
            layout
            className="text-3xl md:text-4xl font-bold transition-colors duration-700"
            style={{ 
              color: isActivated ? '#0B3D2E' : '#E8DFD0',
              WebkitTextFillColor: isActivated ? '#0B3D2E' : '#E8DFD0'
            }}
          >
            {isActivated ? "Energy Restored." : "Make it Boring"}
          </motion.h1>
          <motion.p
            layout
            className="text-sm md:text-base transition-colors duration-700"
            style={{ 
              color: isActivated ? 'rgba(11, 61, 46, 0.7)' : '#C4A77D'
            }}
          >
            {isActivated
              ? "Welcome back. Your dashboard is ready."
              : "Slide across to clear the noise and begin."}
          </motion.p>
        </div>

        {/* 核心组件 */}
        <motion.div
          layout
          className="w-full"
          animate={isActivated ? { y: 20, scale: 1.05 } : { y: 0, scale: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <ImageComparisonSlider
            beforeImage={imgBw}
            afterImage={imgColor}
            onComplete={handleActivation}
            onProgressChange={setSliderProgress}
          />
        </motion.div>
      </div>
    </div>
  );
}
