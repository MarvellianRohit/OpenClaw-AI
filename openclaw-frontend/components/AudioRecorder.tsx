"use client";

import { useState, useRef } from "react";
import { Mic, Loader2, Square } from "lucide-react";
import { clsx } from "clsx";

interface AudioRecorderProps {
    onTranscript: (text: string) => void;
    className?: string;
}

export default function AudioRecorder({ onTranscript, className }: AudioRecorderProps) {
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
                await sendAudio(blob);
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

    const sendAudio = async (blob: Blob) => {
        const formData = new FormData();
        formData.append("file", blob, "recording.wav");

        try {
            const response = await fetch("http://localhost:8000/transcribe", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                if (data.text) {
                    onTranscript(data.text);
                } else if (data.error) {
                    alert(`Transcription Error: ${data.error}`);
                }
            } else {
                alert("Transcription failed.");
            }
        } catch (error) {
            console.error("Error uploading audio:", error);
            alert("Network error during transcription.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={clsx(
                "p-2 text-titanium-dim hover:text-white transition-colors rounded-lg hover:bg-white/10",
                isRecording && "text-red-500 animate-pulse bg-red-500/10 hover:bg-red-500/20",
                className
            )}
            title={isRecording ? "Stop Recording" : "Voice Input (Whisper)"}
        >
            {isProcessing ? (
                <Loader2 size={18} className="animate-spin text-neon-cyan" />
            ) : isRecording ? (
                <Square size={18} fill="currentColor" />
            ) : (
                <Mic size={18} />
            )}
        </button>
    );
}
