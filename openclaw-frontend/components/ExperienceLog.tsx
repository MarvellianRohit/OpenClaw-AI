"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Star, Clock, Trash2, Hexagon, Sparkles } from "lucide-react";

interface MemoryShard {
    description: string;
    category: "preference" | "decision";
    timestamp: string;
}

export default function ExperienceLog() {
    const [memories, setMemories] = useState<MemoryShard[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMemories = async () => {
            try {
                const res = await fetch("http://localhost:8000/tools/memories");
                const data = await res.json();
                setMemories(data.memories || []);
            } catch (e) {
                console.error("Memory fetch failed", e);
            } finally {
                setLoading(false);
            }
        };
        fetchMemories();
        const interval = setInterval(fetchMemories, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-transparent overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <BrainCircuit size={14} className="text-cyan-400" />
                    <span className="text-[10px] font-bold text-white tracking-[0.2em] uppercase font-mono">Experience Log</span>
                </div>
                {memories.length > 0 && (
                    <div className="bg-cyan-500/10 px-2 py-0.5 rounded text-[8px] font-bold text-cyan-400 border border-cyan-500/20 uppercase">
                        {memories.length} Shards
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : memories.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                        <Hexagon size={40} className="text-white/10" />
                        <p className="text-[10px] text-titanium-dim font-mono leading-relaxed uppercase tracking-widest">
                            No memory shards formed yet. Proceed with your workflow to crystallize experience.
                        </p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {memories.map((shard, idx) => (
                            <motion.div
                                key={`${shard.timestamp}-${idx}`}
                                initial={{ opacity: 0, scale: 0.9, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, x: 10 }}
                                className="relative group"
                            >
                                <div className="absolute inset-0 bg-cyan-500/5 blur-xl group-hover:bg-cyan-500/10 transition-colors rounded-2xl" />
                                <div className="relative glass-panel p-4 rounded-2xl border border-white/5 group-hover:border-cyan-500/30 transition-all bg-obsidian-soft/40 overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
                                        {shard.category === "preference" ? <Star size={16} /> : <Hexagon size={16} />}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${shard.category === "preference" ? "text-amber-400 bg-amber-400/10" : "text-cyan-400 bg-cyan-400/10"
                                                }`}>
                                                {shard.category}
                                            </span>
                                            <span className="text-[8px] text-titanium-dim font-mono flex items-center gap-1">
                                                <Clock size={8} /> {new Date(shard.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-titanium leading-relaxed font-medium">
                                            {shard.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            <div className="p-4 bg-white/[0.02] border-t border-white/5">
                <div className="flex items-center gap-2 text-[9px] text-titanium-dim uppercase tracking-[0.1em] font-mono leading-tight">
                    <Sparkles size={10} className="text-amber-400" />
                    These shards are encrypted and injected into active inference for zero-repeat context.
                </div>
            </div>
        </div>
    );
}
