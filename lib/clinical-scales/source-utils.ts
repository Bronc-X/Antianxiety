/**
 * Clinical Scales Source Attribution Utilities
 * 
 * 量表出处信息工具函数
 * 提供格式化、本地化、验证等功能
 */

import type { Citation, ScaleSourceAttribution } from './types';

/**
 * 格式化简短引用
 * 
 * 将完整的学术引用转换为简短格式 (e.g., "Spitzer et al., 2006")
 * 
 * @param citation - 学术引用对象
 * @returns 简短引用字符串
 * 
 * @example
 * formatBriefCitation({
 *   authors: "Spitzer RL, Kroenke K, Williams JBW",
 *   year: 2006,
 *   ...
 * }) // => "Spitzer et al., 2006"
 */
export function formatBriefCitation(citation: Citation): string {
    // 提取第一作者姓氏
    const firstAuthor = citation.authors.split(',')[0].trim();
    const lastName = firstAuthor.split(' ').pop() || firstAuthor;
    
    // 检查是否有多个作者
    const hasMultipleAuthors = citation.authors.includes(',') || citation.authors.includes('&');
    
    if (hasMultipleAuthors) {
        return `${lastName} et al., ${citation.year}`;
    } else {
        return `${lastName}, ${citation.year}`;
    }
}

/**
 * 格式化完整引用 (APA 格式)
 * 
 * @param citation - 学术引用对象
 * @returns 完整的 APA 格式引用
 * 
 * @example
 * formatFullCitation(citation)
 * // => "Spitzer RL, Kroenke K, Williams JBW, Löwe B. (2006). A Brief Measure for Assessing Generalized Anxiety Disorder: The GAD-7. Archives of Internal Medicine, 166(10), 1092-1097."
 */
export function formatFullCitation(citation: Citation): string {
    let result = `${citation.authors}. (${citation.year}). ${citation.title}. ${citation.journal}`;
    
    if (citation.volume) {
        result += `, ${citation.volume}`;
    }
    
    result += '.';
    
    return result;
}

/**
 * 获取本地化的出处信息
 * 
 * 根据语言偏好返回对应语言版本的字段
 * 
 * @param attribution - 量表出处归属对象
 * @param locale - 语言代码 ('zh' | 'en')
 * @returns 本地化后的出处信息对象
 */
export function getLocalizedAttribution(
    attribution: ScaleSourceAttribution,
    locale: 'zh' | 'en' = 'zh'
): {
    developingInstitution: string;
    usagePermission: string;
    briefDescription: string;
    primaryUseCase: string;
} {
    if (locale === 'en') {
        return {
            developingInstitution: attribution.developingInstitutionEn,
            usagePermission: attribution.usagePermissionEn,
            briefDescription: attribution.briefDescriptionEn,
            primaryUseCase: attribution.primaryUseCaseEn,
        };
    }
    
    return {
        developingInstitution: attribution.developingInstitution,
        usagePermission: attribution.usagePermission,
        briefDescription: attribution.briefDescription,
        primaryUseCase: attribution.primaryUseCase,
    };
}

/**
 * 验证引用对象的完整性
 * 
 * @param citation - 学术引用对象
 * @returns 是否有效
 */
export function validateCitation(citation: Citation): boolean {
    if (!citation.authors || citation.authors.trim() === '') {
        return false;
    }
    
    if (!citation.year || citation.year <= 0) {
        return false;
    }
    
    if (!citation.title || citation.title.trim() === '') {
        return false;
    }
    
    if (!citation.journal || citation.journal.trim() === '') {
        return false;
    }
    
    return true;
}

/**
 * 验证量表出处归属的完整性
 * 
 * 检查所有必需字段是否存在且有效
 * 
 * @param attribution - 量表出处归属对象
 * @returns 是否有效
 */
export function validateSourceAttribution(attribution: ScaleSourceAttribution): boolean {
    // 验证原始引用
    if (!validateCitation(attribution.originalCitation)) {
        return false;
    }
    
    // 验证开发机构
    if (!attribution.developingInstitution || attribution.developingInstitution.trim() === '') {
        return false;
    }
    if (!attribution.developingInstitutionEn || attribution.developingInstitutionEn.trim() === '') {
        return false;
    }
    
    // 验证版权状态
    const validCopyrightStatuses = ['public_domain', 'licensed', 'restricted'];
    if (!validCopyrightStatuses.includes(attribution.copyrightStatus)) {
        return false;
    }
    
    // 验证使用许可
    if (!attribution.usagePermission || attribution.usagePermission.trim() === '') {
        return false;
    }
    if (!attribution.usagePermissionEn || attribution.usagePermissionEn.trim() === '') {
        return false;
    }
    
    // 验证简介
    if (!attribution.briefDescription || attribution.briefDescription.trim() === '') {
        return false;
    }
    if (!attribution.briefDescriptionEn || attribution.briefDescriptionEn.trim() === '') {
        return false;
    }
    
    // 验证主要用途
    if (!attribution.primaryUseCase || attribution.primaryUseCase.trim() === '') {
        return false;
    }
    if (!attribution.primaryUseCaseEn || attribution.primaryUseCaseEn.trim() === '') {
        return false;
    }
    
    // 验证中文验证研究（如果存在）
    if (attribution.chineseValidation && !validateCitation(attribution.chineseValidation)) {
        return false;
    }
    
    // 验证其他验证研究（如果存在）
    if (attribution.additionalValidations) {
        for (const validation of attribution.additionalValidations) {
            if (!validateCitation(validation)) {
                return false;
            }
        }
    }
    
    return true;
}

/**
 * 生成 DOI 链接
 * 
 * @param doi - DOI 标识符
 * @returns 完整的 DOI URL
 */
export function getDOIUrl(doi: string): string {
    if (!doi) return '';
    // 移除可能已存在的 URL 前缀
    const cleanDoi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
    return `https://doi.org/${cleanDoi}`;
}

/**
 * 生成 PubMed 链接
 * 
 * @param pmid - PubMed ID
 * @returns 完整的 PubMed URL
 */
export function getPubMedUrl(pmid: string): string {
    if (!pmid) return '';
    return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
}

/**
 * 序列化量表出处信息为 JSON
 * 
 * @param attribution - 量表出处归属对象
 * @returns JSON 字符串
 */
export function serializeSourceAttribution(attribution: ScaleSourceAttribution): string {
    return JSON.stringify(attribution, null, 2);
}

/**
 * 从 JSON 反序列化量表出处信息
 * 
 * @param json - JSON 字符串
 * @returns 量表出处归属对象，如果解析失败返回 null
 */
export function deserializeSourceAttribution(json: string): ScaleSourceAttribution | null {
    try {
        const parsed = JSON.parse(json);
        // 基本验证
        if (!parsed.originalCitation || !parsed.developingInstitution) {
            return null;
        }
        return parsed as ScaleSourceAttribution;
    } catch (error) {
        console.error('Failed to deserialize source attribution:', error);
        return null;
    }
}
