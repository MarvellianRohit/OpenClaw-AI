"use client";

import SystemVitals from "./SystemVitals";
import ReplConsole from "./ReplConsole";
import DebuggerPanel from "./DebuggerPanel";
import { SystemStats } from "@/hooks/useSystemVitals";
import { motion, AnimatePresence } from "framer-motion";

interface RightPanelProps {
    stats: SystemStats | null;
    isConnected: boolean;
    isOpen?: boolean;
    contextMode?: "default" | "c" | "python";
}

export default function RightPanel({ stats, isConnected, isOpen = true, contextMode = "default" }: RightPanelProps) {
    if (!isOpen) return null;

    return (
        <div className="w-80 border-l border-glass-border glass-panel hidden lg:flex flex-col p-4 space-y-4">
            {/* Always show Vitals, maybe condensed? Keeping as is for now. */}
            <div className="shrink-0">
                <SystemVitals stats={stats} isConnected={isConnected} />
            </div>

            {/* Dynamic Context Area */}
            <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {contextMode === "c" && (
                        <motion.div
                            key="c-debugger"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="absolute inset-0 flex flex-col"
                        >
                            <DebuggerPanel />
                        </motion.div>
                    )}

                    {contextMode === "python" && (
                        <motion.div
                            key="python-repl"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="absolute inset-0 flex flex-col"
                        >
                            <ReplConsole />
                        </motion.div>
                    )}

                    {contextMode === "default" && (
                        <motion.div
                            key="default-tools"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="absolute inset-0 glass-panel rounded-xl p-4 opacity-50 flex items-center justify-center text-titanium-dim font-mono text-xs text-center"
                        >
                            Select a file to activate<br />Context Tools
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
