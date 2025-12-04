/**
 * Dynamic Route with Static Generation
 * Requirements: 2.3
 * 
 * This page demonstrates how to use generateStaticParams() for static export.
 * All possible paths must be pre-rendered at build time.
 */

import { notFound } from 'next/navigation';

// Define all possible static pages
const staticPages = {
  about: {
    title: '关于我们',
    description: 'No More Anxious 是一个认知健康平台，帮助您管理焦虑和压力。',
    content: '我们致力于通过科学方法帮助用户改善心理健康。',
  },
  privacy: {
    title: '隐私政策',
    description: '了解我们如何保护您的个人信息。',
    content: '我们重视您的隐私，所有数据都经过加密存储。',
  },
  terms: {
    title: '服务条款',
    description: '使用 No More Anxious 服务的条款和条件。',
    content: '使用本服务即表示您同意遵守以下条款。',
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
    title: `${page.title} | No More Anxious`,
    description: page.description,
  };
}

export default async function StaticPage({ params }: PageProps) {
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
            {page.title}
          </h1>
          <p className="text-muted-foreground mb-8">
            {page.description}
          </p>
          <div className="prose prose-neutral dark:prose-invert">
            <p>{page.content}</p>
          </div>
        </article>
      </div>
    </div>
  );
}
