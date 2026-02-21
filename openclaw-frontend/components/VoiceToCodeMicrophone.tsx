"use client";

import { useState, useRef } from "react";
import { Mic, Loader2, Square, Sparkles } from "lucide-react";
import { clsx } from "clsx";

interface VoiceToCodeMicrophoneProps {
    onCodeGenerated: (code: string) => void;
    currentCode: string;
    cursorLine: number;
    filePath: string;
}

export default function VoiceToCodeMicrophone({ onCodeGenerated, currentCode, cursorLine, filePath }: VoiceToCodeMicrophoneProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: "audio/wav" });
                await sendAudioAndGenerateCode(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Microphone access denied or unavailable.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsProcessing(true);
        }
    };

    const sendAudioAndGenerateCode = async (blob: Blob) => {
        const formData = new FormData();
        formData.append("file", blob, "recording.wav");

        try {
            // STEP 1: Transcribe via Whisper
            const transcribeRes = await fetch("http://localhost:8000/transcribe", {
                method: "POST",
                body: formData,
            });

            if (!transcribeRes.ok) throw new Error("Transcription failed.");

            const transcribeData = await transcribeRes.json();
            if (transcribeData.error) throw new Error(transcribeData.error);
            const instruction = transcribeData.text;

            if (!instruction || instruction.trim().length === 0) {
                setIsProcessing(false);
                return;
            }

            // STEP 2: Voice-to-Code Generation
            const codeRes = await fetch("http://localhost:8000/voice-to-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    instruction,
                    current_code: currentCode,
                    cursor_line: cursorLine,
                    filepath: filePath
                })
            });

            if (!codeRes.ok) throw new Error("Code generation failed.");

            const codeData = await codeRes.json();
            if (codeData.error) throw new Error(codeData.error);

            onCodeGenerated(codeData.snippet);

        } catch (error) {
            console.error("Error in Voice-to-Code pipeline:", error);
            alert("Voice-to-Code pipeline error. Check console.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={clsx(
                "p-3 rounded-full flex items-center justify-center transition-all shadow-lg backdrop-blur-md z-50",
                isProcessing ? "bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan" :
                    isRecording ? "bg-red-500/20 border border-red-500/50 text-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]" :
                        "bg-obsidian-soft/80 border border-white/10 text-titanium hover:bg-white/10 hover:border-white/20 hover:text-white"
            )}
            title={isRecording ? "Stop Dictation" : "Voice-to-Code Dictation"}
        >
            {isProcessing ? (
                <Loader2 size={24} className="animate-spin" />
            ) : isRecording ? (
                <Square size={24} fill="currentColor" />
            ) : (
                <div className="relative">
                    <Mic size={24} />
                    <Sparkles size={10} className="absolute -top-1 -right-2 text-purple-400" />
                </div>
            )}
        </button>
    );
}
