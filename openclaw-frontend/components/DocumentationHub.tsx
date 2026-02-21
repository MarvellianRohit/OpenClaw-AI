import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

interface DocumentationHubProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DocumentationHub({ isOpen, onClose }: DocumentationHubProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<{ name: string; status: 'uploading' | 'success' | 'error'; chunks?: number }[]>([]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFiles = Array.from(e.dataTransfer.files).filter(f =>
                f.name.endsWith('.pdf') || f.name.endsWith('.md') || f.name.endsWith('.txt')
            );

            for (const file of droppedFiles) {
                setFiles(prev => [...prev, { name: file.name, status: 'uploading' }]);

                try {
                    const formData = new FormData();
                    formData.append('file', file);

                    const res = await fetch('http://localhost:8002/ingest', {
                        method: 'POST',
                        body: formData
                    });

                    if (res.ok) {
                        const data = await res.json();
                        setFiles(prev => prev.map(f =>
                            f.name === file.name ? { ...f, status: 'success', chunks: data.chunks_indexed } : f
                        ));
                    } else {
                        throw new Error('Upload failed');
                    }
                } catch (err) {
                    console.error("Ingest error:", err);
                    setFiles(prev => prev.map(f =>
                        f.name === file.name ? { ...f, status: 'error' } : f
                    ));
                }
            }
        }
    }, []);

    return (
        <AnimatePresence>
            {isOpen && (
                <React.Fragment>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] bg-[#0A0A0A] border border-[#222] rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[#222]">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-white font-medium flex items-center gap-2">
                                        Documentation Hub
                                        <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 rounded-full border border-purple-500/30">RAG ENGINE</span>
                                    </h3>
                                    <p className="text-[#666] text-xs">Vectorize PDFs and Markdown into Local Memory</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 text-[#666] hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Dropzone */}
                        <div className="p-6">
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`relative w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${isDragging
                                        ? 'border-purple-500 bg-purple-500/10'
                                        : 'border-[#333] hover:border-purple-500/50 bg-[#111]'
                                    }`}
                            >
                                <UploadCloud className={`w-12 h-12 mb-4 transition-colors ${isDragging ? 'text-purple-400' : 'text-[#444]'}`} />
                                <p className="text-[#888] text-sm text-center">
                                    Drag and drop documentation here<br />
                                    <span className="text-xs text-[#555] mt-1 inline-block">Supports .pdf, .md, .txt</span>
                                </p>

                                {isDragging && (
                                    <motion.div
                                        layoutId="outline"
                                        className="absolute inset-0 border-2 border-purple-500 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                                    />
                                )}
                            </div>

                            {/* Upload Status List */}
                            <div className="mt-4 space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                <AnimatePresence>
                                    {files.map((file, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center justify-between p-3 bg-[#111] border border-[#222] rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-4 h-4 text-[#666]" />
                                                <span className="text-sm text-[#CCC] truncate max-w-[300px]">{file.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {file.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-purple-400" />}
                                                {file.status === 'success' && (
                                                    <>
                                                        <span className="text-xs text-purple-400">{file.chunks} chunks</span>
                                                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                    </>
                                                )}
                                                {file.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </React.Fragment>
            )}
        </AnimatePresence>
    );
}
