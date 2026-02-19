"use client";

import { useState } from "react";
import { MessageSquare, Settings, FolderTree, Cpu, Activity, Database, ChevronLeft, ChevronRight, Plus, Network, History as HistoryIcon, FileText, Loader2 } from "lucide-react";
import SystemVitals from "./SystemVitals";
import FileExplorer from "./FileExplorer";
import VersionHistory from "./VersionHistory";
import MemoryVisualizer from "./MemoryVisualizer";
import ExperienceLog from "./ExperienceLog"; // Phase BD
import EKGMonitor from "./EKGMonitor";
import { SystemStats } from "@/hooks/useSystemVitals";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { useNotification } from "./NotificationContext";

interface SidebarProps {
    isOpen?: boolean;
    setIsOpen?: (open: boolean) => void;
    stats: SystemStats | null;
    isConnected: boolean;
    className?: string;
    onFileSelect?: (path: string) => void;
    onSwitchToChat?: () => void;
    onOpenSettings?: () => void; // New Prop
    onOpenGraph?: () => void;
    activeFile: string | null; // Phase AK
}

export default function Sidebar({ isOpen, setIsOpen, stats, isConnected, className, onFileSelect, onSwitchToChat, onOpenSettings, onOpenGraph, activeFile }: SidebarProps) {
    // If controlled props not provided, manage state internally (hybrid)
    const [internalOpen, setInternalOpen] = useState(true);
    const isCollapsed = isOpen !== undefined ? !isOpen : !internalOpen;
    const toggle = () => setIsOpen ? setIsOpen(!isOpen) : setInternalOpen(!internalOpen);

    const { addNotification, removeNotification } = useNotification();
    const [isGeneratingDocs, setIsGeneratingDocs] = useState(false);

    const handleGenerateDocs = async () => {
        setIsGeneratingDocs(true);
        const notifyId = addNotification({
            message: "Analyzing codebase & generating documentation...",
            type: "info",
            persistent: true
        });

        try {
            const response = await fetch("http://localhost:8000/tools/autodoc", {
                method: "POST"
            });
            const data = await response.json();

            if (data.status === "success") {
                removeNotification(notifyId);
                addNotification({
                    message: "README.md successfully generated!",
                    type: "success",
                    persistent: false
                });
                if (onFileSelect) onFileSelect(data.path);
            } else {
                throw new Error(data.error || "Generation failed");
            }
        } catch (error: any) {
            removeNotification(notifyId);
            addNotification({
                message: `Documentation Error: ${error.message}`,
                type: "error",
                persistent: true
            });
        } finally {
            setIsGeneratingDocs(false);
        }
    };

    const [activeTab, setActiveTab] = useState<"chat" | "files" | "history" | "memory">("chat");
    const [shimmer, setShimmer] = useState(false);

    const triggerShimmer = () => {
        setShimmer(true);
        setTimeout(() => setShimmer(false), 500);
    };

    return (
        <motion.aside
            initial={{ width: 260 }}
            animate={{ width: isCollapsed ? 80 : 300 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={clsx(
                "h-full bg-obsidian border-r border-glass-border flex flex-col glass-panel relative z-20",
                className
            )}
        >
            {/* Shimmer Overlay */}
            <AnimatePresence>
                {shimmer && (
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "linear" }}
                        className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white to-transparent z-50 pointer-events-none"
                    />
                )}
            </AnimatePresence>

            {/* Header / Toggle */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="whitespace-nowrap overflow-hidden"
                        >
                            <span className="font-mono text-neon-cyan font-bold tracking-wider">OPENCLAW</span>
                        </motion.div>
                    )}
                </AnimatePresence>
                <button
                    onClick={toggle}
                    className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-titanium hover:text-white"
                >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Tabs (Only visible when open) */}
            {!isCollapsed && (
                <div className="flex border-b border-white/5 shrink-0">
                    <button
                        onClick={() => {
                            setActiveTab("chat");
                            onSwitchToChat?.();
                        }}
                        className={`flex-1 py-3 text-[10px] font-mono flex items-center justify-center gap-1.5 transition-colors relative
                            ${activeTab === "chat" ? "text-white" : "text-titanium-dim hover:text-white"}`}
                    >
                        <MessageSquare size={12} />
                        CHAT
                        {activeTab === "chat" && <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-neon-cyan" />}
                    </button>
                    <button
                        onClick={() => setActiveTab("files")}
                        className={`flex-1 py-3 text-[10px] font-mono flex items-center justify-center gap-1.5 transition-colors relative
                            ${activeTab === "files" ? "text-white" : "text-titanium-dim hover:text-white"}`}
                    >
                        <FolderTree size={12} />
                        FILES
                        {activeTab === "files" && <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-neon-cyan" />}
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`flex-1 py-3 text-[10px] font-mono flex items-center justify-center gap-1.5 transition-colors relative
                            ${activeTab === "history" ? "text-white" : "text-titanium-dim hover:text-white"}`}
                    >
                        <HistoryIcon size={12} />
                        HISTORY
                        {activeTab === "history" && <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-neon-cyan" />}
                    </button>
                    <button
                        onClick={() => setActiveTab("memory")}
                        className={`flex-1 py-3 text-[10px] font-mono flex items-center justify-center gap-1.5 transition-colors relative
                            ${activeTab === "memory" ? "text-white" : "text-titanium-dim hover:text-white"}`}
                    >
                        <Cpu size={12} />
                        MEMORY
                        {activeTab === "memory" && <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-neon-cyan" />}
                    </button>
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {isCollapsed ? (
                    // Collapsed specific view (Icons)
                    <div className="flex flex-col items-center py-4 space-y-4">
                        <button className="p-2 bg-neon-cyan/10 rounded-lg text-neon-cyan"><Plus size={20} /></button>
                        <button className="p-2 hover:bg-white/5 rounded-lg text-titanium-dim" onClick={onSwitchToChat}><MessageSquare size={20} /></button>
                        <button className="p-2 hover:bg-white/5 rounded-lg text-titanium-dim" onClick={() => setActiveTab("files")}><FolderTree size={20} /></button>
                        <button className="p-2 hover:bg-white/5 rounded-lg text-titanium-dim" onClick={() => setActiveTab("history")}><HistoryIcon size={20} /></button>
                        <button className="p-2 hover:bg-white/5 rounded-lg text-titanium-dim hover:text-neon-cyan" onClick={onOpenSettings}><Settings size={20} /></button>
                    </div>
                ) : (
                    activeTab === "files" ? (
                        <FileExplorer onFileSelect={(path) => {
                            triggerShimmer();
                            onFileSelect?.(path);
                            navigator.clipboard.writeText(path);
                        }} />
                    ) : activeTab === "history" ? (
                        <VersionHistory activeFile={activeFile} />
                    ) : activeTab === "memory" ? (
                        <ExperienceLog />
                    ) : (
                        <div className="p-4 space-y-2 overflow-y-auto">
                            <button className="w-full flex items-center gap-3 p-3 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 hover:bg-neon-cyan/10 transition-all text-left group">
                                <Plus size={16} className="text-neon-cyan" />
                                <span className="text-titanium font-medium text-xs">New Project</span>
                            </button>

                            <button
                                onClick={handleGenerateDocs}
                                disabled={isGeneratingDocs}
                                className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left group disabled:opacity-50"
                            >
                                {isGeneratingDocs ? (
                                    <Loader2 size={16} className="text-titanium animate-spin" />
                                ) : (
                                    <FileText size={16} className="text-titanium group-hover:text-neon-cyan transition-colors" />
                                )}
                                <span className="text-titanium font-medium text-xs">Generate Docs</span>
                            </button>

                            <div className="text-[10px] text-titanium-dim uppercase tracking-wider mt-4 mb-2">Recent</div>
                            {[1, 2, 3].map((i) => (
                                <button key={i} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-titanium-dim hover:text-white text-left text-xs truncate">
                                    <MessageSquare size={14} />
                                    <span>Analysis_Run_{i}0{i}</span>
                                </button>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Phase AY: EKG Monitor */}
            {!isCollapsed && (
                <div className="px-4 py-3 shrink-0">
                    <EKGMonitor />
                </div>
            )}

            {/* Footer / Vitals */}
            <div className={`shrink-0 border-t border-white/5 ${isCollapsed ? 'p-2' : 'p-0'}`}>
                {!isCollapsed ? (
                    <div className="relative">
                        <SystemVitals stats={stats} isConnected={isConnected} />
                        <button
                            className="absolute top-2 right-8 p-1.5 text-titanium-dim hover:text-white rounded-lg hover:bg-white/10"
                            onClick={onOpenGraph}
                            title="Dependency Graph"
                        >
                            <Network size={14} />
                        </button>
                        <button
                            className="absolute top-2 right-2 p-1.5 text-titanium-dim hover:text-white rounded-lg hover:bg-white/10"
                            onClick={onOpenSettings}
                            title="Performance Settings"
                        >
                            <Settings size={14} />
                        </button>
                    </div>
                ) : (
                    // Collapsed Vitals Indicator
                    <div className="flex flex-col items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                        <Activity size={16} className="text-titanium-dim" />
                    </div>
                )}
            </div>

        </motion.aside>
    );
}
