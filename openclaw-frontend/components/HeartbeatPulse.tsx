"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Lightbulb, Thermometer, Construction, AlertCircle } from "lucide-react";

export default function HeartbeatPulse() {
    const [lastPulse, setLastPulse] = useState<any>(null);
    const [suggestion, setSuggestion] = useState<any>(null);
    const [isPulsing, setIsPulsing] = useState(false);

    useEffect(() => {
        const connect = () => {
            const ws = new WebSocket("ws://localhost:8000/ws/voice"); // Reusing system broadcast line

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "pulse") {
                        setLastPulse(data.data);
                        setIsPulsing(true);
                        setTimeout(() => setIsPulsing(false), 1000);
                    } else if (data.type === "proactive_suggestion") {
                        setSuggestion(data);
                        // Hide suggestion after 15 seconds
                        setTimeout(() => setSuggestion(null), 15000);
                    }
                } catch (e) { }
            };

            ws.onclose = () => setTimeout(connect, 3000);
        };
        connect();
    }, []);

    return (
        <>
            {/* Heartbeat Indicator (Bottom Left) */}
            <div className="fixed bottom-8 left-24 z-50 flex items-center gap-3 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 pointer-events-none">
                <motion.div
                    animate={isPulsing ? { scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] } : { opacity: 0.3 }}
                    className="text-neon-cyan"
                >
                    <Activity size={12} />
                </motion.div>
                <div className="flex gap-4 text-[9px] font-mono tracking-widest text-titanium-dim uppercase">
                    <span className="flex items-center gap-1">
                        <Thermometer size={10} /> {lastPulse?.thermals || 0}°C
                    </span>
                    <span className="flex items-center gap-1">
                        <Construction size={10} /> {lastPulse?.compilation_errors === 0 ? "HEALTHY" : "ERROR"}
                    </span>
                </div>
            </div>

            {/* Proactive Suggestion Card */}
            <AnimatePresence>
                {suggestion && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] w-full max-w-lg px-4"
                    >
                        <div className="glass-panel p-5 rounded-2xl border border-neon-cyan/30 shadow-[0_0_40px_rgba(0,243,255,0.15)] flex gap-4 bg-obsidian/90">
                            <div className="bg-neon-cyan/20 p-3 rounded-xl text-neon-cyan h-fit">
                                <Lightbulb size={24} className="animate-pulse" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold tracking-[0.2em] text-neon-cyan uppercase">
                                        Autonomous Suggestion
                                    </span>
                                    <button
                                        onClick={() => setSuggestion(null)}
                                        className="text-titanium-dim hover:text-white transition-colors"
                                    >
                                        <AlertCircle size={14} />
                                    </button>
                                </div>
                                <p className="text-sm text-titanium leading-relaxed">
                                    {suggestion.text}
                                </p>
                                <div className="mt-2 flex gap-3">
                                    <button className="text-[10px] font-bold text-neon-cyan border border-neon-cyan/30 px-3 py-1 rounded-md hover:bg-neon-cyan/10 transition-all uppercase tracking-wider">
                                        Apply Fix
                                    </button>
                                    <button className="text-[10px] font-bold text-titanium-dim px-3 py-1 rounded-md hover:text-white transition-all uppercase tracking-wider">
                                        Ignore
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
