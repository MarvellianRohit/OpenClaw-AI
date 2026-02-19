"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Database, Zap } from "lucide-react";

interface MemoryEvent {
    type: "malloc" | "free";
    addr: number;
    size?: number;
}

interface BlockState {
    id: number;
    isAllocated: boolean;
    lastAction: number; // timestamp
}

export default function MemoryVisualizer() {
    const [blocks, setBlocks] = useState<BlockState[]>(
        Array.from({ length: 144 }, (_, i) => ({ id: i, isAllocated: false, lastAction: 0 }))
    );
    const [stats, setStats] = useState({ allocs: 0, totalSize: 0 });
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        wsRef.current = new WebSocket("ws://localhost:8000/ws/memory");

        wsRef.current.onmessage = (event) => {
            const data: MemoryEvent = JSON.parse(event.data);

            setBlocks((prev) => {
                const newBlocks = [...prev];
                // Map address to a grid index (simplified hash)
                const index = data.addr % newBlocks.length;

                if (data.type === "malloc") {
                    newBlocks[index] = { ...newBlocks[index], isAllocated: true, lastAction: Date.now() };
                    setStats(s => ({ allocs: s.allocs + 1, totalSize: s.totalSize + (data.size || 0) }));
                } else {
                    newBlocks[index] = { ...newBlocks[index], isAllocated: false, lastAction: Date.now() };
                    setStats(s => ({ ...s, allocs: Math.max(0, s.allocs - 1) }));
                }
                return newBlocks;
            });
        };

        return () => wsRef.current?.close();
    }, []);

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-transparent overflow-hidden font-mono uppercase">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/2">
                <div className="flex items-center gap-2">
                    <Database size={14} className="text-neon-cyan" />
                    <span className="text-[10px] font-bold text-titanium tracking-widest">Memory Grid</span>
                </div>
                <div className="flex gap-3 text-[9px] text-titanium-dim">
                    <span className="flex items-center gap-1">
                        <Zap size={10} className="text-neon-cyan" /> {stats.allocs} ALLOCS
                    </span>
                </div>
            </div>

            <div className="flex-1 p-4 flex items-center justify-center">
                <div className="grid grid-cols-12 gap-1.5 aspect-square w-full max-w-[220px]">
                    {blocks.map((block) => (
                        <div
                            key={block.id}
                            className="relative"
                        >
                            <motion.div
                                animate={{
                                    backgroundColor: block.isAllocated ? "#00F3FF" : "#1A1A1A",
                                    boxShadow: block.isAllocated
                                        ? "0 0 10px rgba(0, 243, 255, 0.4)"
                                        : "0 0 0px rgba(0, 0, 0, 0)",
                                    opacity: block.isAllocated ? 1 : 0.6
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="w-full aspect-square rounded-[2px] border border-white/5"
                            />
                            {/* Flash effect on change */}
                            <AnimatePresence>
                                {Date.now() - block.lastAction < 500 && (
                                    <motion.div
                                        initial={{ opacity: 0.8, scale: 1 }}
                                        animate={{ opacity: 0, scale: 1.5 }}
                                        exit={{ opacity: 0 }}
                                        className={`absolute inset-0 rounded-[2px] z-10 ${block.isAllocated ? 'bg-neon-cyan' : 'bg-white/20'}`}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-4 border-t border-white/5 bg-obsidian-soft/50">
                <div className="space-y-2">
                    <div className="flex justify-between text-[9px]">
                        <span className="text-titanium-dim">Heap Density</span>
                        <span className="text-neon-cyan">{((stats.allocs / 144) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-neon-cyan shadow-[0_0_10px_#00F3FF]"
                            animate={{ width: `${(stats.allocs / 144) * 100}%` }}
                        />
                    </div>
                    <p className="text-[8px] text-titanium-dim leading-relaxed">
                        LLVM MEMORY TRACE ACTIVE. M3 MAX INTERCEPTION VIA LLDB WRAPPER.
                    </p>
                </div>
            </div>
        </div>
    );
}
