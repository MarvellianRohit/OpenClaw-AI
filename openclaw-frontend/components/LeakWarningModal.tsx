"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Terminal as TerminalIcon, FileWarning } from "lucide-react";

interface LeakData {
    address?: string;
    size?: number;
    line?: number;
    file?: string;
    summary?: string;
}

interface LeakWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    leakData: LeakData | null;
}

export default function LeakWarningModal({ isOpen, onClose, leakData }: LeakWarningModalProps) {
    if (!leakData) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-obsidian/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="w-full max-w-md bg-[#0a0a0a] border border-orange-500/30 rounded-2xl shadow-[0_0_50px_rgba(249,115,22,0.15)] overflow-hidden"
                    >
                        {/* Warning Header */}
                        <div className="bg-gradient-to-r from-orange-600/20 to-transparent p-4 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-500/20 rounded-lg text-orange-500">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold tracking-widest text-orange-500 uppercase">Memory Leak Detected</h2>
                                    <p className="text-[10px] text-titanium-dim uppercase tracking-tighter">Automatic Memory Profiler (leaks-macOS)</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-white/5 rounded-md text-titanium-dim hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            {leakData.summary ? (
                                <p className="text-xs text-titanium-light font-mono bg-white/5 p-3 rounded-lg border border-white/5">
                                    {leakData.summary}
                                </p>
                            ) : (
                                <>
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] text-titanium-dim uppercase font-bold">Culprit File</span>
                                                <span className="text-xs font-mono text-white">{leakData.file || "unknown"}</span>
                                            </div>
                                            <div className="flex justify-between items-end border-t border-white/5 pt-2">
                                                <span className="text-[10px] text-titanium-dim uppercase font-bold">Crash/Leak Line</span>
                                                <span className="text-sm font-mono text-orange-400 font-bold underline decoration-orange-500/40 underline-offset-4">
                                                    L{leakData.line}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-end border-t border-white/5 pt-2">
                                                <span className="text-[10px] text-titanium-dim uppercase font-bold">Allocation Size</span>
                                                <span className="text-xs font-mono text-titanium">{leakData.size} bytes</span>
                                            </div>
                                            <div className="flex justify-between items-end border-t border-white/5 pt-2">
                                                <span className="text-[10px] text-titanium-dim uppercase font-bold">Memory Address</span>
                                                <span className="text-[10px] font-mono text-titanium-dim">{leakData.address}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 p-3 bg-white/5 rounded-lg border border-orange-500/10 flex gap-3 items-start">
                                        <div className="mt-0.5 text-orange-500/60">
                                            <FileWarning size={14} />
                                        </div>
                                        <p className="text-[10px] text-titanium-dim leading-relaxed">
                                            Recommendation: Verify that every <span className="text-orange-400">malloc</span> / <span className="text-orange-400">calloc</span> has a corresponding <span className="text-orange-400">free</span> inside the execution path.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-white/5 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 text-white text-[10px] font-bold py-2.5 rounded-lg shadow-lg shadow-orange-500/20 active:scale-95 transition-transform uppercase tracking-widest"
                            >
                                Acknowledge & Fix
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
