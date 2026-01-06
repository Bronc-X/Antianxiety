"use client";

/**
 * PlanSelector Component
 * 
 * Displays two plan options from Max AI and allows user to:
 * - Select one plan
 * - "确认" to save to user's plans
 * - "平替" to replace selected plan with easier version (in-place, no new chat message)
 */

import { FC, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, RefreshCw, Sparkles, Target, Clock, Zap, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ParsedPlan } from "@/lib/plan-parser";
import { generatePlanAlternative } from "@/app/actions/plan-alternative";

interface PlanSelectorProps {
    options: ParsedPlan[];
    onConfirm: (plan: ParsedPlan) => void;
    onRequestAlternative?: (plan: ParsedPlan) => void; // kept for backwards compat, but not used
    isLoading?: boolean;
}

export const PlanSelector: FC<PlanSelectorProps> = ({
    options: initialOptions,
    onConfirm,
    isLoading = false,
}) => {
    // Local state for plans - allows in-place updates
    const [plans, setPlans] = useState<ParsedPlan[]>(initialOptions);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [confirmed, setConfirmed] = useState(false);
    const [isReplacing, setIsReplacing] = useState(false);
    const [replaceError, setReplaceError] = useState<string | null>(null);
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

    const toggleExpand = (index: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Don't trigger card selection
        setExpandedCards(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const handleConfirm = () => {
        if (selectedIndex === null) return;
        setConfirmed(true);
        onConfirm(plans[selectedIndex]);
    };

    // In-place replacement: call server action and update local state
    const handleAlternative = async () => {
        if (selectedIndex === null) return;

        setIsReplacing(true);
        setReplaceError(null);

        try {
            const result = await generatePlanAlternative(plans[selectedIndex]);

            if (result.success && result.data) {
                // Update the selected plan in-place
                setPlans(prev => prev.map((plan, idx) =>
                    idx === selectedIndex ? result.data! : plan
                ));
            } else {
                setReplaceError(result.error || '生成替代方案失败');
            }
        } catch (error) {
            setReplaceError(error instanceof Error ? error.message : '生成替代方案失败');
        } finally {
            setIsReplacing(false);
        }
    };

    if (confirmed) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 rounded-xl bg-[#4ADE80]/20 border border-[#4ADE80]/30 px-4 py-3 text-[#4ADE80]"
            >
                <Check className="size-5" />
                <span className="text-sm font-medium">方案已保存到您的计划中!</span>
            </motion.div>
        );
    }

    return (
        <div className="space-y-3 my-2">
            {/* Header */}
            <div className="flex items-center gap-2 text-white/60 text-xs">
                <Sparkles className="size-3.5 text-[#4ADE80]" />
                <span>选择一个方案开始执行:</span>
            </div>

            {/* Plan Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plans.map((plan, index) => (
                    <motion.button
                        key={index}
                        onClick={() => setSelectedIndex(index)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        layout
                        className={cn(
                            "relative text-left p-4 rounded-xl border transition-all duration-200",
                            "bg-white/[0.03] hover:bg-white/[0.06]",
                            selectedIndex === index
                                ? "border-[#4ADE80]/40 ring-1 ring-[#4ADE80]/20 bg-white/[0.08]"
                                : "border-white/[0.08] hover:border-white/[0.15]",
                            isReplacing && selectedIndex === index && "opacity-60"
                        )}
                    >
                        {/* Loading Overlay for this card */}
                        {isReplacing && selectedIndex === index && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/50 backdrop-blur-sm"
                            >
                                <div className="flex items-center gap-2 text-[#4ADE80]">
                                    <Loader2 className="size-5 animate-spin" />
                                    <span className="text-sm">正在生成更简单的方案...</span>
                                </div>
                            </motion.div>
                        )}

                        {/* Selection Indicator */}
                        {selectedIndex === index && !isReplacing && (
                            <motion.div
                                layoutId="plan-selector-indicator"
                                className="absolute top-3 right-3 size-6 rounded-full bg-[#4ADE80] flex items-center justify-center"
                            >
                                <Check className="size-4 text-[#0B3D2E]" />
                            </motion.div>
                        )}

                        {/* Title */}
                        <motion.h4 layout="position" className="font-medium text-white mb-2 pr-8">
                            {plan.title}
                        </motion.h4>

                        {/* Meta Info */}
                        <motion.div layout="position" className="flex items-center gap-3 text-xs text-white/50 mb-3">
                            {plan.difficulty && (
                                <span className="flex items-center gap-1">
                                    <Target className="size-3" />
                                    难度: {plan.difficulty}
                                </span>
                            )}
                            {plan.duration && (
                                <span className="flex items-center gap-1">
                                    <Clock className="size-3" />
                                    {plan.duration}
                                </span>
                            )}
                        </motion.div>

                        {/* Items Preview */}
                        {plan.items && plan.items.length > 0 && (
                            <motion.ul layout="position" className="space-y-1.5 w-full">
                                {(expandedCards.has(index) ? plan.items : plan.items.slice(0, 4)).map((item, itemIndex) => (
                                    <motion.li
                                        key={item.id || itemIndex}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-start gap-2 text-xs text-white/70 min-w-0 w-full"
                                    >
                                        <span className="size-1.5 rounded-full bg-white/40 mt-1.5 shrink-0" />
                                        <span
                                            className={cn(
                                                "min-w-0 flex-1",
                                                expandedCards.has(index)
                                                    ? "break-words whitespace-pre-wrap"
                                                    : "line-clamp-1 truncate"
                                            )}
                                            style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                                        >
                                            {item.text}
                                        </span>
                                    </motion.li>
                                ))}
                                {plan.items.length > 4 && (
                                    <motion.li layout className="pt-1">
                                        <button
                                            onClick={(e) => toggleExpand(index, e)}
                                            className="flex items-center gap-1 text-xs text-[#4ADE80] hover:text-[#4ADE80]/80 transition-colors"
                                        >
                                            {expandedCards.has(index) ? (
                                                <>
                                                    <ChevronUp className="size-3" />
                                                    收起
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="size-3" />
                                                    展开全部 ({plan.items.length - 4} 项)
                                                </>
                                            )}
                                        </button>
                                    </motion.li>
                                )}
                            </motion.ul>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Error Message */}
            {replaceError && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2"
                >
                    {replaceError}
                </motion.div>
            )}

            {/* Actions */}
            <AnimatePresence>
                {selectedIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex items-center gap-3 pt-2"
                    >
                        {/* "平替" Button */}
                        <button
                            onClick={handleAlternative}
                            disabled={isLoading || isReplacing}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                                "bg-white/5 hover:bg-white/10 text-white/80 hover:text-white",
                                "border border-white/10 hover:border-white/20",
                                (isLoading || isReplacing) && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <RefreshCw className={cn("size-4", isReplacing && "animate-spin")} />
                            平替难项
                        </button>

                        {/* "确认" Button */}
                        <button
                            onClick={handleConfirm}
                            disabled={isLoading || isReplacing}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
                                "bg-[#4ADE80] hover:bg-[#4ADE80]/90 text-[#0B3D2E]",
                                "shadow-lg shadow-[#4ADE80]/20",
                                (isLoading || isReplacing) && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <Zap className="size-4" />
                            确认并保存
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PlanSelector;

