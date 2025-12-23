/**
 * Clinical Scales Source Attributions
 * 
 * 量表出处归属信息 - 为每个临床量表提供权威的学术来源
 * 包含原始文献引用、开发机构、中文验证研究等信息
 */

import type { ScaleSourceAttribution } from './types';

/**
 * GAD-7 广泛性焦虑障碍量表出处
 * Reference: Spitzer RL, et al. Archives of Internal Medicine, 2006
 */
export const GAD7_SOURCE: ScaleSourceAttribution = {
    originalCitation: {
        authors: "Spitzer RL, Kroenke K, Williams JBW, Löwe B",
        year: 2006,
        title: "A Brief Measure for Assessing Generalized Anxiety Disorder: The GAD-7",
        journal: "Archives of Internal Medicine",
        volume: "166(10), 1092-1097",
        doi: "10.1001/archinte.166.10.1092",
        pmid: "16717171"
    },
    developingInstitution: "哥伦比亚大学 / 辉瑞公司",
    developingInstitutionEn: "Columbia University / Pfizer Inc.",
    copyrightStatus: "public_domain",
    usagePermission: "公共领域，可免费使用于临床和研究目的",
    usagePermissionEn: "Public domain, free to use for clinical and research purposes",
    chineseValidation: {
        authors: "何筱衍, 李春波, 钱洁, 崔海松, 吴文源",
        year: 2010,
        title: "广泛性焦虑量表在综合性医院的信度和效度研究",
        journal: "上海精神医学",
        volume: "22(4), 200-203"
    },
    briefDescription: "GAD-7 是一个简短的自评量表，用于筛查和评估广泛性焦虑障碍的严重程度。该量表已在全球范围内广泛验证，具有良好的信效度。",
    briefDescriptionEn: "The GAD-7 is a brief self-report scale for screening and measuring the severity of generalized anxiety disorder. It has been extensively validated worldwide with good reliability and validity.",
    primaryUseCase: "焦虑症状筛查、焦虑严重程度评估、治疗效果监测",
    primaryUseCaseEn: "Anxiety screening, severity assessment, treatment monitoring",
    officialUrl: "https://www.phqscreeners.com/"
};

/**
 * PHQ-9 患者健康问卷出处
 * Reference: Kroenke K, et al. Journal of General Internal Medicine, 2001
 */
export const PHQ9_SOURCE: ScaleSourceAttribution = {
    originalCitation: {
        authors: "Kroenke K, Spitzer RL, Williams JB",
        year: 2001,
        title: "The PHQ-9: validity of a brief depression severity measure",
        journal: "Journal of General Internal Medicine",
        volume: "16(9), 606-613",
        doi: "10.1046/j.1525-1497.2001.016009606.x",
        pmid: "11556941"
    },
    developingInstitution: "哥伦比亚大学 / 辉瑞公司",
    developingInstitutionEn: "Columbia University / Pfizer Inc.",
    copyrightStatus: "public_domain",
    usagePermission: "公共领域，可免费使用于临床和研究目的",
    usagePermissionEn: "Public domain, free to use for clinical and research purposes",
    chineseValidation: {
        authors: "王纯, 张宁, 陈瑜",
        year: 2009,
        title: "患者健康问卷抑郁量表(PHQ-9)在综合医院应用的信效度",
        journal: "中国临床心理学杂志",
        volume: "17(1), 31-33"
    },
    briefDescription: "PHQ-9 是基于 DSM-IV 抑郁症诊断标准开发的9项自评量表，用于抑郁症的筛查和严重程度评估。",
    briefDescriptionEn: "The PHQ-9 is a 9-item self-report scale based on DSM-IV depression criteria, used for depression screening and severity assessment.",
    primaryUseCase: "抑郁症状筛查、抑郁严重程度评估、治疗效果监测",
    primaryUseCaseEn: "Depression screening, severity assessment, treatment monitoring",
    officialUrl: "https://www.phqscreeners.com/"
};


/**
 * ISI 失眠严重程度指数出处
 * Reference: Bastien CH, et al. Sleep Medicine, 2001
 */
export const ISI_SOURCE: ScaleSourceAttribution = {
    originalCitation: {
        authors: "Bastien CH, Vallières A, Morin CM",
        year: 2001,
        title: "Validation of the Insomnia Severity Index as an outcome measure for insomnia research",
        journal: "Sleep Medicine",
        volume: "2(4), 297-307",
        doi: "10.1016/s1389-9457(00)00065-4",
        pmid: "11438246"
    },
    developingInstitution: "拉瓦尔大学睡眠研究中心",
    developingInstitutionEn: "Université Laval Sleep Research Center",
    copyrightStatus: "public_domain",
    usagePermission: "公共领域，可免费使用于临床和研究目的",
    usagePermissionEn: "Public domain, free to use for clinical and research purposes",
    chineseValidation: {
        authors: "于恩彦, 吴万振, 施剑飞",
        year: 2010,
        title: "失眠严重程度指数量表中文版的信度和效度",
        journal: "中华行为医学与脑科学杂志",
        volume: "19(8), 735-738"
    },
    briefDescription: "ISI 是一个7项自评量表，用于评估失眠的性质、严重程度及其对日常功能的影响。",
    briefDescriptionEn: "The ISI is a 7-item self-report scale assessing the nature, severity, and impact of insomnia on daily functioning.",
    primaryUseCase: "失眠筛查、失眠严重程度评估、睡眠治疗效果监测",
    primaryUseCaseEn: "Insomnia screening, severity assessment, sleep treatment monitoring"
};

/**
 * PSS-10 感知压力量表出处
 * Reference: Cohen S, et al. Journal of Health and Social Behavior, 1983
 */
export const PSS10_SOURCE: ScaleSourceAttribution = {
    originalCitation: {
        authors: "Cohen S, Kamarck T, Mermelstein R",
        year: 1983,
        title: "A global measure of perceived stress",
        journal: "Journal of Health and Social Behavior",
        volume: "24(4), 385-396",
        doi: "10.2307/2136404",
        pmid: "6668417"
    },
    developingInstitution: "卡内基梅隆大学",
    developingInstitutionEn: "Carnegie Mellon University",
    copyrightStatus: "public_domain",
    usagePermission: "公共领域，可免费使用于临床和研究目的",
    usagePermissionEn: "Public domain, free to use for clinical and research purposes",
    chineseValidation: {
        authors: "杨廷忠, 黄汉腾",
        year: 2003,
        title: "社会转型中城市居民心理压力的流行病学研究",
        journal: "中华流行病学杂志",
        volume: "24(9), 760-764"
    },
    briefDescription: "PSS 是最广泛使用的心理压力测量工具，评估个体在过去一个月内感知到的压力程度。",
    briefDescriptionEn: "The PSS is the most widely used psychological instrument for measuring perceived stress over the past month.",
    primaryUseCase: "压力水平评估、心理健康筛查、压力管理效果监测",
    primaryUseCaseEn: "Stress level assessment, mental health screening, stress management monitoring"
};

/**
 * SHSQ-25 亚健康状态问卷出处
 * Reference: Yan YX, et al. Journal of Epidemiology, 2009
 */
export const SHSQ25_SOURCE: ScaleSourceAttribution = {
    originalCitation: {
        authors: "Yan YX, Liu YQ, Li M, Hu PF, Guo AM, Yang XH, Qiu JJ, Yang SS, Shen J, Zhang LP, Wang W",
        year: 2009,
        title: "Development and evaluation of a questionnaire for measuring suboptimal health status in urban Chinese",
        journal: "Journal of Epidemiology",
        volume: "19(6), 333-341",
        doi: "10.2188/jea.JE20080086",
        pmid: "19749497"
    },
    developingInstitution: "南方医科大学公共卫生学院",
    developingInstitutionEn: "School of Public Health, Southern Medical University",
    copyrightStatus: "public_domain",
    usagePermission: "公共领域，可免费使用于临床和研究目的",
    usagePermissionEn: "Public domain, free to use for clinical and research purposes",
    briefDescription: "SHSQ-25 是专门针对中国城市人群开发的亚健康状态评估量表，涵盖疲劳、心血管、消化、免疫和精神五个维度。",
    briefDescriptionEn: "The SHSQ-25 is a sub-health assessment scale specifically developed for urban Chinese populations, covering fatigue, cardiovascular, digestive, immune, and mental dimensions.",
    primaryUseCase: "亚健康状态筛查、健康风险评估、生活方式干预效果监测",
    primaryUseCaseEn: "Sub-health screening, health risk assessment, lifestyle intervention monitoring"
};

/**
 * CFS-11 Chalder 疲劳量表出处
 * Reference: Chalder T, et al. Journal of Psychosomatic Research, 1993
 */
export const CFS11_SOURCE: ScaleSourceAttribution = {
    originalCitation: {
        authors: "Chalder T, Berelowitz G, Pawlikowska T, Watts L, Wessely S, Wright D, Wallace EP",
        year: 1993,
        title: "Development of a fatigue scale",
        journal: "Journal of Psychosomatic Research",
        volume: "37(2), 147-153",
        doi: "10.1016/0022-3999(93)90081-p",
        pmid: "8463991"
    },
    developingInstitution: "伦敦国王学院精神病学研究所",
    developingInstitutionEn: "Institute of Psychiatry, King's College London",
    copyrightStatus: "public_domain",
    usagePermission: "公共领域，可免费使用于临床和研究目的",
    usagePermissionEn: "Public domain, free to use for clinical and research purposes",
    chineseValidation: {
        authors: "王玲, 吴文源, 张明园",
        year: 2001,
        title: "疲劳量表-14在慢性疲劳综合征患者中的应用",
        journal: "中国心理卫生杂志",
        volume: "15(5), 355-357"
    },
    briefDescription: "Chalder 疲劳量表是评估躯体和精神疲劳的标准化工具，广泛用于慢性疲劳综合征的研究和临床评估。",
    briefDescriptionEn: "The Chalder Fatigue Scale is a standardized tool for assessing physical and mental fatigue, widely used in chronic fatigue syndrome research and clinical assessment.",
    primaryUseCase: "慢性疲劳综合征筛查、疲劳严重程度评估、康复治疗效果监测",
    primaryUseCaseEn: "Chronic fatigue syndrome screening, fatigue severity assessment, rehabilitation monitoring"
};

/**
 * 获取所有量表出处信息
 */
export const ALL_SOURCE_ATTRIBUTIONS: Record<string, ScaleSourceAttribution> = {
    GAD7: GAD7_SOURCE,
    PHQ9: PHQ9_SOURCE,
    ISI: ISI_SOURCE,
    PSS10: PSS10_SOURCE,
    SHSQ25: SHSQ25_SOURCE,
    CFS11: CFS11_SOURCE,
};

/**
 * 根据量表ID获取出处信息
 */
export function getSourceAttribution(scaleId: string): ScaleSourceAttribution | undefined {
    return ALL_SOURCE_ATTRIBUTIONS[scaleId];
}
