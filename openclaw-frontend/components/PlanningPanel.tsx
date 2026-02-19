"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play,
    CheckCircle2,
    Circle,
    Loader2,
    Terminal,
    FileText,
    Layers,
    ChevronRight,
    X,
    Target
} from "lucide-react";

interface Step {
    id: number;
    description: string;
    tool: string;
    parameters: any;
    status: "pending" | "executing" | "completed" | "error";
    result?: string;
}

export default function PlanningPanel() {
    const [goal, setGoal] = useState("");
    const [plan, setPlan] = useState<Step[]>([]);
    const [isPlanning, setIsPlanning] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const generatePlan = async () => {
        if (!goal) return;
        setIsPlanning(true);
        setIsOpen(true);
        try {
            const res = await fetch("http://localhost:8000/agent/plan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ goal })
            });
            const data = await res.json();
            const initializedPlan = data.plan.map((s: any) => ({ ...s, status: "pending" }));
            setPlan(initializedPlan);
        } catch (e) {
            console.error("Planning failed", e);
        } finally {
            setIsPlanning(false);
        }
    };

    const executeStep = async (index: number) => {
        const step = plan[index];
        const newPlan = [...plan];
        newPlan[index].status = "executing";
        setPlan(newPlan);

        try {
            const res = await fetch("http://localhost:8000/agent/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    step_id: step.id,
                    tool: step.tool,
                    parameters: step.parameters
                })
            });
            const data = await res.json();

            const completedPlan = [...plan];
            completedPlan[index].status = "completed";
            completedPlan[index].result = data.result;
            setPlan(completedPlan);
        } catch (e) {
            const errorPlan = [...plan];
            errorPlan[index].status = "error";
            setPlan(errorPlan);
        }
    };

    const getToolIcon = (tool: string) => {
        switch (tool) {
            case "read_file": return <FileText size={16} />;
            case "execute_shell": return <Terminal size={16} />;
            case "list_directory": return <Layers size={16} />;
            default: return <ChevronRight size={16} />;
        }
    };

    return (
        <div className="fixed bottom-24 right-8 z-[90] flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="w-96 glass-panel rounded-3xl border border-white/10 shadow-2xl bg-obsidian/95 overflow-hidden flex flex-col max-h-[600px]"
                    >
                        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-cyan-500/20 rounded-xl text-cyan-400">
                                    <Target size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Agent Strategy</h3>
                                    <span className="text-[10px] text-titanium-dim font-mono uppercase">Multi-Step Execution</span>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-titanium-dim hover:text-white transition-colors p-1">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                            {isPlanning ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-4">
                                    <Loader2 size={32} className="animate-spin text-cyan-400" />
                                    <span className="text-xs font-mono text-titanium-dim animate-pulse">Decomposing Goal...</span>
                                </div>
                            ) : plan.length > 0 ? (
                                <div className="space-y-4">
                                    {plan.map((step, idx) => (
                                        <div key={step.id} className="relative pl-8 group">
                                            {/* Timeline Line */}
                                            {idx < plan.length - 1 && (
                                                <div className="absolute left-[11px] top-6 bottom-[-20px] w-px bg-white/5" />
                                            )}

                                            {/* Status Icon */}
                                            <div className="absolute left-0 top-1 p-1">
                                                {step.status === "completed" ? (
                                                    <CheckCircle2 size={24} className="text-green-500" />
                                                ) : step.status === "executing" ? (
                                                    <Loader2 size={24} className="animate-spin text-cyan-400" />
                                                ) : (
                                                    <Circle size={24} className="text-white/10" />
                                                )}
                                            </div>

                                            <div className={`p-4 rounded-2xl border transition-all ${step.status === "executing" ? "bg-cyan-500/5 border-cyan-500/30" :
                                                step.status === "completed" ? "bg-green-500/5 border-green-500/20" :
                                                    "bg-white/[0.02] border-white/5"
                                                }`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-mono font-bold text-titanium-dim uppercase tracking-tighter">
                                                        Step 0{idx + 1} • {step.tool}
                                                    </span>
                                                    {step.status === "pending" && (
                                                        <button
                                                            onClick={() => executeStep(idx)}
                                                            className="p-1 px-3 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-white transition-all uppercase"
                                                        >
                                                            Execute
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-xs text-titanium leading-relaxed">
                                                    {step.description}
                                                </p>

                                                {step.result && (
                                                    <div className="mt-3 p-2 bg-black/40 rounded-lg border border-white/5">
                                                        <pre className="text-[10px] font-mono text-cyan-400/80 truncate">
                                                            {step.result}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center space-y-4">
                                    <div className="text-xs text-titanium-dim">Enter a high-level goal to begin autonomous planning.</div>
                                    <input
                                        placeholder="e.g. Add thread safety to logic.c"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-cyan-500/50 outline-none transition-all"
                                        value={goal}
                                        onChange={(e) => setGoal(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && generatePlan()}
                                    />
                                    <button
                                        onClick={generatePlan}
                                        className="w-full bg-white text-obsidian font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest hover:scale-[1.02] transition-all"
                                    >
                                        Initiate Planning
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-4 bg-obsidian border border-white/10 rounded-2xl shadow-2xl text-cyan-400 hover:scale-110 active:scale-95 transition-all group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Play size={24} className={isOpen ? "rotate-90 transition-transform" : "transition-transform"} />
            </button>
        </div>
    );
}
