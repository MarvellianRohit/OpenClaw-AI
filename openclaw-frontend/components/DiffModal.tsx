import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { clsx } from "clsx";

interface DiffModalProps {
    isOpen: boolean;
    onClose: () => void;
    originalContent: string;
    newContent: string;
    onAccept: () => void;
    fileName: string;
}

export default function DiffModal({ isOpen, onClose, originalContent, newContent, onAccept, fileName }: DiffModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop: Titanium Grey 0.8 opacity */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[#1c1c1e]/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-6xl h-[80vh] bg-obsidian border border-glass-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-glass-border bg-white/5">
                            <h2 className="text-lg font-mono font-bold text-titanium">
                                Review Changes: <span className="text-neon-cyan">{fileName}</span>
                            </h2>
                            <button onClick={onClose} className="text-titanium hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Diff View (Side by Side) */}
                        <div className="flex-1 grid grid-cols-2 divide-x divide-glass-border min-h-0 bg-[#050505]">
                            {/* Original */}
                            <div className="flex flex-col min-h-0">
                                <div className="p-2 text-[10px] font-mono font-bold text-center bg-[#FF3131]/20 text-[#FF3131] border-b border-[#FF3131]/20 uppercase tracking-widest">
                                    Obsidian-Red / Removed
                                </div>
                                <div className="flex-1 overflow-auto p-4 font-mono text-sm text-[#FF3131]/60 whitespace-pre selection:bg-[#FF3131]/30">
                                    {originalContent || "(New File)"}
                                </div>
                            </div>

                            {/* New */}
                            <div className="flex flex-col min-h-0">
                                <div className="p-2 text-[10px] font-mono font-bold text-center bg-[#B5FF00]/20 text-[#B5FF00] border-b border-[#B5FF00]/20 uppercase tracking-widest">
                                    Titanium-Green / Added
                                </div>
                                <div className="flex-1 overflow-auto p-4 font-mono text-sm text-[#B5FF00] whitespace-pre selection:bg-[#B5FF00]/30">
                                    {newContent}
                                </div>
                            </div>
                        </div>

                        {/* Footer / Actions */}
                        <div className="p-4 border-t border-glass-border bg-white/5 flex justified-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-titanium hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onAccept}
                                className="px-6 py-2 rounded-lg text-sm font-bold bg-neon-cyan text-obsidian hover:bg-white hover:text-obsidian transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(0,243,255,0.3)]"
                            >
                                <Check size={16} />
                                Accept & Apply
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
