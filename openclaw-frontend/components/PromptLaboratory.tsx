import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, X, Sparkles, Brain, Zap, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';

interface PromptLaboratoryProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PromptLaboratory({ isOpen, onClose }: PromptLaboratoryProps) {
    const [creativity, setCreativity] = useState(50);
    const [rigor, setRigor] = useState(50);
    const [conciseness, setConciseness] = useState(50);
    const [proactivity, setProactivity] = useState(50);
    const [isSaving, setIsSaving] = useState(false);

    // Debounce API calls when sliders change
    useEffect(() => {
        if (!isOpen) return;

        const saveConfig = async () => {
            setIsSaving(true);
            try {
                await fetch('http://localhost:8002/config/prompt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ creativity, rigor, conciseness, proactivity })
                });
            } catch (err) {
                console.error("Failed to sync prompt config", err);
            } finally {
                setTimeout(() => setIsSaving(false), 300); // Visual delay for feedback
            }
        };

        const delayDebounceFn = setTimeout(() => {
            saveConfig();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [creativity, rigor, conciseness, proactivity, isOpen]);

    const ranges = [
        {
            id: 'creativity', label: 'Creativity & Brainstorming', state: creativity, setter: setCreativity,
            icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/20',
            desc: 'Left: Literal & Orthodox   •   Right: Unconventional & Creative'
        },
        {
            id: 'rigor', label: 'Technical Rigor', state: rigor, setter: setRigor,
            icon: Brain, color: 'text-blue-400', bg: 'bg-blue-500/20',
            desc: 'Left: High-level overview   •   Right: Big-O, edge-cases, type-safety'
        },
        {
            id: 'conciseness', label: 'Response Conciseness', state: conciseness, setter: setConciseness,
            icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/20',
            desc: 'Left: Chatty & Warm   •   Right: Zero Fluff, immediate code'
        },
        {
            id: 'proactivity', label: 'Proactivity Level', state: proactivity, setter: setProactivity,
            icon: MessageSquare, color: 'text-green-400', bg: 'bg-green-500/20',
            desc: 'Left: Purely reactive answers   •   Right: Anticipates next 3 questions'
        }
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="relative w-full max-w-2xl bg-[#0A0A0A] border border-[#333] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
            >
                {/* Glow Effects */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#555] to-transparent opacity-50"></div>
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#1a1a1a] to-transparent pointer-events-none"></div>

                {/* Header */}
                <div className="relative px-6 py-5 border-b border-[#222] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#1A1A1A] rounded-lg border border-[#333]">
                            <Sliders className="w-5 h-5 text-[#AAA]" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold tracking-widest text-[#E0E0E0] uppercase font-mono shadow-sm">
                                Prompt Laboratory
                            </h2>
                            <p className="text-xs text-[#666] mt-1 font-mono tracking-wider">
                                Live AI Personality Tuning Module
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <AnimatePresence>
                            {isSaving && (
                                <motion.span
                                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                    className="text-xs font-mono text-cyan-400 flex items-center gap-2"
                                >
                                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                                    SYNCING...
                                </motion.span>
                            )}
                        </AnimatePresence>

                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-[#222] rounded-md transition-colors text-[#888] hover:text-[#FFF]"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Sliders Container */}
                <div className="p-6 space-y-8 max-h-[60vh] overflow-y-auto">
                    {ranges.map((r, i) => (
                        <div key={r.id} className="group">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={clsx("p-1.5 rounded-md", r.bg)}>
                                    <r.icon className={clsx("w-4 h-4", r.color)} />
                                </div>
                                <div className="flex-1 flex justify-between items-baseline">
                                    <label className="text-sm font-medium text-[#CCC] uppercase tracking-wide">
                                        {r.label}
                                    </label>
                                    <span className={clsx("text-xs font-mono font-bold w-8 text-right", r.color)}>
                                        {r.state}%
                                    </span>
                                </div>
                            </div>

                            <div className="relative px-1">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={r.state}
                                    onChange={(e) => r.setter(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-[#222] rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#DDD] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.2)] hover:[&::-webkit-slider-thumb]:bg-white"
                                    style={{
                                        background: `linear-gradient(to right, #444 0%, #444 ${r.state}%, #111 ${r.state}%, #111 100%)`
                                    }}
                                />
                            </div>

                            <div className="mt-2 text-[10px] text-[#666] font-mono flex justify-between uppercase tracking-wider">
                                <span>{r.desc.split('•')[0]}</span>
                                <span>{r.desc.split('•')[1]}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-[#050505] border-t border-[#222] flex items-center justify-between text-xs text-[#555] font-mono">
                    <span>Changes take effect on the next LLM query</span>
                    <span className="uppercase tracking-widest text-[#444]">Titanium Base AI</span>
                </div>

            </motion.div>
        </div>
    );
}
