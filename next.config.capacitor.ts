import type { NextConfig } from "next";

/**
 * Next.js 配置 - Capacitor 在线运行模式
 *
 * 保留动态能力（Server Actions/SSR），不使用静态导出。
 */

const nextConfig: NextConfig = {
  // 动态运行配置
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  
  // 优化性能
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  
  // 减少 bundle 大小
  experimental: {
    optimizePackageImports: [
      '@supabase/supabase-js',
      '@supabase/auth-helpers-nextjs',
      'framer-motion',
      'recharts',
      'react-tweet',
    ],
  },
  
  // Turbopack 配置
  turbopack: {},
};

export default nextConfig;
