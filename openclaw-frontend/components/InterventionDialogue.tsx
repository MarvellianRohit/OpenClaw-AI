"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    Bot,
    X,
    Lightbulb,
    Wand2,
    ArrowRight,
    BrainCircuit,
    Zap
} from "lucide-react";
import { useState, useEffect } from "react";

interface InterventionDialogueProps {
    isOpen: boolean;
    onClose: () => void;
    onExplain: () => void;
    onApplyFix: () => void;
    message: string;
}

export default function InterventionDialogue({
    isOpen,
    onClose,
    onExplain,
    onApplyFix,
    message
}: InterventionDialogueProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 100, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
                    className="fixed bottom-8 right-8 z-[100] w-full max-w-[380px] pointer-events-auto"
                >
                    {/* High-Diffusion Glass Container */}
                    <div className="relative group">
                        {/* Heartbeat Pulse Border */}
                        <motion.div
                            animate={{
                                boxShadow: [
                                    "0 0 0px 0px rgba(0, 243, 255, 0)",
                                    "0 0 15px 2px rgba(0, 243, 255, 0.3)",
                                    "0 0 0px 0px rgba(0, 243, 255, 0)"
                                ]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -inset-[1px] rounded-[24px] pointer-events-none border border-cyan-500/30"
                        />

                        <div className="relative glass-panel bg-obsidian/60 backdrop-blur-[40px] border border-white/10 rounded-[24px] p-6 shadow-2xl overflow-hidden brushed-metal">
                            {/* Content Integration */}
                            <div className="flex flex-col gap-5">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center relative">
                                            <Bot size={20} className="text-neon-cyan" />
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-neon-cyan rounded-full border-2 border-obsidian"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Assistant Intervention</h3>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className="w-1 h-1 rounded-full bg-neon-cyan animate-pulse" />
                                                <span className="text-[9px] font-mono text-neon-cyan/70 uppercase">High Priority Audit</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-1.5 hover:bg-white/5 rounded-lg text-titanium-dim hover:text-white transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Message Body */}
                                <div className="space-y-3">
                                    <p className="text-[13px] leading-relaxed text-titanium font-medium">
                                        {message || "I noticed the execution stalled at the mutex in main.c—it looks like a deadlock. Should I show you where the circular wait is occurring?"}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    <button
                                        onClick={onExplain}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-[11px] font-bold text-white uppercase tracking-wider group"
                                    >
                                        <Lightbulb size={14} className="text-amber-400 group-hover:scale-110 transition-transform" />
                                        Explain Logic
                                    </button>
                                    <button
                                        onClick={onApplyFix}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neon-cyan text-obsidian hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all text-[11px] font-black uppercase tracking-wider group"
                                    >
                                        <Wand2 size={14} className="group-hover:rotate-12 transition-transform" />
                                        Apply Fix
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="col-span-2 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold text-titanium-dim hover:text-white transition-colors uppercase tracking-[0.2em]"
                                    >
                                        Ignore Intervention
                                    </button>
                                </div>
                            </div>

                            {/* Bottom Decoration */}
                            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent" />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
