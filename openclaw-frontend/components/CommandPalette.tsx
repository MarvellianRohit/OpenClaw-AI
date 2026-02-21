"use client";

import { useState, useEffect, useRef } from "react";
import {
    Command,
    Search,
    Cpu,
    Zap,
    FileCode,
    Terminal,
    Layout,
    Activity,
    MoveRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectFile: (path: string) => void;
    actions: {
        toggleZen: () => void;
        toggleTerminal: () => void;
        checkLeaks: () => void;
        runBuild: () => void;
        toggleVariableMap: () => void;
    };
    stats: any;
}

export default function CommandPalette({ isOpen, onClose, onSelectFile, actions, stats }: CommandPaletteProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Hardcoded Actions for Natural Language Matching
    const staticActions = [
        { id: "var_map", label: "Open Live Variable Map", keywords: ["variable", "map", "trace", "graph", "live"], icon: Activity, action: actions.toggleVariableMap },
        { id: "zen", label: "Toggle Zen Mode", keywords: ["zen", "focus", "hide"], icon: Layout, action: actions.toggleZen },
        { id: "term", label: "Toggle Terminal", keywords: ["terminal", "console", "cli"], icon: Terminal, action: actions.toggleTerminal },
        { id: "leak", label: "Check for Memory Leaks", keywords: ["leak", "memory", "detect", "scan"], icon: Activity, action: actions.checkLeaks },
        { id: "build", label: "Run Project Build", keywords: ["build", "compile", "make"], icon: Zap, action: actions.runBuild },
    ];

    // Reset on Open
    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setResults(staticActions); // Start with actions
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50); // Small delay for animation
        }
    }, [isOpen]);

    // Search Logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            const q = query.toLowerCase().trim();
            if (!q) {
                setResults(staticActions);
                return;
            }

            // 1. Filter Actions
            const matchedActions = staticActions.filter(act =>
                act.label.toLowerCase().includes(q) ||
                act.keywords.some(k => k.includes(q))
            ).map(act => ({ ...act, type: "action" }));

            // 2. Vitals Check
            const vitalResults = [];
            if (["status", "cpu", "gpu", "vitals", "stats"].some(k => k.includes(q))) {
                vitalResults.push({
                    id: "vitals-cpu",
                    label: `CPU Load: ${stats?.cpu_usage_percent || 0}%`,
                    icon: Cpu,
                    type: "vital"
                });
                vitalResults.push({
                    id: "vitals-gpu",
                    label: `GPU Load: ${stats?.gpu_load_percent || 0}%`,
                    icon: Zap,
                    type: "vital"
                });
            }

            // 3. File Search (Async)
            let fileResults: any[] = [];
            try {
                if (q.length > 2) {
                    const res = await fetch(`http://localhost:8000/search?q=${encodeURIComponent(query)}`);
                    const data = await res.json();
                    fileResults = (data.results || []).slice(0, 5).map((f: any) => ({
                        id: f.file,
                        label: f.file,
                        sub: `Line ${f.line}`,
                        icon: FileCode,
                        type: "file",
                        action: () => onSelectFile(f.file)
                    }));
                }
            } catch (e) { }

            setResults([...vitalResults, ...matchedActions, ...fileResults]);
            setSelectedIndex(0);
        }, 200);

        return () => clearTimeout(timer);
    }, [query]);

    // Keyboard Nav
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % results.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
            } else if (e.key === "Enter") {
                e.preventDefault();
                const item = results[selectedIndex];
                if (item) {
                    if (item.type === "action" || item.type === "file") {
                        item.action?.();
                        onClose();
                    }
                }
            } else if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [isOpen, results, selectedIndex]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
                        className="relative w-full max-w-xl bg-obsidian/80 backdrop-blur-[30px] border border-titanium/30 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
                    >
                        {/* Search Bar */}
                        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
                            <Command className="text-neon-cyan shrink-0" size={24} />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="What would you like to do?"
                                className="flex-1 bg-transparent text-2xl font-light text-white outline-none placeholder-white/20"
                                autoFocus
                            />
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto p-2">
                            {results.length === 0 && (
                                <div className="p-8 text-center text-titanium-dim">No matching commands found.</div>
                            )}

                            {results.map((item, i) => (
                                <motion.button
                                    key={item.id + i}
                                    layout
                                    onClick={() => {
                                        if (item.type !== "vital") {
                                            item.action?.();
                                            onClose();
                                        }
                                    }}
                                    className={clsx(
                                        "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group",
                                        i === selectedIndex ? "bg-white/10" : "hover:bg-white/5"
                                    )}
                                >
                                    <div className={clsx(
                                        "p-2 rounded-lg",
                                        i === selectedIndex ? "bg-neon-cyan text-obsidian" : "bg-white/5 text-titanium"
                                    )}>
                                        <item.icon size={18} />
                                    </div>

                                    <div className="flex-1 text-left">
                                        <div className={clsx("font-medium", i === selectedIndex ? "text-white" : "text-titanium")}>
                                            {item.label}
                                        </div>
                                        {item.sub && (
                                            <div className="text-xs text-titanium-dim font-mono mt-0.5">{item.sub}</div>
                                        )}
                                    </div>

                                    {i === selectedIndex && item.type !== "vital" && (
                                        <motion.div layoutId="enter-icon" className="text-neon-cyan">
                                            <MoveRight size={16} />
                                        </motion.div>
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="bg-black/20 px-4 py-2 flex justify-between items-center border-t border-white/5 text-[10px] text-titanium-dim font-mono uppercase tracking-widest">
                            <span>Titanium Command Core</span>
                            <div className="flex gap-2">
                                <span>Cmd+J to Open</span>
                                <span>Esc to Close</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
