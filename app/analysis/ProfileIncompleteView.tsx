'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';

interface ProfileIncompleteViewProps {
  missingFields: string[];
  completedFields: string[];
}

export default function ProfileIncompleteView({ missingFields, completedFields }: ProfileIncompleteViewProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // 倒计时并自动跳转
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // 跳转到设置页面的身体档案部分
          router.push('/settings?tab=body');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#E7E1D6] p-8 shadow-sm text-center">
        {/* Icon */}
        <div className="w-16 h-16 bg-[#0B3D2E]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <User className="w-8 h-8 text-[#0B3D2E]" />
        </div>

        {/* Main Message */}
        <div className="mb-8">
          <h1 className="text-xl font-medium text-[#0B3D2E] mb-4 leading-relaxed">
            请继续完善您的资料后，生成更精准的分析报告
          </h1>
          
          <p className="text-lg font-medium text-[#0B3D2E] mb-2">
            现在跳转...
          </p>
          
          <div className="text-2xl font-bold text-[#0B3D2E]">
            {countdown}
          </div>
        </div>

        {/* Loading Animation */}
        <div className="flex justify-center">
          <div className="w-8 h-8 border-2 border-[#0B3D2E]/20 border-t-[#0B3D2E] rounded-full animate-spin"></div>
        </div>

        {/* Skip Button */}
        <button
          onClick={() => router.push('/settings?tab=body')}
          className="mt-6 text-sm text-[#0B3D2E]/60 hover:text-[#0B3D2E] transition-colors underline"
        >
          立即跳转
        </button>
      </div>
    </div>
  );
}
