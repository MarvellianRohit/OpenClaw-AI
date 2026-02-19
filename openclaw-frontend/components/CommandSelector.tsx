"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, TestTube, Zap } from 'lucide-react';

interface Command {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
}

const COMMANDS: Command[] = [
    { id: '/explain', label: '/explain', description: 'Summarize the open file', icon: <FileText size={14} className="text-neon-cyan" /> },
    { id: '/test', label: '/test', description: 'Generate unit tests for current function', icon: <TestTube size={14} className="text-purple-500" /> },
    { id: '/optimize', label: '/optimize', description: 'M3 Max-specific performance tweaks', icon: <Zap size={14} className="text-orange-500" /> },
];

interface CommandSelectorProps {
    isVisible: boolean;
    onSelect: (command: string) => void;
    filter: string;
}

export default function CommandSelector({ isVisible, onSelect, filter }: CommandSelectorProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const filteredCommands = COMMANDS.filter(cmd =>
        cmd.id.toLowerCase().startsWith(filter.toLowerCase())
    );

    useEffect(() => {
        setSelectedIndex(0);
    }, [filter]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isVisible) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    onSelect(filteredCommands[selectedIndex].id);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, filteredCommands, selectedIndex, onSelect]);

    return (
        <AnimatePresence>
            {isVisible && filteredCommands.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute bottom-full left-0 mb-2 w-64 bg-obsidian/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100]"
                >
                    <div className="p-1 px-2 border-b border-white/5 bg-white/5">
                        <span className="text-[10px] font-mono text-titanium-dim tracking-widest uppercase">Commands</span>
                    </div>
                    <div className="p-1">
                        {filteredCommands.map((cmd, idx) => (
                            <button
                                key={cmd.id}
                                onClick={() => onSelect(cmd.id)}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left ${idx === selectedIndex ? 'bg-white/10 border-white/10' : 'hover:bg-white/5 border-transparent'
                                    } border`}
                            >
                                <div className={`p-1.5 rounded-md ${idx === selectedIndex ? 'bg-neon-cyan/20' : 'bg-white/5'}`}>
                                    {cmd.icon}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-mono font-bold text-white leading-none mb-1">{cmd.label}</span>
                                    <span className="text-[10px] text-titanium-dim leading-none">{cmd.description}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
