"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, CheckCircle2, Circle, AlertTriangle, ShieldCheck, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

interface PlanStep {
    step: string;
    valid: boolean;
    reason: string;
}

interface ThoughtTraceData {
    query: string;
    plan: {
        thought_process: string;
        steps: string[];
        feasibility_check: string;
    };
    validation: PlanStep[];
    timestamp: number;
}

interface ThoughtTraceProps {
    trace: ThoughtTraceData | null;
    status: "thinking" | "planned" | "idle";
}

export default function ThoughtTrace({ trace, status }: ThoughtTraceProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!trace && status === "idle") return null;

    return (
        <div className="mt-4 border-t border-white/5 pt-4">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-[10px] font-mono text-titanium-dim uppercase tracking-wider hover:text-white transition-colors w-full mb-2"
            >
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <BrainCircuit size={12} className={status === "thinking" ? "animate-pulse text-neon-cyan" : ""} />
                {status === "thinking" ? "Neural Engine Planning..." : "Reasoning Trace"}
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-obsidian-soft/40 rounded-xl border border-white/5 p-4 font-mono text-xs">

                            {/* Thinking State */}
                            {status === "thinking" && !trace && (
                                <div className="flex flex-col gap-2">
                                    <div className="h-2 w-3/4 bg-white/5 rounded animate-pulse" />
                                    <div className="h-2 w-1/2 bg-white/5 rounded animate-pulse delay-75" />
                                    <div className="h-2 w-2/3 bg-white/5 rounded animate-pulse delay-150" />
                                    <span className="text-[10px] text-neon-cyan/50 mt-2">Generating Hidden Plan...</span>
                                </div>
                            )}

                            {/* Trace Content */}
                            {trace && (
                                <div className="space-y-4">
                                    {/* Thought Process */}
                                    <div className="text-titanium-dim italic border-l-2 border-white/10 pl-3 py-1">
                                        "{trace.plan.thought_process}"
                                    </div>

                                    {/* Steps with Validation */}
                                    <div className="space-y-2">
                                        {trace.plan.steps.map((step, idx) => {
                                            const validation = trace.validation[idx];
                                            return (
                                                <div key={idx} className="flex items-start gap-3 group">
                                                    <div className="mt-0.5 shrink-0">
                                                        {validation?.valid ? (
                                                            <CheckCircle2 size={12} className="text-neon-cyan" />
                                                        ) : (
                                                            <AlertTriangle size={12} className="text-warning-orange" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className={validation?.valid ? "text-titanium" : "text-warning-orange/80 line-through decoration-white/20"}>
                                                            {step}
                                                        </span>
                                                        {!validation?.valid && (
                                                            <div className="text-[10px] text-warning-orange mt-0.5">
                                                                Constraint: {validation.reason}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Hardware / Feasibility Note */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                        <ShieldCheck size={12} className="text-green-400" />
                                        <span className="text-[10px] text-green-400/80 uppercase tracking-wide">
                                            M3 Max Feasibility Verified
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
