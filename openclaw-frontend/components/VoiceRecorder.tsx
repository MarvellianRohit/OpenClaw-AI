import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceRecorderProps {
    onCodeGenerated: (code: string) => void;
}

export default function VoiceRecorder({ onCodeGenerated }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const ws = useRef<WebSocket | null>(null);
    const audioContext = useRef<AudioContext | null>(null);
    const mediaStream = useRef<MediaStream | null>(null);
    const processor = useRef<ScriptProcessorNode | null>(null);
    const isRecordingRef = useRef<boolean>(false);

    useEffect(() => {
        // Connect WebSocket
        const connectWs = () => {
            const socket = new WebSocket('ws://localhost:8000/ws/voice');
            socket.binaryType = 'arraybuffer';

            socket.onopen = () => console.log('🎙️ Voice WS Connected');
            socket.onmessage = (e) => {
                if (typeof e.data === 'string') {
                    const res = JSON.parse(e.data);
                    if (res.error) {
                        setError(res.error);
                        setIsProcessing(false);
                    } else if (res.code) {
                        onCodeGenerated(res.code);
                        setIsProcessing(false);
                        setError(null);
                    }
                }
            };
            socket.onerror = (e) => console.error('Voice WS Error', e);
            ws.current = socket;
        };

        connectWs();
        return () => {
            ws.current?.close();
        };
    }, []);

    const startRecording = async () => {
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStream.current = stream;

            // Need exactly 16000Hz for Google Speech Recognition to work perfectly without resampling
            const ctx = new window.AudioContext({ sampleRate: 16000 });
            audioContext.current = ctx;

            const source = ctx.createMediaStreamSource(stream);
            const proc = ctx.createScriptProcessor(4096, 1, 1);
            processor.current = proc;

            // Ensure WS is clear
            if (ws.current?.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({ command: 'clear' }));
            }

            isRecordingRef.current = true;
            proc.onaudioprocess = (e) => {
                if (!isRecordingRef.current) return;
                const float32 = e.inputBuffer.getChannelData(0);
                // Convert Float32 to Int16 PCM
                const int16 = new Int16Array(float32.length);
                for (let i = 0; i < float32.length; i++) {
                    const s = Math.max(-1, Math.min(1, float32[i]));
                    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }

                if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    ws.current.send(int16.buffer); // Send binary
                }
            };

            source.connect(proc);
            proc.connect(ctx.destination);

            setIsRecording(true);
        } catch (err: any) {
            console.error("Mic access denied", err);
            setError("Mic access denied");
        }
    };

    const stopRecording = () => {
        isRecordingRef.current = false;
        setIsRecording(false);
        setIsProcessing(true);

        // Stop tracks
        mediaStream.current?.getTracks().forEach(t => t.stop());
        processor.current?.disconnect();
        audioContext.current?.close();

        // Signal Backend to process
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ command: 'process' }));
        } else {
            setIsProcessing(false);
            setError("WebSocket offline");
        }
    };

    return (
        <div className="flex items-center gap-2">
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                        className="text-[10px] text-red-400 bg-red-500/10 px-2 py-1 rounded font-mono border border-red-500/20"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`p-2 rounded-full border shadow-lg flex items-center justify-center transition-all ${isRecording
                    ? "bg-red-500 border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                    : isProcessing
                        ? "bg-[#222] border-[#444] text-[#AAA]"
                        : "bg-[#1A1A1A] border-[#333] text-neon-cyan hover:border-neon-cyan hover:shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                    }`}
            >
                {isRecording ? (
                    <Square className="w-5 h-5 fill-current" />
                ) : isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                ) : (
                    <Mic className="w-5 h-5" />
                )}
            </motion.button>

            {/* Ripple Animation when recording */}
            {isRecording && (
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
            )}

            {isProcessing && (
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            )}
        </div>
    );
}
