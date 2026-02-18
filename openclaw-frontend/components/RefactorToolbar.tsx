"use client";

import { motion } from "framer-motion";
import { Sparkles, Zap, Bug, MessageSquarePlus } from "lucide-react";

interface RefactorToolbarProps {
    visible: boolean;
    x: number;
    y: number;
    onAction: (action: string) => void;
}

export default function RefactorToolbar({ visible, x, y, onAction }: RefactorToolbarProps) {
    if (!visible) return null;

    const buttons = [
        { id: "explain", icon: Sparkles, label: "Explain", color: "text-purple-400" },
        { id: "optimize", icon: Zap, label: "Optimize", color: "text-amber-400" },
        { id: "fix", icon: Bug, label: "Fix Bugs", color: "text-red-400" },
        { id: "comment", icon: MessageSquarePlus, label: "Comment", color: "text-neon-cyan" },
    ];

    return (
        <div
            style={{
                position: 'fixed',
                left: x,
                top: y,
                zIndex: 1000
            }}
            className="pointer-events-auto"
        >
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex items-center gap-1 p-1 bg-[#1a1a1a]/90 backdrop-blur-md border border-neon-cyan/30 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            >
                {buttons.map((btn) => (
                    <button
                        key={btn.id}
                        onClick={() => onAction(btn.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors group"
                    >
                        <btn.icon size={14} className={btn.color} />
                        <span className="text-xs font-mono font-medium text-titanium group-hover:text-white">
                            {btn.label}
                        </span>
                    </button>
                ))}
            </motion.div>
        </div>
    );
}
