"use client";

import { cn } from "@/lib/utils";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";
import { FC, useMemo } from "react";
import { PlanSelector } from "./plan-selector";
import { usePlanSelectorContext } from "./plan-selector-context";
import type { ParsedPlan } from "@/lib/plan-parser";

/**
 * Try to parse plan-options JSON from code block content
 */
function tryParsePlanOptions(content: string): ParsedPlan[] | null {
    try {
        const parsed = JSON.parse(content);
        if (parsed && Array.isArray(parsed.options)) {
            // Convert to ParsedPlan format
            return parsed.options.map((opt: any) => ({
                title: opt.title || `方案${opt.id}`,
                content: opt.description || "",
                difficulty: opt.difficulty,
                duration: opt.duration,
                items: opt.items?.map((item: any) => ({
                    id: item.id,
                    text: item.text,
                    status: "pending" as const,
                })) || [],
            }));
        }
    } catch {
        // Not valid JSON, ignore
    }
    return null;
}

export const MarkdownText: FC = () => {
    // Try to get context, but gracefully handle when not available
    let planContext: ReturnType<typeof usePlanSelectorContext> | null = null;
    try {
        planContext = usePlanSelectorContext();
    } catch {
        // Context not available, plan selector won't work but markdown will still render
    }

    return (
        <MarkdownTextPrimitive
            remarkPlugins={[remarkGfm]}
            className="aui-md prose prose-sm prose-invert max-w-none break-words"
            components={{
                // Custom code block styling with plan-options detection
                pre: ({ children, ...props }) => {
                    // Check if this pre contains a plan-options code block
                    // If so, render children directly without the pre wrapper
                    // Check if this pre contains a plan-options code block
                    // If so, render children directly without the pre wrapper
                    const childrenArray = Array.isArray(children) ? children : [children];
                    const hasPlanOptions = childrenArray.some((child: any) =>
                        child?.props?.className?.includes('language-plan-options')
                    );

                    if (hasPlanOptions) {
                        return <>{children}</>;
                    }

                    return (
                        <pre
                            {...props}
                            className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-sm"
                        >
                            {children}
                        </pre>
                    );
                },
                code: ({ children, className, ...props }) => {
                    const isInline = !className;
                    const isPlanOptions = className?.includes("language-plan-options");

                    // Handle plan-options code blocks
                    if (isPlanOptions && typeof children === "string" && planContext) {
                        const plans = tryParsePlanOptions(children);
                        if (plans && plans.length >= 2) {
                            return (
                                <PlanSelector
                                    options={plans}
                                    onConfirm={async (plan) => {
                                        await planContext!.savePlan(plan);
                                    }}
                                    onRequestAlternative={(plan) => {
                                        planContext!.requestAlternative(plan);
                                    }}
                                    isLoading={planContext.isSaving}
                                />
                            );
                        }
                    }

                    return isInline ? (
                        <code
                            {...props}
                            className="rounded bg-zinc-800 px-1 py-0.5 text-[#4ADE80]"
                        >
                            {children}
                        </code>
                    ) : (
                        <code {...props} className={className}>
                            {children}
                        </code>
                    );
                },
            }}
        />
    );
};
