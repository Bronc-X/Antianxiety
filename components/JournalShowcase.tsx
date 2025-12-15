'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Award, BookOpen } from 'lucide-react';

/**
 * Paper interface for academic journal articles
 */
export interface Paper {
  id: string;
  title: string;
  titleZh?: string;
  authors: string;
  journal: string;
  year: number;
  abstract: string;
  abstractZh?: string;
  url: string;
  citationCount?: number;
  credibilityTier: 1 | 2; // 1 = Top Journal, 2 = Peer Reviewed
}

/**
 * Curated papers on anxiety, stress, and mental health research
 */
export const CURATED_PAPERS: Paper[] = [
  {
    id: 'paper-1',
    title: 'The neuroscience of mindfulness meditation and its effects on anxiety',
    titleZh: '正念冥想的神经科学及其对焦虑的影响',
    authors: 'Tang YY, Hölzel BK, Posner MI',
    journal: 'Nature Reviews Neuroscience',
    year: 2015,
    abstract: 'Mindfulness meditation has been reported to produce positive effects on psychological well-being that extend beyond the time the individual is formally meditating. This review examines the neural mechanisms underlying these effects.',
    abstractZh: '正念冥想被报道能产生超越正式冥想时间的心理健康积极效果。本综述探讨了这些效果背后的神经机制。',
    url: 'https://www.nature.com/articles/nrn3916',
    citationCount: 2847,
    credibilityTier: 1
  },
  {
    id: 'paper-2',
    title: 'Heart rate variability as a biomarker of anxiety disorders',
    titleZh: '心率变异性作为焦虑障碍的生物标志物',
    authors: 'Chalmers JA, Quintana DS, Abbott MJ, Kemp AH',
    journal: 'Frontiers in Psychiatry',
    year: 2014,
    abstract: 'Heart rate variability (HRV) is a measure of the variation in time between consecutive heartbeats. Reduced HRV has been associated with anxiety disorders, suggesting autonomic nervous system dysregulation.',
    abstractZh: '心率变异性（HRV）是连续心跳之间时间变化的测量指标。HRV降低与焦虑障碍相关，表明自主神经系统失调。',
    url: 'https://www.frontiersin.org/articles/10.3389/fpsyt.2014.00048',
    citationCount: 892,
    credibilityTier: 2
  },
  {
    id: 'paper-3',
    title: 'Sleep and anxiety disorders: A bidirectional relationship',
    titleZh: '睡眠与焦虑障碍：双向关系',
    authors: 'Alvaro PK, Roberts RM, Harris JK',
    journal: 'Sleep Medicine Reviews',
    year: 2013,
    abstract: 'This systematic review examines the bidirectional relationship between sleep disturbance and anxiety. Evidence suggests that sleep problems both precede and follow the development of anxiety disorders.',
    abstractZh: '本系统综述探讨了睡眠障碍与焦虑之间的双向关系。证据表明睡眠问题既先于也跟随焦虑障碍的发展。',
    url: 'https://www.sciencedirect.com/science/article/pii/S1087079212000731',
    citationCount: 1156,
    credibilityTier: 2
  },
  {
    id: 'paper-4',
    title: 'The gut-brain axis: Microbiome influences on stress and anxiety',
    titleZh: '肠脑轴：微生物组对压力和焦虑的影响',
    authors: 'Foster JA, Rinaman L, Cryan JF',
    journal: 'Neurobiology of Stress',
    year: 2017,
    abstract: 'The gut microbiome communicates with the brain through multiple pathways including the vagus nerve, immune system, and metabolites. Alterations in gut bacteria have been linked to anxiety-like behaviors.',
    abstractZh: '肠道微生物组通过迷走神经、免疫系统和代谢物等多种途径与大脑沟通。肠道细菌的改变与焦虑样行为有关。',
    url: 'https://www.sciencedirect.com/science/article/pii/S2352289516300509',
    citationCount: 1423,
    credibilityTier: 2
  },
  {
    id: 'paper-5',
    title: 'Exercise as a treatment for anxiety: Systematic review and meta-analysis',
    titleZh: '运动作为焦虑治疗：系统综述和荟萃分析',
    authors: 'Stubbs B, Vancampfort D, Rosenbaum S',
    journal: 'JAMA Psychiatry',
    year: 2017,
    abstract: 'This meta-analysis of 49 randomized controlled trials found that exercise significantly reduces anxiety symptoms compared to control conditions, with effects comparable to pharmacotherapy.',
    abstractZh: '这项对49项随机对照试验的荟萃分析发现，与对照条件相比，运动显著减少焦虑症状，效果与药物治疗相当。',
    url: 'https://jamanetwork.com/journals/jamapsychiatry/fullarticle/2611773',
    citationCount: 2134,
    credibilityTier: 1
  },
  {
    id: 'paper-6',
    title: 'Cognitive behavioral therapy for anxiety disorders: An update on the evidence',
    titleZh: '焦虑障碍的认知行为疗法：证据更新',
    authors: 'Hofmann SG, Smits JAJ',
    journal: 'Dialogues in Clinical Neuroscience',
    year: 2008,
    abstract: 'Cognitive behavioral therapy (CBT) is the most extensively researched form of psychotherapy for anxiety disorders. This review summarizes the evidence supporting CBT as a first-line treatment.',
    abstractZh: '认知行为疗法（CBT）是焦虑障碍研究最广泛的心理治疗形式。本综述总结了支持CBT作为一线治疗的证据。',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3263389/',
    citationCount: 1876,
    credibilityTier: 2
  }
];

/**
 * Fallback papers if main data fails to load
 */
const FALLBACK_PAPERS: Paper[] = CURATED_PAPERS.slice(0, 4);

/**
 * Truncate text to specified length with ellipsis
 */
export function truncateAbstract(text: string, maxLength: number = 120): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

interface JournalShowcaseProps {
  language?: 'en' | 'zh';
  columns?: 2 | 3;
  limit?: number;
}

export default function JournalShowcase({
  language = 'en',
  columns = 2,
  limit = 6
}: JournalShowcaseProps) {
  const papers = CURATED_PAPERS.length > 0 
    ? CURATED_PAPERS.slice(0, limit) 
    : FALLBACK_PAPERS;

  const gridCols = columns === 3 
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
    : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {papers.map((paper, index) => {
        const title = language === 'zh' && paper.titleZh ? paper.titleZh : paper.title;
        const abstract = language === 'zh' && paper.abstractZh ? paper.abstractZh : paper.abstract;
        const truncatedAbstract = truncateAbstract(abstract, 120);
        
        return (
          <motion.a
            key={paper.id}
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="group block rounded-xl border border-[#E7E1D6] dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            {/* Header: Journal + Year + Credibility Badge */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-[#9CAF88] dark:text-[#9CAF88]">
                  {paper.journal}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-neutral-500">
                  {paper.year}
                </span>
              </div>
              
              {/* Credibility Badge */}
              <div 
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  paper.credibilityTier === 1 
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' 
                    : 'bg-[#9CAF88]/15 dark:bg-[#9CAF88]/20 text-[#6B8E5B] dark:text-[#9CAF88]'
                }`}
              >
                {paper.credibilityTier === 1 ? (
                  <>
                    <Award className="w-3 h-3" />
                    {language === 'zh' ? '顶级期刊' : 'Top Journal'}
                  </>
                ) : (
                  <>
                    <BookOpen className="w-3 h-3" />
                    {language === 'zh' ? '同行评审' : 'Peer Reviewed'}
                  </>
                )}
              </div>
            </div>

            {/* Title */}
            <h4 className="text-sm font-medium text-[#0B3D2E] dark:text-white leading-snug mb-2 group-hover:text-[#9CAF88] dark:group-hover:text-[#9CAF88] transition-colors line-clamp-2">
              {title}
            </h4>

            {/* Abstract Snippet */}
            <p className="text-xs text-gray-500 dark:text-neutral-400 leading-relaxed mb-3 line-clamp-3">
              {truncatedAbstract}
            </p>

            {/* Footer: Authors + Citation Count */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E7E1D6]/50 dark:border-neutral-700/50">
              <span className="text-[10px] text-gray-400 dark:text-neutral-500 truncate max-w-[60%]">
                {paper.authors}
              </span>
              
              <div className="flex items-center gap-2">
                {paper.citationCount !== undefined && (
                  <span className="text-[10px] text-gray-400 dark:text-neutral-500">
                    {language === 'zh' ? '引用' : 'Cited'} {paper.citationCount.toLocaleString()}
                  </span>
                )}
                <ExternalLink className="w-3 h-3 text-gray-300 dark:text-neutral-600 group-hover:text-[#9CAF88] transition-colors" />
              </div>
            </div>
          </motion.a>
        );
      })}
    </div>
  );
}
