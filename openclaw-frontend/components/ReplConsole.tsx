"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal as TerminalIcon, Play, RefreshCw } from "lucide-react";

export default function ReplConsole() {
    const [history, setHistory] = useState<string[]>(["Python 3.9.13 (default, Aug 25 2022) [Clang 12.0.0]"]);
    const [input, setInput] = useState("");
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    // Connect to WebSocket
    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8000/ws/terminal");

        ws.onopen = () => {
            setHistory(prev => [...prev, "Connected to REPL Service..."]);
            // Initialize Python environment
            ws.send("python3 -q");
        };

        ws.onmessage = (event) => {
            // Filter raw JSON if any leaks/etc come through
            try {
                const data = JSON.parse(event.data);
                if (data.type) return;
            } catch (e) { }

            setHistory(prev => [...prev, event.data]);
        };

        ws.onclose = () => {
            setHistory(prev => [...prev, "Connection closed."]);
        };

        setSocket(ws);

        return () => {
            ws.close();
        };
    }, []);

    const handleExecute = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || !socket) return;

        setHistory(prev => [...prev, `>>> ${input}`]);
        socket.send(input);
        setInput("");
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#0d1117] font-mono text-xs rounded-lg overflow-hidden border border-white/5">
            {/* Header */}
            <div className="px-3 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-yellow-400">
                    <TerminalIcon size={12} />
                    <span className="font-bold tracking-widest text-[10px]">PYTHON REPL</span>
                </div>
                <button
                    onClick={() => setHistory([])}
                    className="text-titanium-dim hover:text-white transition-colors"
                    title="Clear Console"
                >
                    <RefreshCw size={10} />
                </button>
            </div>

            {/* Output */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar bg-[#0d1117]">
                {history.map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap break-words text-blue-300/90 leading-relaxed">
                        {line}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleExecute} className="p-2 bg-white/5 border-t border-white/5 flex gap-2">
                <span className="text-yellow-400 font-bold select-none">&gt;&gt;&gt;</span>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-white placeholder-white/20"
                    autoFocus
                />
            </form>
        </div>
    );
}
