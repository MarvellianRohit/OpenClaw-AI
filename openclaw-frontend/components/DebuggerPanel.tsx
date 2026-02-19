"use client";

import MemoryVisualizer from "./MemoryVisualizer";
import { Layers } from "lucide-react";

export default function DebuggerPanel() {
    return (
        <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* Memory Visualizer (Existing) */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#0A0A0A] rounded-xl border border-white/10 overflow-hidden shadow-lg">
                <MemoryVisualizer />
            </div>

            {/* Stack View Placeholder */}
            <div className="h-1/3 min-h-[120px] bg-[#0A0A0A] rounded-xl border border-white/10 overflow-hidden flex flex-col">
                <div className="px-3 py-2 bg-white/5 border-b border-white/5 flex items-center gap-2">
                    <Layers size={12} className="text-purple-400" />
                    <span className="text-[10px] font-bold text-titanium tracking-widest">CALL STACK</span>
                </div>
                <div className="flex-1 p-3 font-mono text-[10px] space-y-2 overflow-y-auto text-titanium-dim">
                    <div className="flex justify-between hover:bg-white/5 p-1 rounded cursor-pointer">
                        <span className="text-purple-300">main()</span>
                        <span className="opacity-50">main.c:42</span>
                    </div>
                    <div className="flex justify-between hover:bg-white/5 p-1 rounded cursor-pointer opacity-50">
                        <span>_start</span>
                        <span className="opacity-50">0x100004f2</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
