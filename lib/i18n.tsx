'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Language = 'zh' | 'en';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// 完整翻译字典
export const translations: Record<Language, Record<string, string>> = {
  zh: {
    // ========== 导航 ==========
    'nav.core': '核心功能',
    'nav.model': '科学模型',
    'nav.authority': '权威洞察',
    'nav.pricing': '升级',
    'nav.login': '登录',
    'nav.signup': '注册',
    'nav.assistant': '动态身体报告',
    'nav.analysis': '向你推荐',
    'nav.assessment': '症状评估',
    'nav.bayesian': '认知天平',
    'nav.plans': '我的计划',
    'nav.settings': '设置',
    'nav.early': '获取早期访问权限',
    'nav.scienceInsight': '科学与洞察',
    'nav.upgrade': '升级',

    // ========== 通用 ==========
    'common.save': '保存',
    'common.cancel': '取消',
    'common.edit': '编辑',
    'common.delete': '删除',
    'common.close': '关闭',
    'common.loading': '加载中...',
    'common.submit': '提交',
    'common.confirm': '确认',
    'common.back': '返回',
    'common.next': '下一步',
    'common.skip': '跳过',
    'common.done': '完成',
    'common.error': '出错了',
    'common.success': '成功',
    'common.retry': '重试',

    // ========== 登录页面 ==========
    'login.title': '登录',
    'login.welcome': '欢迎回来，请登录您的账户',
    'login.email': '邮箱地址',
    'login.emailPlaceholder': 'your@email.com',
    'login.password': '密码',
    'login.passwordPlaceholder': '••••••••',
    'login.forgotPassword': '忘记密码？',
    'login.submit': '登录',
    'login.processing': '处理中...',
    'login.noAccount': '还没有账户？',
    'login.signupNow': '立即注册',
    'login.orOther': '或使用其他平台登录',
    'login.promise': '我们将始终履行对抗贩卖焦虑的行为。',
    'login.success': '登录成功！正在跳转...',
    'login.sessionSetting': '登录成功，正在设置会话...',
    'login.resetPassword': '重置密码',
    'login.registeredEmail': '注册邮箱',
    'login.sendCode': '发送验证码',
    'login.sending': '发送中...',
    'login.resetSent': '密码重置链接已发送到您的邮箱，请查收邮件并按照提示重置密码',
    'login.useX': '使用 X 登录',
    'login.useGithub': '使用 GitHub 登录',
    'login.useWechat': '使用微信登录',

    // ========== 注册页面 ==========
    'signup.title': '注册',
    'signup.subtitle': '创建您的账户，开始建立健康习惯',
    'signup.wechatScan': '微信扫码',
    'signup.xSignup': 'X 注册',
    'signup.githubSignup': 'GitHub 注册',
    'signup.emailSignup': '邮箱注册',
    'signup.phoneSignup': '手机号注册',
    'signup.country': '国家 / 地区',
    'signup.phone': '手机号',
    'signup.phonePlaceholder': '请输入手机号',
    'signup.phoneHint': '我们会向此号码发送一次性验证码，用于账号创建与验证。',
    'signup.sendOtp': '发送验证码',
    'signup.otpSent': '验证码已发送，如未收到可重新发送。',
    'signup.otpCode': '验证码',
    'signup.otpPlaceholder': '输入短信验证码',
    'signup.verifyAndSignup': '验证并注册',
    'signup.verifying': '验证中...',
    'signup.smsHint': '提示：如尚未在 Supabase 控制台配置短信服务商，请先完成设置后再尝试手机注册。',
    'signup.password': '密码',
    'signup.passwordPlaceholder': '至少 6 个字符',
    'signup.confirmPassword': '确认密码',
    'signup.confirmPlaceholder': '再次输入密码',
    'signup.submit': '注册',
    'signup.processing': '注册中...',
    'signup.hasAccount': '已有账户？',
    'signup.loginNow': '立即登录',
    'signup.orOther': '或使用其他平台快速注册',
    'signup.success': '注册成功！请查收邮件以验证您的账户。',
    'signup.redirecting': '注册成功！正在为您跳转...',
    'signup.otpSuccess': '验证码验证成功，请前往登录。',
    'signup.passwordMismatch': '两次输入的密码不匹配',
    'signup.passwordTooShort': '密码长度至少为 6 个字符',
    'signup.wechatTitle': '微信扫码注册 / 登录',
    'signup.wechatDesc': '使用微信扫一扫关注我们的官方服务，即可在微信内完成注册并同步到 Web 端。',
    'signup.wechatStep1': '1. 打开微信 > 扫一扫',
    'signup.wechatStep2': '2. 关注「No More anxious」官方服务',
    'signup.wechatStep3': '3. 按指引完成注册，账号自动登录',
    'signup.wechatDone': '我已完成扫码',
    'signup.openWechat': '打开微信',

    // ========== Landing 页面 ==========
    'landing.hello': '你好，',
    'landing.friend': '朋友',
    'landing.findBalance': '让我们找到今天的平衡。',
    'landing.changeDetected': '检测到变化',
    'landing.hrvDrop': '你的 HRV 下降了 {percent}%。昨晚是否有以下情况？',
    'landing.alcohol': '🍷 饮酒',
    'landing.lateMeal': '🍜 晚餐过晚',
    'landing.stress': '😰 压力大',
    'landing.none': '都没有',
    'landing.todayInsight': '今日身体洞察',
    'landing.recoveryMode': '恢复模式',
    'landing.balanceMode': '平衡模式',
    'landing.basedOnCalibration': '基于今日校准数据',
    'landing.completeCalibration': '完成今日健康校准',
    'landing.calibrationHint': '记录你的睡眠和状态，解锁个性化洞察',
    'landing.startCalibration': '开始校准',
    'landing.healthTools': '健康工具',
    'landing.symptomAssessment': '症状评估',
    'landing.aiHealthConsult': 'AI 健康问诊',
    'landing.cognitiveScale': '认知天平',
    'landing.bayesianLoop': '贝叶斯循环',
    'landing.scientificConsensus': '科学共识',

    // ========== Landing - 核心理念 Section ==========
    'landing.coreIdea': '核心理念',
    'landing.noiseTitle': '健康产业是"噪音"。',
    'landing.truthTitle': '生理信号是"真相"。',
    'landing.cognitiveLoad': 'Cognitive Load',
    'landing.cognitiveLoadTitle': '"认知负荷"已满。',
    'landing.cognitiveLoadP1': '你知道有氧和力量训练；你懂得区分优质的蛋白质、脂肪和碳水。你明白要保证充足的睡眠。',
    'landing.cognitiveLoadP2': '但身体仍然像一个失控的"黑匣子"。',
    'landing.cognitiveLoadP3': '你发现，只是更努力地去坚持这些"规则"，并不是最终的答案。',
    'landing.habitStreaks': 'Habit Streaks',
    'landing.habitStreaksTitle': '打卡游戏好玩吗？',
    'landing.habitStreaksP1': '许多健康App依赖"羞耻感"和"强制打卡"。功能越来越多，认知负荷越来越重，却不触及"根本原因"。你的身体并没有崩溃，它只是在诚实地对压力做出反应。',
    'landing.theSignal': 'The Signal',
    'landing.theSignalTitle': '信号：接受生理真相。',
    'landing.theSignalP1': '我们承认新陈代谢的不可逆趋势，但可以选择"反应"。先解决"焦虑"（领先指标），自然改善"身体机能"（滞后指标）。不对抗真相，与真相和解。',

    // ========== Landing - 方法论 Section ==========
    'landing.methodology': '方法论',
    'landing.solutionTitle': '解决思路',
    'landing.solutionSubtitle': '这是 No More anxious™ 的核心方法论。',
    'landing.agent': 'Agent',
    'landing.agentTitle': '您的专属"健康代理"',
    'landing.agentP1': '这不是一个AI聊天机器人。',
    'landing.agentP2': '它冷血，因为它只会基于唯一的规则："生理真相"。',
    'landing.agentP3': '它不会说"加油！"。它会说："你现在感到焦虑，意味着你的皮质醇已达峰值。一个5分钟的步行是为了\'代谢\'你的压力激素。"',
    'landing.cortisolEquation': '皮质醇响应方程',
    'landing.cortisolDesc': 'λ 控制焦虑激素的自然衰减，输入 I(t) 代表 5 分钟步行等最小干预。',
    'landing.bayesian': 'Bayesian',
    'landing.bayesianTitle': '"贝叶斯信念"循环',
    'landing.bayesianP1': '我们从来不为"打卡天数"而焦虑。我们只关心"信念强度"。每次行动后，你将评估："这在起作用的确信度(1-10)"。我们帮你可视化"信心曲线"。',
    'landing.bayesianRef': '参考：后验置信度随可验证信号更新（Bayes\' theorem）',
    'landing.bayesianFormula': '每次习惯完成即是新的 D，后验信念提高 → 曲线抬升。',
    'landing.minimumDose': 'Minimum Dose',
    'landing.minimumDoseTitle': '最低有效剂量',
    'landing.minimumDoseP1': '你不需要每天锻炼1小时，那太累了。你只需要在"线索"出现时，执行"最低阻力"的"反应"（如步行5分钟）。我们帮你识别并建立这些"微习惯"。',

    // ========== Landing - 权威洞察 Section ==========
    'landing.curatedContent': '精选内容',
    'landing.noNoiseFeed': '一个没有"噪音"的信息流。',
    'landing.feedDesc': '我们从 X、顶级权威健康研报、Reddit 热议组等为您精选了该领域最顶尖的生理学家、神经科学家和表现专家的核心见解。没有励志名言，没有低效"技巧"，只有可执行的数据和第一性原理。',
    'landing.refReading': '参考阅读',
    'landing.cholesterolRef': '胆固醇过低与心理健康风险的相关性综述（英文）。',

    // ========== Landing - 肌肉衰老真相 ==========
    'landing.agingTruth': '生理真相：运动单位与衰老',
    'landing.agingCore': '核心真相：',
    'landing.agingP1': '从30岁起，你的运动神经元开始凋亡。到80岁，可能丢失40-50%的运动单位。',
    'landing.agingP2': '散步、游泳无法阻止这一过程——只有刻意的力量训练才能激活高阈值神经元。',
    'landing.agingRef': '基于 Henneman 大小原则：低强度活动只激活慢肌纤维，快肌纤维因"休眠"而加速凋亡。',

    // ========== MetabolicCodex ==========
    'systemOptimal': '系统最优',
    'uplink': '上行链路',
    'user': '用户',
    'metabolicScore': '代谢评分',
    'recoveryCapacity': '恢复能力: 高',
    'liveTelemetry': '实时遥测',
    'autonomicNervousSystem': '自主神经系统',
    'fascialTensegrity': '筋膜张整性',
    'bioElectricStatus': '生物电状态',
    'vagalCalibration': '迷走神经校准',
    'dailyInterventions': '每日干预',
    'glucose': '血糖 (CGM)',
    'ketones': '酮体',
    'cortisol': '皮质醇 (估)',
    'skinTemp': '皮肤温度',
    'restingHR': '静息心率',
    'vagalTone': '迷走张力',
    'neckLoad': '颈部负荷',
    'stable': '稳定 (-2%)',
    'optimal': '最优',
    'high': '高',
    'circadianDip': '▼ 昼夜节律低谷',
    'idle': '待机',
    'initiateProtocol': '启动协议',
    'terminateSession': '终止会话',
    'targetAlphaWaves': '目标: 增加Alpha波',
    'morningColdPlunge': '晨间冷水浸泡',
    'coherentBreathing': '协调呼吸 (5分钟)',
    'intermittentFasting': '间歇性禁食窗口',
    'zone2Cardio': '二区有氧运动',
    'biomarkerScan': '高级生物标志物扫描',
    'vagalStimulation': '迷走神经刺激',
    'anomalyDetection': '异常检测',
    'cortisolSpike': '20:00 - 检测到餐后皮质醇峰值。炎症标志物活跃。',
    'dataSource': '数据来源: OURA V3 + LEVELS CGM',
    'synced': '2分钟前同步',
    'qiFlux': '下丹田区域检测到气流。建议副交感神经激活。',
    'systemAlert': '*** 系统警报: 皮质醇清除率 -15% ***',
    'suggestion': '建议: 深度睡眠窗口延长40分钟',
    'newResearch': '新研究加载: "禁食中的线粒体动力学"',

    // ========== 设置页面 ==========
    'settings.title': '设置',
    'settings.basicInfo': '基本信息',
    'settings.healthInfo': '健康信息',
    'settings.preferences': '偏好设置',
    'settings.account': '账户',
    'settings.logout': '退出登录',
    'settings.name': '姓名',
    'settings.email': '邮箱',
    'settings.phone': '手机号',
    'settings.birthday': '生日',
    'settings.gender': '性别',
    'settings.male': '男',
    'settings.female': '女',
    'settings.other': '其他',
    'settings.height': '身高',
    'settings.weight': '体重',
    'settings.saveSuccess': '保存成功',
    'settings.saveFailed': '保存失败，请重试',

    // ========== 评估页面 ==========
    'assessment.title': '症状评估',
    'assessment.subtitle': 'AI 健康问诊',
    'assessment.start': '开始评估',
    'assessment.continue': '继续',
    'assessment.finish': '完成评估',
    'assessment.result': '评估结果',
    'assessment.recommendation': '建议',

    // ========== 贝叶斯页面 ==========
    'bayesian.title': '认知天平',
    'bayesian.subtitle': '贝叶斯信念循环',
    'bayesian.beliefStrength': '信念强度',
    'bayesian.evidence': '证据',
    'bayesian.update': '更新信念',

    // ========== 计划页面 ==========
    'plans.title': '我的计划',
    'plans.empty': '暂无计划',
    'plans.create': '创建计划',
    'plans.active': '进行中',
    'plans.completed': '已完成',

    // ========== 分析页面 ==========
    'analysis.title': '分析报告',
    'analysis.generating': '正在生成分析...',
    'analysis.noData': '暂无数据',

    // ========== 助手页面 ==========
    'assistant.title': '动态身体报告',
    'assistant.placeholder': '输入您的问题...',
    'assistant.send': '发送',

    // ========== 错误消息 ==========
    'error.network': '网络错误，请检查您的连接',
    'error.server': '服务器错误，请稍后再试',
    'error.auth': '认证失败，请重新登录',
    'error.unknown': '发生未知错误',
    'error.tryAgain': '让我们再试一次',

    // ========== 时间相关 ==========
    'time.today': '今天',
    'time.yesterday': '昨天',
    'time.thisWeek': '本周',
    'time.thisMonth': '本月',
    'time.morning': '早上',
    'time.afternoon': '下午',
    'time.evening': '晚上',
    'time.night': '夜间',
  },

  en: {
    // ========== Navigation ==========
    'nav.core': 'Core Features',
    'nav.model': 'Scientific Model',
    'nav.authority': 'Authority Insights',
    'nav.pricing': 'Upgrade',
    'nav.login': 'Login',
    'nav.signup': 'Sign Up',
    'nav.assistant': 'Body Report',
    'nav.analysis': 'For You',
    'nav.assessment': 'Assessment',
    'nav.bayesian': 'Cognitive Scale',
    'nav.plans': 'My Plans',
    'nav.settings': 'Settings',
    'nav.early': 'Get Early Access',
    'nav.scienceInsight': 'Science & Insights',
    'nav.upgrade': 'Upgrade',

    // ========== Common ==========
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.close': 'Close',
    'common.loading': 'Loading...',
    'common.submit': 'Submit',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.skip': 'Skip',
    'common.done': 'Done',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.retry': 'Retry',

    // ========== Login Page ==========
    'login.title': 'Login',
    'login.welcome': 'Welcome back, please login to your account',
    'login.email': 'Email Address',
    'login.emailPlaceholder': 'your@email.com',
    'login.password': 'Password',
    'login.passwordPlaceholder': '••••••••',
    'login.forgotPassword': 'Forgot password?',
    'login.submit': 'Login',
    'login.processing': 'Processing...',
    'login.noAccount': "Don't have an account?",
    'login.signupNow': 'Sign up now',
    'login.orOther': 'Or login with other platforms',
    'login.promise': 'We will always fight against anxiety-inducing marketing.',
    'login.success': 'Login successful! Redirecting...',
    'login.sessionSetting': 'Login successful, setting up session...',
    'login.resetPassword': 'Reset Password',
    'login.registeredEmail': 'Registered Email',
    'login.sendCode': 'Send Code',
    'login.sending': 'Sending...',
    'login.resetSent': 'Password reset link has been sent to your email. Please check your inbox.',
    'login.useX': 'Login with X',
    'login.useGithub': 'Login with GitHub',
    'login.useWechat': 'Login with WeChat',

    // ========== Signup Page ==========
    'signup.title': 'Sign Up',
    'signup.subtitle': 'Create your account and start building healthy habits',
    'signup.wechatScan': 'WeChat Scan',
    'signup.xSignup': 'X Sign Up',
    'signup.githubSignup': 'GitHub Sign Up',
    'signup.emailSignup': 'Email Sign Up',
    'signup.phoneSignup': 'Phone Sign Up',
    'signup.country': 'Country / Region',
    'signup.phone': 'Phone Number',
    'signup.phonePlaceholder': 'Enter your phone number',
    'signup.phoneHint': 'We will send a one-time verification code to this number.',
    'signup.sendOtp': 'Send Code',
    'signup.otpSent': 'Code sent. Resend if not received.',
    'signup.otpCode': 'Verification Code',
    'signup.otpPlaceholder': 'Enter SMS code',
    'signup.verifyAndSignup': 'Verify & Sign Up',
    'signup.verifying': 'Verifying...',
    'signup.smsHint': 'Note: Please configure SMS provider in Supabase console before using phone signup.',
    'signup.password': 'Password',
    'signup.passwordPlaceholder': 'At least 6 characters',
    'signup.confirmPassword': 'Confirm Password',
    'signup.confirmPlaceholder': 'Re-enter password',
    'signup.submit': 'Sign Up',
    'signup.processing': 'Signing up...',
    'signup.hasAccount': 'Already have an account?',
    'signup.loginNow': 'Login now',
    'signup.orOther': 'Or sign up with other platforms',
    'signup.success': 'Sign up successful! Please check your email to verify your account.',
    'signup.redirecting': 'Sign up successful! Redirecting...',
    'signup.otpSuccess': 'Verification successful, please login.',
    'signup.passwordMismatch': 'Passwords do not match',
    'signup.passwordTooShort': 'Password must be at least 6 characters',
    'signup.wechatTitle': 'WeChat Scan to Sign Up / Login',
    'signup.wechatDesc': 'Scan with WeChat to follow our official service and complete registration.',
    'signup.wechatStep1': '1. Open WeChat > Scan',
    'signup.wechatStep2': '2. Follow "No More anxious" official service',
    'signup.wechatStep3': '3. Complete registration as guided',
    'signup.wechatDone': 'I have completed scanning',
    'signup.openWechat': 'Open WeChat',

    // ========== Landing Page ==========
    'landing.hello': 'Hello, ',
    'landing.friend': 'Friend',
    'landing.findBalance': "Let's find today's balance.",
    'landing.changeDetected': 'Change Detected',
    'landing.hrvDrop': 'Your HRV dropped by {percent}%. Did any of these happen last night?',
    'landing.alcohol': '🍷 Alcohol',
    'landing.lateMeal': '🍜 Late Dinner',
    'landing.stress': '😰 High Stress',
    'landing.none': 'None',
    'landing.todayInsight': "Today's Body Insight",
    'landing.recoveryMode': 'Recovery Mode',
    'landing.balanceMode': 'Balance Mode',
    'landing.basedOnCalibration': 'Based on today\'s calibration data',
    'landing.completeCalibration': 'Complete Daily Health Calibration',
    'landing.calibrationHint': 'Record your sleep and status to unlock personalized insights',
    'landing.startCalibration': 'Start Calibration',
    'landing.healthTools': 'Health Tools',
    'landing.symptomAssessment': 'Symptom Assessment',
    'landing.aiHealthConsult': 'AI Health Consult',
    'landing.cognitiveScale': 'Cognitive Scale',
    'landing.bayesianLoop': 'Bayesian Loop',
    'landing.scientificConsensus': 'Scientific Consensus',

    // ========== Landing - Core Idea Section ==========
    'landing.coreIdea': 'Core Philosophy',
    'landing.noiseTitle': 'The health industry is "noise".',
    'landing.truthTitle': 'Physiological signals are "truth".',
    'landing.cognitiveLoad': 'Cognitive Load',
    'landing.cognitiveLoadTitle': '"Cognitive Load" is full.',
    'landing.cognitiveLoadP1': 'You know about cardio and strength training; you understand quality proteins, fats, and carbs. You know you need enough sleep.',
    'landing.cognitiveLoadP2': 'But your body still feels like an out-of-control "black box".',
    'landing.cognitiveLoadP3': 'You realize that just trying harder to follow these "rules" is not the final answer.',
    'landing.habitStreaks': 'Habit Streaks',
    'landing.habitStreaksTitle': 'Is the streak game fun?',
    'landing.habitStreaksP1': 'Many health apps rely on "shame" and "forced check-ins". More features, heavier cognitive load, yet never addressing the "root cause". Your body hasn\'t collapsed—it\'s just honestly responding to stress.',
    'landing.theSignal': 'The Signal',
    'landing.theSignalTitle': 'Signal: Accept physiological truth.',
    'landing.theSignalP1': 'We acknowledge the irreversible trend of metabolism, but we can choose our "response". First solve "anxiety" (leading indicator), naturally improve "body function" (lagging indicator). Don\'t fight the truth—reconcile with it.',

    // ========== Landing - Methodology Section ==========
    'landing.methodology': 'Methodology',
    'landing.solutionTitle': 'The Solution',
    'landing.solutionSubtitle': 'This is the core methodology of No More anxious™.',
    'landing.agent': 'Agent',
    'landing.agentTitle': 'Your Personal "Health Agent"',
    'landing.agentP1': 'This is not an AI chatbot.',
    'landing.agentP2': 'It\'s cold-blooded, because it only follows one rule: "Physiological Truth".',
    'landing.agentP3': 'It won\'t say "You can do it!". It will say: "You\'re feeling anxious now, meaning your cortisol has peaked. A 5-minute walk is to \'metabolize\' your stress hormones."',
    'landing.cortisolEquation': 'Cortisol Response Equation',
    'landing.cortisolDesc': 'λ controls the natural decay of anxiety hormones, input I(t) represents minimal interventions like a 5-minute walk.',
    'landing.bayesian': 'Bayesian',
    'landing.bayesianTitle': '"Bayesian Belief" Loop',
    'landing.bayesianP1': 'We never worry about "streak days". We only care about "belief strength". After each action, you\'ll evaluate: "Confidence that this is working (1-10)". We help you visualize the "confidence curve".',
    'landing.bayesianRef': 'Reference: Posterior confidence updates with verifiable signals (Bayes\' theorem)',
    'landing.bayesianFormula': 'Each habit completion is new D, posterior belief increases → curve rises.',
    'landing.minimumDose': 'Minimum Dose',
    'landing.minimumDoseTitle': 'Minimum Effective Dose',
    'landing.minimumDoseP1': 'You don\'t need to exercise 1 hour daily—that\'s exhausting. You just need to execute the "lowest resistance" response when "cues" appear (like a 5-minute walk). We help you identify and build these "micro-habits".',

    // ========== Landing - Authority Section ==========
    'landing.curatedContent': 'Curated Content',
    'landing.noNoiseFeed': 'A feed without "noise".',
    'landing.feedDesc': 'We curate core insights from top physiologists, neuroscientists, and performance experts from X, top health reports, Reddit discussions. No motivational quotes, no ineffective "tips"—just actionable data and first principles.',
    'landing.refReading': 'Reference Reading',
    'landing.cholesterolRef': 'Review on the correlation between low cholesterol and mental health risks.',

    // ========== Landing - Aging Truth ==========
    'landing.agingTruth': 'Physiological Truth: Motor Units & Aging',
    'landing.agingCore': 'Core Truth:',
    'landing.agingP1': 'From age 30, your motor neurons begin to die. By 80, you may lose 40-50% of motor units.',
    'landing.agingP2': 'Walking and swimming cannot stop this process—only deliberate strength training can activate high-threshold neurons.',
    'landing.agingRef': 'Based on Henneman\'s Size Principle: Low-intensity activities only activate slow-twitch fibers; fast-twitch fibers accelerate atrophy due to "dormancy".',

    // ========== MetabolicCodex ==========
    'systemOptimal': 'SYSTEM_OPTIMAL',
    'uplink': 'UPLINK',
    'user': 'USER',
    'metabolicScore': 'METABOLIC SCORE',
    'recoveryCapacity': 'Recovery Capacity: High',
    'liveTelemetry': 'LIVE TELEMETRY',
    'autonomicNervousSystem': 'AUTONOMIC NERVOUS SYSTEM',
    'fascialTensegrity': 'FASCIAL TENSEGRITY',
    'bioElectricStatus': 'BIO-ELECTRIC STATUS',
    'vagalCalibration': 'VAGAL CALIBRATION',
    'dailyInterventions': 'DAILY INTERVENTIONS',
    'glucose': 'Glucose (CGM)',
    'ketones': 'Ketones',
    'cortisol': 'Cortisol (Est)',
    'skinTemp': 'Skin Temp',
    'restingHR': 'Resting HR',
    'vagalTone': 'VAGAL TONE',
    'neckLoad': 'NECK LOAD',
    'stable': 'Stable (-2%)',
    'optimal': 'OPTIMAL',
    'high': 'HIGH',
    'circadianDip': '▼ Circadian Dip',
    'idle': 'IDLE',
    'initiateProtocol': 'INITIATE PROTOCOL',
    'terminateSession': 'TERMINATE SESSION',
    'targetAlphaWaves': 'Target: Increase Alpha Waves',
    'morningColdPlunge': 'Morning Cold Plunge',
    'coherentBreathing': 'Coherent Breathing (5min)',
    'intermittentFasting': 'Intermittent Fasting Window',
    'zone2Cardio': 'Zone 2 Cardio',
    'biomarkerScan': 'Advanced Biomarker Scan',
    'vagalStimulation': 'Vagal Nerve Stimulation',
    'anomalyDetection': 'ANOMALY DETECTION',
    'cortisolSpike': '20:00 - High cortisol spike detected post-meal. Inflammation markers active.',
    'dataSource': 'DATA SOURCE: OURA V3 + LEVELS CGM',
    'synced': 'SYNCED 2M AGO',
    'qiFlux': 'Qi flux detected in lower Dan Tian region. Parasympathetic activation recommended.',
    'systemAlert': '*** SYSTEM ALERT: CORTISOL CLEARANCE RATE -15% ***',
    'suggestion': 'SUGGESTION: EXTEND DEEP SLEEP WINDOW BY 40MIN',
    'newResearch': 'NEW RESEARCH LOADED: "MITOCHONDRIAL DYNAMICS IN FASTING"',

    // ========== Settings Page ==========
    'settings.title': 'Settings',
    'settings.basicInfo': 'Basic Info',
    'settings.healthInfo': 'Health Info',
    'settings.preferences': 'Preferences',
    'settings.account': 'Account',
    'settings.logout': 'Logout',
    'settings.name': 'Name',
    'settings.email': 'Email',
    'settings.phone': 'Phone',
    'settings.birthday': 'Birthday',
    'settings.gender': 'Gender',
    'settings.male': 'Male',
    'settings.female': 'Female',
    'settings.other': 'Other',
    'settings.height': 'Height',
    'settings.weight': 'Weight',
    'settings.saveSuccess': 'Saved successfully',
    'settings.saveFailed': 'Save failed, please try again',

    // ========== Assessment Page ==========
    'assessment.title': 'Symptom Assessment',
    'assessment.subtitle': 'AI Health Consultation',
    'assessment.start': 'Start Assessment',
    'assessment.continue': 'Continue',
    'assessment.finish': 'Complete Assessment',
    'assessment.result': 'Assessment Result',
    'assessment.recommendation': 'Recommendation',

    // ========== Bayesian Page ==========
    'bayesian.title': 'Cognitive Scale',
    'bayesian.subtitle': 'Bayesian Belief Loop',
    'bayesian.beliefStrength': 'Belief Strength',
    'bayesian.evidence': 'Evidence',
    'bayesian.update': 'Update Belief',

    // ========== Plans Page ==========
    'plans.title': 'My Plans',
    'plans.empty': 'No plans yet',
    'plans.create': 'Create Plan',
    'plans.active': 'Active',
    'plans.completed': 'Completed',

    // ========== Analysis Page ==========
    'analysis.title': 'Analysis Report',
    'analysis.generating': 'Generating analysis...',
    'analysis.noData': 'No data available',

    // ========== Assistant Page ==========
    'assistant.title': 'Dynamic Body Report',
    'assistant.placeholder': 'Enter your question...',
    'assistant.send': 'Send',

    // ========== Error Messages ==========
    'error.network': 'Network error, please check your connection',
    'error.server': 'Server error, please try again later',
    'error.auth': 'Authentication failed, please login again',
    'error.unknown': 'An unknown error occurred',
    'error.tryAgain': 'Let\'s try that again gently',

    // ========== Time Related ==========
    'time.today': 'Today',
    'time.yesterday': 'Yesterday',
    'time.thisWeek': 'This Week',
    'time.thisMonth': 'This Month',
    'time.morning': 'Morning',
    'time.afternoon': 'Afternoon',
    'time.evening': 'Evening',
    'time.night': 'Night',
  },
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('zh');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('app_language') as Language | null;
    if (savedLang === 'zh' || savedLang === 'en') {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback((key: string): string => {
    return translations[language]?.[key] || key;
  }, [language]);

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
