"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export type MonitorState = "healthy" | "processing" | "error";

export default function EKGMonitor() {
    const [state, setState] = useState<MonitorState>("healthy");
    const [points, setPoints] = useState<number[]>(new Array(40).fill(50));
    const requestRef = useRef<number | null>(null);
    const pulseRef = useRef(0);

    useEffect(() => {
        const connect = () => {
            const ws = new WebSocket("ws://localhost:8000/ws/voice");

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "pulse") {
                        // Check for errors in pulse data
                        if (data.data.compilation_errors > 0) {
                            setState("error");
                        } else {
                            setState("healthy");
                        }
                    } else if (data.state === "processing") {
                        setState("processing");
                    }
                } catch (e) { }
            };

            ws.onclose = () => setTimeout(connect, 3000);
        };

        connect();

        // EKG Animation Logic
        const animate = () => {
            pulseRef.current += 0.15;

            setPoints((prev) => {
                let newVal = 50;
                const x = pulseRef.current % 10;

                // EKG Pattern Logic
                if (x > 1 && x < 1.5) newVal = 20; // P-wave (simplified)
                else if (x > 2 && x < 2.2) newVal = 80; // Q-dip
                else if (x > 2.2 && x < 2.6) newVal = 10; // R-peak
                else if (x > 2.6 && x < 2.8) newVal = 90; // S-dip
                else if (x > 3.5 && x < 4.5) newVal = 40; // T-wave

                // Add random jitter based on state
                const jitter = state === "processing" ? (Math.random() - 0.5) * 10 : (Math.random() - 0.5) * 3;

                const next = [...prev.slice(1), newVal + jitter];
                return next;
            });
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current!);
    }, [state]);

    const getColor = () => {
        switch (state) {
            case "error": return "#FF003C";
            case "processing": return "#FFB800";
            default: return "#00F3FF";
        }
    };

    const path = points.map((p, i) => `${i * 5},${p}`).join(" L");

    return (
        <div className="w-full flex flex-col gap-2 p-3 bg-obsidian/40 backdrop-blur-xl border border-white/5 rounded-xl shadow-inner relative overflow-hidden group">
            {/* Titanium Brushed Border Effect */}
            <div className="absolute inset-0 border border-white/10 rounded-xl pointer-events-none" />
            <div className="absolute inset-[1px] border border-black/20 rounded-xl pointer-events-none" />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: getColor() }} />
                    <span className="text-[10px] font-mono font-bold tracking-widest text-titanium-dim uppercase">Brain Telemetry</span>
                </div>
                <span className="text-[9px] font-mono text-titanium-dim opacity-50 uppercase">72 BPM</span>
            </div>

            <div className="h-16 w-full relative">
                <svg viewBox="0 0 200 100" className="w-full h-full preserve-3d">
                    {/* Base Grid */}
                    <defs>
                        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="200" height="100" fill="url(#grid)" />

                    {/* Glowing Waveform */}
                    <motion.path
                        d={`M 0,50 L ${path}`}
                        fill="none"
                        stroke={getColor()}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={false}
                        animate={{ stroke: getColor() }}
                        className="filter drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]"
                    />

                    {/* Scanning Line */}
                    <motion.line
                        x1="0" y1="0" x2="0" y2="100"
                        stroke={getColor()}
                        strokeWidth="0.5"
                        strokeOpacity="0.3"
                        animate={{ x: [0, 200] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                </svg>
            </div>

            <div className="flex items-center justify-between mt-1 px-1">
                <div className="flex gap-2">
                    <div className="h-0.5 w-4 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            animate={{ width: ["0%", "100%", "0%"] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="h-full bg-titanium"
                        />
                    </div>
                    <div className="h-0.5 w-4 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            animate={{ width: ["0%", "80%", "0%"] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                            className="h-full bg-titanium"
                        />
                    </div>
                </div>
                <span className="text-[8px] font-mono text-titanium-dim uppercase tracking-tighter">
                    State: {state}
                </span>
            </div>
        </div>
    );
}
