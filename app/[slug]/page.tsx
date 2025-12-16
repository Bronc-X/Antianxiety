/**
 * Dynamic Route with Static Generation
 * Requirements: 2.3
 * 
 * This page demonstrates how to use generateStaticParams() for static export.
 * All possible paths must be pre-rendered at build time.
 */

import { notFound } from 'next/navigation';
import { getServerLanguage } from '@/lib/i18n-server';
import { tr } from '@/lib/i18n-core';

// Define all possible static pages
const staticPages = {
  about: {
    title: { zh: '关于我们', en: 'About Us' },
    description: {
      zh: 'No More anxious™ 是一个认知健康平台，帮助你管理焦虑与压力。',
      en: 'No More anxious™ is a cognitive health platform that helps you manage anxiety and stress.',
    },
    content: {
      zh: '我们致力于通过科学方法帮助用户改善心理健康。',
      en: 'We help people improve mental well-being with evidence-based methods.',
    },
  },
  privacy: {
    title: { zh: '隐私政策', en: 'Privacy Policy' },
    description: { zh: '了解我们如何保护你的个人信息。', en: 'Learn how we protect your personal information.' },
    content: {
      zh: '我们重视你的隐私，所有数据都经过加密存储。',
      en: 'We take privacy seriously. Your data is stored with encryption.',
    },
  },
  terms: {
    title: { zh: '服务条款', en: 'Terms of Service' },
    description: {
      zh: '使用 No More anxious™ 服务的条款与条件。',
      en: 'Terms and conditions for using No More anxious™.',
    },
    content: {
      zh: '使用本服务即表示你同意遵守以下条款。',
      en: 'By using this service, you agree to the following terms.',
    },
  },
} as const;

type SlugType = keyof typeof staticPages;

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate static params for all possible slugs
 * This function is required for static export with dynamic routes
 */
export async function generateStaticParams() {
  return Object.keys(staticPages).map((slug) => ({
    slug,
  }));
}

/**
 * Generate metadata for each page
 */
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const page = staticPages[slug as SlugType];

  if (!page) {
    return {
      title: '页面未找到',
    };
  }

  return {
    title: `${page.title.zh} | No More anxious™`,
    description: page.description.zh,
  };
}

export default async function StaticPage({ params }: PageProps) {
  const language = await getServerLanguage();
  const { slug } = await params;
  const page = staticPages[slug as SlugType];

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <article className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            {tr(language, page.title)}
          </h1>
          <span className="text-sm font-semibold tracking-wide text-[#0B3D2E]">
            AntiAnxiety™
          </span>
          <p className="text-muted-foreground mb-8">
            {tr(language, page.description)}
          </p>
          <div className="prose prose-neutral dark:prose-invert">
            <p>{tr(language, page.content)}</p>
          </div>
        </article>
      </div>
    </div>
  );
}
