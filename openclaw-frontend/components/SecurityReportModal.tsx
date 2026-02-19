"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldAlert,
    X,
    ChevronRight,
    Wand2,
    AlertTriangle,
    Info,
    CheckCircle2
} from "lucide-react";

interface SecurityFinding {
    type: string;
    severity: "high" | "medium" | "low";
    title: string;
    description: string;
    line: number;
}

interface SecurityReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    findings: SecurityFinding[];
    filepath: string;
    onApplyFix: (finding: SecurityFinding) => void;
    isPatching?: boolean;
}

export default function SecurityReportModal({
    isOpen,
    onClose,
    findings,
    filepath,
    onApplyFix,
    isPatching = false
}: SecurityReportModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-obsidian-soft/60 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl brushed-metal"
                    >
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-warning-orange/10 border border-warning-orange/20 flex items-center justify-center">
                                    <ShieldAlert className="text-warning-orange" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black uppercase tracking-widest text-white">Security Audit</h2>
                                    <p className="text-xs text-titanium-dim font-mono">{filepath.split('/').pop()}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-titanium-dim transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Findings List */}
                        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-6">
                            {findings.map((finding, idx) => (
                                <div key={idx} className="group relative">
                                    <div className={`absolute -inset-2 rounded-3xl transition-colors ${finding.severity === 'high' ? 'bg-red-500/5 group-hover:bg-red-500/10' : 'bg-warning-orange/5 group-hover:bg-warning-orange/10'
                                        }`} />
                                    <div className="relative p-6 rounded-2xl border border-white/5 bg-obsidian/40">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${finding.severity === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-warning-orange/20 text-warning-orange'
                                                        }`}>
                                                        {finding.severity} SEVERITY
                                                    </span>
                                                    <span className="text-[10px] font-mono text-titanium-dim">Line {finding.line}</span>
                                                </div>
                                                <h3 className="text-md font-bold text-white">{finding.title}</h3>
                                                <p className="text-[13px] text-titanium leading-relaxed font-medium italic opacity-90">
                                                    "{finding.description}"
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => onApplyFix(finding)}
                                                disabled={isPatching}
                                                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isPatching ? (
                                                    <span className="animate-spin">⟳</span>
                                                ) : (
                                                    <Wand2 size={14} className="text-neon-cyan group-hover/btn:rotate-12 transition-transform" />
                                                )}
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white">
                                                    {isPatching ? "Patching..." : "Patch Now"}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full border border-obsidian bg-obsidian-soft flex items-center justify-center"><CheckCircle2 size={12} className="text-neon-cyan" /></div>)}
                                </div>
                                <span className="text-[10px] font-mono text-titanium-dim uppercase tracking-wider">M3 Max Optimized Audit Engine</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl bg-white text-obsidian font-black text-[11px] uppercase tracking-widest hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all"
                            >
                                Dismiss Audit
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
