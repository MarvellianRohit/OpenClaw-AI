"use client";

import { useState, useEffect, useRef } from "react";
import { X, Terminal as TerminalIcon, Eraser, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

interface TerminalProps {
    isOpen: boolean;
    onClose: () => void;
    onLineReceived?: (line: string) => void;
}

export default function Terminal({ isOpen, onClose, onLineReceived }: TerminalProps) {
    const [history, setHistory] = useState<string[]>(["Titanium Terminal v1.0 [Online]"]);
    const [input, setInput] = useState("");
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    // Connect to WebSocket
    useEffect(() => {
        if (isOpen && !socket) {
            const ws = new WebSocket("ws://localhost:8000/ws/terminal");

            ws.onopen = () => {
                setHistory(prev => [...prev, "Connected to backend gateway..."]);
            };

            ws.onmessage = (event) => {
                setHistory(prev => [...prev, event.data]);
                onLineReceived?.(event.data);
            };

            ws.onclose = () => {
                setHistory(prev => [...prev, "Connection closed."]);
                setSocket(null);
            };

            setSocket(ws);
        }

        return () => {
            if (!isOpen && socket) {
                socket.close();
                setSocket(null);
            }
        };
    }, [isOpen]);

    const handleExecute = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || !socket) return;

        // Echo command
        setHistory(prev => [...prev, `$ ${input}`]);
        socket.send(input);
        setInput("");
    };

    const handleClear = () => {
        setHistory([]);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 right-0 h-[300px] z-40 bg-[#000000] border-t border-neon-cyan/30 shadow-[0_-5px_20px_rgba(6,182,212,0.15)] flex flex-col font-mono"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                        <div className="flex items-center gap-2 text-neon-cyan">
                            <TerminalIcon size={16} />
                            <span className="text-xs font-bold tracking-widest uppercase">Titanium Terminal</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleClear} className="p-1 hover:text-white text-titanium-dim transition-colors" title="Clear">
                                <Eraser size={14} />
                            </button>
                            <button onClick={onClose} className="p-1 hover:text-red-500 text-titanium-dim transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Output Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-sm">
                        {history.map((line, i) => (
                            <div key={i} className="whitespace-pre-wrap break-all text-green-400 font-medium opacity-90">
                                {line}
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleExecute} className="p-3 bg-white/5 border-t border-white/10 flex items-center gap-2">
                        <span className="text-neon-cyan/80 font-bold">$</span>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-white font-mono placeholder-white/20"
                            placeholder="Execute command..."
                            autoFocus
                        />
                        <button type="submit" className="text-neon-cyan hover:text-white transition-colors">
                            <Play size={16} className="fill-current" />
                        </button>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
