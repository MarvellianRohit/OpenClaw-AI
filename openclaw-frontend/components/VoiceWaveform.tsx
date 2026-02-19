"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Waves } from 'lucide-react';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'command_detected';

export default function VoiceWaveform() {
    const [state, setState] = useState<VoiceState>('idle');
    const [lastCommand, setLastCommand] = useState("");
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const connect = () => {
            const ws = new WebSocket("ws://localhost:8000/ws/voice");
            wsRef.current = ws;

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "voice_state") {
                        setState(data.state);
                        if (data.text) {
                            setLastCommand(data.text);

                            // Dispatch Custom Event for UI to react
                            const cmd = data.text.toLowerCase();
                            if (cmd.includes("zen mode")) {
                                window.dispatchEvent(new CustomEvent('toggle-zen'));
                            } else if (cmd.includes("terminal")) {
                                window.dispatchEvent(new CustomEvent('toggle-terminal'));
                            } else if (cmd.includes("build") || cmd.includes("run")) {
                                window.dispatchEvent(new CustomEvent('run-build'));
                            } else if (cmd.includes("find") && cmd.includes("bug")) {
                                window.dispatchEvent(new CustomEvent('find-bug'));
                            }

                            // Clear command after 3 seconds
                            setTimeout(() => setLastCommand(""), 3000);
                        }
                    }
                } catch (e) {
                    console.error("Voice Socket Error", e);
                }
            };

            ws.onclose = () => {
                setTimeout(connect, 3000);
            };
        };

        connect();
        return () => wsRef.current?.close();
    }, []);

    return (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[60] py-4">
            <AnimatePresence>
                {state !== 'idle' && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="flex flex-col items-center gap-2"
                    >
                        {/* Command Text Bubble */}
                        {lastCommand && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-neon-cyan/90 text-obsidian px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(0,243,255,0.4)] mb-2"
                            >
                                {lastCommand}
                            </motion.div>
                        )}

                        {/* Waveform Container */}
                        <div className="bg-obsidian/80 backdrop-blur-2xl border border-white/5 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-2xl">
                            <div className={state === 'processing' ? 'text-neon-cyan animate-pulse' : 'text-titanium-dim'}>
                                {state === 'listening' ? <Mic size={18} /> : <Waves size={18} />}
                            </div>

                            <div className="flex items-center gap-1 h-6">
                                {[...Array(8)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={state === 'listening' ? {
                                            height: [8, Math.random() * 24 + 8, 8],
                                        } : state === 'processing' ? {
                                            height: 4,
                                            scaleX: [1, 1.5, 1],
                                            opacity: [0.3, 1, 0.3]
                                        } : { height: 4 }}
                                        transition={{
                                            duration: 0.5,
                                            repeat: Infinity,
                                            delay: i * 0.05
                                        }}
                                        className="w-1 bg-neon-cyan rounded-full"
                                    />
                                ))}
                            </div>

                            <div className="text-[10px] font-mono font-bold tracking-[0.2em] text-titanium uppercase">
                                {state === 'listening' ? 'Claw Listening' : 'Analyzing...'}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
