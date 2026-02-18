"use client";

import { X, FileCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

interface TabBarProps {
    files: string[];
    activeFile: string | null;
    onSelect: (path: string) => void;
    onClose: (path: string) => void;
}

export default function TabBar({ files, activeFile, onSelect, onClose }: TabBarProps) {
    if (files.length === 0) return null;

    return (
        <div className="flex items-center bg-[#0a0a0a] border-b border-white/5 overflow-x-auto scrollbar-hide pt-1">
            <AnimatePresence>
                {files.map((path) => {
                    const fileName = path.split('/').pop() || path;
                    const isActive = path === activeFile;

                    return (
                        <motion.div
                            key={path}
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className={clsx(
                                "group relative flex items-center gap-2 px-4 py-2.5 cursor-pointer transition-all min-w-[120px] max-w-[200px]",
                                isActive ? "bg-[#111] text-titanium" : "text-titanium-dim hover:bg-white/5 hover:text-titanium"
                            )}
                            onClick={() => onSelect(path)}
                        >
                            {/* Active Indicator (Brushed Titanium Underline) */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabUnderline"
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-titanium to-transparent"
                                />
                            )}

                            <FileCode size={14} className={isActive ? "text-neon-cyan" : "opacity-50"} />

                            <span className="text-xs font-mono truncate flex-1">{fileName}</span>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose(path);
                                }}
                                className={clsx(
                                    "p-0.5 rounded-md hover:bg-white/10 transition-colors",
                                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                )}
                            >
                                <X size={12} />
                            </button>

                            {/* Separator */}
                            {!isActive && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[1px] h-4 bg-white/5" />
                            )}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
