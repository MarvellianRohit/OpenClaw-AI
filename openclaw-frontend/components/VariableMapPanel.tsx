"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3-force";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Square, Activity } from "lucide-react";

interface Variable {
    name: string;
    type: string;
    value: string;
    id: string; // memory pointer
}

interface StepData {
    line: number;
    variables: Variable[];
    error?: string;
    status?: string;
}

// Nodes for d3-force
interface GraphNode extends d3.SimulationNodeDatum {
    id: string; // The variable name itself
    mem_id: string; // The memory id
    group: string; // Type for color
    label: string;
    value: string;
}

// Edges for d3-force
interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
    source: string;
    target: string;
}

export default function VariableMapPanel({ onClose }: { onClose: () => void }) {
    const [code, setCode] = useState("a = 10\nb = 20\nc = a + b\nl1 = [1, 2]\nl2 = l1");
    const [isRunning, setIsRunning] = useState(false);
    const [currentLine, setCurrentLine] = useState<number | null>(null);

    // Graph State
    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [links, setLinks] = useState<GraphLink[]>([]);
    const [updatedNodes, setUpdatedNodes] = useState<Set<string>>(new Set());

    const wsRef = useRef<WebSocket | null>(null);
    const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

    // Refs to mute stale state in d3 force loop
    const nodesRef = useRef<GraphNode[]>([]);
    const linksRef = useRef<GraphLink[]>([]);

    useEffect(() => {
        // Initialize d3 simulation
        const simulation = d3
            .forceSimulation<GraphNode>()
            .force(
                "link",
                d3.forceLink<GraphNode, GraphLink>().id((d) => d.id).distance(100)
            )
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(0, 0))
            .force("collide", d3.forceCollide().radius(60))
            .on("tick", () => {
                // Force React to re-render nodes at their new physical positions
                setNodes([...nodesRef.current]);
                setLinks([...linksRef.current]);
            });

        simulationRef.current = simulation;

        return () => {
            simulation.stop();
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const startTrace = () => {
        if (wsRef.current) wsRef.current.close();
        setIsRunning(true);
        setNodes([]);
        setLinks([]);
        nodesRef.current = [];
        linksRef.current = [];
        setUpdatedNodes(new Set());
        setCurrentLine(null);

        const ws = new WebSocket("ws://localhost:8000/ws/variable_map");
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({ code }));
        };

        ws.onmessage = (event) => {
            try {
                const data: StepData = JSON.parse(event.data);
                if (data.status === "done" || data.error) {
                    setIsRunning(false);
                    ws.close();
                    return;
                }

                setCurrentLine(data.line);
                processVariables(data.variables);
            } catch (e) {
                console.error("Frame parse error:", e);
            }
        };

        ws.onclose = () => setIsRunning(false);
    };

    const processVariables = (variables: Variable[]) => {
        const newNodesMap = new Map<string, GraphNode>();
        const newLinks: GraphLink[] = [];
        const changed = new Set<string>();

        // 1. Convert variables to nodes
        variables.forEach(v => {
            const existing = nodesRef.current.find(n => n.id === v.name);

            const node: GraphNode = {
                id: v.name,
                mem_id: v.id,
                group: v.type,
                label: v.name,
                value: v.value,
                // preserve physics positions if it already existed
                x: existing?.x,
                y: existing?.y,
                vx: existing?.vx,
                vy: existing?.vy
            };

            // Track changes for pulsing animation
            if (!existing || existing.value !== v.value || existing.mem_id !== v.id) {
                changed.add(v.name);
            }

            newNodesMap.set(v.name, node);
        });

        // 2. Compute Links (Variables pointing to same memory ID)
        const memGroups = new Map<string, string[]>();
        variables.forEach(v => {
            // only link complex mutable types for clarity, or all if we want rigorous mapping
            if (['list', 'dict', 'set', 'object'].includes(v.type)) {
                if (!memGroups.has(v.id)) memGroups.set(v.id, []);
                memGroups.get(v.id)!.push(v.name);
            }
        });

        memGroups.forEach(varNames => {
            for (let i = 0; i < varNames.length; i++) {
                for (let j = i + 1; j < varNames.length; j++) {
                    newLinks.push({ source: varNames[i], target: varNames[j] });
                }
            }
        });

        const newNodes = Array.from(newNodesMap.values());

        nodesRef.current = newNodes;
        linksRef.current = newLinks;
        setUpdatedNodes(changed);

        // Update Simulation
        if (simulationRef.current) {
            simulationRef.current.nodes(newNodes);
            (simulationRef.current.force("link") as d3.ForceLink<GraphNode, GraphLink>).links(newLinks);
            simulationRef.current.alpha(1).restart();
        }
    };

    const stopTrace = () => {
        if (wsRef.current) wsRef.current.close();
        setIsRunning(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/60 backdrop-blur-md">
            <div className="w-full max-w-6xl h-full max-h-[85vh] bg-[#0A0A0A] border border-[#222] rounded-xl flex flex-col shadow-2xl overflow-hidden shadow-cyan-900/10">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] bg-[#111]">
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-sm font-semibold tracking-widest text-[#E0E0E0] uppercase">
                            Live Variable Map
                        </h2>
                        {isRunning && (
                            <span className="flex items-center gap-2 px-2 py-1 ml-4 text-xs text-cyan-400 bg-cyan-400/10 rounded-full border border-cyan-400/20">
                                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                                Tracing... Line {currentLine}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#222] rounded-md transition-colors text-[#888] hover:text-[#FFF]">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Left: Code Editor Input */}
                    <div className="w-1/3 flex flex-col border-r border-[#222] bg-[#0F0F0F]">
                        <div className="p-4 flex-1">
                            <label className="text-xs text-[#888] uppercase tracking-wider mb-2 block">Python Script</label>
                            <textarea
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full h-[90%] bg-[#080808] border border-[#222] rounded-md p-4 text-sm font-mono text-[#E0E0E0] focus:outline-none focus:border-cyan-500/50 resize-none"
                                spellCheck={false}
                            />
                        </div>
                        <div className="p-4 border-t border-[#222] bg-[#111] flex gap-3">
                            {!isRunning ? (
                                <button
                                    onClick={startTrace}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-cyan-900/40 text-cyan-400 border border-cyan-800/50 rounded-md hover:bg-cyan-900/60 transition-all text-sm font-medium tracking-wide shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                                >
                                    <Play className="w-4 h-4 fill-current" />
                                    Execute & Trace
                                </button>
                            ) : (
                                <button
                                    onClick={stopTrace}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-900/30 text-red-400 border border-red-900/50 rounded-md hover:bg-red-900/50 transition-all text-sm font-medium tracking-wide"
                                >
                                    <Square className="w-4 h-4 fill-current" />
                                    Stop Execution
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right: Graph Canvas */}
                    <div className="flex-1 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#111] to-[#050505] overflow-hidden">

                        {/* Background Grid Lines optional */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                        <svg className="w-full h-full">
                            {/* Center Origin Wrapper */}
                            <g transform="translate(500, 350)">

                                {/* Links */}
                                <AnimatePresence>
                                    {links.map((link, i) => {
                                        // Type assertion since d3 injects full node objects into source/target after initialization
                                        const source = link.source as unknown as GraphNode;
                                        const target = link.target as unknown as GraphNode;
                                        if (!source || !target || source.x === undefined || target.x === undefined) return null;

                                        return (
                                            <motion.line
                                                key={`link-${source.id}-${target.id}`}
                                                x1={source.x} y1={source.y}
                                                x2={target.x} y2={target.y}
                                                stroke="#0ea5e9"
                                                strokeWidth="2"
                                                strokeOpacity="0.4"
                                                strokeDasharray="4 4"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            />
                                        );
                                    })}
                                </AnimatePresence>

                                {/* Nodes */}
                                <AnimatePresence>
                                    {nodes.map(node => (
                                        <motion.g
                                            key={node.id}
                                            animate={{ x: node.x || 0, y: node.y || 0 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                        >
                                            {/* Glow Ring triggered by update */}
                                            {updatedNodes.has(node.id) && (
                                                <motion.circle
                                                    r="35"
                                                    fill="none"
                                                    stroke="#22d3ee"
                                                    strokeWidth="2"
                                                    initial={{ scale: 0.8, opacity: 1 }}
                                                    animate={{ scale: 1.5, opacity: 0 }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                />
                                            )}

                                            {/* Node Shape */}
                                            <circle
                                                r="24"
                                                fill="#111"
                                                stroke={updatedNodes.has(node.id) ? "#22d3ee" : "#333"}
                                                strokeWidth="2"
                                                className="shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                                            />

                                            {/* Variable Name */}
                                            <text
                                                textAnchor="middle"
                                                y="-4"
                                                fill={updatedNodes.has(node.id) ? "#FFF" : "#AAA"}
                                                fontSize="12"
                                                fontFamily="monospace"
                                                fontWeight="bold"
                                            >
                                                {node.id}
                                            </text>

                                            {/* Variable Value (truncated if needed) */}
                                            <text
                                                textAnchor="middle"
                                                y="10"
                                                fill="#0ea5e9"
                                                fontSize="10"
                                                fontFamily="monospace"
                                            >
                                                {node.value.length > 8 ? node.value.substring(0, 7) + '…' : node.value}
                                            </text>

                                            {/* Floating Type Label */}
                                            <text
                                                textAnchor="middle"
                                                y="40"
                                                fill="#555"
                                                fontSize="9"
                                                fontFamily="monospace"
                                                className="uppercase"
                                            >
                                                {node.group}
                                            </text>
                                        </motion.g>
                                    ))}
                                </AnimatePresence>
                            </g>
                        </svg>

                        {nodes.length === 0 && !isRunning && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-[#333] text-sm tracking-widest uppercase font-mono">Run code to trace variables</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
