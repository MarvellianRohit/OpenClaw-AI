"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Sparkles, X, ChevronRight } from "lucide-react";

export default function InterventionToast() {
    const [intervention, setIntervention] = useState<any>(null);

    useEffect(() => {
        const connect = () => {
            const ws = new WebSocket("ws://localhost:8000/ws/voice");

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "intervention") {
                        setIntervention(data);
                        // Auto-dismiss after 20 seconds
                        setTimeout(() => setIntervention(null), 20000);
                    }
                } catch (e) { }
            };

            ws.onclose = () => setTimeout(connect, 3000);
        };
        connect();
    }, []);

    if (!intervention) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                className="fixed top-24 right-8 z-[100] w-full max-w-sm"
            >
                <div className="glass-panel p-4 rounded-xl border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)] bg-obsidian/90 overflow-hidden relative">
                    {/* Atmospheric Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />

                    <div className="flex gap-4 relative z-10">
                        <div className="bg-amber-500/20 p-2.5 rounded-lg text-amber-500 h-fit">
                            <HelpCircle size={20} className="animate-pulse" />
                        </div>

                        <div className="flex flex-col gap-1 flex-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold tracking-[0.2em] text-amber-500 uppercase">
                                    AI Intervention
                                </span>
                                <button
                                    onClick={() => setIntervention(null)}
                                    className="text-titanium-dim hover:text-white transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <p className="text-xs text-titanium leading-relaxed font-medium">
                                OpenClaw noticed you've been struggling with <span className="text-amber-400 font-bold">{intervention.function}</span> in <span className="italic">{intervention.file}</span>.
                            </p>

                            <div className="mt-3 flex items-center gap-2">
                                <button className="flex-1 bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-500 py-1.5 rounded-md hover:bg-amber-500/20 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider group">
                                    <Sparkles size={12} />
                                    Analyze & Fix
                                    <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                </button>
                                <button
                                    onClick={() => setIntervention(null)}
                                    className="px-3 py-1.5 text-[10px] font-bold text-titanium-dim hover:text-white transition-colors uppercase tracking-wider"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Progress Bar (Timer) */}
                    <motion.div
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: 20, ease: "linear" }}
                        className="absolute bottom-0 left-0 h-0.5 bg-amber-500/50"
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
