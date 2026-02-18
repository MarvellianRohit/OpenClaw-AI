"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Network, Maximize2, Minimize2 } from "lucide-react";

interface DependencyGraphModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DependencyGraphModal({ isOpen, onClose }: DependencyGraphModalProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] } | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch Graph Data
    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            fetch("http://localhost:8000/graph/dependencies")
                .then(res => res.json())
                .then(data => {
                    setGraphData(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Failed to fetch graph", err);
                    setLoading(false);
                });
        }
    }, [isOpen]);

    // Draw Graph
    useEffect(() => {
        if (!isOpen || !graphData || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Resize
        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        // Simple Force Layout Simulation (Custom implementation for dependency-free)
        const nodes = graphData.nodes.map(n => ({ ...n, x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: 0, vy: 0 }));
        const links = graphData.links.map(l => ({ ...l }));

        // Click Handler (Now inside so it can access 'nodes')
        const handleClick = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const clickedNode = nodes.find(n => {
                const dx = n.x - mouseX;
                const dy = n.y - mouseY;
                return Math.sqrt(dx * dx + dy * dy) < (n.radius || 4) + 10;
            });

            if (clickedNode && clickedNode.group === 1) { // 1 = File
                window.dispatchEvent(new CustomEvent('open-file', { detail: clickedNode.id }));
                onClose();
            }
        };
        canvas.addEventListener("click", handleClick);

        let animationFrameId: number;

        const simulate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Physics (Simplified)
            // 1. Repulsion
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = 500 / (dist * dist);
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    nodes[i].vx += fx;
                    nodes[i].vy += fy;
                    nodes[j].vx -= fx;
                    nodes[j].vy -= fy;
                }
            }

            // 2. Attraction (Springs)
            links.forEach(link => {
                const source = nodes.find(n => n.id === link.source);
                const target = nodes.find(n => n.id === link.target);
                if (source && target) {
                    const dx = target.x - source.x;
                    const dy = target.y - source.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = (dist - 100) * 0.05; // Spring length 100
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    source.vx += fx;
                    source.vy += fy;
                    target.vx -= fx;
                    target.vy -= fy;
                }
            });

            // 3. Center Gravity
            nodes.forEach(node => {
                const dx = canvas.width / 2 - node.x;
                const dy = canvas.height / 2 - node.y;
                node.vx += dx * 0.01;
                node.vy += dy * 0.01;

                // Apply velocity
                node.vx *= 0.9; // Damping
                node.vy *= 0.9;
                node.x += node.vx;
                node.y += node.vy;

                // Boundaries
                node.x = Math.max(20, Math.min(canvas.width - 20, node.x));
                node.y = Math.max(20, Math.min(canvas.height - 20, node.y));
            });

            // Draw Links
            ctx.strokeStyle = "rgba(6, 182, 212, 0.2)"; // Neon Cyan dim
            ctx.lineWidth = 1;
            links.forEach(link => {
                const source = nodes.find(n => n.id === link.source);
                const target = nodes.find(n => n.id === link.target);
                if (source && target) {
                    ctx.beginPath();
                    ctx.moveTo(source.x, source.y);
                    ctx.lineTo(target.x, target.y);
                    ctx.stroke();
                }
            });

            // Draw Nodes
            nodes.forEach(node => {
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius || 4, 0, Math.PI * 2);
                ctx.fillStyle = node.group === 1 ? "#06b6d4" : "#ffffff"; // Cyan for files, White for external
                ctx.fill();

                // Label
                ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
                ctx.font = "10px monospace";
                ctx.fillText(node.id.split('/').pop()!, node.x + 8, node.y + 3);
            });

            animationFrameId = requestAnimationFrame(simulate);
        };

        simulate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", resize);
            canvas.removeEventListener("click", handleClick);
        };
    }, [isOpen, graphData]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="relative w-full max-w-5xl h-[80vh] bg-[#050505] border border-neon-cyan/20 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.1)] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
                            <div className="flex items-center gap-3 text-neon-cyan">
                                <Network size={20} />
                                <div>
                                    <h2 className="font-mono font-bold tracking-widest text-lg">DEPENDENCY MAPPER</h2>
                                    <p className="text-[10px] text-titanium-dim uppercase tracking-wider">Force-Directed Knowledge Graph</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-4 text-xs font-mono text-titanium-dim">
                                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-neon-cyan" /> FILE</div>
                                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white" /> EXTERNAL</div>
                                </div>
                                <div className="h-6 w-px bg-white/10" />
                                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-titanium hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Visualizer */}
                        <div className="flex-1 relative bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0%,transparent_70%)]">
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-neon-cyan font-mono animate-pulse">Computing Graph Layout...</div>
                                </div>
                            )}
                            <canvas ref={canvasRef} className="w-full h-full block cursor-move" />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
