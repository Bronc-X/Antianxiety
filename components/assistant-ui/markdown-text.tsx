"use client";

import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";
import { FC, isValidElement } from "react";
import { PlanSelector } from "./plan-selector";
import { usePlanSelectorContext } from "./plan-selector-context";
import type { ParsedPlan } from "@/lib/plan-parser";

type PlanOptionItem = {
    id?: string | number;
    text?: string;
};

type PlanOption = {
    id?: string | number;
    title?: string;
    description?: string;
    difficulty?: string;
    duration?: string;
    items?: PlanOptionItem[];
};

type PlanOptionsPayload = {
    options: PlanOption[];
};

function isPlanOptionsPayload(value: unknown): value is PlanOptionsPayload {
    if (!value || typeof value !== 'object') return false;
    const record = value as { options?: unknown };
    return Array.isArray(record.options);
}

/**
 * Try to parse plan-options JSON from code block content
 */
function tryParsePlanOptions(content: string): ParsedPlan[] | null {
    try {
        const parsed = JSON.parse(content);
        if (isPlanOptionsPayload(parsed)) {
            // Convert to ParsedPlan format
            return parsed.options.map((opt, index) => ({
                title: opt.title || `方案${opt.id ?? index + 1}`,
                content: opt.description || "",
                difficulty: opt.difficulty,
                duration: opt.duration,
                items: (opt.items ?? [])
                    .map((item) => ({
                        id: item.id ? String(item.id) : undefined,
                        text: item.text ?? "",
                        status: "pending" as const,
                    }))
                    .filter((item) => item.text.trim().length > 0),
            }));
        }
    } catch {
        // Not valid JSON, ignore
    }
    return null;
}

export const MarkdownText: FC = () => {
    const planContext = usePlanSelectorContext();

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
                    const hasPlanOptions = childrenArray.some((child) => {
                        if (!isValidElement(child)) return false;
                        const className = child.props?.className;
                        return typeof className === 'string' && className.includes('language-plan-options');
                    });

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
