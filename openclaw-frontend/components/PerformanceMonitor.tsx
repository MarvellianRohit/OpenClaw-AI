"use client";

import { useEffect, useState } from "react";

export default function PerformanceMonitor() {
    const [fps, setFps] = useState(0);

    useEffect(() => {
        let lastTime = performance.now();
        let frames = 0;
        let animationFrameId: number;

        const loop = () => {
            frames++;
            const now = performance.now();
            if (now - lastTime >= 1000) {
                setFps(frames);
                frames = 0;
                lastTime = now;
            }
            animationFrameId = requestAnimationFrame(loop);
        };

        loop();

        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    // Color coding for health
    const color = fps >= 110 ? "text-green-400" : fps >= 60 ? "text-yellow-400" : "text-red-500";

    return (
        <div className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5">
            <span className="text-titanium">FPS (120Hz)</span>
            <span className={`font-bold font-mono ${color}`}>{fps}</span>
        </div>
    );
}
