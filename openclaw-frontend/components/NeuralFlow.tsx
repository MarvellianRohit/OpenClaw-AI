"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Thermometer, Construction } from "lucide-react";

export default function NeuralFlow() {
    const [lastPulse, setLastPulse] = useState<any>(null);
    const [suggestion, setSuggestion] = useState<any>(null);
    const [isPulsing, setIsPulsing] = useState(false);
    const [tokenSpeed, setTokenSpeed] = useState(1); // Baseline speed

    useEffect(() => {
        const connect = () => {
            const ws = new WebSocket("ws://localhost:8002/ws/heartbeat");

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "pulse") {
                        setLastPulse(data.data);
                        setIsPulsing(true);

                        // Fake token speed for visual effect, mapped roughly from CPU/Memory or a static value if real tokens/sec aren't available yet in this stream
                        const speed = Math.min(3, Math.max(0.5, (data.data.cpu_percent || 10) / 10));
                        setTokenSpeed(speed);

                        setTimeout(() => setIsPulsing(false), 500 / speed); // Adjust pulse hide by speed
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
            {/* Neural Nerve Indicator (Bottom Left) */}
            <div className="fixed bottom-8 left-24 z-50 flex items-center gap-4 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)] pointer-events-none">

                {/* Visual SVG Core container */}
                <div className="relative w-12 h-6 flex items-center justify-center">
                    {/* The core nerve fiber */}
                    <svg width="40" height="20" viewBox="0 0 40 20" className="absolute">
                        {/* Static base path */}
                        <path
                            d="M 5,10 Q 15,2 25,10 T 35,10"
                            fill="transparent"
                            stroke="rgba(168, 85, 247, 0.2)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            style={{ filter: "drop-shadow(0 0 4px rgba(168, 85, 247, 0.4))" }}
                        />
                        {/* Animated pulse path */}
                        <motion.path
                            d="M 5,10 Q 15,2 25,10 T 35,10"
                            fill="transparent"
                            stroke="#A855F7" // Purple-500
                            strokeWidth="3"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={isPulsing ? {
                                pathLength: [0, 1, 1],
                                opacity: [0, 1, 0],
                                pathOffset: [0, 0, 1]
                            } : { pathLength: 0, opacity: 0 }}
                            transition={{
                                duration: 1 / tokenSpeed,
                                ease: "easeInOut"
                            }}
                            style={{ filter: "drop-shadow(0 0 8px rgba(168, 85, 247, 0.8)) blur(1px)" }}
                        />
                    </svg>

                    {/* Sparkle Nodes */}
                    <motion.div
                        className="absolute left-1 w-2 h-2 rounded-full bg-cyan-400"
                        animate={isPulsing ? { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] } : { scale: 1, opacity: 0.3 }}
                        transition={{ duration: 0.5 / tokenSpeed, repeat: isPulsing ? Infinity : 0 }}
                        style={{ filter: "drop-shadow(0 0 6px rgba(34, 211, 238, 0.8))" }}
                    />
                    <motion.div
                        className="absolute right-1 w-2 h-2 rounded-full bg-purple-400"
                        animate={isPulsing ? { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] } : { scale: 1, opacity: 0.3 }}
                        transition={{ duration: 0.5 / tokenSpeed, repeat: isPulsing ? Infinity : 0, delay: 0.2 }}
                        style={{ filter: "drop-shadow(0 0 6px rgba(168, 85, 247, 0.8))" }}
                    />
                </div>

                <div className="flex flex-col gap-1 text-[9px] font-mono tracking-widest text-[#AAA] uppercase">
                    <span className="flex items-center gap-1.5">
                        <Thermometer size={10} className="text-purple-400" />
                        {lastPulse?.thermals || 0}°C
                        <span className="text-[#555] ml-1">M3 MAX</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Construction size={10} className="text-cyan-400" />
                        {lastPulse?.compilation_errors === 0 ? "STABLE" : "FAULT"}
                        <span className="text-purple-400/50 text-[8px] tracking-tight ml-2">{(tokenSpeed * 10).toFixed(0)} T/s</span>
                    </span>
                </div>
            </div>

            {/* Proactive Suggestion Card */}
            <AnimatePresence>
                {suggestion && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                        className="fixed bottom-24 left-24 z-40 bg-[#0A0A0A]/90 backdrop-blur-xl border border-purple-500/30 p-4 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.15)] max-w-sm pointer-events-auto"
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-1 flex-shrink-0 animate-pulse text-neon-cyan">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                </motion.div>
                            </div>
                            <div>
                                <h4 className="text-white text-xs font-bold mb-1 tracking-wider uppercase flex justify-between items-center">
                                    Agent Intervention
                                    <span className="text-[9px] text-[#666] font-mono lowercase bg-white/5 py-0.5 px-1.5 rounded">{suggestion.confidence} conf</span>
                                </h4>
                                <p className="text-[#CCC] text-sm leading-relaxed font-light">
                                    {suggestion.message}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
