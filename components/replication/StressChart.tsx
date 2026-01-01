"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

const CustomCursor = ({ points, width, height }: { points?: { x: number; y: number }[]; width?: number; height?: number }) => {
    if (!points?.length || width == null || height == null) {
        return null;
    }

    const { x, y } = points[0];

    return (
        <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill="rgba(99, 102, 241, 0.08)"
        />
    );
};

interface StressChartProps {
    data?: { time: string; value: number }[];
    currentStress?: number;
    trendLabel?: string;
    trendValue?: 'up' | 'down' | 'stable';
    isSkeleton?: boolean;
}

export const StressChart = ({ 
    data,
    currentStress,
    trendLabel,
    trendValue,
    isSkeleton = false
}: StressChartProps) => {
    const chartData = data || [];
    const labelText = trendLabel || '';
    // Determine trend visual if not explicitly passed
    const isStable = trendValue === 'stable' || (!trendValue && labelText.includes('平稳'));

    return (
        <div className={`p-6 bg-white rounded-[2rem] shadow-sm${isSkeleton ? ' animate-pulse' : ''}`}>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-sm font-semibold text-slate-500 mb-1">压力趋势 (Stress)</h3>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                        <span className={`text-sm font-bold text-indigo-500${isSkeleton ? ' text-transparent bg-slate-200 rounded px-2' : ''}`}>
                            {isSkeleton ? 'loading' : labelText}
                        </span>
                    </div>
                </div>
                <div className="text-2xl mr-2">😌</div>
            </div>

            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#94A3B8' }}
                            dy={10}
                        />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            cursor={<CustomCursor />}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#6366f1"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, strokeWidth: 0, fill: "#6366f1" }}
                            animationDuration={2000}
                        />
                        {/* Baseline / Ideal line */}
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#cbd5e1"
                            strokeWidth={3}
                            dot={false}
                            strokeDasharray="5 5"
                            opacity={0.5}
                            transform="translate(0, 10)" // Just visual offset for fake comparison
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="flex justify-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    当前压力
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    昨日同期
                </div>
            </div>
        </div>
    );
};
