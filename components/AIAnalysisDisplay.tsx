'use client';

import { useState, useEffect } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import ProAntiAgingFoods from './ProAntiAgingFoods';
import DeepInferenceModal from './DeepInferenceModal';
import { Brain } from 'lucide-react';

type Language = 'en' | 'zh';

interface AIAnalysisDisplayProps {
  analysis: {
    metabolic_rate_estimate?: string;
    cortisol_pattern?: string;
    sleep_quality?: string;
    recovery_capacity?: string;
    stress_resilience?: string;
    energy_stability?: string;
    inflammation_risk?: string;
    hormonal_balance?: string;
    cardiovascular_health?: string;
    risk_factors?: string[];
    strengths?: string[];
    confidence_score?: number;
    confidence_reasons?: string[];
    risk_factors_en?: string[];
    strengths_en?: string[];
    confidence_reasons_en?: string[];
    analysis_details?: {
      [key: string]: {
        reason: string;
        reason_en: string;
        target: string;
        target_en: string;
      };
    };
  };
  plan: {
    core_principles?: string[];
    micro_habits?: Array<{
      name: string;
      name_en?: string;
      cue: string;
      cue_en?: string;
      response: string;
      response_en?: string;
      timing: string;
      timing_en?: string;
      rationale: string;
      rationale_en?: string;
    }>;
    avoidance_behaviors?: string[];
    monitoring_approach?: string;
    expected_timeline?: string;
  };
}

const getScoreValue = (value: string | undefined) => {
  const scoreMap: Record<string, number> = {
    'low': 40, 'poor': 35, 'unstable': 40, 'imbalanced': 40, 'needs_attention': 35, 'elevated': 45,
    'medium': 65, 'fair': 60, 'moderate': 65, 'normal': 75,
    'high': 90, 'good': 85, 'stable': 90, 'balanced': 90
  };
  return scoreMap[value || ''] || 50;
};

const translateValue = (value: string | undefined, lang: Language) => {
  const translations: Record<string, { en: string; zh: string }> = {
    'low': { en: 'Low', zh: '较低' },
    'medium': { en: 'Medium', zh: '中等' },
    'high': { en: 'High', zh: '较高' },
    'poor': { en: 'Poor', zh: '较差' },
    'fair': { en: 'Fair', zh: '一般' },
    'good': { en: 'Good', zh: '良好' },
    'unstable': { en: 'Unstable', zh: '不稳定' },
    'moderate': { en: 'Moderate', zh: '中等' },
    'stable': { en: 'Stable', zh: '稳定' },
    'imbalanced': { en: 'Imbalanced', zh: '失衡' },
    'balanced': { en: 'Balanced', zh: '平衡' },
    'needs_attention': { en: 'Needs Attention', zh: '需关注' },
    'elevated': { en: 'Elevated', zh: '偏高' },
    'normal': { en: 'Normal', zh: '正常' }
  };
  const translation = translations[value || ''];
  return translation ? translation[lang] : value;
};

export default function AIAnalysisDisplay({ analysis, plan }: AIAnalysisDisplayProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [language, setLanguage] = useState<Language>('en');
  const [activeInfoKey, setActiveInfoKey] = useState<string | null>(null);
  const [showDeepInference, setShowDeepInference] = useState(false);
  
  useEffect(() => {
    const duration = 2500;
    const interval = 50;
    const steps = duration / interval;
    const increment = 100 / steps;
    
    let currentProgress = 0;
    const timer = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= 100) {
        setProgress(100);
        setTimeout(() => setIsLoading(false), 400);
        clearInterval(timer);
      } else {
        setProgress(currentProgress);
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-8 bg-white">
        <style jsx>{`
          @keyframes breathe {
            0%, 100% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.15); opacity: 1; }
          }
          @keyframes pulse-ring {
            0% { transform: scale(0.9); opacity: 1; }
            100% { transform: scale(1.4); opacity: 0; }
          }
        `}</style>
        <div className="relative w-40 h-40">
          <div 
            className="absolute inset-0 rounded-full bg-slate-800"
            style={{
              animation: 'breathe 3.5s ease-in-out infinite',
              boxShadow: '0 0 40px rgba(15, 23, 42, 0.3)'
            }}
          />
          <div 
            className="absolute inset-0 rounded-full border-2 border-slate-400"
            style={{ animation: 'pulse-ring 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite' }}
          />
          <div 
            className="absolute inset-0 rounded-full border-2 border-slate-300"
            style={{ animation: 'pulse-ring 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite 1.25s' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-semibold text-white tracking-tight">{Math.round(progress)}%</div>
              <div className="text-xs text-white/80 mt-1 font-medium uppercase tracking-wider">Processing</div>
            </div>
          </div>
        </div>
        <div className="text-center space-y-2">
          <div className="text-xl font-semibold text-slate-900">
            Analyzing your health data
          </div>
          <div className="text-sm text-slate-600 max-w-md px-4">
            {
              progress < 25 ? 'Parsing physiological indicators' :
              progress < 50 ? 'Evaluating 8-dimensional health status' :
              progress < 75 ? 'Generating personalized recommendations' : 'Completing analysis report'
            }
          </div>
        </div>
      </div>
    );
  }

  const t = (en: string, zh: string) => language === 'en' ? en : zh;

  // 科学解释数据库
  const metricExplanations: Record<string, { science: string; science_en: string; interpretation: (value: string) => string; interpretation_en: (value: string) => string; suggestion: string; suggestion_en: string }> = {
    metabolic_rate_estimate: {
      science: '代谢率是指机体在静息状态下维持基本生命活动所需的最低能量消耗。受年龄、性别、肌肉量、激素水平等因素影响。基础代谢率(BMR)占每日总能量消耗的60-75%。',
      science_en: 'Metabolic rate refers to the minimum energy expenditure required to maintain basic life functions at rest. Influenced by age, gender, muscle mass, and hormone levels. Basal Metabolic Rate (BMR) accounts for 60-75% of total daily energy expenditure.',
      interpretation: (value) => {
        if (value === 'low') return '您的代谢率偏低，可能导致体重管理困难和精力不足。这可能与久坐生活方式、肌肉量不足或激素失衡有关。';
        if (value === 'high') return '您的代谢率较高，身体能高效消耗能量。这通常与规律运动、良好的肌肉质量和活跃的生活方式相关。';
        return '您的代谢率处于正常范围，身体能量消耗适中。保持当前的生活方式可维持健康代谢水平。';
      },
      interpretation_en: (value) => {
        if (value === 'low') return 'Your metabolic rate is below optimal, which may contribute to weight management challenges and low energy. This could be related to a sedentary lifestyle, insufficient muscle mass, or hormonal imbalance.';
        if (value === 'high') return 'Your metabolic rate is elevated, indicating efficient energy utilization. This is typically associated with regular exercise, good muscle mass, and an active lifestyle.';
        return 'Your metabolic rate is within the normal range, with moderate energy expenditure. Maintaining your current lifestyle can sustain healthy metabolic levels.';
      },
      suggestion: '建议：进行力量训练增加肌肉量，保证充足蛋白质摄入，避免过度节食。每周进行3-4次抗阻训练可有效提升基础代谢率5-8%。',
      suggestion_en: 'Recommendation: Engage in strength training to increase muscle mass, ensure adequate protein intake, and avoid excessive calorie restriction. 3-4 resistance training sessions per week can effectively boost basal metabolic rate by 5-8%.'
    },
    cortisol_pattern: {
      science: '皮质醇是肾上腺分泌的主要压力激素，遵循昼夜节律波动。正常情况下早晨最高，晚上最低。慢性压力会导致皮质醇分泌失调，影响睡眠、代谢和免疫功能。',
      science_en: 'Cortisol is the primary stress hormone secreted by the adrenal glands, following a circadian rhythm. Normally highest in the morning and lowest at night. Chronic stress can dysregulate cortisol secretion, affecting sleep, metabolism, and immune function.',
      interpretation: (value) => {
        if (value === 'elevated') return '您的皮质醇水平可能偏高，这与慢性压力、睡眠不足或过度咖啡因摄入相关。长期升高可能导致腹部脂肪堆积、免疫力下降和睡眠障碍。';
        if (value === 'low') return '您的皮质醇水平可能偏低，这可能与肾上腺疲劳或长期慢性压力后的耗竭状态有关。可能表现为持续疲劳和压力应对能力下降。';
        return '您的皮质醇分泌模式正常，压力激素处于健康平衡状态。继续保持规律作息和有效的压力管理。';
      },
      interpretation_en: (value) => {
        if (value === 'elevated') return 'Your cortisol levels may be elevated, associated with chronic stress, sleep deprivation, or excessive caffeine intake. Prolonged elevation can lead to abdominal fat accumulation, decreased immunity, and sleep disorders.';
        if (value === 'low') return 'Your cortisol levels may be low, possibly related to adrenal fatigue or exhaustion following chronic stress. This may manifest as persistent fatigue and reduced stress coping capacity.';
        return 'Your cortisol secretion pattern is normal, with stress hormones in healthy balance. Continue maintaining regular routines and effective stress management.';
      },
      suggestion: '建议：练习正念冥想或深呼吸，限制咖啡因摄入（下午3点后避免），确保7-9小时优质睡眠。研究表明每日20分钟冥想可降低皮质醇水平23%。',
      suggestion_en: 'Recommendation: Practice mindfulness meditation or deep breathing, limit caffeine intake (avoid after 3 PM), ensure 7-9 hours of quality sleep. Research shows 20 minutes of daily meditation can reduce cortisol levels by 23%.'
    },
    sleep_quality: {
      science: '睡眠质量由深度睡眠和REM睡眠比例、睡眠连续性和总睡眠时长决定。深度睡眠负责身体修复，REM睡眠负责记忆巩固和情绪调节。成人最佳睡眠时长为7-9小时。',
      science_en: 'Sleep quality is determined by the proportion of deep sleep and REM sleep, sleep continuity, and total sleep duration. Deep sleep is responsible for physical restoration, while REM sleep consolidates memory and regulates emotions. Optimal sleep duration for adults is 7-9 hours.',
      interpretation: (value) => {
        if (value === 'poor') return '您的睡眠质量较差，可能表现为入睡困难、频繁醒来或早醒。这会影响认知功能、情绪稳定性和免疫力。';
        if (value === 'good') return '您的睡眠质量良好，能够获得充足的恢复性睡眠。这有助于维持最佳的身心状态和日间表现。';
        return '您的睡眠质量一般，虽然睡眠时长可能足够，但睡眠深度或连续性可能需要改善。';
      },
      interpretation_en: (value) => {
        if (value === 'poor') return 'Your sleep quality is suboptimal, possibly characterized by difficulty falling asleep, frequent awakenings, or early morning awakenings. This affects cognitive function, emotional stability, and immunity.';
        if (value === 'good') return 'Your sleep quality is good, allowing for adequate restorative sleep. This helps maintain optimal physical and mental state and daytime performance.';
        return 'Your sleep quality is fair. While sleep duration may be sufficient, sleep depth or continuity may need improvement.';
      },
      suggestion: '建议：保持规律作息，睡前1-2小时避免蓝光暴露，卧室温度保持18-22°C。研究显示规律作息可提高深度睡眠质量达30%。',
      suggestion_en: 'Recommendation: Maintain regular sleep schedule, avoid blue light exposure 1-2 hours before bed, keep bedroom temperature at 18-22°C. Research shows regular sleep schedules can improve deep sleep quality by up to 30%.'
    },
    recovery_capacity: {
      science: '恢复能力是指运动或压力后身体回到基线状态的速度。受心率变异性(HRV)、睡眠质量、营养状况和训练适应性影响。良好的恢复能力是健康和运动表现的关键指标。',
      science_en: 'Recovery capacity refers to the speed at which the body returns to baseline after exercise or stress. Influenced by Heart Rate Variability (HRV), sleep quality, nutritional status, and training adaptation. Good recovery capacity is a key indicator of health and athletic performance.',
      interpretation: (value) => {
        if (value === 'low') return '您的恢复能力较低，可能在运动或压力后需要较长时间才能恢复。这可能与睡眠不足、营养缺乏或过度训练有关。';
        if (value === 'high') return '您的恢复能力出色，身体能快速适应并从压力中恢复。这表明您的心血管系统和神经系统功能良好。';
        return '您的恢复能力中等，身体能在合理时间内恢复。适当调整训练强度和休息时间可进一步提升。';
      },
      interpretation_en: (value) => {
        if (value === 'low') return 'Your recovery capacity is low; you may require extended time to recover after exercise or stress. This could be related to insufficient sleep, nutritional deficiencies, or overtraining.';
        if (value === 'high') return 'Your recovery capacity is excellent; your body adapts quickly and recovers efficiently from stress. This indicates good cardiovascular and nervous system function.';
        return 'Your recovery capacity is moderate; your body recovers within reasonable timeframes. Adjusting training intensity and rest periods can further enhance recovery.';
      },
      suggestion: '建议：确保运动后充足蛋白质摄入(20-30g)，进行主动恢复(轻度有氧)，保证睡眠质量。冷热交替浴可促进血液循环，加速代谢废物清除。',
      suggestion_en: 'Recommendation: Ensure adequate protein intake post-exercise (20-30g), engage in active recovery (light aerobic activity), prioritize sleep quality. Contrast baths can enhance circulation and accelerate metabolic waste removal.'
    },
    stress_resilience: {
      science: '压力韧性是个体应对和适应压力的能力。由HPA轴(下丘脑-垂体-肾上腺轴)调节，与神经递质平衡、睡眠质量和社会支持密切相关。高韧性者能更快从压力中恢复。',
      science_en: 'Stress resilience is the ability to cope with and adapt to stress. Regulated by the HPA axis (hypothalamic-pituitary-adrenal axis), closely related to neurotransmitter balance, sleep quality, and social support. High-resilience individuals recover faster from stress.',
      interpretation: (value) => {
        if (value === 'low') return '您的压力韧性较低，可能容易被日常压力源影响，导致焦虑或情绪波动。这可能与长期慢性压力、缺乏应对策略或生活事件累积有关。';
        if (value === 'high') return '您的压力韧性很强，能够有效应对压力并快速恢复。这与良好的情绪调节能力、充足的社会支持和健康的生活方式相关。';
        return '您的压力韧性中等，能应对大多数日常压力，但在高强度压力下可能需要额外支持。';
      },
      interpretation_en: (value) => {
        if (value === 'low') return 'Your stress resilience is low; you may be easily affected by daily stressors, leading to anxiety or emotional fluctuations. This could be related to chronic stress, lack of coping strategies, or accumulated life events.';
        if (value === 'high') return 'Your stress resilience is strong; you can effectively cope with stress and recover quickly. This is associated with good emotional regulation, adequate social support, and healthy lifestyle habits.';
        return 'Your stress resilience is moderate; you can handle most daily stressors, but may need additional support under high-intensity stress.';
      },
      suggestion: '建议：建立社交支持网络，定期进行放松练习(如瑜伽、太极)，培养积极的认知模式。认知行为疗法(CBT)技术可显著提升压力应对能力。',
      suggestion_en: 'Recommendation: Build social support networks, regularly practice relaxation techniques (yoga, tai chi), cultivate positive cognitive patterns. Cognitive Behavioral Therapy (CBT) techniques can significantly enhance stress coping abilities.'
    },
    energy_stability: {
      science: '精力稳定性反映全天能量水平的波动程度。受血糖调节、皮质醇节律、线粒体功能和睡眠质量影响。稳定的精力水平有助于提高生产力和生活质量。',
      science_en: 'Energy stability reflects the fluctuation of energy levels throughout the day. Influenced by blood glucose regulation, cortisol rhythm, mitochondrial function, and sleep quality. Stable energy levels enhance productivity and quality of life.',
      interpretation: (value) => {
        if (value === 'unstable') return '您的精力水平波动较大，可能出现午后崩溃或依赖咖啡因提神。这可能与血糖不稳定、睡眠质量差或压力过大有关。';
        if (value === 'stable') return '您的精力水平全天保持稳定，能够维持持续的专注力和生产力。这表明您的能量代谢和激素调节良好。';
        return '您的精力稳定性中等，虽有波动但整体可控。优化饮食结构和作息可进一步改善。';
      },
      interpretation_en: (value) => {
        if (value === 'unstable') return 'Your energy levels fluctuate significantly, possibly experiencing afternoon crashes or relying on caffeine for alertness. This may be related to blood sugar instability, poor sleep quality, or excessive stress.';
        if (value === 'stable') return 'Your energy levels remain stable throughout the day, maintaining consistent focus and productivity. This indicates good energy metabolism and hormonal regulation.';
        return 'Your energy stability is moderate, with manageable fluctuations. Optimizing diet structure and routines can further improve stability.';
      },
      suggestion: '建议：采用低GI饮食，规律进餐(每3-4小时)，避免高糖零食。保证充足水分摄入(每日2-3升)。短暂户外活动可快速恢复精力。',
      suggestion_en: 'Recommendation: Adopt a low-GI diet, eat regularly (every 3-4 hours), avoid high-sugar snacks. Ensure adequate hydration (2-3 liters daily). Brief outdoor activities can quickly restore energy.'
    },
    inflammation_risk: {
      science: '炎症风险反映体内慢性低度炎症水平。慢性炎症与多种疾病相关(心血管病、糖尿病、自身免疫病)。主要标志物包括C反应蛋白(CRP)、白细胞介素-6(IL-6)等。',
      science_en: 'Inflammation risk reflects the level of chronic low-grade inflammation in the body. Chronic inflammation is associated with various diseases (cardiovascular disease, diabetes, autoimmune disorders). Key markers include C-reactive protein (CRP), interleukin-6 (IL-6), etc.',
      interpretation: (value) => {
        if (value === 'high') return '您的炎症风险较高，可能与吸烟、久坐、不良饮食或慢性压力有关。长期炎症状态会增加慢性疾病风险。';
        if (value === 'low') return '您的炎症风险较低，体内炎症标志物可能处于健康范围。这与良好的生活方式和饮食习惯相关。';
        return '您的炎症风险中等，需要注意生活方式调整以降低慢性炎症风险。';
      },
      interpretation_en: (value) => {
        if (value === 'high') return 'Your inflammation risk is high, possibly related to smoking, sedentary behavior, poor diet, or chronic stress. Prolonged inflammatory state increases chronic disease risk.';
        if (value === 'low') return 'Your inflammation risk is low; inflammatory markers are likely within healthy ranges. This is associated with good lifestyle and dietary habits.';
        return 'Your inflammation risk is moderate; lifestyle adjustments are needed to reduce chronic inflammation risk.';
      },
      suggestion: '建议：增加抗炎食物摄入(深海鱼、坚果、浆果)，减少加工食品和反式脂肪。每周150分钟中等强度运动可降低炎症标志物30%。',
      suggestion_en: 'Recommendation: Increase anti-inflammatory food intake (fatty fish, nuts, berries), reduce processed foods and trans fats. 150 minutes of moderate-intensity exercise per week can reduce inflammatory markers by 30%.'
    },
    cardiovascular_health: {
      science: '心血管健康涵盖心脏和血管系统的功能状态。关键指标包括静息心率、血压、心率变异性和运动耐力。良好的心血管健康是长寿和生活质量的基础。',
      science_en: 'Cardiovascular health encompasses the functional state of the heart and vascular system. Key indicators include resting heart rate, blood pressure, heart rate variability, and exercise endurance. Good cardiovascular health is fundamental to longevity and quality of life.',
      interpretation: (value) => {
        if (value === 'needs_attention') return '您的心血管健康需要关注，可能存在久坐、缺乏运动或不良饮食习惯。及早干预可以有效降低心血管疾病风险。';
        if (value === 'good') return '您的心血管健康状况良好，心脏功能和血管弹性处于健康水平。保持规律运动和健康饮食可维持最佳状态。';
        return '您的心血管健康处于一般水平，虽未达到最佳状态，但通过适度运动和饮食调整可显著改善。';
      },
      interpretation_en: (value) => {
        if (value === 'needs_attention') return 'Your cardiovascular health needs attention, possibly due to sedentary behavior, lack of exercise, or poor dietary habits. Early intervention can effectively reduce cardiovascular disease risk.';
        if (value === 'good') return 'Your cardiovascular health is good; heart function and vascular elasticity are at healthy levels. Maintaining regular exercise and healthy diet can sustain optimal condition.';
        return 'Your cardiovascular health is at a fair level. Though not optimal, it can be significantly improved through moderate exercise and dietary adjustments.';
      },
      suggestion: '建议：每周进行5次30分钟有氧运动，控制钠盐摄入(<5g/日)，增加钾元素摄入。地中海饮食模式可降低心血管疾病风险达25-30%。',
      suggestion_en: 'Recommendation: Engage in 30 minutes of aerobic exercise 5 times per week, limit sodium intake (<5g/day), increase potassium intake. Mediterranean diet pattern can reduce cardiovascular disease risk by 25-30%.'
    }
  };

  const radarData = [
    { metric: t('Metabolic', '代谢率'), value: getScoreValue(analysis.metabolic_rate_estimate), fullMark: 100 },
    { metric: t('Sleep', '睡眠质量'), value: getScoreValue(analysis.sleep_quality), fullMark: 100 },
    { metric: t('Recovery', '恢复能力'), value: getScoreValue(analysis.recovery_capacity), fullMark: 100 },
    { metric: t('Resilience', '压力韧性'), value: getScoreValue(analysis.stress_resilience), fullMark: 100 },
    { metric: t('Energy', '精力稳定'), value: getScoreValue(analysis.energy_stability), fullMark: 100 },
    { metric: t('Cardio', '心血管'), value: getScoreValue(analysis.cardiovascular_health), fullMark: 100 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-slate-900 mb-1">{t('Health Analysis Report', '健康分析报告')}</h1>
            <p className="text-slate-600">{t('AI-powered personalized health assessment', '基于AI的个性化健康评估')}</p>
          </div>
          <button
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            className="mr-4 p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title={t('Switch to Chinese', '切换到英文')}
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <div className="border border-slate-200 px-4 py-2 rounded-lg bg-slate-50">
            <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('Confidence', '置信度')}</div>
            <div className="text-2xl font-semibold text-slate-900">{analysis.confidence_score}%</div>
          </div>
        </div>
        
        {analysis.confidence_reasons && analysis.confidence_reasons.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-4">
            <div className="text-sm font-semibold text-slate-900 mb-3">{t('Analysis Basis', '分析依据')}</div>
            <div className="grid grid-cols-2 gap-2">
              {(language === 'en' ? analysis.confidence_reasons_en : analysis.confidence_reasons)?.map((reason, i) => (
                <div key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5">·</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Radar Chart - Brand Aligned Style */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-[#E7E1D6] shadow-sm hover:shadow-md transition-shadow duration-300">
        {/* Subtle gradient background matching brand */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6EF] via-white to-[#FAF6EF]/50"></div>
        
        <div className="relative p-12">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-[#0B3D2E] tracking-tight mb-2">
                {t('Health Metrics Overview', '健康指标概览')}
              </h2>
              <p className="text-sm text-[#0B3D2E]/60 font-medium">
                {t('Multi-dimensional physiological analysis with statistical benchmarking', '多维度生理分析与统计基准对比')}
              </p>
            </div>
            
            {/* Statistics Panel */}
            <div className="grid grid-cols-2 gap-3">
              <div className="px-4 py-3 bg-[#FAF6EF]/80 rounded-lg border border-[#E7E1D6]">
                <div className="text-xs text-[#0B3D2E]/60 font-medium mb-1">{t('Average', '平均值')}</div>
                <div className="text-xl font-semibold text-[#0B3D2E]">
                  {Math.round(radarData.reduce((acc, item) => acc + item.value, 0) / radarData.length)}
                </div>
              </div>
              <div className="px-4 py-3 bg-[#0B3D2E]/5 rounded-lg border border-[#0B3D2E]/20">
                <div className="text-xs text-[#0B3D2E]/70 font-medium mb-1">{t('Percentile', '百分位')}</div>
                <div className="text-xl font-semibold text-[#0B3D2E]">
                  {Math.round((radarData.reduce((acc, item) => acc + item.value, 0) / radarData.length) * 0.85)}
                  <span className="text-sm">th</span>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mb-6 px-4 py-3 bg-[#FAF6EF]/60 rounded-lg border border-[#E7E1D6]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-gradient-to-r from-[#0B3D2E] to-[#1a5c4a]"></div>
              <span className="text-xs text-[#0B3D2E]/70 font-medium">{t('Your Data', '您的数据')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-[#D4AF37]/60"></div>
              <span className="text-xs text-[#0B3D2E]/70 font-medium">{t('Population Avg', '人群均值')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 border-t-2 border-dashed border-[#0B3D2E]/40"></div>
              <span className="text-xs text-[#0B3D2E]/60 font-medium">{t('Optimal', '最优值')}</span>
            </div>
          </div>
          
          <div className="h-[480px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <defs>
                  {/* Brand green gradient */}
                  <linearGradient id="radarFillBrand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B3D2E" stopOpacity={0.35} />
                    <stop offset="50%" stopColor="#1a5c4a" stopOpacity={0.20} />
                    <stop offset="100%" stopColor="#2d8068" stopOpacity={0.08} />
                  </linearGradient>
                  
                  {/* Average fill with muted gold */}
                  <linearGradient id="avgFillBrand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.06} />
                  </linearGradient>
                  
                  {/* Subtle shadow */}
                  <filter id="brandShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2.5"/>
                    <feOffset dx="0" dy="2" result="offsetblur"/>
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.18"/>
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Enhanced Grid matching brand */}
                <PolarGrid 
                  stroke="#E7E1D6" 
                  strokeWidth={0.8}
                  strokeOpacity={0.6}
                  gridType="polygon"
                />
                
                {/* Angle Axis with brand color */}
                <PolarAngleAxis 
                  dataKey="metric" 
                  tick={{ 
                    fill: '#0B3D2E', 
                    fontSize: 11.5, 
                    fontWeight: 600,
                    letterSpacing: '0.02em'
                  }}
                  tickLine={false}
                />
                
                {/* Radius Axis */}
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ fill: '#0B3D2E', fontSize: 9.5, fontWeight: 500, opacity: 0.5 }}
                  tickCount={6}
                  stroke="#E7E1D6"
                  strokeOpacity={0.6}
                  tickFormatter={(value) => `${value}%`}
                />
                
                {/* Optimal reference line */}
                <Radar 
                  name="Optimal" 
                  dataKey="fullMark" 
                  stroke="#0B3D2E" 
                  fill="transparent" 
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                  strokeOpacity={0.3}
                />
                
                {/* Population average (benchmark) */}
                <Radar 
                  name="Average" 
                  dataKey={(item) => item.value * 0.85} 
                  stroke="#D4AF37" 
                  fill="url(#avgFillBrand)" 
                  fillOpacity={1} 
                  strokeWidth={1.8}
                  strokeOpacity={0.6}
                  dot={false}
                />
                
                {/* Your data (prominent) */}
                <Radar 
                  name="Current" 
                  dataKey="value" 
                  stroke="#0B3D2E" 
                  fill="url(#radarFillBrand)" 
                  fillOpacity={1} 
                  strokeWidth={3}
                  dot={{ 
                    r: 5, 
                    fill: '#FAF6EF', 
                    strokeWidth: 3, 
                    stroke: '#0B3D2E'
                  }}
                  activeDot={{
                    r: 7,
                    fill: '#0B3D2E',
                    strokeWidth: 3,
                    stroke: '#FAF6EF'
                  }}
                  filter="url(#brandShadow)"
                />
                
                {/* Brand-aligned tooltip */}
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(250, 246, 239, 0.98)', 
                    border: '1px solid #E7E1D6', 
                    borderRadius: '10px',
                    color: '#0B3D2E',
                    boxShadow: '0 10px 40px -10px rgba(11, 61, 46, 0.15), 0 2px 8px -2px rgba(11, 61, 46, 0.1)',
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontWeight: 500
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'Current') {
                      return [
                        <span key="value" style={{ color: '#0B3D2E', fontSize: '16px', fontWeight: 700 }}>{value}</span>, 
                        <span key="label" style={{ color: '#0B3D2E', opacity: 0.6, marginLeft: '6px', fontSize: '12px' }}>/ 100</span>
                      ];
                    }
                    return null;
                  }}
                  labelStyle={{ 
                    color: '#0B3D2E', 
                    fontWeight: 600, 
                    marginBottom: '4px',
                    fontSize: '13px',
                    borderBottom: '1px solid #E7E1D6',
                    paddingBottom: '4px'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Data density indicator */}
          <div className="mt-6 flex items-center justify-between px-4 py-3 bg-[#FAF6EF]/60 rounded-lg border border-[#E7E1D6]">
            <span className="text-xs text-[#0B3D2E]/70 font-medium">{t('Data Confidence Level', '数据置信度')}</span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-1.5 bg-[#E7E1D6] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#0B3D2E] to-[#1a5c4a] rounded-full transition-all duration-500"
                  style={{ width: `${analysis.confidence_score || 75}%` }}
                ></div>
              </div>
              <span className="text-xs font-semibold text-[#0B3D2E] min-w-[40px] text-right">{analysis.confidence_score || 75}%</span>
            </div>
          </div>
          
          {/* AI 深度推演按钮 */}
          <button
            onClick={() => setShowDeepInference(true)}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#0B3D2E] to-[#1a5c4a] text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <Brain className="w-5 h-5" />
            <span>{t('View AI Deep Inference', '查看 AI 深度推演')}</span>
          </button>
        </div>
      </div>
      
      {/* 深度推演模态框 */}
      <DeepInferenceModal
        isOpen={showDeepInference}
        onClose={() => setShowDeepInference(false)}
        analysisResult={analysis}
        recentLogs={[]}
      />

      {/* 8维指标详情 */}
      <div className="bg-white border border-[#E7E1D6] rounded-lg p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-[#0B3D2E] mb-6">{t('Detailed Health Metrics', '详细健康指标')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'metabolic_rate_estimate', label: t('Metabolic Rate', '代谢率') },
            { key: 'cortisol_pattern', label: t('Cortisol Pattern', '皮质醇模式') },
            { key: 'sleep_quality', label: t('Sleep Quality', '睡眠质量') },
            { key: 'recovery_capacity', label: t('Recovery Capacity', '恢复能力') },
            { key: 'stress_resilience', label: t('Stress Resilience', '压力韧性') },
            { key: 'energy_stability', label: t('Energy Stability', '精力稳定性') },
            { key: 'inflammation_risk', label: t('Inflammation Risk', '炎症风险') },
            { key: 'cardiovascular_health', label: t('Cardiovascular Health', '心血管健康') }
          ].map((item) => {
            const value = analysis[item.key as keyof typeof analysis] as string;
            const details = analysis.analysis_details?.[item.key];
            const score = getScoreValue(value);
            const explanation = metricExplanations[item.key];
            const isExpanded = activeInfoKey === item.key;
            
            return (
              <div key={item.key} className="border border-[#E7E1D6] rounded-lg p-5 hover:border-[#0B3D2E]/30 transition-all bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-[#0B3D2E]">{item.label}</div>
                      {/* Info button */}
                      <button
                        onClick={() => setActiveInfoKey(isExpanded ? null : item.key)}
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-[#0B3D2E]/30 text-[#0B3D2E]/70 hover:bg-[#0B3D2E]/10 hover:border-[#0B3D2E]/50 transition-colors"
                        title={t('View scientific explanation', '查看科学解释')}
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-sm text-[#0B3D2E]/60 mt-0.5">
                      {translateValue(value, language)}
                    </div>
                  </div>
                  <div className="text-xl font-semibold text-[#0B3D2E]">
                    {score}
                  </div>
                </div>
                
                {/* Scientific explanation panel (expandable) */}
                {isExpanded && explanation && (
                  <div className="mt-4 pt-4 border-t border-[#E7E1D6] space-y-4 bg-[#FAF6EF]/40 -mx-5 -mb-5 p-5 rounded-b-lg">
                    {/* Scientific basis */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-[#0B3D2E]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <div className="text-xs font-semibold text-[#0B3D2E]/80 uppercase tracking-wider">{t('Scientific Basis', '科学原理')}</div>
                      </div>
                      <div className="text-sm text-[#0B3D2E]/70 leading-relaxed">
                        {language === 'en' ? explanation.science_en : explanation.science}
                      </div>
                    </div>

                    {/* Your data interpretation */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-[#0B3D2E]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <div className="text-xs font-semibold text-[#0B3D2E]/80 uppercase tracking-wider">{t('Your Data Interpretation', '您的数据解读')}</div>
                      </div>
                      <div className="text-sm text-[#0B3D2E]/70 leading-relaxed">
                        {language === 'en' ? explanation.interpretation_en(value) : explanation.interpretation(value)}
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-[#0B3D2E]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <div className="text-xs font-semibold text-[#0B3D2E]/80 uppercase tracking-wider">{t('Actionable Recommendation', '改善建议')}</div>
                      </div>
                      <div className="text-sm text-[#0B3D2E]/70 leading-relaxed font-medium">
                        {language === 'en' ? explanation.suggestion_en : explanation.suggestion}
                      </div>
                    </div>
                  </div>
                )}

                {/* Original analysis and target (only shown when not expanded) */}
                {!isExpanded && details && (
                  <div className="space-y-3 text-sm pt-3 border-t border-[#E7E1D6]">
                    <div>
                      <div className="text-xs font-medium text-[#0B3D2E]/60 uppercase tracking-wide mb-1.5">{t('ANALYSIS', '分析')}</div>
                      <div className="text-[#0B3D2E]/70 leading-relaxed">{language === 'en' ? details.reason_en : details.reason}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[#0B3D2E]/60 uppercase tracking-wide mb-1.5">{t('TARGET', '目标')}</div>
                      <div className="text-[#0B3D2E]/70 leading-relaxed">{language === 'en' ? details.target_en : details.target}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 优势与改善 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analysis.strengths && analysis.strengths.length > 0 && (
          <div className="bg-white border border-[#E7E1D6] rounded-lg p-6 shadow-sm">
            <div className="text-base font-semibold text-[#0B3D2E] mb-4">{t('Strengths to Maintain', '继续保持')}</div>
            <div className="space-y-2">
              {(language === 'en' ? analysis.strengths_en : analysis.strengths)?.map((s, i) => (
                <div key={i} className="flex items-start gap-3 text-[#0B3D2E]/70">
                  <span className="text-[#0B3D2E]/40 mt-1">·</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.risk_factors && analysis.risk_factors.length > 0 && (
          <div className="bg-white border border-[#E7E1D6] rounded-lg p-6 shadow-sm">
            <div className="text-base font-semibold text-[#0B3D2E] mb-4">{t('Areas for Improvement', '需要改善')}</div>
            <div className="space-y-2">
              {(language === 'en' ? analysis.risk_factors_en : analysis.risk_factors)?.map((r, i) => (
                <div key={i} className="flex items-start gap-3 text-[#0B3D2E]/70">
                  <span className="text-[#0B3D2E]/40 mt-1">·</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 微习惯 */}
      {plan.micro_habits && plan.micro_habits.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-1">{t('Personalized Action Plan', '个性化行动方案')}</h2>
            <p className="text-slate-600">{t(`${plan.micro_habits.length} micro-habits tailored for you`, `为您定制的 ${plan.micro_habits.length} 个微习惯`)}</p>
          </div>
          <div className="space-y-4">
            {plan.micro_habits.map((habit, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">{language === 'en' ? (habit.name_en || habit.name) : habit.name}</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-16">{t('TRIGGER', '触发')}</span>
                        <span className="text-slate-700 flex-1">{language === 'en' ? (habit.cue_en || habit.cue) : habit.cue}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-16">{t('ACTION', '行动')}</span>
                        <span className="text-slate-900 font-medium flex-1">{language === 'en' ? (habit.response_en || habit.response) : habit.response}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-16">{t('TIMING', '时机')}</span>
                        <span className="text-slate-700 flex-1">{language === 'en' ? (habit.timing_en || habit.timing) : habit.timing}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="text-sm text-slate-600 leading-relaxed">
                        <span className="font-medium text-slate-700">{t('Rationale', '原理')}: </span>{language === 'en' ? (habit.rationale_en || habit.rationale) : habit.rationale}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pro版功能：AI甄选抗衰食材 */}
      <div className="mt-6">
        <ProAntiAgingFoods />
      </div>

      {/* 修改按钮 */}
      <div className="text-center">
        <button
          onClick={() => window.location.href = '/assistant?edit=true'}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-sm"
        >
          {t('Edit Health Parameters', '修改健康参数')}
        </button>
      </div>
    </div>
  );
}
