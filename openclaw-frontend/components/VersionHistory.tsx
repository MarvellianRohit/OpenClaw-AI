"use client";

import { useEffect, useState } from "react";
import { History, FileText, Clock, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface Snapshot {
    timestamp: number;
    size: number;
    filepath: string;
}

interface VersionHistoryProps {
    activeFile: string | null;
}

export default function VersionHistory({ activeFile }: VersionHistoryProps) {
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!activeFile) return;

        async function fetchHistory() {
            setLoading(true);
            try {
                if (!activeFile) return;
                const res = await fetch(`http://localhost:8000/history/list?path=${encodeURIComponent(activeFile)}`);
                const data = await res.json();
                setSnapshots(data);
            } catch (e) {
                console.error("Failed to fetch history", e);
            } finally {
                setLoading(false);
            }
        }

        fetchHistory();
    }, [activeFile]);

    const handleSnapshotClick = async (timestamp: number) => {
        if (!activeFile) return;
        try {
            // Get current content from local editor or server
            // For the diff, we want the current file vs the snapshot
            const currentRes = await fetch(`http://localhost:8000/file/read`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filepath: activeFile })
            });
            const { content: currentContent } = await currentRes.json();

            const snapshotRes = await fetch(`http://localhost:8000/history/read?path=${encodeURIComponent(activeFile)}&timestamp=${timestamp}`);
            const { content: snapshotContent } = await snapshotRes.json();

            // Trigger custom event to open DiffModal in page.tsx
            window.dispatchEvent(new CustomEvent('open-diff', {
                detail: {
                    fileName: activeFile.split('/').pop(),
                    originalContent: snapshotContent,
                    newContent: currentContent,
                    onAccept: () => {
                        console.log("History restored effectively?");
                        // Optionally implement restore logic here
                    }
                }
            }));
        } catch (e) {
            console.error("Failed to load snapshot for diff", e);
        }
    };

    if (!activeFile) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <FileText size={32} className="text-titanium-dim mb-2 opacity-20" />
                <p className="text-xs text-titanium-dim font-mono">Select a file to view its version history</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-transparent overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-titanium tracking-widest uppercase">Timeline</span>
                <span className="text-[10px] font-mono text-neon-cyan opacity-60 truncate max-w-[120px]">
                    {activeFile.split('/').pop()}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="w-4 h-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : snapshots.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-[10px] text-titanium-dim italic">No snapshots found for this build.</p>
                    </div>
                ) : (
                    <div className="space-y-4 relative">
                        {/* Vertical line for timeline */}
                        <div className="absolute left-[11px] top-1 bottom-1 w-[1px] bg-white/10" />

                        {snapshots.map((ss, idx) => (
                            <motion.button
                                key={ss.timestamp}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => handleSnapshotClick(ss.timestamp)}
                                className="w-full flex items-start gap-4 p-2 rounded-lg hover:bg-white/5 transition-colors group text-left relative z-10"
                            >
                                <div className="mt-1 w-[22px] h-[22px] rounded-full bg-obsidian border border-white/20 flex items-center justify-center shrink-0 group-hover:border-neon-cyan transition-colors">
                                    <Clock size={10} className="text-titanium-dim group-hover:text-neon-cyan" />
                                </div>
                                <div className="flex-1 flex flex-col gap-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-medium text-titanium group-hover:text-white">
                                            {new Date(ss.timestamp * 1000).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                        <ExternalLink size={10} className="text-titanium-dim opacity-0 group-hover:opacity-100" />
                                    </div>
                                    <div className="flex items-center gap-2 text-[9px] font-mono text-titanium-dim">
                                        <span className="px-1 py-0.5 rounded bg-white/5 uppercase">Snapshot</span>
                                        <span>{(ss.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
