'use client';

import React from 'react';
import { ExternalLink, BookOpen, Building2, CheckCircle2, Globe } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import type { ScaleDefinition } from '@/lib/clinical-scales/types';
import { 
    formatFullCitation, 
    getDOIUrl, 
    getPubMedUrl 
} from '@/lib/clinical-scales/source-utils';

interface SourceAttributionModalProps {
    scale: ScaleDefinition;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * 显示量表详细出处信息的模态框
 * 包含: 完整引用、开发机构、中文验证研究、使用许可等
 */
export function SourceAttributionModal({ 
    scale, 
    isOpen, 
    onClose 
}: SourceAttributionModalProps) {
    if (!scale.sourceAttribution) {
        return null;
    }

    const { sourceAttribution } = scale;
    const { originalCitation, chineseValidation } = sourceAttribution;

    const doiUrl = originalCitation.doi ? getDOIUrl(originalCitation.doi) : null;
    const pmidUrl = originalCitation.pmid ? getPubMedUrl(originalCitation.pmid) : null;

    const copyrightStatusLabel = {
        'public_domain': '公共领域',
        'licensed': '需授权',
        'restricted': '受限使用'
    }[sourceAttribution.copyrightStatus];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        {scale.name}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        {scale.nameEn}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* 量表简介 */}
                    <section>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            量表简介
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {sourceAttribution.briefDescription}
                        </p>
                    </section>

                    <div className="border-t border-border" />

                    {/* 原始文献引用 */}
                    <section>
                        <h3 className="text-sm font-semibold mb-3">原始文献</h3>
                        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                            <p className="text-sm leading-relaxed">
                                {formatFullCitation(originalCitation)}
                            </p>
                            
                            {/* DOI 和 PubMed 链接 */}
                            <div className="flex flex-wrap gap-2">
                                {doiUrl && (
                                    <a
                                        href={doiUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        DOI: {originalCitation.doi}
                                    </a>
                                )}
                                {pmidUrl && (
                                    <a
                                        href={pmidUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        PMID: {originalCitation.pmid}
                                    </a>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* 开发机构 */}
                    <section>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            开发机构
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {sourceAttribution.developingInstitution}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {sourceAttribution.developingInstitutionEn}
                        </p>
                    </section>

                    {/* 中文验证研究 */}
                    {chineseValidation && (
                        <>
                            <div className="border-t border-border" />
                            <section>
                                <h3 className="text-sm font-semibold mb-3">中文版验证研究</h3>
                                <div className="rounded-lg border border-border bg-muted/30 p-4">
                                    <p className="text-sm leading-relaxed">
                                        {formatFullCitation(chineseValidation)}
                                    </p>
                                </div>
                            </section>
                        </>
                    )}

                    <div className="border-t border-border" />

                    {/* 主要用途 */}
                    <section>
                        <h3 className="text-sm font-semibold mb-2">主要用途</h3>
                        <p className="text-sm text-muted-foreground">
                            {sourceAttribution.primaryUseCase}
                        </p>
                    </section>

                    {/* 版权和使用许可 */}
                    <section>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            使用许可
                        </h3>
                        <div className="space-y-2">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-md ${
                                sourceAttribution.copyrightStatus === 'public_domain' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                            }`}>
                                {copyrightStatusLabel}
                            </span>
                            <p className="text-sm text-muted-foreground">
                                {sourceAttribution.usagePermission}
                            </p>
                        </div>
                    </section>

                    {/* 官方网站 */}
                    {sourceAttribution.officialUrl && (
                        <section>
                            <a
                                href={sourceAttribution.officialUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                                <Globe className="w-4 h-4" />
                                访问官方网站
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </section>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
