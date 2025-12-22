import { useState } from 'react';
import { MotionButton } from './motion/MotionButton';

export interface PlanItem {
    id?: string;
    text: string;
    status?: 'pending' | 'completed' | 'skipped';
}

interface PlanReviewChecklistProps {
    items: PlanItem[];
    onSubmit: (selectedItems: PlanItem[]) => void;
}

export function PlanReviewChecklist({ items, onSubmit }: PlanReviewChecklistProps) {
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

    const toggleItem = (index: number) => {
        setSelectedIndices(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const handleSubmit = () => {
        const selectedItems = selectedIndices.map(i => items[i]);
        onSubmit(selectedItems);
    };

    if (!items || items.length === 0) return null;

    return (
        <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="text-sm font-medium text-gray-700 mb-3">
                请勾选需要调整或平替的项目：
            </div>
            <div className="space-y-2 mb-4">
                {items.map((item, index) => (
                    <div
                        key={index}
                        onClick={() => toggleItem(index)}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedIndices.includes(index)
                                ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selectedIndices.includes(index)
                                ? 'bg-emerald-500 border-emerald-500'
                                : 'bg-white border-gray-300'
                            }`}>
                            {selectedIndices.includes(index) && (
                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <span className={`text-sm leading-relaxed ${selectedIndices.includes(index) ? 'text-gray-900 font-medium' : 'text-gray-600'
                            }`}>
                            {item.text}
                        </span>
                    </div>
                ))}
            </div>

            <div className="flex justify-end gap-2">
                <button
                    onClick={() => onSubmit([])}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    一切正常
                </button>
                <MotionButton
                    onClick={handleSubmit}
                    disabled={selectedIndices.length === 0}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedIndices.length > 0
                            ? 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    调整选中项
                </MotionButton>
            </div>
        </div>
    );
}
