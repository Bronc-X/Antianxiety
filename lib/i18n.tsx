'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'zh' | 'en';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// 翻译字典 - 导出供组件直接使用
export const translations: Record<Language, Record<string, string>> = {
  zh: {
    // 导航
    'nav.core': '核心功能',
    'nav.model': '科学模型',
    'nav.authority': '权威洞察',
    'nav.pricing': '升级',
    'nav.login': '登录',
    'nav.assistant': '分析报告',
    'nav.early': '获取早期访问权限',
    // 通用
    'common.save': '保存',
    'common.cancel': '取消',
    'common.edit': '编辑',
    'common.delete': '删除',
    'common.close': '关闭',
    // MetabolicCodex - Header
    'systemOptimal': '系统最优',
    'uplink': '上行链路',
    'user': '用户',
    // MetabolicCodex - Cards
    'metabolicScore': '代谢评分',
    'recoveryCapacity': '恢复能力: 高',
    'liveTelemetry': '实时遥测',
    'autonomicNervousSystem': '自主神经系统',
    'fascialTensegrity': '筋膜张整性',
    'bioElectricStatus': '生物电状态',
    'vagalCalibration': '迷走神经校准',
    'dailyInterventions': '每日干预',
    // MetabolicCodex - Metrics
    'glucose': '血糖 (CGM)',
    'ketones': '酮体',
    'cortisol': '皮质醇 (估)',
    'skinTemp': '皮肤温度',
    'restingHR': '静息心率',
    'vagalTone': '迷走张力',
    'neckLoad': '颈部负荷',
    // MetabolicCodex - Status
    'stable': '稳定 (-2%)',
    'optimal': '最优',
    'high': '高',
    'circadianDip': '▼ 昼夜节律低谷',
    // MetabolicCodex - Breathing
    'idle': '待机',
    'initiateProtocol': '启动协议',
    'terminateSession': '终止会话',
    'targetAlphaWaves': '目标: 增加Alpha波',
    // MetabolicCodex - Tasks
    'morningColdPlunge': '晨间冷水浸泡',
    'coherentBreathing': '协调呼吸 (5分钟)',
    'intermittentFasting': '间歇性禁食窗口',
    'zone2Cardio': '二区有氧运动',
    'biomarkerScan': '高级生物标志物扫描',
    'vagalStimulation': '迷走神经刺激',
    // MetabolicCodex - Alerts
    'anomalyDetection': '异常检测',
    'cortisolSpike': '20:00 - 检测到餐后皮质醇峰值。炎症标志物活跃。',
    'dataSource': '数据来源: OURA V3 + LEVELS CGM',
    'synced': '2分钟前同步',
    'qiFlux': '下丹田区域检测到气流。建议副交感神经激活。',
    'systemAlert': '*** 系统警报: 皮质醇清除率 -15% ***',
    'suggestion': '建议: 深度睡眠窗口延长40分钟',
    'newResearch': '新研究加载: "禁食中的线粒体动力学"',
  },
  en: {
    // 导航
    'nav.core': 'Core Features',
    'nav.model': 'Scientific Model',
    'nav.authority': 'Authority Insights',
    'nav.pricing': 'Upgrade',
    'nav.login': 'Login',
    'nav.assistant': 'Analysis Report',
    'nav.early': 'Get Early Access',
    // 通用
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.close': 'Close',
    // MetabolicCodex - Header
    'systemOptimal': 'SYSTEM_OPTIMAL',
    'uplink': 'UPLINK',
    'user': 'USER',
    // MetabolicCodex - Cards
    'metabolicScore': 'METABOLIC SCORE',
    'recoveryCapacity': 'Recovery Capacity: High',
    'liveTelemetry': 'LIVE TELEMETRY',
    'autonomicNervousSystem': 'AUTONOMIC NERVOUS SYSTEM',
    'fascialTensegrity': 'FASCIAL TENSEGRITY',
    'bioElectricStatus': 'BIO-ELECTRIC STATUS',
    'vagalCalibration': 'VAGAL CALIBRATION',
    'dailyInterventions': 'DAILY INTERVENTIONS',
    // MetabolicCodex - Metrics
    'glucose': 'Glucose (CGM)',
    'ketones': 'Ketones',
    'cortisol': 'Cortisol (Est)',
    'skinTemp': 'Skin Temp',
    'restingHR': 'Resting HR',
    'vagalTone': 'VAGAL TONE',
    'neckLoad': 'NECK LOAD',
    // MetabolicCodex - Status
    'stable': 'Stable (-2%)',
    'optimal': 'OPTIMAL',
    'high': 'HIGH',
    'circadianDip': '▼ Circadian Dip',
    // MetabolicCodex - Breathing
    'idle': 'IDLE',
    'initiateProtocol': 'INITIATE PROTOCOL',
    'terminateSession': 'TERMINATE SESSION',
    'targetAlphaWaves': 'Target: Increase Alpha Waves',
    // MetabolicCodex - Tasks
    'morningColdPlunge': 'Morning Cold Plunge',
    'coherentBreathing': 'Coherent Breathing (5min)',
    'intermittentFasting': 'Intermittent Fasting Window',
    'zone2Cardio': 'Zone 2 Cardio',
    'biomarkerScan': 'Advanced Biomarker Scan',
    'vagalStimulation': 'Vagal Nerve Stimulation',
    // MetabolicCodex - Alerts
    'anomalyDetection': 'ANOMALY DETECTION',
    'cortisolSpike': '20:00 - High cortisol spike detected post-meal. Inflammation markers active.',
    'dataSource': 'DATA SOURCE: OURA V3 + LEVELS CGM',
    'synced': 'SYNCED 2M AGO',
    'qiFlux': 'Qi flux detected in lower Dan Tian region. Parasympathetic activation recommended.',
    'systemAlert': '*** SYSTEM ALERT: CORTISOL CLEARANCE RATE -15% ***',
    'suggestion': 'SUGGESTION: EXTEND DEEP SLEEP WINDOW BY 40MIN',
    'newResearch': 'NEW RESEARCH LOADED: "MITOCHONDRIAL DYNAMICS IN FASTING"',
  },
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // 始终以 'zh' 作为初始值，避免 hydration 不匹配
  const [language, setLanguageState] = useState<Language>('zh');
  const [mounted, setMounted] = useState(false);

  // 客户端 mounted 后再读取 localStorage
  React.useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('app_language') as Language | null;
    if (savedLang === 'zh' || savedLang === 'en') {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
    // 更新html lang属性
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

