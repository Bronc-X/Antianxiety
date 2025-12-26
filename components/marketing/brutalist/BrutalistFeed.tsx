'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, BookOpen, Clock, Tag } from 'lucide-react';
import BrutalistNav from './BrutalistNav';

interface Article {
    id: string;
    title: string;
    summary: string;
    source: string;
    url: string;
    readTime: string;
    tags: string[];
    date: string;
}

const ARTICLES: Article[] = [
    {
        id: '1',
        title: 'The impact of sleep deprivation on cognitive performance',
        summary: 'Meta-analysis of 14 studies showing significant degradation in working memory and executive function after just 24 hours of sleep deprivation.',
        source: 'Nature Reviews Neuroscience',
        url: '#',
        readTime: '8 min',
        tags: ['SLEEP', 'COGNITION'],
        date: '2024-03-15'
    },
    {
        id: '2',
        title: 'Cold exposure increases dopamine levels by 250%',
        summary: 'Cold water immersion (14°C) was shown to increase plasma dopamine concentrations by 250% and maintain elevated levels for 2 hours.',
        source: 'European Journal of Applied Physiology',
        url: '#',
        readTime: '12 min',
        tags: ['DOPAMINE', 'RECOVERY'],
        date: '2024-02-28'
    },
    {
        id: '3',
        title: 'Zone 2 training and mitochondrial efficiency',
        summary: 'Low-intensity steady-state cardio (Zone 2) improves fat oxidation and lactate clearance more effectively than HIIT in untrained individuals.',
        source: 'Cell Metabolism',
        url: '#',
        readTime: '15 min',
        tags: ['METABOLISM', 'EXERCISE'],
        date: '2024-01-10'
    }
];

export default function BrutalistFeed() {
    const [filter, setFilter] = useState('ALL');

    const uniqueTags = ['ALL', ...Array.from(new Set(ARTICLES.flatMap(a => a.tags)))];

    const filteredArticles = filter === 'ALL'
        ? ARTICLES
        : ARTICLES.filter(a => a.tags.includes(filter));

    return (
        <div className="brutalist-page min-h-screen">
            <BrutalistNav />
            <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
                <header className="mb-12">
                    <h1 className="brutalist-h2 mb-2">Signal</h1>
                    <p className="text-[var(--brutalist-muted)] text-sm font-mono uppercase">peer-reviewed protocols and data.</p>
                </header>

                {/* Filter */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    {uniqueTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => setFilter(tag)}
                            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider border transition-all ${filter === tag
                                    ? 'bg-[var(--brutalist-fg)] text-[var(--brutalist-bg)] border-[var(--brutalist-fg)]'
                                    : 'border-[var(--brutalist-border)] text-[var(--brutalist-muted)] hover:border-[var(--brutalist-fg)]'
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                {/* Article Grid */}
                <div className="grid grid-cols-1 gap-6">
                    {filteredArticles.map((article, idx) => (
                        <motion.article
                            key={article.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group border border-[var(--brutalist-border)] bg-[var(--brutalist-card-bg)] hover:border-[var(--signal-green)] transition-colors p-6 md:p-8"
                        >
                            <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                                <div className="space-y-4 flex-1">
                                    <div className="flex gap-2 flex-wrap">
                                        {article.tags.map(tag => (
                                            <span key={tag} className="text-[9px] font-bold uppercase bg-[var(--brutalist-border)]/20 px-1.5 py-0.5 text-[var(--brutalist-fg)]">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    <h3 className="text-xl md:text-2xl font-bold leading-tight group-hover:text-[var(--signal-green)] transition-colors">
                                        {article.title}
                                    </h3>

                                    <p className="text-sm text-[var(--brutalist-muted)] leading-relaxed max-w-2xl">
                                        {article.summary}
                                    </p>

                                    <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider text-[var(--brutalist-muted)] pt-2 font-mono">
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="w-3 h-3" /> {article.source}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {article.readTime}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-shrink-0 self-end md:self-start">
                                    <a
                                        href={article.url}
                                        className="inline-flex items-center justify-center w-10 h-10 border border-[var(--brutalist-fg)] hover:bg-[var(--signal-green)] hover:border-[var(--signal-green)] hover:text-black transition-all"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>
            </main>
        </div>
    );
}
