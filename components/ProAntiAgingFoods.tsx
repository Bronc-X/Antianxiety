'use client';

import { useState } from 'react';

/**
 * Pro版功能：AI甄选抗衰食材
 * 基于 Arora et al. 2024 (Nature Aging) AgeXtend研究
 * AI预测具有抗衰老潜力的天然分子
 */

interface AntiAgingMolecule {
  name: string;
  name_zh: string;
  mechanism: string;
  mechanism_zh: string;
  benefits: string[];
  benefits_zh: string[];
  food_sources: string[];
  food_sources_zh: string[];
  dosage?: string;
  dosage_zh?: string;
  timing?: string;
  timing_zh?: string;
  research_backing: string;
}

const antiAgingMolecules: AntiAgingMolecule[] = [
  {
    name: 'Curcumin',
    name_zh: '姜黄素',
    mechanism: 'Anti-inflammatory, antioxidant, activates Nrf2 pathway',
    mechanism_zh: '抗炎、抗氧化，激活Nrf2通路',
    benefits: [
      'Reduces chronic inflammation (IL-6, TNF-α ↓30%)',
      'Neutralizes oxidative stress',
      'Improves mitochondrial function',
      'Enhances brain health (BDNF ↑)'
    ],
    benefits_zh: [
      '减少慢性炎症（IL-6、TNF-α ↓30%）',
      '中和氧化应激',
      '改善线粒体功能',
      '增强大脑健康（BDNF ↑）'
    ],
    food_sources: ['Turmeric', 'Curry powder', 'Curcumin supplements'],
    food_sources_zh: ['姜黄根', '咖喱粉', '姜黄素补充剂'],
    dosage: '500-1000mg curcumin with black pepper (enhances absorption 2000%)',
    dosage_zh: '500-1000mg 姜黄素配黑胡椒（提升吸收2000%）',
    timing: 'With meals containing fat',
    timing_zh: '随含脂肪的餐食服用',
    research_backing: 'Arora et al. 2024, Nature Aging - AgeXtend AI prediction'
  },
  {
    name: 'Spermidine',
    name_zh: '亚精胺',
    mechanism: 'Induces autophagy, improves mitochondrial function, extends lifespan',
    mechanism_zh: '诱导自噬，改善线粒体功能，延长寿命',
    benefits: [
      'Activates cellular autophagy (clean-up damaged proteins)',
      'Improves heart health',
      'Enhances cognitive function',
      'Extends lifespan in animal studies (+25%)'
    ],
    benefits_zh: [
      '激活细胞自噬（清除受损蛋白）',
      '改善心脏健康',
      '增强认知功能',
      '动物研究中延长寿命（+25%）'
    ],
    food_sources: ['Wheat germ', 'Soybeans', 'Aged cheese', 'Mushrooms', 'Natto'],
    food_sources_zh: ['小麦胚芽', '大豆', '发酵奶酪', '蘑菇', '纳豆'],
    dosage: '5-10mg daily from food sources',
    dosage_zh: '每日从食物中摄入5-10mg',
    timing: 'Morning or with breakfast',
    timing_zh: '早晨或随早餐',
    research_backing: 'Arora et al. 2024, Nature Aging + Madeo et al. 2018, Science'
  },
  {
    name: 'Resveratrol',
    name_zh: '白藜芦醇',
    mechanism: 'Activates SIRT1 (longevity gene), mimics caloric restriction',
    mechanism_zh: '激活SIRT1（长寿基因），模拟热量限制',
    benefits: [
      'Activates sirtuins (anti-aging proteins)',
      'Improves insulin sensitivity',
      'Protects cardiovascular health',
      'Reduces inflammation'
    ],
    benefits_zh: [
      '激活去乙酰化酶（抗衰老蛋白）',
      '改善胰岛素敏感性',
      '保护心血管健康',
      '减少炎症'
    ],
    food_sources: ['Red wine', 'Red grapes', 'Blueberries', 'Dark chocolate', 'Peanuts'],
    food_sources_zh: ['红酒', '红葡萄', '蓝莓', '黑巧克力', '花生'],
    dosage: '150-300mg daily (supplement) or 1 glass red wine',
    dosage_zh: '150-300mg/天（补充剂）或1杯红酒',
    timing: 'Evening with dinner',
    timing_zh: '晚上随晚餐',
    research_backing: 'Sinclair et al. 2013, Cell + Multiple longevity studies'
  },
  {
    name: 'Omega-3 (EPA/DHA)',
    name_zh: 'Omega-3（EPA/DHA）',
    mechanism: 'Anti-inflammatory, membrane stabilization, neuroprotection',
    mechanism_zh: '抗炎、稳定细胞膜、神经保护',
    benefits: [
      'Reduces inflammatory markers (CRP ↓20-30%)',
      'Improves brain health and mood',
      'Supports cardiovascular function',
      'Enhances muscle protein synthesis'
    ],
    benefits_zh: [
      '降低炎症标志物（CRP ↓20-30%）',
      '改善大脑健康和情绪',
      '支持心血管功能',
      '增强肌肉蛋白合成'
    ],
    food_sources: ['Fatty fish (salmon, mackerel)', 'Fish oil supplements', 'Algae oil', 'Walnuts', 'Flaxseeds'],
    food_sources_zh: ['深海鱼（三文鱼、鲭鱼）', '鱼油补充剂', '藻油', '核桃', '亚麻籽'],
    dosage: '1-2g EPA+DHA daily',
    dosage_zh: '每日1-2g EPA+DHA',
    timing: 'With meals',
    timing_zh: '随餐服用',
    research_backing: 'Izadi et al. 2024 + Calder 2017, PNAS'
  },
  {
    name: 'EGCG (Green Tea)',
    name_zh: 'EGCG（绿茶多酚）',
    mechanism: 'Antioxidant, activates AMPK, inhibits mTOR',
    mechanism_zh: '抗氧化，激活AMPK，抑制mTOR',
    benefits: [
      'Powerful antioxidant (neutralizes ROS)',
      'Enhances fat oxidation',
      'Improves metabolic rate',
      'Protects against cellular aging'
    ],
    benefits_zh: [
      '强效抗氧化（中和ROS）',
      '增强脂肪氧化',
      '提升代谢率',
      '防止细胞衰老'
    ],
    food_sources: ['Green tea', 'Matcha', 'EGCG supplements'],
    food_sources_zh: ['绿茶', '抹茶', 'EGCG补充剂'],
    dosage: '300-400mg EGCG (3-4 cups green tea)',
    dosage_zh: '300-400mg EGCG（3-4杯绿茶）',
    timing: 'Morning and afternoon (avoid evening due to caffeine)',
    timing_zh: '早晨和下午（晚上避免，含咖啡因）',
    research_backing: 'Chacko et al. 2010, Chinese Medicine + AMPK pathway studies'
  }
];

export default function ProAntiAgingFoods() {
  const [selectedMolecule, setSelectedMolecule] = useState<string | null>(null);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');

  const t = (en: string, zh: string) => language === 'en' ? en : zh;

  return (
    <div className="bg-gradient-to-br from-[#0B3D2E]/5 via-white to-[#FAF6EF] rounded-2xl border border-[#0B3D2E]/20 p-8 shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-gradient-to-r from-[#D4AF37] to-[#f0c674] text-white text-xs font-bold rounded-full">
              PRO
            </span>
            <h2 className="text-2xl font-bold text-[#0B3D2E]">
              {t('AI-Selected Anti-Aging Foods', 'AI甄选抗衰食材')}
            </h2>
          </div>
          <p className="text-sm text-[#0B3D2E]/70">
            {t(
              'Based on Nature Aging 2024 AgeXtend research - AI-predicted molecules with anti-aging potential',
              '基于Nature Aging 2024 AgeXtend研究 - AI预测具有抗衰潜力的分子'
            )}
          </p>
        </div>
        <button
          onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
          className="px-3 py-1 bg-white border border-[#E7E1D6] rounded-lg text-xs text-[#0B3D2E] hover:bg-[#FAF6EF] transition-colors"
        >
          {language === 'zh' ? 'EN' : '中文'}
        </button>
      </div>

      {/* Research Citation */}
      <div className="mb-6 p-4 bg-white/80 rounded-lg border border-[#E7E1D6]">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-[#0B3D2E] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="text-sm">
            <p className="font-semibold text-[#0B3D2E] mb-1">
              {t('Scientific Backing', '科学背书')}
            </p>
            <p className="text-[#0B3D2E]/70 text-xs leading-relaxed">
              <span className="font-semibold">Arora et al., 2024.</span> "AgeXtend: Artificial Intelligence for Discovery of Anti-Aging Molecules." 
              <span className="italic"> Nature Aging</span>, DOI: 10.1038/s43587-024-00763-4
            </p>
          </div>
        </div>
      </div>

      {/* Molecule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {antiAgingMolecules.map((molecule) => {
          const isSelected = selectedMolecule === molecule.name;
          return (
            <div
              key={molecule.name}
              className={`relative overflow-hidden rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#0B3D2E] bg-[#0B3D2E]/5 shadow-md'
                  : 'border-[#E7E1D6] bg-white hover:border-[#0B3D2E]/50 hover:shadow-sm'
              }`}
              onClick={() => setSelectedMolecule(isSelected ? null : molecule.name)}
            >
              {/* Header */}
              <div className="p-5 pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-[#0B3D2E]">
                      {language === 'zh' ? molecule.name_zh : molecule.name}
                    </h3>
                    <p className="text-xs text-[#0B3D2E]/50 mt-0.5">
                      {language === 'zh' ? molecule.name : molecule.name_zh}
                    </p>
                  </div>
                  <button
                    className={`p-1.5 rounded-full transition-colors ${
                      isSelected ? 'bg-[#0B3D2E] text-white' : 'bg-[#0B3D2E]/10 text-[#0B3D2E]'
                    }`}
                  >
                    <svg className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#0B3D2E]/60 mb-3">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>{language === 'zh' ? molecule.mechanism_zh : molecule.mechanism}</span>
                </div>

                {/* Food Sources - Always visible */}
                <div className="flex flex-wrap gap-2">
                  {(language === 'zh' ? molecule.food_sources_zh : molecule.food_sources).slice(0, 3).map((source, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-[#0B3D2E]/10 text-[#0B3D2E] text-xs rounded-full"
                    >
                      {source}
                    </span>
                  ))}
                  {(language === 'zh' ? molecule.food_sources_zh : molecule.food_sources).length > 3 && (
                    <span className="px-2 py-1 bg-[#0B3D2E]/5 text-[#0B3D2E]/60 text-xs rounded-full">
                      +{(language === 'zh' ? molecule.food_sources_zh : molecule.food_sources).length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {isSelected && (
                <div className="border-t border-[#E7E1D6] p-5 pt-4 bg-[#FAF6EF]/30 space-y-4">
                  {/* Benefits */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-[#0B3D2E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold text-[#0B3D2E]">
                        {t('Health Benefits', '健康益处')}
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {(language === 'zh' ? molecule.benefits_zh : molecule.benefits).map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[#0B3D2E]/70">
                          <span className="text-[#0B3D2E]/40 mt-0.5">•</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Dosage & Timing */}
                  {molecule.dosage && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white rounded-lg border border-[#E7E1D6]">
                        <div className="text-xs text-[#0B3D2E]/60 mb-1">
                          {t('Dosage', '建议剂量')}
                        </div>
                        <div className="text-xs font-medium text-[#0B3D2E]">
                          {language === 'zh' ? molecule.dosage_zh : molecule.dosage}
                        </div>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-[#E7E1D6]">
                        <div className="text-xs text-[#0B3D2E]/60 mb-1">
                          {t('Best Timing', '最佳时间')}
                        </div>
                        <div className="text-xs font-medium text-[#0B3D2E]">
                          {language === 'zh' ? molecule.timing_zh : molecule.timing}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Research */}
                  <div className="p-3 bg-[#0B3D2E]/5 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg className="w-3.5 h-3.5 text-[#0B3D2E] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-xs text-[#0B3D2E]/70">
                        {molecule.research_backing}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="mt-6 p-4 bg-gradient-to-r from-[#0B3D2E]/5 to-transparent rounded-lg border-l-4 border-[#0B3D2E]">
        <p className="text-xs text-[#0B3D2E]/70 leading-relaxed">
          <span className="font-semibold">⚠️ {t('Important Note', '重要提示')}:</span>{' '}
          {t(
            'These recommendations are based on scientific research but should not replace professional medical advice. Consult with a healthcare provider before starting any supplementation regimen, especially if you have medical conditions or take medications.',
            '这些建议基于科学研究，但不应替代专业医疗建议。在开始任何补充剂方案之前，请咨询医疗保健提供者，特别是如果您有医疗状况或正在服药。'
          )}
        </p>
      </div>
    </div>
  );
}
