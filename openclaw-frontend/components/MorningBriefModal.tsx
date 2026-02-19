"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Coffee, ArrowRight, X, Sparkles, CheckCircle2 } from "lucide-react";

export default function MorningBriefModal() {
    const [show, setShow] = useState(false);
    const [briefing, setBriefing] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkBriefing = async () => {
            const lastBrief = localStorage.getItem("lastMorningBrief");
            const today = new Date().toDateString();

            // For demo/testing purposes, you might want to bypass this
            // if (lastBrief === today) return; 

            try {
                const res = await fetch("http://localhost:8000/tools/morning-brief");
                const data = await res.json();
                setBriefing(data.briefing);
                setLoading(false);
                setShow(true);
                localStorage.setItem("lastMorningBrief", today);
            } catch (e) {
                console.error("Failed to fetch morning brief", e);
            }
        };

        // Delay slightly to let the boot sequence finish
        const timer = setTimeout(checkBriefing, 4500);
        return () => clearTimeout(timer);
    }, []);

    if (!show) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-3xl"
            >
                {/* Animated Background Gradients */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: "2s" }} />
                </div>

                <motion.div
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    className="relative w-full max-w-2xl bg-obsidian/40 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-md overflow-hidden"
                >
                    {/* Decorative Mesh */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`, backgroundSize: '24px 24px' }} />

                    <div className="relative z-10 flex flex-col items-center text-center gap-8">
                        <div className="flex items-center justify-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                                <Sun size={32} />
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                                <Coffee size={24} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-3">
                                <Sparkles size={24} className="text-amber-400" />
                                Your Morning Briefing
                            </h2>
                            <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto" />
                        </div>

                        <div className="w-full bg-white/5 rounded-3xl p-8 text-left border border-white/5 relative group">
                            {loading ? (
                                <div className="flex flex-col gap-4">
                                    <div className="h-4 w-3/4 bg-white/5 animate-pulse rounded-full" />
                                    <div className="h-4 w-full bg-white/5 animate-pulse rounded-full" />
                                    <div className="h-4 w-5/6 bg-white/5 animate-pulse rounded-full" />
                                </div>
                            ) : (
                                <p className="text-lg text-titanium-dim leading-relaxed font-medium italic">
                                    "{briefing}"
                                </p>
                            )}
                            <div className="absolute -top-3 -right-3 bg-cyan-500/20 border border-cyan-500/30 p-2 rounded-xl text-cyan-400">
                                <CheckCircle2 size={16} />
                            </div>
                        </div>

                        <div className="flex items-center gap-6 mt-4">
                            <button
                                onClick={() => setShow(false)}
                                className="group relative px-8 py-4 bg-white text-obsidian font-bold rounded-2xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
                            >
                                Let's Get Limited
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => setShow(false)}
                                className="text-sm font-bold text-titanium-dim hover:text-white transition-colors uppercase tracking-[0.2em]"
                            >
                                Skip Brief
                            </button>
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={() => setShow(false)}
                        className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
