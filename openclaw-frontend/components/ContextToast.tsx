"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Zap, CloudLightning } from "lucide-react";

export default function ContextToast() {
    const [show, setShow] = useState(false);
    const [contextTokens, setContextTokens] = useState(0);
    const [isHighCapacity, setIsHighCapacity] = useState(false);

    useEffect(() => {
        const connect = () => {
            const ws = new WebSocket("ws://localhost:8000/ws/voice"); // Reusing voice stream for system events

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "context_scale") {
                        setContextTokens(data.tokens);
                        setIsHighCapacity(data.high_capacity);
                        setShow(true);

                        // Hide after 6 seconds
                        setTimeout(() => setShow(false), 6000);
                    }
                } catch (e) {
                    console.error("Context Scale Socket Error", e);
                }
            };

            ws.onclose = () => {
                setTimeout(connect, 3000);
            };
        };

        connect();
    }, []);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, x: 100, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 100, scale: 0.9 }}
                    className="fixed top-24 right-8 z-[100] max-w-sm pointer-events-auto"
                >
                    <div className={`glass-panel p-4 flex items-start gap-4 rounded-2xl border-l-[4px] shadow-2xl transition-all duration-500 ${isHighCapacity
                            ? "border-l-neon-cyan/80 bg-neon-cyan/5 shadow-[0_0_30px_rgba(0,243,255,0.2)]"
                            : "border-l-titanium/80 bg-titanium/5"
                        }`}>
                        <div className={`p-2 rounded-xl ${isHighCapacity ? "bg-neon-cyan/20 text-neon-cyan" : "bg-titanium/20 text-titanium"}`}>
                            {isHighCapacity ? <Zap size={24} className="animate-pulse" /> : <Cpu size={24} />}
                        </div>

                        <div className="flex flex-col gap-1">
                            <h3 className={`text-sm font-bold tracking-tight ${isHighCapacity ? "text-neon-cyan" : "text-titanium"}`}>
                                {isHighCapacity ? "HIGH-CAPACITY MODE ACTIVE" : "STANDARD CONTEXT ACTIVE"}
                            </h3>
                            <p className="text-xs text-titanium-dim leading-relaxed">
                                {isHighCapacity
                                    ? `Infrastructure scaled to ${contextTokens / 1000}k tokens using available system RAM.`
                                    : `Context reset to ${contextTokens / 1000}k tokens for performance optimization.`}
                            </p>

                            <div className="mt-2 flex items-center gap-2">
                                <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: isHighCapacity ? "100%" : "25%" }}
                                        className={`h-full ${isHighCapacity ? "bg-neon-cyan" : "bg-titanium"}`}
                                    />
                                </div>
                                <span className="text-[10px] font-mono font-bold text-titanium-dim">
                                    {contextTokens / 1000}K
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
