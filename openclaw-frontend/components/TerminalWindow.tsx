"use client";

import { useEffect, useRef, useState } from "react";
import { X, Play, AlertTriangle } from "lucide-react";

interface TerminalProps {
    logs: { type: "stdout" | "stderr" | "error" | "exit"; content: string }[];
    isOpen: boolean;
    onClose: () => void;
}

export default function TerminalWindow({ logs, isOpen, onClose }: TerminalProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-0 left-80 right-0 h-48 bg-[#1e1e1e] border-t border-white/10 z-30 flex flex-col font-mono text-xs shadow-2xl">
            {/* Header */}
            <div className="h-8 bg-[#252526] flex items-center justify-between px-4 border-b border-black">
                <div className="flex items-center gap-2">
                    <span className="text-white font-bold">TERMINAL</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-gray-400">gcc output</span>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <X size={14} />
                </button>
            </div>

            {/* Output */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                {logs.map((log, i) => (
                    <div key={i} className={`whitespace-pre-wrap break-all ${log.type === "stderr" ? "text-red-400" :
                            log.type === "error" ? "text-red-500 font-bold" :
                                log.type === "exit" ? "text-blue-400 opacity-50 italic" : "text-gray-300"
                        }`}>
                        {log.type === "stderr" && <AlertTriangle size={10} className="inline mr-1" />}
                        {log.type === "exit" ? `Process exited with code ${log.content}` : log.content}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
