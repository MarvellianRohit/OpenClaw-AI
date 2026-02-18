"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FileNode {
    name: string;
    path: string;
    type: "file" | "directory";
    children?: FileNode[];
}

interface FileExplorerProps {
    onFileSelect: (path: string) => void;
}

const FileIcon = ({ name }: { name: string }) => {
    // Simple icon colors based on extension
    if (name.endsWith(".tsx") || name.endsWith(".ts")) return <span className="text-blue-400">📄</span>;
    if (name.endsWith(".py")) return <span className="text-yellow-400">🐍</span>;
    if (name.endsWith(".c") || name.endsWith(".cpp")) return <span className="text-red-400">Ⓒ</span>; // C logo
    if (name.endsWith(".json")) return <span className="text-green-400">{ }</span>;
    if (name.endsWith(".css")) return <span className="text-pink-400">#</span>;
    return <span className="text-titanium-dim">📄</span>;
};

const FileTreeItem = ({ node, onSelect, depth = 0 }: { node: FileNode, onSelect: (path: string) => void, depth?: number }) => {
    const [isOpen, setIsOpen] = useState(false);
    const isDir = node.type === "directory";

    return (
        <div style={{ paddingLeft: `${depth * 12}px` }}>
            <div
                className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer hover:bg-white/5 transition-colors ${!isDir ? 'hover:text-neon-cyan' : ''}`}
                onClick={() => isDir ? setIsOpen(!isOpen) : onSelect(node.path)}
            >
                {isDir && (
                    <span className="text-titanium-dim w-3 text-center">
                        {isOpen ? "▼" : "▶"}
                    </span>
                )}
                {!isDir && <span className="w-3" />} {/* Spacer */}

                {isDir ? (
                    isOpen ? <span className="text-titanium">📂</span> : <span className="text-titanium-dim">📁</span>
                ) : (
                    <FileIcon name={node.name} />
                )}

                <span className={`text-[11px] font-mono truncate ${isDir ? 'text-titanium font-bold' : 'text-titanium-light'}`}>
                    {node.name}
                </span>
            </div>

            <AnimatePresence>
                {isOpen && node.children && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        {node.children.map((child, idx) => (
                            <FileTreeItem key={`${child.path}-${idx}`} node={child} onSelect={onSelect} depth={depth + 1} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function FileExplorer({ onFileSelect }: FileExplorerProps) {
    const [tree, setTree] = useState<FileNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Use a simpler mock structure if fetch fails or use effect to fetch
    useEffect(() => {
        const fetchTree = async () => {
            try {
                const res = await fetch("http://localhost:8000/fs/tree");
                if (!res.ok) throw new Error("Failed");
                const data = await res.json();
                setTree(data);
                setLoading(false);
            } catch (e) {
                console.error(e);
                // Fallback Mock for Demo if server isn't ready
                setTree([
                    {
                        name: "openclaw-backend", path: "/mock/backend", type: "directory", children: [
                            { name: "gateway.py", path: "/mock/backend/gateway.py", type: "file" },
                            { name: "compiler.py", path: "/mock/backend/compiler.py", type: "file" }
                        ]
                    },
                    {
                        name: "openclaw-frontend", path: "/mock/frontend", type: "directory", children: [
                            { name: "app", path: "/mock/frontend/app", type: "directory", children: [] },
                            { name: "components", path: "/mock/frontend/components", type: "directory", children: [] }
                        ]
                    }
                ]);
                setLoading(false);
            }
        };
        fetchTree();
    }, []);

    if (loading) return <div className="p-4 text-xs text-titanium-dim animate-pulse">Scanning Filesystem...</div>;

    return (
        <div className="h-full overflow-y-auto custom-scrollbar pb-20 no-scrollbar">
            <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-titanium-dim font-bold border-b border-white/5 mb-2 flex justify-between">
                <span>Project Files</span>
                <span className="text-[9px] bg-white/5 px-1 rounded">LOCAL</span>
            </div>
            <div className="px-2">
                {tree.map((node, idx) => (
                    <FileTreeItem key={`${node.path}-${idx}`} node={node} onSelect={onFileSelect} />
                ))}
            </div>
        </div>
    );
}
