"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

const data = [
    { time: "06:30", value: 45 },
    { time: "06:45", value: 42 },
    { time: "07:00", value: 38 }, // Descending stress is good
    { time: "07:15", value: 35 },
    { time: "07:30", value: 30 },
    { time: "07:45", value: 28 },
    { time: "08:00", value: 25 },
];

const CustomCursor = (props: any) => {
    const { points, width, height } = props;
    const { x } = points[0];
    return (
        <line x1={x} y1={0} x2={x} y2={height} stroke="#6366f1" strokeWidth={2} strokeDasharray="4 4" />
    );
};

export const StressChart = () => {
    return (
        <div className="p-6 bg-white rounded-[2rem] shadow-sm">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-sm font-semibold text-slate-500 mb-1">压力趋势 (Stress)</h3>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                        <span className="text-sm font-bold text-indigo-500">逐渐平稳</span>
                    </div>
                </div>
                <div className="text-2xl mr-2">😌</div>
            </div>

            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
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
