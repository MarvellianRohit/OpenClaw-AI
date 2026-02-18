"use client";

import { useState, useEffect, useRef } from "react";

interface TypewriterEffectProps {
    text: string;
    speed?: number; // ms per char
    onComplete?: () => void;
    className?: string;
}

export default function TypewriterEffect({
    text,
    speed = 30,
    onComplete,
    className
}: TypewriterEffectProps) {
    const [displayedText, setDisplayedText] = useState("");
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const currentIndexRef = useRef(0);

    useEffect(() => {
        // Reset if text changes significantly (e.g. new message content)
        // However, for streaming, text grows. We should only append.
        // If text is completely different, reset.
        if (!text.startsWith(displayedText) && displayedText !== "") {
            setDisplayedText("");
            currentIndexRef.current = 0;
        }
    }, [text]);

    useEffect(() => {
        if (currentIndexRef.current >= text.length) {
            if (onComplete) onComplete();
            return;
        }

        intervalRef.current = setInterval(() => {
            if (currentIndexRef.current < text.length) {
                setDisplayedText((prev) => prev + text.charAt(currentIndexRef.current));
                currentIndexRef.current++;
            } else {
                if (intervalRef.current) clearInterval(intervalRef.current);
                if (onComplete) onComplete();
            }
        }, speed);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [text, speed, onComplete]);

    return (
        <span className={className}>
            {displayedText}
        </span>
    );
}
