'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Settings, User } from 'lucide-react';

// Mock patient data
const patients = [
    { id: 1, name: 'Sarah M.', age: 34, status: 'active' },
    { id: 2, name: 'James L.', age: 42, status: 'active' },
    { id: 3, name: 'Maria G.', age: 28, status: 'active' },
    { id: 4, name: 'Robert K.', age: 51, status: 'active' },
    { id: 5, name: 'Emily R.', age: 39, status: 'active' },
    { id: 6, name: 'Michael T.', age: 45, status: 'active' },
    { id: 7, name: 'Lisa W.', age: 33, status: 'active' },
    { id: 8, name: 'David H.', age: 48, status: 'active' },
];

// Chart data points
const chartData = [
    { month: '3m', prediction: 0.5, actual: 0.3 },
    { month: '6m', prediction: 0.9, actual: 0.8 },
    { month: '9m', prediction: 0.8, actual: 0.9 },
    { month: '12m', prediction: 1.8, actual: 1.5 },
    { month: '15m', prediction: 2.8, actual: 2.5 },
    { month: '18m', prediction: 3.0, actual: 2.8 },
    { month: '21m', prediction: 3.5, actual: 3.2 },
    { month: '24m', prediction: 3.8, actual: 3.5 },
];

export default function DigitalTwinDashboard() {
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: true, margin: '-100px' });
    const [selectedPatient, setSelectedPatient] = useState(patients[0]);

    return (
        <section
            ref={containerRef}
            className="relative py-24"
            style={{ backgroundColor: '#1A081C' }}
        >
            <div className="max-w-[1280px] mx-auto px-6">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="mb-12"
                >
                    <p
                        className="text-sm uppercase tracking-widest font-medium mb-4"
                        style={{ color: '#AA8FFF' }}
                    >
                        Digital Twin Technology
                    </p>
                    <h2
                        className="text-white font-bold leading-[1.1] tracking-[-0.02em] mb-4"
                        style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}
                    >
                        Predict outcomes before they happen
                    </h2>
                </motion.div>

                {/* Dashboard Card */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="rounded-2xl overflow-hidden"
                    style={{
                        backgroundColor: 'rgba(26, 8, 28, 0.8)',
                        border: '1px solid rgba(170, 143, 255, 0.2)',
                    }}
                >
                    {/* Dashboard Header */}
                    <div
                        className="flex items-center justify-between px-6 py-4"
                        style={{ borderBottom: '1px solid rgba(170, 143, 255, 0.15)' }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-8 h-8 rounded flex items-center justify-center"
                                style={{ backgroundColor: '#AA8FFF' }}
                            >
                                <span className="text-[#1A081C] font-bold text-sm">A</span>
                            </div>
                            <span className="text-white font-medium">Anxiety Recovery Program</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-white/50 hover:text-white transition-colors">
                                <Settings className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-white/50 hover:text-white transition-colors">
                                <User className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Patient Avatars */}
                    <div className="px-6 py-4">
                        <div className="flex flex-wrap gap-3">
                            {patients.map((patient, i) => (
                                <motion.button
                                    key={patient.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                    transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                                    onClick={() => setSelectedPatient(patient)}
                                    className={`
                    relative w-12 h-12 rounded-full overflow-hidden
                    transition-all duration-300
                    ${selectedPatient.id === patient.id
                                            ? 'ring-2 ring-[#AA8FFF] ring-offset-2 ring-offset-[#1A081C]'
                                            : 'opacity-60 hover:opacity-100'
                                        }
                  `}
                                    style={{
                                        background: `linear-gradient(135deg, #AA8FFF 0%, #7B61FF 100%)`,
                                    }}
                                >
                                    <div className="absolute inset-0 flex items-center justify-center text-white font-medium text-sm">
                                        {patient.name.split(' ')[0][0]}{patient.name.split(' ')[1]?.[0] || ''}
                                    </div>
                                </motion.button>
                            ))}
                            {/* Add more indicator */}
                            <div className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center text-white/30 text-xl">
                                +
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="px-6 py-6">
                        <div
                            className="rounded-xl p-6"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                        >
                            <h3 className="text-white font-medium mb-6">
                                Digital Twins Prediction vs. Actual Outcomes
                            </h3>

                            {/* Simple SVG Chart */}
                            <div className="relative h-[200px]">
                                <svg
                                    viewBox="0 0 400 150"
                                    className="w-full h-full"
                                    preserveAspectRatio="none"
                                >
                                    {/* Grid lines */}
                                    {[0, 1, 2, 3, 4, 5].map((i) => (
                                        <line
                                            key={i}
                                            x1="0"
                                            y1={i * 30}
                                            x2="400"
                                            y2={i * 30}
                                            stroke="rgba(255,255,255,0.1)"
                                            strokeWidth="1"
                                        />
                                    ))}

                                    {/* Prediction line (purple) */}
                                    <motion.path
                                        initial={{ pathLength: 0 }}
                                        animate={isInView ? { pathLength: 1 } : {}}
                                        transition={{ duration: 1.5, delay: 0.5 }}
                                        d={`M ${chartData.map((d, i) =>
                                            `${(i / (chartData.length - 1)) * 380 + 10},${130 - d.prediction * 30}`
                                        ).join(' L ')}`}
                                        fill="none"
                                        stroke="#AA8FFF"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />

                                    {/* Actual line (white) */}
                                    <motion.path
                                        initial={{ pathLength: 0 }}
                                        animate={isInView ? { pathLength: 1 } : {}}
                                        transition={{ duration: 1.5, delay: 0.7 }}
                                        d={`M ${chartData.map((d, i) =>
                                            `${(i / (chartData.length - 1)) * 380 + 10},${130 - d.actual * 30}`
                                        ).join(' L ')}`}
                                        fill="none"
                                        stroke="rgba(255,255,255,0.6)"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />

                                    {/* Data points - Prediction */}
                                    {chartData.map((d, i) => (
                                        <motion.circle
                                            key={`pred-${i}`}
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                            transition={{ duration: 0.3, delay: 0.8 + i * 0.1 }}
                                            cx={(i / (chartData.length - 1)) * 380 + 10}
                                            cy={130 - d.prediction * 30}
                                            r="4"
                                            fill="#AA8FFF"
                                        />
                                    ))}

                                    {/* Data points - Actual */}
                                    {chartData.map((d, i) => (
                                        <motion.circle
                                            key={`actual-${i}`}
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                            transition={{ duration: 0.3, delay: 0.9 + i * 0.1 }}
                                            cx={(i / (chartData.length - 1)) * 380 + 10}
                                            cy={130 - d.actual * 30}
                                            r="4"
                                            fill="rgba(255,255,255,0.8)"
                                        />
                                    ))}
                                </svg>

                                {/* X-axis labels */}
                                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-white/40">
                                    {chartData.map((d) => (
                                        <span key={d.month}>{d.month}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flex items-center gap-6 mt-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#AA8FFF' }} />
                                    <span className="text-sm text-white/60">Digital Twins Prediction</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-white/60" />
                                    <span className="text-sm text-white/60">Actual Outcomes</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
