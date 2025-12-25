/**
 * Curated Research API
 * 
 * Fetches personalized academic papers from Semantic Scholar and PubMed
 * based on user health profile tags
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Tag → English Keywords mapping
const TAG_KEYWORD_MAP: Record<string, string[]> = {
    // GAD-7 related
    '高皮质醇风险': ['cortisol', 'stress response', 'anxiety disorder'],
    '重度焦虑': ['severe anxiety', 'GAD treatment', 'anxiolytic therapy'],

    // SHSQ-25 related
    '亚健康状态': ['sub-health', 'fatigue syndrome', 'wellness intervention'],
    '慢性疲劳': ['chronic fatigue', 'mitochondrial function', 'energy metabolism'],
    '情绪困扰': ['mood disorder', 'emotional regulation', 'depression treatment'],
    '免疫力差': ['immune function', 'inflammation markers', 'immunomodulation'],

    // Sleep-related
    '睡眠问题': ['sleep quality', 'insomnia treatment', 'circadian rhythm'],
    '失眠': ['insomnia', 'sleep disorder', 'melatonin'],

    // Default health topics
    'default': ['mental health', 'stress management', 'HRV biofeedback', 'mindfulness']
};

interface Paper {
    id: string;
    title: string;
    abstract: string;
    url: string;
    year: number;
    source: 'semantic_scholar' | 'pubmed';
    matchScore: number;
    category: string;
}

/**
 * Calculate match score based on keyword hits
 */
function calculateMatchScore(title: string, abstract: string, keywords: string[]): number {
    const text = `${title} ${abstract}`.toLowerCase();
    let hits = 0;

    for (const kw of keywords) {
        if (text.includes(kw.toLowerCase())) {
            hits++;
        }
    }

    // Base score 70 + bonus up to 30 based on hit rate
    const hitRate = keywords.length > 0 ? hits / keywords.length : 0;
    return Math.min(100, Math.round(70 + hitRate * 30));
}

/**
 * Get category from keywords (bilingual)
 */
function getCategoryFromKeywords(keywords: string[], isZh: boolean): string {
    if (keywords.some(k => k.includes('anxiety') || k.includes('stress'))) {
        return isZh ? '焦虑研究' : 'Anxiety Research';
    }
    if (keywords.some(k => k.includes('sleep') || k.includes('insomnia'))) {
        return isZh ? '睡眠科学' : 'Sleep Science';
    }
    if (keywords.some(k => k.includes('fatigue') || k.includes('energy'))) {
        return isZh ? '能量代谢' : 'Energy & Metabolism';
    }
    if (keywords.some(k => k.includes('mood') || k.includes('depression'))) {
        return isZh ? '情绪调节' : 'Mood Regulation';
    }
    if (keywords.some(k => k.includes('immune') || k.includes('inflammation'))) {
        return isZh ? '免疫健康' : 'Immune Health';
    }
    return isZh ? '健康科学' : 'Health Science';
}

/**
 * Fetch papers from Semantic Scholar API
 */
async function fetchSemanticScholar(query: string, limit: number = 5): Promise<Paper[]> {
    try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodedQuery}&limit=${limit}&fields=paperId,title,abstract,url,year`;

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            console.error('[SemanticScholar] API error:', response.status);
            return [];
        }

        const data = await response.json();

        return (data.data || []).map((paper: any) => ({
            id: paper.paperId,
            title: paper.title || 'Untitled',
            abstract: paper.abstract || '',
            url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
            year: paper.year || new Date().getFullYear(),
            source: 'semantic_scholar' as const,
            matchScore: 0, // Will be calculated later
            category: ''
        }));
    } catch (error) {
        console.error('[SemanticScholar] Fetch error:', error);
        return [];
    }
}

/**
 * Fetch papers from PubMed E-utilities API
 */
async function fetchPubMed(query: string, limit: number = 5): Promise<Paper[]> {
    try {
        // Step 1: Search for IDs
        const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${limit}&retmode=json&sort=relevance`;

        const searchResponse = await fetch(searchUrl, {
            next: { revalidate: 3600 }
        });

        if (!searchResponse.ok) {
            console.error('[PubMed] Search error:', searchResponse.status);
            return [];
        }

        const searchData = await searchResponse.json();
        const ids: string[] = searchData.esearchresult?.idlist || [];

        if (ids.length === 0) return [];

        // Step 2: Fetch summaries
        const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;

        const summaryResponse = await fetch(summaryUrl, {
            next: { revalidate: 3600 }
        });

        if (!summaryResponse.ok) {
            console.error('[PubMed] Summary error:', summaryResponse.status);
            return [];
        }

        const summaryData = await summaryResponse.json();
        const result = summaryData.result || {};

        return ids.map(id => {
            const paper = result[id];
            if (!paper) return null;

            return {
                id: id,
                title: paper.title || 'Untitled',
                abstract: paper.sorttitle || '', // PubMed summary doesn't include full abstract
                url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
                year: parseInt(paper.pubdate?.split(' ')[0]) || new Date().getFullYear(),
                source: 'pubmed' as const,
                matchScore: 0,
                category: ''
            };
        }).filter(Boolean) as Paper[];
    } catch (error) {
        console.error('[PubMed] Fetch error:', error);
        return [];
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const limit = parseInt(searchParams.get('limit') || '10');
        const language = searchParams.get('language') || 'en';
        const isZh = language.startsWith('zh') || language === 'zh';

        const userTags: string[] = [];
        let keywords: string[] = [];

        // Get user health tags from profile
        if (userId) {
            const supabase = await createClient();
            const { data: profile } = await supabase
                .from('profiles')
                .select('inferred_scale_scores, metabolic_profile')
                .eq('id', userId)
                .single();

            if (profile) {
                // Extract tags from scale scores
                const scores = profile.inferred_scale_scores as any;

                if (scores?.GAD7?.score >= 10) {
                    userTags.push('高皮质醇风险');
                }
                if (scores?.GAD7?.score >= 15) {
                    userTags.push('重度焦虑');
                }
                if (scores?.ISI?.score >= 15) {
                    userTags.push('失眠');
                }

                // Add tags from metabolic profile if available
                const metabolic = profile.metabolic_profile as any;
                if (metabolic?.tags) {
                    userTags.push(...metabolic.tags);
                }
            }
        }

        // Map tags to keywords
        if (userTags.length > 0) {
            for (const tag of userTags) {
                keywords.push(...(TAG_KEYWORD_MAP[tag] || []));
            }
        }

        // Use default keywords if none found
        if (keywords.length === 0) {
            keywords = TAG_KEYWORD_MAP['default'];
        }

        // Remove duplicates
        keywords = [...new Set(keywords)];

        // Build search query
        const searchQuery = keywords.slice(0, 5).join(' '); // Use top 5 keywords

        console.log('[CuratedAPI] User tags:', userTags);
        console.log('[CuratedAPI] Search query:', searchQuery);

        // Fetch from both sources in parallel
        const [semanticPapers, pubmedPapers] = await Promise.all([
            fetchSemanticScholar(searchQuery, Math.ceil(limit / 2)),
            fetchPubMed(searchQuery, Math.ceil(limit / 2))
        ]);

        // Combine and calculate match scores
        const allPapers = [...semanticPapers, ...pubmedPapers];
        const category = getCategoryFromKeywords(keywords, isZh);

        const scoredPapers = allPapers
            .map(paper => ({
                ...paper,
                matchScore: calculateMatchScore(paper.title, paper.abstract, keywords),
                category
            }))
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, limit);

        return NextResponse.json({
            papers: scoredPapers,
            keywords: keywords.slice(0, 5),
            userTags,
            cached: false
        });

    } catch (error) {
        console.error('[CuratedAPI] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch curated papers' },
            { status: 500 }
        );
    }
}
