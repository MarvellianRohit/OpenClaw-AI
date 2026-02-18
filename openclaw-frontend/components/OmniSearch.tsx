"use client";

import { useState, useEffect, useRef } from "react";
import { Search, FileCode, CornerDownLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

interface OmniSearchProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectFile: (path: string, line: number) => void;
}

export default function OmniSearch({ isOpen, onClose, onSelectFile }: OmniSearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus and reset
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setQuery("");
            setResults([]);
        }
    }, [isOpen]);

    // Debounced Search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }
            try {
                const res = await fetch(`http://localhost:8000/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(data.results || []);
                setSelectedIndex(0);
            } catch (e) {
                console.error(e);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % results.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (results[selectedIndex]) {
                    onSelectFile(results[selectedIndex].file, results[selectedIndex].line);
                    onClose();
                }
            } else if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, results, selectedIndex]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: -20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: -20 }}
                        transition={{ type: "spring", duration: 0.3 }}
                        className="relative w-full max-w-2xl bg-obsidian/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Search Input */}
                        <div className="flex items-center px-4 py-4 border-b border-white/10 gap-3">
                            <Search size={20} className="text-titanium-dim" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="flex-1 bg-transparent outline-none text-xl text-white placeholder-titanium-dim font-light"
                                placeholder="Search files, symbols, code..."
                            />
                            <div className="hidden sm:flex items-center gap-1">
                                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-titanium-dim">ESC</span>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10">
                            {results.length === 0 && query && (
                                <div className="p-8 text-center text-titanium-dim text-sm">No results found.</div>
                            )}
                            {results.length === 0 && !query && (
                                <div className="p-8 text-center text-titanium-dim text-sm">Type to search...</div>
                            )}

                            {results.map((res, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        onSelectFile(res.file, res.line);
                                        onClose();
                                    }}
                                    className={clsx(
                                        "w-full flex items-start text-left gap-3 p-3 rounded-lg transition-colors group",
                                        i === selectedIndex ? "bg-neon-cyan/10" : "hover:bg-white/5"
                                    )}
                                >
                                    <FileCode size={18} className={clsx("mt-0.5 shrink-0 transition-colors", i === selectedIndex ? "text-neon-cyan" : "text-titanium-dim")} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className={clsx("text-sm font-medium truncate", i === selectedIndex ? "text-neon-cyan" : "text-titanium")}>
                                                {res.file}
                                            </span>
                                            <span className="text-xs text-titanium-dim font-mono">L{res.line}</span>
                                        </div>
                                        <div className="mt-1 text-xs text-titanium-dim font-mono truncate opacity-70">
                                            {res.snippet}
                                        </div>
                                    </div>
                                    {i === selectedIndex && <CornerDownLeft size={14} className="mt-1 text-neon-cyan/50" />}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
