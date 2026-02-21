"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Copy, Check, Wand2, Network } from "lucide-react";
import FluidInput from "./FluidInput";
import { clsx } from "clsx";
import { useOpenClawStream } from "@/hooks/useOpenClawStream";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import AudioRecorder from "./AudioRecorder";
import DiffModal from "./DiffModal";
import PlanningRoadmap from "./PlanningRoadmap";

// Copy Button Component
const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-titanium hover:text-white transition-colors border border-white/5"
        >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
    );
};

interface TypewriterProps {
    content: string;
    isStreaming: boolean;
    onApplyFix: (path: string, content: string) => void;
    onMagicComment?: (code: string, lang: string) => void;
}

const FileLink = ({ path, onOpen }: { path: string, onOpen: (p: string) => void }) => (
    <span
        onClick={() => onOpen(path)}
        className="text-neon-cyan underline decoration-dotted cursor-pointer hover:text-white hover:decoration-solid px-1 rounded hover:bg-neon-cyan/10 transition-colors inline-flex items-center gap-1"
    >
        📄 {path}
    </span>
);

const CitationBadge = ({ citation }: { citation: any }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div
            className="group relative cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <div className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border transition-all duration-300",
                isExpanded
                    ? "bg-neon-cyan/20 border-neon-cyan/50 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                    : "bg-white/5 border-white/10 text-titanium-dim hover:bg-white/10 hover:text-titanium"
            )}>
                <span className="opacity-60">[{(citation.distance || 0).toFixed(2)}]</span>
                <span>{citation.filename}</span>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full left-0 mt-2 p-3 bg-obsidian-soft border border-white/10 rounded-xl shadow-2xl z-50 w-80 text-xs font-sans text-titanium leading-relaxed"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-[9px] text-neon-cyan uppercase">Raw Context Snippet</span>
                            <span className="font-mono text-[9px] text-titanium-dim">Chunk #{citation.chunk_index}</span>
                        </div>
                        <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-2">
                            {citation.content}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const TypewriterMarkdown = ({
    content,
    isStreaming,
    onApplyFix,
    onOpenFile,
    onMagicComment
}: TypewriterProps & { onOpenFile: (path: string) => void }) => {
    const [displayedContent, setDisplayedContent] = useState("");
    const indexRef = useRef(0);

    // ... (streaming logic same) ...
    useEffect(() => {
        if (!isStreaming) {
            setDisplayedContent(content);
            return;
        }
        if (!content.startsWith(displayedContent)) {
            setDisplayedContent("");
            indexRef.current = 0;
        }
        const interval = setInterval(() => {
            if (indexRef.current < content.length) {
                setDisplayedContent(prev => prev + content.charAt(indexRef.current));
                indexRef.current++;
            } else {
                clearInterval(interval);
            }
        }, 5); // FAST TYPEWRITER
        return () => clearInterval(interval);
    }, [content, isStreaming]);

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                p({ children }) {
                    // Primitive File Link Detection in Text Nodes
                    return (
                        <p className="mb-4 last:mb-0 leading-7 text-titanium-light">
                            {React.Children.map(children, child => {
                                if (typeof child === 'string') {
                                    // Split by potential file paths (basic regex for extensions)
                                    const parts = child.split(/(\b[\w\/-]+\.(?:py|tsx|ts|js|json|c|h|md)\b)/g);
                                    return parts.map((part, i) => {
                                        if (i % 2 === 1) return <FileLink key={i} path={part} onOpen={onOpenFile} />;
                                        return part;
                                    });
                                }
                                return child;
                            })}
                        </p>
                    )
                },
                code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '')
                    const codeContent = String(children).replace(/\n$/, '');
                    const lang = match ? match[1] : "";

                    // Detect "// file: <path>" pattern
                    const fileMatch = codeContent.match(/^\/\/\s*file:\s*(.+)$/m);
                    const filePath = fileMatch ? fileMatch[1].trim() : null;

                    return !inline && match ? (
                        <div className="relative group my-4 rounded-lg overflow-hidden border border-white/10 shadow-inner bg-[#050505]">
                            <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5 text-xs text-titanium-dim">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-neon-cyan/80">{lang}</span>
                                    {filePath && <span className="opacity-50">• {filePath}</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                    {onMagicComment && (
                                        <button
                                            onClick={() => onMagicComment(codeContent, lang)}
                                            className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
                                            title="Add AI Comments (Magic Wand)"
                                        >
                                            <Wand2 size={14} className="group-hover:animate-pulse" />
                                            <span className="text-[10px] font-bold uppercase hidden group-hover:block">Intelli-Comment</span>
                                        </button>
                                    )}
                                    {filePath && (
                                        <button
                                            onClick={() => onApplyFix(filePath, codeContent)}
                                            className="flex items-center gap-1 hover:text-white transition-colors"
                                        >
                                            <span className="uppercase text-[10px] font-bold text-neon-cyan hover:underline">Review Fix</span>
                                        </button>
                                    )}
                                    <CopyButton text={codeContent} />
                                </div>
                            </div>
                            <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={lang}
                                PreTag="div"
                                customStyle={{ margin: 0, borderRadius: 0, background: 'transparent' }} // Transparent to show container bg
                                {...props}
                            >
                                {codeContent}
                            </SyntaxHighlighter>
                        </div>
                    ) : (
                        <code className={clsx("bg-white/10 rounded px-1.5 py-0.5 text-neon-cyan font-mono text-xs border border-white/5", className)} {...props}>
                            {children}
                        </code>
                    )
                }
            }}
        >
            {displayedContent + (isStreaming ? "▋" : "")}
        </ReactMarkdown>
    );
};

interface ChatInterfaceProps {
    onShowSummary?: (summary: string) => void;
    activeCode?: string;
    activeFile?: string | null;
    terminalLastErrors?: string[];
    pendingMessage?: string | null;
    onMessageHandled?: () => void;
    // Lifted
    messages: any[];
    sendMessage: (msg: string, file?: string | null) => void;
    isProcessing: boolean;
    currentStream: string;
    connectionStatus: string;
    setMessages: any; // visual ref
    sendAction: any;
    statusMessage: string;
    socket: any;
    currentCitations?: any[];
}

export default function ChatInterface({
    onShowSummary,
    activeCode = "",
    activeFile = null,
    terminalLastErrors = [],
    pendingMessage,
    onMessageHandled,
    messages,
    sendMessage,
    isProcessing,
    currentStream,
    connectionStatus,
    setMessages,
    sendAction,
    statusMessage,
    socket,
    currentCitations
}: ChatInterfaceProps) {
    // const { ... } = useOpenClawStream(); // REMOVED
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleMagicComment = async (msgId: string, code: string, lang: string) => {
        try {
            console.log("Magic Wand Activated for", msgId);
            const res = await fetch("http://localhost:8000/tools/docs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, language: lang })
            });
            const data = await res.json();
            if (data.code) {
                setMessages((prev: any[]) => prev.map(m => {
                    if (m.id === msgId) {
                        return { ...m, content: m.content.replace(code, data.code) };
                    }
                    return m;
                }));
            }
        } catch (e) {
            console.error("Magic Comment failed", e);
        }
    };

    // Handle Pending Message (from Refactor Toolbar)
    useEffect(() => {
        if (pendingMessage) {
            handleSend(pendingMessage);
            onMessageHandled?.();
        }
    }, [pendingMessage]);

    // Voice & Input State
    const [inputText, setInputText] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);
    const [stressActive, setStressActive] = useState(false);

    // Diff Modal State
    const [diffState, setDiffState] = useState({
        isOpen: false,
        path: "",
        original: "",
        new: "",
    });

    const [roadmapSteps, setRoadmapSteps] = useState<any[]>([]);

    // Listen for summary and roadmap events
    useEffect(() => {
        if (!socket) return;

        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "summary" && data.content) {
                    onShowSummary?.(data.content);
                }
                if (data.type === "roadmap_step") {
                    setRoadmapSteps(prev => {
                        // Check if step exists
                        const existingIdx = prev.findIndex(s => s.label === data.step);
                        const newStep = {
                            id: Date.now().toString(),
                            label: data.step,
                            status: data.status,
                            logs: data.logs
                        };

                        // If "Verification" complete, likely done. 
                        // If "Simulating", mark previous "Analyzing" as complete.
                        const updated = [...prev];
                        if (existingIdx >= 0) {
                            updated[existingIdx] = { ...updated[existingIdx], ...newStep };
                        } else {
                            // Mark all others as complete if this is a new "active" step
                            if (data.status === 'active') {
                                updated.forEach(s => { if (s.status === 'active') s.status = 'complete'; });
                            }
                            updated.push(newStep);
                        }
                        return updated;
                    });
                    // Auto-scroll
                    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                }
            } catch (e) {
                // ignore
            }
        };

        socket.addEventListener("message", handleMessage);
        return () => socket.removeEventListener("message", handleMessage);
    }, [socket, onShowSummary]);

    const handleEndSession = () => {
        if (socket) {
            socket.send(JSON.stringify({ type: "summarize_session" }));
        }
    };

    // Scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, currentStream]);

    const [selectedModel, setSelectedModel] = useState("OpenClaw-Ultra-M3");

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedModel(e.target.value);
        // Ideally send a signal to backend
        sendAction({ type: "switch_model", model: e.target.value });
    };

    const handleSend = (text: string) => {
        playClick();
        if (text.trim() === "/stress") {
            setStressActive(true);
            setInputText("");
            return;
        }

        // Deep-Context Injection (Phase AD)
        let finalMessage = text;
        if (!text.startsWith("/")) {
            let contextXML = "";
            if (activeCode) {
                const lines = activeCode.split('\n');
                const last50 = lines.slice(-50).join('\n');
                contextXML += `<file name="${activeFile || 'untitled'}">\n${last50}\n</file>\n`;
            }
            if (terminalLastErrors && terminalLastErrors.length > 0) {
                contextXML += `<errors>\n${terminalLastErrors.join('\n')}\n</errors>\n`;
            }

            if (contextXML) {
                // Hidden context wrapper
                finalMessage = `${text}\n\n<system_context>\n${contextXML}</system_context>`;
            }
        }

        sendMessage(finalMessage, activeFile);
        setInputText("");
    };

    // Stress Test Simulation
    useEffect(() => {
        if (!stressActive) return;

        const id = Date.now().toString();
        // Add initial message
        // We modify messages directly? usage of setMessages from hook is not exposed?
        // Wait, useOpenClawStream exposes `messages` but not `setMessages`.
        // I need to expose `addMessage` or `streamChunk` in useOpenClawStream to simulate this externally?
        // Or I can just use `sendMessage` with a special prompt?
        // But user asked for "Stress-Test script" for FRONTEND.
        // Bypassing useOpenClawStream is cleaner for pure frontend test.
        // But I can't modify `messages` as it is inside the hook.

        // Alternative: Add `simulateStream` to useOpenClawStream.
        // Let's hold off on this replace until I update useOpenClawStream.
    }, [stressActive]);

    const handleApplyFix = async (path: string, newContent: string) => {
        try {
            const res = await fetch(`http://localhost:8000/tools/read_file?path=${encodeURIComponent(path)}`);
            let original = "";
            if (res.ok) {
                const data = await res.json();
                original = data.content;
            } else {
                original = "// New File or Error fetching original content";
            }

            setDiffState({
                isOpen: true,
                path,
                original,
                new: newContent
            });
        } catch (e) {
            console.error(e);
            alert("Failed to fetch original file.");
        }
    };

    const handleAcceptDiff = () => {
        playClick();
        if (!diffState.path) return;
        sendAction({
            type: "apply_fix",
            path: diffState.path,
            content: diffState.new
        });
        setDiffState(prev => ({ ...prev, isOpen: false }));
    };

    // Combine history + current stream for display
    const allMessages = [...messages];
    if (currentStream) {
        allMessages.push({
            id: "streaming-response",
            role: "assistant",
            content: currentStream,
            timestamp: Date.now(),
            citations: currentCitations
        });
    }

    // Sound Hook (Simple Audio Context Beep)
    const playClick = () => {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // High freq click
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    };

    return (
        <div className={clsx(
            "flex-1 flex flex-col h-full relative overflow-hidden bg-gradient-to-b from-obsidian to-[#0d0d0d] transition-all duration-500",
            isProcessing && "shadow-[inset_0_0_20px_rgba(6,182,212,0.15)] border-l-2 border-r-2 border-neon-cyan/30"
        )}>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-800">
                {allMessages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={clsx(
                            "flex gap-4 max-w-4xl mx-auto",
                            msg.role === "assistant" ? "justify-start" : "justify-end"
                        )}
                        layout // animating layout changes
                    >
                        {msg.role === "assistant" && (
                            <div className="w-8 h-8 rounded-full bg-neon-cyan/20 border border-neon-cyan/50 flex items-center justify-center shrink-0 mt-1">
                                <Bot size={18} className="text-neon-cyan" />
                            </div>
                        )}

    // Callback to open file (Hack: emit event or context?)
                        // Ideally use a global context or pass prop.
                        // For now, let's use a Custom Event to communicate with Page (Simplest without refactoring props chain extensively if needed)
                        // Or just accept we need to update page.tsx too.

                        // Updating ChatInterface to accept props is cleaner.

                        // ...
                        <div className="flex flex-col gap-2 relative">
                            <div className={clsx(
                                "p-5 rounded-2xl max-w-[85%] border overflow-hidden backdrop-blur-md shadow-sm transition-all",
                                msg.role === "assistant"
                                    ? "bg-white/5 border-white/10 text-titanium/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                                    : "bg-neon-cyan/5 border-neon-cyan/20 text-white shadow-[inset_0_0_10px_rgba(6,182,212,0.05)] ml-auto"
                            )}>
                                {msg.role === "assistant" ? (
                                    <TypewriterMarkdown
                                        content={msg.content}
                                        isStreaming={msg.id === "streaming-response"}
                                        onApplyFix={handleApplyFix}
                                        onMagicComment={(code, lang) => handleMagicComment(msg.id, code, lang)}
                                        onOpenFile={(path) => {
                                            // Dispatch event for Page to catch
                                            window.dispatchEvent(new CustomEvent('open-file', { detail: path }));
                                        }}
                                    />
                                ) : (
                                    <div className="text-sm leading-relaxed font-sans whitespace-pre-wrap">{msg.content}</div>
                                )}
                            </div>

                            {/* Render Citations if attached to message */}
                            {msg.role === "assistant" && msg.citations && msg.citations.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {msg.citations.map((c: any, idx: number) => (
                                        <CitationBadge key={idx} citation={c} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {msg.role === "user" && (
                            <div className="w-8 h-8 rounded-full bg-titanium/20 border border-titanium/50 flex items-center justify-center shrink-0 mt-1">
                                <User size={18} className="text-titanium" />
                            </div>
                        )}
                    </motion.div>
                ))}
                <div className="max-w-4xl mx-auto px-4">
                    <PlanningRoadmap isVisible={roadmapSteps.length > 0} steps={roadmapSteps} />
                </div>
                <div ref={bottomRef} className="h-4" />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-gradient-to-t from-obsidian via-obsidian to-transparent z-20">
                <div className="max-w-4xl mx-auto relative group">
                    <FluidInput
                        value={inputText}
                        onChange={setInputText}
                        onSend={handleSend}
                        isProcessing={isProcessing}
                    />
                    <div className="absolute right-14 bottom-3 z-30">
                        <AudioRecorder onTranscript={(text) => setInputText(prev => prev + (prev ? " " : "") + text)} />
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <p className={clsx("text-center text-xs font-mono transition-all duration-300",
                            statusMessage ? "text-neon-cyan animate-pulse" : "text-titanium-dim opacity-50"
                        )}>
                            {statusMessage || "OpenClaw AI v1.0 • Local Inference Only"}
                        </p>
                        <span className={clsx(
                            "w-2 h-2 rounded-full",
                            connectionStatus === "open" && "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]",
                            connectionStatus === "connecting" && "bg-yellow-500 animate-pulse",
                            connectionStatus === "closed" && "bg-red-500",
                            connectionStatus === "error" && "bg-red-500"
                        )} />
                        {connectionStatus !== "open" && (
                            <span className="text-xs text-titanium-dim font-mono uppercase">
                                {connectionStatus}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            {/* Header Overlay for Model Selection & Actions */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-graph'))}
                    className="p-1.5 rounded-lg border border-neon-cyan/30 bg-black/80 backdrop-blur text-neon-cyan hover:bg-neon-cyan/10 transition-colors shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                    title="Open Architecture Graph"
                >
                    <Network size={18} />
                </button>

                <button
                    onClick={handleEndSession}
                    className="px-3 py-1.5 rounded-lg border border-neon-cyan/30 bg-black/80 backdrop-blur text-[10px] font-mono text-neon-cyan hover:bg-neon-cyan/10 transition-colors uppercase tracking-widest shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                >
                    End Session
                </button>

                <div className="relative group">
                    <select
                        value={selectedModel}
                        onChange={handleModelChange}
                        className="appearance-none bg-black/80 backdrop-blur border border-neon-cyan/30 text-neon-cyan text-xs font-mono py-1.5 pl-3 pr-8 rounded-lg outline-none focus:ring-1 focus:ring-neon-cyan cursor-pointer"
                    >
                        <option value="OpenClaw-Turbo-7B">⚡ Turbo (7B)</option>
                        <option value="OpenClaw-Ultra-M3">🚀 Ultra (M3 Max)</option>
                        <option value="OpenClaw-Vision-Pro">👁️ Vision Pro</option>
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-3 h-3 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>


            {/* Diff Modal */}
            <DiffModal
                isOpen={diffState.isOpen}
                onClose={() => setDiffState(prev => ({ ...prev, isOpen: false }))}
                fileName={diffState.path}
                originalContent={diffState.original}
                newContent={diffState.new}
                onAccept={handleAcceptDiff}
            />

            {/* Terminal Window (Mock for now, needs hook integration) */}
            {/* <TerminalWindow 
                isOpen={false} 
                onClose={() => {}} 
                logs={[]} 
            /> */}

        </div>
    );
}
