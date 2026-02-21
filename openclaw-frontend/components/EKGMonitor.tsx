"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export type MonitorState = "healthy" | "processing" | "error" | "warning";

export default function EKGMonitor({ onOpenReport }: { onOpenReport?: (findings: any[]) => void }) {
    const [state, setState] = useState<MonitorState>("healthy");
    const [statusText, setStatusText] = useState("SYSTEM IDLE");
    const [findings, setFindings] = useState<any[]>([]); // Store security findings
    const [isPulsing, setIsPulsing] = useState(false);
    const [tokenSpeed, setTokenSpeed] = useState(1);
    const requestRef = useRef<number | null>(null);

    interface EKGMonitorProps {
        onOpenReport?: (findings: any[]) => void;
    }

    useEffect(() => {
        const connect = () => {
            const ws = new WebSocket("ws://localhost:8000/ws/voice");

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "pulse") {
                        setStatusText(data.data.status_text || "SYSTEM IDLE");
                        setIsPulsing(true);
                        const speed = Math.min(3, Math.max(0.5, (data.data.cpu_percent || 10) / 10));
                        setTokenSpeed(speed);
                        setTimeout(() => setIsPulsing(false), 500 / speed);

                        // Check for errors in pulse data
                        if (data.data.compilation_errors > 0) {
                            setState("error");
                        } else if (state !== "warning") {
                            setState("healthy");
                        }
                    } else if (data.state === "processing") {
                        setState("processing");
                    } else if (data.type === "heartbeat_warning") {
                        setState("warning");
                        setFindings(data.findings);
                    }
                } catch (e) { }
            };

            ws.onclose = () => setTimeout(connect, 3000);
        };

        connect();
    }, [state]);

    const getColor = () => {
        switch (state) {
            case "error": return "#FF003C";
            case "processing": return "#FFB800";
            case "warning": return "#FFA500"; // Warning Orange
            default: return "#00F3FF";
        }
    };


    return (
        <div
            onClick={() => state === "warning" && onOpenReport?.(findings)}
            className={`w-full flex flex-col gap-2 p-3 bg-obsidian/40 backdrop-blur-xl border border-white/5 rounded-xl shadow-inner relative overflow-hidden group ${state === 'warning' ? 'cursor-pointer hover:bg-warning-orange/5' : ''}`}
        >
            {/* Titanium Brushed Border Effect */}
            <div className="absolute inset-0 border border-white/10 rounded-xl pointer-events-none" />
            <div className="absolute inset-[1px] border border-black/20 rounded-xl pointer-events-none" />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${state === 'warning' ? 'animate-ping' : 'animate-pulse'}`} style={{ backgroundColor: getColor() }} />
                    <span className="text-[10px] font-mono font-bold tracking-widest text-titanium-dim uppercase flex items-center gap-2">
                        <span>{state === 'warning' ? 'SECURITY FLICKER' : 'Brain Telemetry'}</span>
                        <span className="text-[8px] opacity-70 border-l border-white/10 pl-2">{statusText}</span>
                    </span>
                </div>
                <span className="text-[9px] font-mono text-titanium-dim opacity-50 uppercase">
                    {state === 'warning' ? 'THREAT DETECTED' : '72 BPM'}
                </span>
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

                    {/* Neural Flow Core Nerve */}
                    <path
                        d="M -10,50 Q 50,-10 100,50 T 210,50"
                        fill="transparent"
                        stroke="rgba(168, 85, 247, 0.2)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        style={{ filter: "drop-shadow(0 0 4px rgba(168, 85, 247, 0.4))" }}
                    />
                    {/* Firing Spark Pulse */}
                    <motion.path
                        d="M -10,50 Q 50,-10 100,50 T 210,50"
                        fill="transparent"
                        stroke="#A855F7"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={isPulsing ? {
                            pathLength: [0, 1, 1],
                            opacity: [0, 1, 0],
                            pathOffset: [0, 0, 1]
                        } : { pathLength: 0, opacity: 0 }}
                        transition={{
                            duration: 1.5 / tokenSpeed,
                            ease: "easeInOut"
                        }}
                        style={{ filter: "drop-shadow(0 0 12px rgba(168, 85, 247, 0.9)) blur(1px)" }}
                    />

                    {/* Cyan Accent Track */}
                    <motion.path
                        d="M -10,50 Q 50,-10 100,50 T 210,50"
                        fill="transparent"
                        stroke="#00F3FF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={isPulsing ? {
                            pathLength: [0, 0.5, 1],
                            opacity: [0, 0.8, 0],
                            pathOffset: [0, 0.5, 1]
                        } : { pathLength: 0, opacity: 0 }}
                        transition={{
                            duration: 1 / tokenSpeed,
                            ease: "easeOut",
                            delay: 0.1
                        }}
                        style={{ filter: "drop-shadow(0 0 8px rgba(0, 243, 255, 0.8))" }}
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
