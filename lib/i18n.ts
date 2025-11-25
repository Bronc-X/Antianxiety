export type Language = 'zh' | 'en';

export interface Translations {
  // Header
  systemOptimal: string;
  uplink: string;
  user: string;
  
  // Cards
  metabolicScore: string;
  recoveryCapacity: string;
  liveTelemetry: string;
  autonomicNervousSystem: string;
  fascialTensegrity: string;
  bioElectricStatus: string;
  vagalCalibration: string;
  dailyInterventions: string;
  
  // Metrics
  glucose: string;
  ketones: string;
  cortisol: string;
  skinTemp: string;
  restingHR: string;
  vagalTone: string;
  neckLoad: string;
  
  // Status
  stable: string;
  optimal: string;
  high: string;
  circadianDip: string;
  
  // Breathing
  idle: string;
  initiateProtocol: string;
  terminateSession: string;
  targetAlphaWaves: string;
  
  // Tasks
  morningColdPlunge: string;
  coherentBreathing: string;
  intermittentFasting: string;
  zone2Cardio: string;
  biomarkerScan: string;
  vagalStimulation: string;
  
  // Times
  timeSlots: {
    '06:00': string;
    '09:30': string;
    '12:00-20:00': string;
    '16:00': string;
    '18:00': string;
    '20:30': string;
  };
  
  // Alerts
  anomalyDetection: string;
  cortisolSpike: string;
  dataSource: string;
  synced: string;
  qiFlux: string;
  
  // Status alerts
  systemAlert: string;
  suggestion: string;
  newResearch: string;
}

export const translations: Record<Language, Translations> = {
  zh: {
    // Header
    systemOptimal: '系统最优',
    uplink: '上行链路',
    user: '用户',
    
    // Cards
    metabolicScore: '代谢评分',
    recoveryCapacity: '恢复能力: 高',
    liveTelemetry: '实时遥测',
    autonomicNervousSystem: '自主神经系统',
    fascialTensegrity: '筋膜张整性',
    bioElectricStatus: '生物电状态',
    vagalCalibration: '迷走神经校准',
    dailyInterventions: '每日干预',
    
    // Metrics
    glucose: '血糖 (CGM)',
    ketones: '酮体',
    cortisol: '皮质醇 (估)',
    skinTemp: '皮肤温度',
    restingHR: '静息心率',
    vagalTone: '迷走张力',
    neckLoad: '颈部负荷',
    
    // Status
    stable: '稳定 (-2%)',
    optimal: '最优',
    high: '高',
    circadianDip: '▼ 昼夜节律低谷',
    
    // Breathing
    idle: '待机',
    initiateProtocol: '启动协议',
    terminateSession: '终止会话',
    targetAlphaWaves: '目标: 增加Alpha波',
    
    // Tasks
    morningColdPlunge: '晨间冷水浸泡',
    coherentBreathing: '协调呼吸 (5分钟)',
    intermittentFasting: '间歇性禁食窗口',
    zone2Cardio: '二区有氧运动',
    biomarkerScan: '高级生物标志物扫描',
    vagalStimulation: '迷走神经刺激',
    
    // Times
    timeSlots: {
      '06:00': '06:00',
      '09:30': '09:30',
      '12:00-20:00': '12:00-20:00',
      '16:00': '16:00',
      '18:00': '18:00',
      '20:30': '20:30',
    },
    
    // Alerts
    anomalyDetection: '异常检测',
    cortisolSpike: '20:00 - 检测到餐后皮质醇峰值。炎症标志物活跃。',
    dataSource: '数据来源: OURA V3 + LEVELS CGM',
    synced: '2分钟前同步',
    qiFlux: '下丹田区域检测到气流。建议副交感神经激活。',
    
    // Status alerts
    systemAlert: '*** 系统警报: 皮质醇清除率 -15% ***',
    suggestion: '建议: 深度睡眠窗口延长40分钟',
    newResearch: '新研究加载: "禁食中的线粒体动力学"',
  },
  
  en: {
    // Header
    systemOptimal: 'SYSTEM_OPTIMAL',
    uplink: 'UPLINK',
    user: 'USER',
    
    // Cards
    metabolicScore: 'METABOLIC SCORE',
    recoveryCapacity: 'Recovery Capacity: High',
    liveTelemetry: 'LIVE TELEMETRY',
    autonomicNervousSystem: 'AUTONOMIC NERVOUS SYSTEM',
    fascialTensegrity: 'FASCIAL TENSEGRITY',
    bioElectricStatus: 'BIO-ELECTRIC STATUS',
    vagalCalibration: 'VAGAL CALIBRATION',
    dailyInterventions: 'DAILY INTERVENTIONS',
    
    // Metrics
    glucose: 'Glucose (CGM)',
    ketones: 'Ketones',
    cortisol: 'Cortisol (Est)',
    skinTemp: 'Skin Temp',
    restingHR: 'Resting HR',
    vagalTone: 'VAGAL TONE',
    neckLoad: 'NECK LOAD',
    
    // Status
    stable: 'Stable (-2%)',
    optimal: 'OPTIMAL',
    high: 'HIGH',
    circadianDip: '▼ Circadian Dip',
    
    // Breathing
    idle: 'IDLE',
    initiateProtocol: 'INITIATE PROTOCOL',
    terminateSession: 'TERMINATE SESSION',
    targetAlphaWaves: 'Target: Increase Alpha Waves',
    
    // Tasks
    morningColdPlunge: 'Morning Cold Plunge',
    coherentBreathing: 'Coherent Breathing (5min)',
    intermittentFasting: 'Intermittent Fasting Window',
    zone2Cardio: 'Zone 2 Cardio',
    biomarkerScan: 'Advanced Biomarker Scan',
    vagalStimulation: 'Vagal Nerve Stimulation',
    
    // Times
    timeSlots: {
      '06:00': '06:00',
      '09:30': '09:30',
      '12:00-20:00': '12:00-20:00',
      '16:00': '16:00',
      '18:00': '18:00',
      '20:30': '20:30',
    },
    
    // Alerts
    anomalyDetection: 'ANOMALY DETECTION',
    cortisolSpike: '20:00 - High cortisol spike detected post-meal. Inflammation markers active.',
    dataSource: 'DATA SOURCE: OURA V3 + LEVELS CGM',
    synced: 'SYNCED 2M AGO',
    qiFlux: 'Qi flux detected in lower Dan Tian region. Parasympathetic activation recommended.',
    
    // Status alerts
    systemAlert: '*** SYSTEM ALERT: CORTISOL CLEARANCE RATE -15% ***',
    suggestion: 'SUGGESTION: EXTEND DEEP SLEEP WINDOW BY 40MIN',
    newResearch: 'NEW RESEARCH LOADED: "MITOCHONDRIAL DYNAMICS IN FASTING"',
  }
};
