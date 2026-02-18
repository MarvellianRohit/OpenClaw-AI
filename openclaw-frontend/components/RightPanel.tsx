"use client";

import SystemVitals from "./SystemVitals";
import { SystemStats } from "@/hooks/useSystemVitals";

interface RightPanelProps {
    stats: SystemStats | null;
    isConnected: boolean;
    isOpen?: boolean; // For FAB toggle
}

export default function RightPanel({ stats, isConnected, isOpen = true }: RightPanelProps) {
    if (!isOpen) return null;

    return (
        <div className="w-80 border-l border-glass-border glass-panel hidden lg:flex flex-col p-4 space-y-4">
            <SystemVitals stats={stats} isConnected={isConnected} />
            {/* Future Widgets */}
            <div className="flex-1 glass-panel rounded-xl p-4 opacity-50 flex items-center justify-center text-titanium-dim font-mono text-xs text-center">
                Action Tools &<br />Live Preview
            </div>
        </div>
    );
}
