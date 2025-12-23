'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';
import type { ScaleDefinition } from '@/lib/clinical-scales/types';
import { formatBriefCitation } from '@/lib/clinical-scales/source-utils';
import { SourceAttributionModal } from './SourceAttributionModal';

interface SourceAttributionCardProps {
    scale: ScaleDefinition;
    compact?: boolean;
    className?: string;
}

/**
 * 显示量表出处的卡片组件
 * 
 * compact 模式: 仅显示简短引用 (e.g., "Spitzer et al., 2006")
 * 完整模式: 显示完整引用信息
 */
export function SourceAttributionCard({ 
    scale, 
    compact = true,
    className = '' 
}: SourceAttributionCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 如果没有出处信息，不显示
    if (!scale.sourceAttribution) {
        return null;
    }

    const { sourceAttribution } = scale;
    const briefCitation = formatBriefCitation(sourceAttribution.originalCitation);

    if (compact) {
        return (
            <>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors ${className}`}
                    aria-label="查看量表出处信息"
                >
                    <Info className="w-3.5 h-3.5" />
                    <span className="font-medium">{briefCitation}</span>
                </button>

                <SourceAttributionModal
                    scale={scale}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            </>
        );
    }

    // 完整模式
    return (
        <>
            <div 
                className={`rounded-lg border border-border bg-card p-4 ${className}`}
                role="region"
                aria-label="量表出处信息"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <h3 className="text-sm font-semibold text-foreground">
                                量表出处
                            </h3>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                            <p className="text-muted-foreground">
                                <span className="font-medium text-foreground">
                                    {sourceAttribution.originalCitation.authors}
                                </span>
                                {' '}({sourceAttribution.originalCitation.year})
                            </p>
                            <p className="text-muted-foreground italic">
                                {sourceAttribution.originalCitation.journal}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {sourceAttribution.developingInstitution}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-xs text-primary hover:underline whitespace-nowrap"
                    >
                        查看详情
                    </button>
                </div>
            </div>

            <SourceAttributionModal
                scale={scale}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
