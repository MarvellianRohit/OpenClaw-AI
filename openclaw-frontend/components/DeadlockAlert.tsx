"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Zap, X, BrainCircuit, Terminal } from "lucide-react";

export default function DeadlockAlert() {
    const [alert, setAlert] = useState<any>(null);

    useEffect(() => {
        const connect = () => {
            const ws = new WebSocket("ws://localhost:8000/ws/voice"); // System broadcast line

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "intervention_required" && data.subtype === "deadlock") {
                        setAlert(data);
                    }
                } catch (e) { }
            };

            ws.onclose = () => setTimeout(connect, 3000);
        };
        connect();
    }, []);

    if (!alert) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -50 }}
                className="fixed top-24 left-1/2 -translate-x-1/2 z-[150] w-full max-w-2xl px-4"
            >
                <div className="glass-panel p-6 rounded-2xl border-2 border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.3)] bg-obsidian/95 overflow-hidden">
                    {/* Diagnostic Pulse Overlay */}
                    <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />

                    <div className="flex flex-col gap-6 relative z-10">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-red-500/20 p-3 rounded-2xl text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                                    <AlertTriangle size={32} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black tracking-[0.3em] text-red-500 uppercase">
                                        System Critical: Deadlock Detected
                                    </span>
                                    <h3 className="text-xl font-mono font-bold text-white mt-1 uppercase">
                                        Execution Stalled (PID: {alert.pid})
                                    </h3>
                                </div>
                            </div>
                            <button
                                onClick={() => setAlert(null)}
                                className="text-titanium-dim hover:text-white transition-colors p-2"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6">
                            <div className="space-y-4">
                                <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Terminal size={14} className="text-titanium-dim" />
                                        <span className="text-[10px] font-mono text-titanium-dim uppercase">Command</span>
                                    </div>
                                    <code className="text-sm text-red-400 font-mono break-all line-clamp-2">
                                        {alert.command}
                                    </code>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <BrainCircuit size={16} className="text-red-400" />
                                        <span className="text-sm font-bold text-red-400 uppercase tracking-widest">AI Diagnosis</span>
                                    </div>
                                    <div className="text-sm text-titanium leading-relaxed bg-red-500/5 border border-red-500/20 rounded-xl p-4 italic">
                                        {alert.diagnosis}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 min-w-[180px]">
                                <button className="w-full bg-red-500 text-white font-bold text-xs py-3 rounded-xl hover:bg-red-600 transition-all flex items-center justify-center gap-2 uppercase tracking-wide shadow-lg shadow-red-500/20 group">
                                    <Zap size={14} className="fill-current" />
                                    Apply Live Fix
                                </button>
                                <button
                                    onClick={() => setAlert(null)}
                                    className="w-full bg-white/5 border border-white/10 text-white/70 font-bold text-xs py-3 rounded-xl hover:bg-white/10 hover:text-white transition-all uppercase tracking-wide"
                                >
                                    Terminate Process
                                </button>
                                <button className="w-full text-[10px] font-bold text-titanium-dim hover:text-white transition-colors uppercase tracking-widest py-2">
                                    Ignore (Risky)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
