"use client";

import { useState } from "react";
import { Copy, Check, FileText, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SmartCommitModalProps {
    isOpen: boolean;
    onClose: () => void;
    summary: string;
}

export default function SmartCommitModal({ isOpen, onClose, summary }: SmartCommitModalProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                            <div className="flex items-center gap-2 text-neon-cyan">
                                <FileText size={18} />
                                <span className="font-mono font-bold tracking-wider uppercase text-sm">Smart Summary</span>
                            </div>
                            <button onClick={onClose} className="text-titanium-dim hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="bg-black/50 border border-white/5 rounded-lg p-4 font-mono text-sm text-titanium leading-relaxed whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
                                {summary || "Generating summary..."}
                            </div>
                        </div>

                        <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-white/5">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg text-sm text-titanium hover:text-white transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleCopy}
                                className="px-4 py-2 rounded-lg bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/30 transition-all flex items-center gap-2 text-sm font-medium"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? "Copied" : "Copy to Clipboard"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
