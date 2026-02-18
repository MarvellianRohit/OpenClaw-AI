"use client";

import { useRef, useEffect, useState } from "react";
import { Send, Mic } from "lucide-react";
import { clsx } from "clsx";

interface FluidInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: (message: string) => void;
    isProcessing: boolean;
}

export default function FluidInput({ value, onChange, onSend, isProcessing }: FluidInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim() && !isProcessing) {
                onSend(value);
            }
        }
    };

    return (
        <div className={clsx(
            "relative rounded-2xl bg-white/5 border transition-all duration-300 backdrop-blur-md overflow-hidden",
            isProcessing ? "border-neon-cyan/50 shadow-[0_0_15px_rgba(0,243,255,0.1)] animate-pulse" : "border-white/10 focus-within:border-neon-cyan/50 focus-within:shadow-[0_0_15px_rgba(0,243,255,0.1)]"
        )}>
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask OpenClaw AI (Model: Llama3-70B)..."
                className="w-full bg-transparent text-titanium placeholder:text-titanium-dim p-4 pr-32 resize-none focus:outline-none min-h-[60px] max-h-[200px] leading-relaxed font-mono text-sm"
                rows={1}
            />

            <div className="absolute right-2 bottom-2 flex items-center gap-2">
                <button
                    onClick={() => {
                        if (value.trim() && !isProcessing) {
                            onSend(value);
                        }
                    }}
                    disabled={!value.trim() || isProcessing}
                    className="p-2 bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan disabled:text-titanium-dim disabled:bg-transparent rounded-lg transition-all"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}
