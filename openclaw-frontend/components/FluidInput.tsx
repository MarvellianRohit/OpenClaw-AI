"use client";

import { useRef, useEffect, useState } from "react";
import { Send, Mic } from "lucide-react";
import { clsx } from "clsx";
import CommandSelector from "./CommandSelector";

interface FluidInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: (message: string) => void;
    isProcessing: boolean;
}

export default function FluidInput({ value, onChange, onSend, isProcessing }: FluidInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isCommandSelectorVisible, setIsCommandSelectorVisible] = useState(false);
    const [commandFilter, setCommandFilter] = useState("");

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    };

    useEffect(() => {
        adjustHeight();

        // Slash Command Detection
        if (value.startsWith('/')) {
            const firstWord = value.split(' ')[0];
            if (!value.includes(' ')) {
                setCommandFilter(firstWord);
                setIsCommandSelectorVisible(true);
            } else {
                setIsCommandSelectorVisible(false);
            }
        } else {
            setIsCommandSelectorVisible(false);
        }
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (isCommandSelectorVisible && (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Enter")) {
            // Let CommandSelector handle these
            return;
        }

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim() && !isProcessing) {
                onSend(value);
            }
        }
    };

    const handleCommandSelect = (command: string) => {
        onChange(command + " ");
        setIsCommandSelectorVisible(false);
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    return (
        <div className="relative">
            <CommandSelector
                isVisible={isCommandSelectorVisible}
                filter={commandFilter}
                onSelect={handleCommandSelect}
            />

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
        </div>
    );
}
