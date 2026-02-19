"use client";

import { motion } from "framer-motion";
import { SystemStats } from "@/hooks/useSystemVitals";
import PerformanceMonitor from "./PerformanceMonitor";
import { useState } from "react";
import { Flame } from "lucide-react";

interface SystemVitalsProps {
    stats: SystemStats | null;
    isConnected: boolean;
}

const RadialGauge = ({ label, value, max, color, suffix = "" }: { label: string, value: number, max: number, color: string, suffix?: string }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(value / max, 1);
    const offset = circumference - progress * circumference;
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="flex flex-col items-center relative group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90 text-[#111]">
                    {/* Background Circle */}
                    <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                    />
                    {/* Progress Circle */}
                    <motion.circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke={color}
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className={`font-mono font-bold text-sm ${isHovered ? 'text-white' : 'text-titanium'}`}>
                        {Math.round(value)}{suffix}
                    </span>
                </div>

                {/* Tooltip */}
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-full mb-2 bg-black border border-white/20 px-2 py-1 rounded text-[10px] text-white whitespace-nowrap z-50 pointer-events-none shadow-xl"
                    >
                        {value.toFixed(1)} / {max}
                    </motion.div>
                )}
            </div>
            <span className="text-[10px] text-titanium-dim -mt-1 uppercase tracking-widest">{label}</span>
        </div>
    );
};

export default function SystemVitals({ stats, isConnected }: SystemVitalsProps) {
    if (!stats) return (
        <div className="p-4 rounded-xl animate-pulse bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/10 shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <div className="h-3 w-20 bg-white/10 rounded"></div>
                <div className="h-2 w-2 bg-white/10 rounded-full"></div>
            </div>
            <div className="flex justify-around mb-4">
                <div className="w-16 h-16 rounded-full bg-white/5"></div>
                <div className="w-16 h-16 rounded-full bg-white/5"></div>
            </div>
            <div className="h-2 w-full bg-white/5 rounded mb-4"></div>
            <div className="h-8 w-full bg-white/5 rounded"></div>
        </div>
    );

    const getThermalColor = (pressure: number) => {
        if (pressure === 0) return "text-neon-cyan";
        if (pressure === 1) return "text-orange-400";
        if (pressure === 2) return "text-orange-600";
        return "text-red-500";
    };

    return (
        <div className="p-5 rounded-xl space-y-6 font-mono text-xs shadow-2xl relative overflow-hidden backdrop-blur-md transition-all duration-300 hover:shadow-neon/10 hover:border-white/20"
            style={{
                background: "linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(10,10,10,0.98) 100%)",
                border: "1px solid rgba(255,255,255,0.08)"
            }}>

            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                    <h3 className="text-titanium uppercase tracking-widest text-[10px] font-bold">Titanium Vitals</h3>
                    <motion.div
                        animate={stats.thermal_pressure > 0 ? { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                        className={getThermalColor(stats.thermal_pressure)}
                    >
                        <Flame size={12} fill="currentColor" />
                    </motion.div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] text-titanium-dim">{isConnected ? "ONLINE" : "OFFLINE"}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-neon-cyan shadow-[0_0_8px_rgba(0,255,255,0.6)]' : 'bg-red-500'}`} />
                </div>
            </div>

            {/* Gauges Row */}
            <div className="flex justify-around items-center">
                <RadialGauge
                    label="CPU"
                    value={stats.cpu_percent}
                    max={100}
                    color="#3b82f6"
                    suffix="%"
                />
                <RadialGauge
                    label="GPU"
                    value={stats.gpu_active_cores}
                    max={40}
                    color="#06b6d4"
                />
            </div>

            {/* RAM Progress */}
            <div className="group relative pt-2">
                <div className="flex justify-between mb-1.5 text-[10px]">
                    <span className="text-titanium-dim tracking-wider">RAM (118GB UMA)</span>
                    <span className="text-purple-400 font-bold">{stats.memory_used_gb} GB</span>
                </div>
                <div className="h-1.5 w-full bg-[#111] rounded-full overflow-hidden border border-white/5 relative">
                    <motion.div
                        className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.memory_percent}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
                <div className="flex justify-between mt-1 text-[8px] tracking-tighter uppercase whitespace-nowrap">
                    <span className="text-titanium-dim">Swap Usage</span>
                    <span className={stats.swap_used_mb > 0 ? "text-orange-400 font-bold" : "text-titanium-dim"}>
                        {stats.swap_used_mb} MB
                    </span>
                </div>
            </div>

            {/* Performance Footer */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                <div className="bg-white/5 rounded p-2 border border-white/5 flex flex-col items-center justify-center hover:bg-white/10 transition-colors">
                    <span className="text-[9px] text-titanium-dim mb-0.5">INFERENCE</span>
                    <span className="text-neon-cyan font-bold text-sm">-- t/s</span>
                </div>
                <div className="bg-white/5 rounded p-2 border border-white/5 flex flex-col items-center justify-center hover:bg-white/10 transition-colors">
                    <span className="text-[9px] text-titanium-dim mb-0.5">DISPLAY</span>
                    <div className="scale-75 origin-center">
                        <PerformanceMonitor />
                    </div>
                </div>
            </div>

        </div>
    );
}
