"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Cpu, Zap, Save } from "lucide-react";
import { clsx } from "clsx";

interface PerformanceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PerformanceModal({ isOpen, onClose }: PerformanceModalProps) {
    const [aggressiveCaching, setAggressiveCaching] = useState(false);
    const [gpuThreads, setGpuThreads] = useState(8);

    // Load existing config (mock)
    useEffect(() => {
        if (isOpen) {
            // In real app, fetch /config
            // fetch('http://localhost:8081/config').then(...)
        }
    }, [isOpen]);

    const handleSave = async () => {
        try {
            await fetch("http://localhost:8000/config/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    aggressive_caching: aggressiveCaching,
                    gpu_threads: gpuThreads
                })
            });
            onClose();
        } catch (e) {
            alert("Failed to save config");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="relative w-full max-w-md bg-[#0a0a0a] border border-neon-cyan/20 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5">
                            <div className="flex items-center gap-2 text-neon-cyan">
                                <Zap size={20} className="fill-neon-cyan/20" />
                                <h2 className="font-mono font-bold tracking-wider">M3 MAX POWER CONTROL</h2>
                            </div>
                            <button onClick={onClose} className="text-titanium hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-8">

                            {/* Toggle: Aggressive Caching */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-titanium font-medium">Aggressive Caching</h3>
                                    <p className="text-xs text-titanium-dim max-w-[200px]">Keep previous responses in RAM for instant context recall.</p>
                                </div>
                                <button
                                    onClick={() => setAggressiveCaching(!aggressiveCaching)}
                                    className={clsx(
                                        "w-12 h-6 rounded-full relative transition-colors duration-300",
                                        aggressiveCaching ? "bg-neon-cyan shadow-[0_0_10px_rgba(6,182,212,0.4)]" : "bg-white/10"
                                    )}
                                >
                                    <div className={clsx(
                                        "absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300",
                                        aggressiveCaching ? "translate-x-6" : "translate-x-0"
                                    )} />
                                </button>
                            </div>

                            {/* Slider: GPU Threads */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-titanium">
                                        <Cpu size={16} />
                                        <span>GPU Thread Allocation</span>
                                    </div>
                                    <span className="font-mono text-neon-cyan font-bold">{gpuThreads} Cores</span>
                                </div>
                                <div className="relative h-2 bg-white/10 rounded-full">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-neon-cyan rounded-full"
                                        style={{ width: `${(gpuThreads / 16) * 100}%` }} // Logic for M3 Max 16-core? Max slider 16?
                                    />
                                    <input
                                        type="range"
                                        min="1"
                                        max="16"
                                        value={gpuThreads}
                                        onChange={(e) => setGpuThreads(Number(e.target.value))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                                <p className="text-xs text-titanium-dim text-right">Recommended: 8-12 for M3 Max</p>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-white/5 bg-black/20 flex justify-end">
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/50 text-neon-cyan rounded-lg hover:bg-neon-cyan/20 transition-all flex items-center gap-2 font-mono text-xs font-bold"
                            >
                                <Save size={14} />
                                APPLY CONFIG
                            </button>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
