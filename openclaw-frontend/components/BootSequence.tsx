"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Cpu, Database, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface HealthState {
    gateway: 'loading' | 'ok' | 'fail';
    gpu: 'loading' | 'ok' | 'fail';
    workspace: 'loading' | 'ok' | 'fail';
}

export default function BootSequence({ onComplete }: { onComplete: () => void }) {
    const [health, setHealth] = useState<HealthState>({
        gateway: 'loading',
        gpu: 'loading',
        workspace: 'loading',
    });
    const [shards, setShards] = useState<{ id: number; initial: any; animate: any }[]>([]);
    const [bootStep, setBootStep] = useState(0);

    useEffect(() => {
        // Generate shards only on mount to prevent hydration mismatch
        const generatedShards = [...Array(12)].map((_, i) => ({
            id: i,
            initial: {
                x: (Math.random() - 0.5) * 1000,
                y: (Math.random() - 0.5) * 1000,
                rotation: Math.random() * 360,
                opacity: 0,
                scale: 0.5
            },
            animate: { x: 0, y: 0, rotation: 0, opacity: 1, scale: 1 }
        }));
        setShards(generatedShards);
    }, []);

    useEffect(() => {
        const runChecks = async () => {
            // Step 1: Animation Delay
            await new Promise(r => setTimeout(r, 1000));
            setBootStep(1);

            // Step 2: Gateway Check
            try {
                const res = await fetch("http://localhost:8000/status");
                if (res.ok) {
                    const data = await res.json();
                    setHealth(prev => ({ ...prev, gateway: 'ok' }));

                    // Step 3: GPU Check (from status data)
                    if (data.vitals.gpu_load_percent !== undefined) {
                        setHealth(prev => ({ ...prev, gpu: 'ok' }));
                    } else {
                        setHealth(prev => ({ ...prev, gpu: 'fail' }));
                    }
                } else {
                    setHealth(prev => ({ ...prev, gateway: 'fail', gpu: 'fail' }));
                }
            } catch {
                setHealth(prev => ({ ...prev, gateway: 'fail', gpu: 'fail' }));
            }

            // Step 4: Workspace Check
            try {
                const res = await fetch("http://localhost:8000/fs/tree");
                if (res.ok) {
                    setHealth(prev => ({ ...prev, workspace: 'ok' }));
                } else {
                    setHealth(prev => ({ ...prev, workspace: 'fail' }));
                }
            } catch {
                setHealth(prev => ({ ...prev, workspace: 'fail' }));
            }

            setBootStep(2);

            // Final Transition
            if (health.gateway === 'ok' && health.workspace === 'ok') {
                await new Promise(r => setTimeout(r, 1500));
                onComplete();
            }
        };

        runChecks();
    }, [onComplete]);



    return (
        <div className="fixed inset-0 z-[100] bg-obsidian flex flex-col items-center justify-center overflow-hidden">
            {/* Background Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-cyan/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Titanium Logo Assembly */}
            <div className="relative w-64 h-64 mb-16">
                <div className="absolute inset-0 flex items-center justify-center">
                    {shards.map((shard) => (
                        <motion.div
                            key={shard.id}
                            initial={shard.initial}
                            animate={shard.animate}
                            transition={{
                                duration: 1.5,
                                ease: [0.16, 1, 0.3, 1],
                                delay: shard.id * 0.05
                            }}
                            className="absolute w-16 h-1 px-4 bg-titanium border-glass-border/20 shadow-xl"
                            style={{
                                background: "linear-gradient(90deg, #8E8E93 0%, #00F3FF 100%)",
                                clipPath: "polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)",
                                transform: `rotate(${shard.id * 30}deg) translateX(40px)`
                            }}
                        />
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <span className="text-4xl font-mono font-black tracking-[0.4em] text-gradient-titanium">
                        CLAW
                    </span>
                </motion.div>
            </div>

            {/* Boot Status List */}
            <div className="w-80 space-y-3 font-mono">
                <StatusItem label="GATEWAY CONNECTIVITY" status={health.gateway} />
                <StatusItem label="GPU ACCELERATION" status={health.gpu} />
                <StatusItem label="WORKSPACE MAPPER" status={health.workspace} />

                <div className="mt-8 pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center text-[10px] text-titanium-dim uppercase tracking-widest">
                        <span>System Initialization</span>
                        <span>{bootStep === 2 ? '100%' : '42%'}</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 mt-2 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: bootStep === 2 ? "100%" : "42%" }}
                            className="h-full bg-neon-cyan shadow-[0_0_10px_#00F3FF]"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusItem({ label, status }: { label: string, status: 'loading' | 'ok' | 'fail' }) {
    return (
        <div className="flex items-center justify-between text-[11px] uppercase tracking-tighter">
            <span className="text-titanium-dim">{label}</span>
            <div className="flex items-center gap-2">
                {status === 'loading' && <Loader2 size={12} className="text-titanium-dim animate-spin" />}
                {status === 'ok' && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 text-neon-cyan">
                        <span className="font-bold">READY</span>
                        <CheckCircle2 size={12} />
                    </motion.div>
                )}
                {status === 'fail' && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 text-red-500">
                        <span className="font-bold">OFFLINE</span>
                        <XCircle size={12} />
                    </motion.div>
                )}
            </div>
        </div>
    );
}
