"use client";

import { ChevronRight, Box, FileCode, Braces } from "lucide-react";
import { motion } from "framer-motion";

interface StructureMapProps {
    path: string | null;
    functionName: string | null;
    className: string | null;
}

export default function StructureMap({ path, functionName, className }: StructureMapProps) {
    if (!path) return null;

    const parts = path.split('/');
    const fileName = parts.pop();
    const folder = parts.length > 0 ? parts[parts.length - 1] : "root";

    return (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-sm text-xs font-mono text-titanium-dim overflow-x-auto whitespace-nowrap scrollbar-hide">
            {/* Project/Folder */}
            <div className="flex items-center gap-1 hover:text-titanium transition-colors cursor-pointer">
                <Box size={12} className="text-neon-cyan/70" />
                <span>{folder}</span>
            </div>

            <ChevronRight size={12} className="opacity-30" />

            {/* File */}
            <div className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
                <FileCode size={12} className="text-neon-cyan/70" />
                <span className="font-bold text-titanium">{fileName}</span>
            </div>

            {/* Class (Optional) */}
            {className && (
                <>
                    <ChevronRight size={12} className="opacity-30" />
                    <div className="flex items-center gap-1 text-neon-cyan hover:underline decoration-neon-cyan/30 cursor-pointer">
                        <span className="opacity-70">class</span>
                        <span>{className}</span>
                    </div>
                </>
            )}

            {/* Function (Optional) */}
            {functionName && (
                <>
                    <ChevronRight size={12} className="opacity-30" />
                    <motion.div
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-1 text-neon-cyan hover:bg-neon-cyan/10 px-1.5 py-0.5 rounded cursor-pointer"
                    >
                        <Braces size={12} />
                        <span>{functionName}()</span>
                    </motion.div>
                </>
            )}
        </div>
    );
}
