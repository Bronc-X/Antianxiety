import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const buildContentSecurityPolicy = () => {
  const scriptSrc = ["'self'", "'wasm-unsafe-eval'", "'unsafe-inline'"];
  if (isDev) {
    scriptSrc.push("'unsafe-eval'");
  }

  const connectSrc = new Set<string>([
    "'self'",
    "https://*.supabase.co",
    "https://api.deepseek.com",
    "https://react-tweet.vercel.app",
    "https://cdn.syndication.twimg.com",
    "https://*.twitter.com",
    "https://*.twimg.com",
  ]);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    connectSrc.add(process.env.NEXT_PUBLIC_SUPABASE_URL);
  }

  const imgSrc = [
    "'self'",
    "data:",
    "blob:",
    "https://*.twimg.com",
    "https://pbs.twimg.com",
    "https://abs.twimg.com",
    "https://images.unsplash.com",
    "https://images.pexels.com",
  ];

  const frameSrc = ["https://*.supabase.co", "https://platform.twitter.com"];

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc.join(" ")}`,
    `connect-src ${Array.from(connectSrc).join(" ")}`,
    "font-src 'self' data:",
    `frame-src ${frameSrc.join(" ")}`,
  ]
    .join("; ")
    .replace(/\s{2,}/g, " ")
    .trim();
};

const securityHeaders = [
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

if (!isDev) {
  securityHeaders.unshift({
    key: "Content-Security-Policy",
    value: buildContentSecurityPolicy(),
  });
}

const nextConfig: NextConfig = {
  // 启用 standalone 输出模式，用于 Docker 部署
  output: 'standalone',
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  // 优化性能
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // 减少 bundle 大小 - 优化包导入
  experimental: {
    optimizePackageImports: [
      '@supabase/supabase-js',
      '@supabase/auth-helpers-nextjs',
      'framer-motion',
      'recharts',
      'react-tweet',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },
  // 优化 Webpack 配置以减少 bundle 大小
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 客户端优化：减少 bundle 大小
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // 将大型库单独打包
            supabase: {
              name: 'supabase',
              test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
              priority: 20,
            },
            charts: {
              name: 'charts',
              test: /[\\/]node_modules[\\/](recharts)[\\/]/,
              priority: 20,
            },
            motion: {
              name: 'motion',
              test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
              priority: 20,
            },
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
