"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    Brain,
    Search,
    ShieldCheck,
    Cpu,
    Zap,
    Network,
    Settings,
    FileSearch,
    CheckCircle2,
    LineChart
} from "lucide-react";
import { useState, useEffect } from "react";

const thoughts = [
    { id: "memory", label: "Retrieving User Patterns", icon: <Brain size={20} />, status: "completed" },
    { id: "safety", label: "Executing Safety Audit", icon: <ShieldCheck size={20} />, status: "active" },
    { id: "context", label: "Scanning Code Graph", icon: <Search size={20} />, status: "pending" },
    { id: "opt", label: "Optimizing Hardware Loops", icon: <Cpu size={20} />, status: "pending" },
    { id: "vector", label: "Vectorizing Workspace", icon: <Network size={20} />, status: "pending" },
];

import ThoughtTrace from "./ThoughtTrace";

interface AgentThoughtsProps {
    trace?: any;
    status?: "thinking" | "planned" | "idle";
}

export default function AgentThoughts({ trace, status = "idle" }: AgentThoughtsProps) {
    const [activeStep, setActiveStep] = useState(1);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep(prev => (prev + 1) % thoughts.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-12 relative overflow-hidden bg-obsidian-soft/20">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '40px 40px' }} />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8"
            >
                {thoughts.map((thought, idx) => (
                    <motion.div
                        key={thought.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: activeStep === idx ? 1.05 : 1,
                            borderColor: activeStep === idx ? "rgba(0, 243, 255, 0.4)" : "rgba(255, 255, 255, 0.05)"
                        }}
                        transition={{ delay: idx * 0.1 }}
                        className={`p-6 rounded-3xl border bg-obsidian/40 backdrop-blur-xl relative group overflow-hidden transition-colors ${activeStep === idx ? "shadow-[0_0_30px_rgba(0,243,255,0.1)]" : ""
                            }`}
                    >
                        {/* Brushed Metal Texture Overlay */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none brushed-metal" />

                        <div className="relative z-10 flex flex-col gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${activeStep === idx ? "bg-neon-cyan/20 text-neon-cyan" : "bg-white/5 text-titanium-dim"
                                }`}>
                                {thought.icon}
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-white uppercase tracking-widest">{thought.label}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    {activeStep === idx ? (
                                        <span className="flex items-center gap-1.5 text-[10px] text-neon-cyan font-mono italic animate-pulse">
                                            <Zap size={10} className="fill-current" />
                                            Analyzing...
                                        </span>
                                    ) : idx < activeStep ? (
                                        <span className="flex items-center gap-1.5 text-[10px] text-green-500 font-mono uppercase font-bold">
                                            <CheckCircle2 size={10} />
                                            Verified
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-titanium-dim font-mono uppercase">Idle</span>
                                    )}
                                </div>
                            </div>

                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-2">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: activeStep === idx ? "70%" : idx < activeStep ? "100%" : "0%" }}
                                    className={`h-full ${activeStep === idx ? "bg-neon-cyan" : "bg-white/20"}`}
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Central Core Signal */}
                <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none">
                    <div className="w-px h-full bg-gradient-to-b from-transparent via-neon-cyan/20 to-transparent" />
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent" />
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.1, 0.3, 0.1]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="w-64 h-64 bg-neon-cyan/5 rounded-full blur-3xl"
                    />
                </div>
            </motion.div>

            <div className="mt-16 flex flex-col items-center gap-4 relative z-10">
                <div className="flex items-center gap-4 bg-white/5 p-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                    <LineChart size={14} className="text-neon-cyan" />
                    <span className="text-[10px] font-mono text-titanium-dim uppercase tracking-[0.3em]">
                        Orchestration Latency: <span className="text-white">12ms</span>
                    </span>
                </div>
                <p className="max-w-md text-center text-xs text-titanium-dim leading-relaxed italic opacity-60">
                    OpenClaw is scanning your vector workspace and optimizing for M3 Max neural cores. Background intelligence is fully prioritized.
                </p>
            </div>

            {/* Phase BJ: Thought Trace */}
            <div className="relative z-20 w-full max-w-4xl mt-8">
                <ThoughtTrace trace={trace} status={status} />
            </div>
        </div>
    );
}
