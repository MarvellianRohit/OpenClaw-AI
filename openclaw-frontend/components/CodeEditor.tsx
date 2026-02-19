"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { Save, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StructureMap from "./StructureMap";
import RefactorToolbar from "./RefactorToolbar";

interface CodeEditorProps {
    filePath: string | null;
    content: string;
    onChange: (val: string) => void;
    onSave: (path: string, content: string) => Promise<void>;
}

export default function CodeEditor({ filePath, content, onChange, onSave }: CodeEditorProps) {
    const [originalContent, setOriginalContent] = useState("");
    const [isDirty, setIsDirty] = useState(false);
    const [loading, setLoading] = useState(false);
    const [cursorLine, setCursorLine] = useState(1);
    const [structure, setStructure] = useState<{ function: string | null; class: string | null } | null>(null);
    const [toolbarState, setToolbarState] = useState<{ visible: boolean; x: number; y: number; selectedText: string }>({
        visible: false, x: 0, y: 0, selectedText: ""
    });
    // Phase BI: Ghost Text
    const [prediction, setPrediction] = useState("");
    const [isPredicting, setIsPredicting] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const monaco = useMonaco();
    const editorRef = useRef<any>(null);

    // Load file content
    useEffect(() => {
        if (!filePath) return;

        const loadFile = async () => {
            setLoading(true);
            try {
                // Use new Secure API
                const res = await fetch("http://localhost:8000/file/read", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ filepath: filePath, content: "" })
                });
                if (!res.ok) throw new Error("Failed to load");
                const data = await res.json();
                onChange(data.content);
                setOriginalContent(data.content);
                setIsDirty(false);
            } catch (e) {
                console.error(e);
                onChange("// Error loading file");
            } finally {
                setLoading(false);
            }
        };

        loadFile();
    }, [filePath]);

    // Theme Setup
    useEffect(() => {
        if (monaco) {
            monaco.editor.defineTheme("obsidian", {
                base: "vs-dark",
                inherit: true,
                rules: [
                    { token: "comment", foreground: "6272a4", fontStyle: "italic" },
                    { token: "keyword", foreground: "ff79c6" },
                    { token: "string", foreground: "f1fa8c" },
                ],
                colors: {
                    "editor.background": "#0A0A0A",
                    "editor.foreground": "#F8F8F2",
                    "editor.lineHighlightBackground": "#44475a55",
                    "editorCursor.foreground": "#8be9fd",
                }
            });
            monaco.editor.setTheme("obsidian");
        }
    }, [monaco]);

    const handleSave = async () => {
        if (!filePath) return;
        await onSave(filePath, content);
        setOriginalContent(content);
        setIsDirty(false);
    };

    // Keyboard Shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [content, filePath]); // Re-bind on content change to capture latest

    // Cursor Position Handler
    const handleEditorDidMount = (editor: any) => {
        editorRef.current = editor;
        editor.onDidChangeCursorPosition((e: any) => {
            setCursorLine(e.position.lineNumber);
        });

        // Refactor Toolbar Logic
        editor.onDidChangeCursorSelection((e: any) => {
            const selection = editor.getSelection();
            if (selection && !selection.isEmpty()) {
                const model = editor.getModel();
                const text = model?.getValueInRange(selection) || "";
                const scrolledPos = editor.getScrolledVisiblePosition(selection.getStartPosition());

                if (scrolledPos) {
                    const domNode = editor.getDomNode();
                    if (domNode) {
                        const rect = domNode.getBoundingClientRect();
                        setToolbarState({
                            visible: true,
                            x: rect.left + scrolledPos.left,
                            y: rect.top + scrolledPos.top - 60,
                            selectedText: text
                        });
                    }
                }
            } else {
                setToolbarState(prev => ({ ...prev, visible: false }));
            }
        });

        editor.onDidScrollChange(() => {
            setToolbarState(prev => ({ ...prev, visible: false }));
        });
    };

    // Fetch Structure (Phase AC)
    useEffect(() => {
        if (!content || !filePath) return;

        const timer = setTimeout(async () => {
            const lang = filePath.endsWith(".py") ? "python" : (filePath.endsWith(".c") || filePath.endsWith(".cpp")) ? "c" : null;
            if (!lang) {
                setStructure(null);
                return;
            }

            try {
                const res = await fetch("http://localhost:8000/tools/structure", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code: content, filepath: filePath, line: cursorLine })
                });
                if (res.ok) {
                    const data = await res.json();
                    setStructure(data);
                }
            } catch (e) {
                console.error("Structure Error", e);
            }
        }, 1000); // 1s debounce for structure

        return () => clearTimeout(timer);
    }, [content, filePath, cursorLine]);

    // Real-Time Linting (Phase AB)
    useEffect(() => {
        if (!content || !filePath || !monaco) return;

        const timer = setTimeout(async () => {
            // Only lint supported languages
            const lang = filePath.endsWith(".py") ? "python" : (filePath.endsWith(".c") || filePath.endsWith(".cpp")) ? "c" : null;
            if (!lang) return;

            try {
                const res = await fetch("http://localhost:8000/tools/lint", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code: content, language: lang })
                });

                if (res.ok) {
                    const errors = await res.json();
                    const model = monaco.editor.getModel(monaco.Uri.parse(filePath)); // This might need ensuring model URI matches?
                    // actually, we can just use the current model from editor instance if we had ref, 
                    // but setModelMarkers takes a model object.
                    // simpler:
                    const editors = monaco.editor.getEditors();
                    if (editors.length > 0) {
                        const model = editors[0].getModel();
                        if (model) {
                            monaco.editor.setModelMarkers(model, "owner", errors.map((e: any) => ({
                                startLineNumber: e.line,
                                startColumn: e.column,
                                endLineNumber: e.line,
                                endColumn: 1000, // Highlight full line if column specific isn't great
                                message: e.message,
                                severity: e.severity === "error" ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning
                            })));
                        }
                    }
                }
            } catch (e) {
                console.error("Lint Error", e);
            }
        }, 1500); // 1.5s debounce

        return () => clearTimeout(timer);
    }, [content, filePath, monaco]);



    if (!filePath) {
        return (
            <div className="flex-1 flex items-center justify-center text-titanium-dim bg-[#0a0a0a]">
                <div className="text-center">
                    <div className="text-4xl mb-4 opacity-20">⌘</div>
                    <p>Select a file to edit</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex-1 h-full bg-[#0a0a0a] overflow-hidden group flex flex-col">
            <StructureMap
                path={filePath}
                functionName={structure?.function || null}
                className={structure?.class || null}
            />

            <div className="flex-1 relative" onKeyDown={(e) => {
                if (prediction && e.key === 'Tab') {
                    e.preventDefault();
                    editorRef.current.trigger('keyboard', 'type', { text: prediction });
                    setPrediction("");
                }
                if (prediction && e.key === 'Escape') {
                    e.preventDefault();
                    setPrediction("");
                }
            }}>
                <Editor
                    height="100%"
                    language={filePath.endsWith(".py") ? "python" : filePath.endsWith(".tsx") ? "typescript" : "c"}
                    theme="obsidian"
                    value={content}
                    onMount={handleEditorDidMount}
                    onChange={(val: string | undefined) => {
                        const value = val || "";
                        onChange(value);
                        setIsDirty(value !== originalContent);

                        // Phase BI: Ghost Text Logic
                        setPrediction(""); // Clear on type
                        if (debounceRef.current) clearTimeout(debounceRef.current);

                        debounceRef.current = setTimeout(async () => {
                            if (!editorRef.current) return;
                            const model = editorRef.current.getModel();
                            const position = editorRef.current.getPosition();
                            if (!model || !position) return;

                            // Heuristic: Only predict if at end of line
                            if (position.column < model.getLineContent(position.lineNumber).length + 1) return;

                            setIsPredicting(true);
                            try {
                                const res = await fetch("http://localhost:8000/tools/completion", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        code: value,
                                        language: filePath?.endsWith(".py") ? "python" : "c",
                                        cursor_line: position.lineNumber
                                    })
                                });
                                const data = await res.json();
                                if (data.completion) setPrediction(data.completion);
                            } catch (e) { } finally { setIsPredicting(false); }
                        }, 500);
                    }}
                    options={{
                        fontFamily: "JetBrains Mono, Menlo, monospace",
                        fontSize: 13,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        padding: { top: 16 },
                    }}
                />

                {/* Ghost Text Overlay */}
                <AnimatePresence>
                    {prediction && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute z-10 pointer-events-none font-mono text-[13px]"
                            style={{
                                top: (cursorLine * 19) + 4 - (editorRef.current?.getScrollTop() || 0), // Tuned for JetBrains Mono 13px
                                left: 60 + (editorRef.current?.getModel()?.getLineContent(cursorLine).length || 0) * 7.8 // Tuned char width
                            }}
                        >
                            <span className="text-white/40">{prediction}</span>
                            <span className="ml-2 text-[10px] text-neon-cyan bg-neon-cyan/10 px-1 rounded">TAB</span>
                        </motion.div>
                    )}
                </AnimatePresence>



                {/* Glowing Save Button */}
                <AnimatePresence>
                    {isDirty && (
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            onClick={handleSave}
                            className="absolute bottom-6 right-6 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all flex items-center gap-2 font-mono text-xs font-bold z-50"
                        >
                            <Save size={16} />
                            SAVE CHANGES
                        </motion.button>
                    )}
                </AnimatePresence>

                {loading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-titanium animate-pulse z-50">
                        Loading...
                    </div>
                )}
            </div>
        </div>
    );
}
