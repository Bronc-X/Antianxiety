'use client';

/**
 * ChatPlanSelector Component - Optimized UI
 * 
 * Clean, modern design with:
 * - Better spacing and visual hierarchy
 * - Cleaner card design
 * - More intuitive interactions
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check,
    X,
    Plus,
    Trash2,
    Save,
    ChevronDown,
    ChevronUp,
    Edit2,
    Sparkles,
    Loader2,
    Star,
    Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EditablePlan, EditablePlanItem } from '@/hooks/domain/useChatToPlan';

// ============================================
// Types
// ============================================

interface ChatPlanSelectorProps {
    plans: EditablePlan[];
    isSaving: boolean;
    error: string | null;
    onTogglePlan: (planId: string) => void;
    onToggleItem: (planId: string, itemId: string) => void;
    onUpdateItem: (planId: string, itemId: string, text: string) => void;
    onAddItem: (planId: string, text: string) => void;
    onRemoveItem: (planId: string, itemId: string) => void;
    onSave: () => void;
    onDismiss: () => void;
    variant?: 'mobile' | 'desktop';
}

// ============================================
// Plan Item Component
// ============================================

function PlanItemRow({
    item,
    onToggle,
    onUpdate,
    onRemove,
}: {
    item: EditablePlanItem;
    onToggle: () => void;
    onUpdate: (text: string) => void;
    onRemove: () => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(item.text);

    const handleSave = () => {
        if (editText.trim()) onUpdate(editText.trim());
        setIsEditing(false);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-start gap-3 py-2 group"
        >
            {/* Checkbox */}
            <button
                onClick={onToggle}
                className={cn(
                    "w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0",
                    item.selected
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-stone-300 dark:border-stone-600 hover:border-emerald-400"
                )}
            >
                {item.selected && <Check size={12} strokeWidth={3} />}
            </button>

            {/* Text */}
            {isEditing ? (
                <div className="flex-1 flex gap-2">
                    <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        className="flex-1 px-2 py-1 text-sm border border-emerald-400 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-stone-800"
                        autoFocus
                    />
                    <button onClick={handleSave} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                        <Check size={16} />
                    </button>
                    <button onClick={() => setIsEditing(false)} className="p-1 text-stone-400 hover:bg-stone-100 rounded">
                        <X size={16} />
                    </button>
                </div>
            ) : (
                <>
                    <span className={cn(
                        "flex-1 text-sm leading-relaxed",
                        item.selected ? "text-stone-700 dark:text-stone-200" : "text-stone-400 line-through"
                    )}>
                        {item.text}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setIsEditing(true)} className="p-1 text-stone-400 hover:text-emerald-600 rounded">
                            <Edit2 size={14} />
                        </button>
                        <button onClick={onRemove} className="p-1 text-stone-400 hover:text-red-500 rounded">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </>
            )}
        </motion.div>
    );
}

// ============================================
// Plan Card Component - Redesigned
// ============================================

function PlanCard({
    plan,
    onTogglePlan,
    onToggleItem,
    onUpdateItem,
    onAddItem,
    onRemoveItem,
}: {
    plan: EditablePlan;
    onTogglePlan: () => void;
    onToggleItem: (itemId: string) => void;
    onUpdateItem: (itemId: string, text: string) => void;
    onAddItem: (text: string) => void;
    onRemoveItem: (itemId: string) => void;
}) {
    const [expanded, setExpanded] = useState(true);
    const [newItemText, setNewItemText] = useState('');

    const selectedCount = plan.editableItems.filter(i => i.selected).length;
    const totalCount = plan.editableItems.length;

    // Extract clean title (remove "方案1：" prefix for display)
    const cleanTitle = plan.title.replace(/^方案\d[：:]\s*/, '');

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "rounded-2xl overflow-hidden transition-all duration-200",
                plan.selected
                    ? "bg-white dark:bg-stone-800 shadow-lg ring-2 ring-emerald-400 ring-offset-2 ring-offset-emerald-50 dark:ring-offset-stone-900"
                    : "bg-stone-100 dark:bg-stone-800/50 opacity-60"
            )}
        >
            {/* Header */}
            <div
                onClick={onTogglePlan}
                className="flex items-start gap-3 p-4 cursor-pointer"
            >
                {/* Checkbox */}
                <button
                    className={cn(
                        "w-6 h-6 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                        plan.selected
                            ? "bg-emerald-500 border-emerald-500 text-white scale-110"
                            : "border-stone-300 dark:border-stone-600"
                    )}
                >
                    {plan.selected && <Check size={14} strokeWidth={3} />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className={cn(
                        "font-bold text-base leading-tight mb-1",
                        plan.selected ? "text-stone-800 dark:text-white" : "text-stone-500"
                    )}>
                        {cleanTitle}
                    </h4>

                    {/* Meta Tags */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        {plan.difficulty && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
                                <Star size={10} className="fill-current" />
                                {plan.difficulty}
                            </span>
                        )}
                        {plan.duration && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                <Clock size={10} />
                                {plan.duration}
                            </span>
                        )}
                        {totalCount > 0 && (
                            <span className="text-stone-400">
                                {selectedCount}/{totalCount} 项
                            </span>
                        )}
                    </div>
                </div>

                {/* Expand Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                    className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                >
                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {expanded && plan.selected && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4">
                            {/* Description */}
                            {plan.content && (
                                <p className="text-sm text-stone-500 dark:text-stone-400 mb-3 leading-relaxed">
                                    {plan.content}
                                </p>
                            )}

                            {/* Items List */}
                            {plan.editableItems.length > 0 && (
                                <div className="space-y-0.5 mb-3 pl-1 border-l-2 border-emerald-200 dark:border-emerald-800">
                                    <AnimatePresence mode="popLayout">
                                        {plan.editableItems.map(item => (
                                            <PlanItemRow
                                                key={item.id}
                                                item={item}
                                                onToggle={() => onToggleItem(item.id)}
                                                onUpdate={(text) => onUpdateItem(item.id, text)}
                                                onRemove={() => onRemoveItem(item.id)}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Add New Item */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newItemText}
                                    onChange={(e) => setNewItemText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newItemText.trim()) {
                                            onAddItem(newItemText.trim());
                                            setNewItemText('');
                                        }
                                    }}
                                    placeholder="添加执行项..."
                                    className="flex-1 px-3 py-2 text-sm bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-stone-400"
                                />
                                <button
                                    onClick={() => {
                                        if (newItemText.trim()) {
                                            onAddItem(newItemText.trim());
                                            setNewItemText('');
                                        }
                                    }}
                                    disabled={!newItemText.trim()}
                                    className="px-3 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ============================================
// Main Component - Redesigned
// ============================================

export default function ChatPlanSelector({
    plans,
    isSaving,
    error,
    onTogglePlan,
    onToggleItem,
    onUpdateItem,
    onAddItem,
    onRemoveItem,
    onSave,
    onDismiss,
    variant = 'mobile',
}: ChatPlanSelectorProps) {
    const selectedCount = plans.filter(p => p.selected).length;

    if (plans.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className={cn(
                "rounded-2xl overflow-hidden shadow-2xl",
                "bg-gradient-to-b from-emerald-50 via-white to-emerald-50",
                "dark:from-stone-900 dark:via-stone-900 dark:to-stone-900",
                "border border-emerald-200 dark:border-emerald-800",
                variant === 'mobile' ? "" : "max-w-xl mx-auto"
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                <div className="flex items-center gap-2">
                    <Sparkles size={20} />
                    <h3 className="font-bold text-lg">发现 {plans.length} 个方案</h3>
                </div>
                <button
                    onClick={onDismiss}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Plans List */}
            <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
                {plans.map(plan => (
                    <PlanCard
                        key={plan.id}
                        plan={plan}
                        onTogglePlan={() => onTogglePlan(plan.id)}
                        onToggleItem={(itemId) => onToggleItem(plan.id, itemId)}
                        onUpdateItem={(itemId, text) => onUpdateItem(plan.id, itemId, text)}
                        onAddItem={(text) => onAddItem(plan.id, text)}
                        onRemoveItem={(itemId) => onRemoveItem(plan.id, itemId)}
                    />
                ))}
            </div>

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mx-4 mb-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-300"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-4 bg-stone-50 dark:bg-stone-800/50 border-t border-stone-200 dark:border-stone-700">
                <span className="text-sm text-stone-500">
                    已选 <span className="font-bold text-emerald-600">{selectedCount}</span> 个方案
                </span>
                <div className="flex gap-3">
                    <button
                        onClick={onDismiss}
                        className="px-4 py-2.5 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl transition-colors"
                    >
                        稍后再说
                    </button>
                    <button
                        onClick={onSave}
                        disabled={isSaving || selectedCount === 0}
                        className={cn(
                            "px-5 py-2.5 text-sm font-bold rounded-xl flex items-center gap-2 transition-all",
                            selectedCount > 0
                                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                                : "bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed"
                        )}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                保存中
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                保存方案
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

export { ChatPlanSelector };
