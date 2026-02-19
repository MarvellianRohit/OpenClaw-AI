
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type StepStatus = 'pending' | 'active' | 'complete' | 'error';

interface RoadmapStep {
    id: string;
    label: string;
    status: StepStatus;
    logs?: string;
}

interface PlanningRoadmapProps {
    isVisible: boolean;
    steps: RoadmapStep[];
}

const PlanningRoadmap: React.FC<PlanningRoadmapProps> = ({ isVisible, steps }) => {
    const [expandedStep, setExpandedStep] = useState<string | null>(null);

    if (!isVisible && steps.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full bg-[#1c1c1e] bg-opacity-80 backdrop-blur-md rounded-lg p-4 border border-[#2c2c2e] shadow-lg my-2 overflow-hidden"
        >
            <div className="text-xs text-[#8E8E93] mb-3 uppercase tracking-wider font-semibold">
                AI Reasoning Trace & Sandbox
            </div>

            <div className="relative pl-2">
                {/* Vertical Line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-[1px] bg-[#3a3a3c]" />

                <div className="space-y-4">
                    {steps.map((step, index) => {
                        const isActive = step.status === 'active';
                        const isComplete = step.status === 'complete';
                        const isError = step.status === 'error';

                        return (
                            <div key={index} className="relative z-10">
                                <div
                                    className="flex items-center cursor-pointer group"
                                    onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                                >
                                    {/* Node */}
                                    <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center mr-3 border transition-all duration-300
                    ${isActive ? 'border-cyan-400 bg-cyan-900/30' : 'border-[#48484a] bg-[#1c1c1e]'}
                    ${isComplete ? 'border-cyan-500 bg-cyan-500' : ''}
                    ${isError ? 'border-red-500 bg-red-900/30' : ''}
                  `}>
                                        {isComplete ? (
                                            <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-cyan-400 animate-pulse' : 'bg-[#636366]'}`} />
                                        )}
                                    </div>

                                    {/* Label */}
                                    <span className={`
                    text-sm font-mono transition-colors duration-300
                    ${isActive ? 'text-cyan-400 text-shadow-neon' : 'text-[#8E8E93]'}
                    ${isComplete ? 'text-gray-300' : ''}
                    ${isError ? 'text-red-400' : ''}
                  `}>
                                        {step.label}
                                    </span>
                                </div>

                                {/* Logs Expander */}
                                <AnimatePresence>
                                    {expandedStep === step.id && step.logs && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="ml-9 mt-2 overflow-hidden"
                                        >
                                            <div className="bg-black/50 rounded p-2 text-[10px] font-mono text-gray-400 whitespace-pre-wrap border-l-2 border-cyan-800">
                                                {step.logs}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

export default PlanningRoadmap;
