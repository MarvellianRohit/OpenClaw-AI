"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import RightPanel from "@/components/RightPanel";
import ChatInterface from "@/components/ChatInterface";
import CodeEditor from "@/components/CodeEditor";
import PerformanceModal from "@/components/PerformanceModal";
import Terminal from "@/components/Terminal";
import OmniSearch from "@/components/OmniSearch";
import HardwareGrid from "@/components/HardwareGrid";
import SmartCommitModal from "@/components/SmartCommitModal";
import DependencyGraphModal from "@/components/DependencyGraphModal";
import DiffModal from "@/components/DiffModal";
import TabBar from "@/components/TabBar";
import VoiceWaveform from "@/components/VoiceWaveform";
import ContextToast from "@/components/ContextToast";
import BootSequence from "@/components/BootSequence";
import HeartbeatPulse from "@/components/HeartbeatPulse";
import InterventionToast from "@/components/InterventionToast";
import DeadlockAlert from "@/components/DeadlockAlert";
import MorningBriefModal from "@/components/MorningBriefModal";
import PlanningPanel from "@/components/PlanningPanel";
import AgentThoughts from "@/components/AgentThoughts";
import InterventionDialogue from "@/components/InterventionDialogue";
import SecurityReportModal from "@/components/SecurityReportModal";
import { useSystemVitals } from "@/hooks/useSystemVitals";
import { Menu, X, Activity } from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { stats, isConnected } = useSystemVitals();
  const [showVitals, setShowVitals] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [isBooted, setIsBooted] = useState(false);

  // ...
  // ...
  // ...
  const [showOmniSearch, setShowOmniSearch] = useState(false);

  // Phase Z & AA States
  const [showGraph, setShowGraph] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryContent, setSummaryContent] = useState("");
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  // Phase BF: Intervention Dialogue
  const [intervention, setIntervention] = useState<{
    isOpen: boolean;
    message: string;
    onApply: () => void;
  }>({
    isOpen: false,
    message: "",
    onApply: () => { }
  });

  // Phase BH: Security Report
  const [showSecurityReport, setShowSecurityReport] = useState(false);
  const [securityFindings, setSecurityFindings] = useState<any[]>([]);

  // Phase AK: Version History Diff
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [diffData, setDiffData] = useState({
    fileName: "",
    originalContent: "",
    newContent: "",
    onAccept: () => { }
  });

  const handleShowSummary = (content: string) => {
    setSummaryContent(content);
    setShowSummary(true);
  };

  // Sync Zen Mode to Body
  useEffect(() => {
    if (zenMode) {
      document.documentElement.setAttribute("data-zen", "true");
      // Hide other elements when entering zen
      setShowVitals(false);
      setShowTerminal(false);
    } else {
      document.documentElement.removeAttribute("data-zen");
      setShowVitals(true);
    }
  }, [zenMode]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Cmd+K: OmniSearch
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowOmniSearch(prev => !prev);
      }
      // Cmd+B: Zen Mode
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setZenMode(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // ...
  // ...


  // Editor State
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"chat" | "editor">("chat");
  const [activeView, setActiveView] = useState<"editor" | "thoughts">("editor"); // Phase BE
  const [editorContent, setEditorContent] = useState("// Select a file to view");
  const [terminalErrors, setTerminalErrors] = useState<string[]>([]);

  // Load Tabs from LocalStorage
  useEffect(() => {
    const savedTabs = localStorage.getItem("openclaw_tabs");
    const savedActive = localStorage.getItem("openclaw_active_file");
    if (savedTabs) {
      try {
        const tabs = JSON.parse(savedTabs);
        setOpenFiles(tabs);
        if (savedActive && tabs.includes(savedActive)) {
          setActiveFile(savedActive);
          setViewMode("editor");
        }
      } catch (e) {
        console.error("Failed to parse tabs", e);
      }
    }
  }, []);

  // Save Tabs to LocalStorage
  useEffect(() => {
    localStorage.setItem("openclaw_tabs", JSON.stringify(openFiles));
    if (activeFile) {
      localStorage.setItem("openclaw_active_file", activeFile);
    }
  }, [openFiles, activeFile]);

  const handleTerminalOutput = (line: string) => {
    // Heuristic to capture errors for context
    if (/error|exception|fail|traceback/i.test(line)) {
      setTerminalErrors(prev => [...prev.slice(-2), line]); // Keep last 3
    }
  };

  const handleFileSelect = (path: string) => {
    if (!openFiles.includes(path)) {
      setOpenFiles(prev => [...prev, path]);
    }
    setActiveFile(path);
    setViewMode("editor");
    setIsMobileMenuOpen(false);
  };

  const handleTabClose = (path: string) => {
    const newFiles = openFiles.filter(f => f !== path);
    setOpenFiles(newFiles);

    if (activeFile === path) {
      if (newFiles.length > 0) {
        setActiveFile(newFiles[newFiles.length - 1]);
      } else {
        setActiveFile(null);
        // Optionally switch back to chat if no files open?
        // setViewMode("chat"); 
      }
    }
  };

  const handleSend = (message: string) => {
    setPendingMessage(message);
    setViewMode("chat");
  };

  // Listen for 'open-file' event from Chat
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handler = (e: any) => handleFileSelect(e.detail);
      window.addEventListener('open-file', handler);

      const msgHandler = (e: any) => handleSend(e.detail);
      window.addEventListener('send-message', msgHandler);

      const graphHandler = () => setShowGraph(true);
      window.addEventListener('open-graph', graphHandler);

      const diffHandler = (e: any) => {
        setDiffData(e.detail);
        setShowDiffModal(true);
      };
      window.addEventListener('open-diff', diffHandler);

      // Phase AT: Voice Command Listeners
      const zenHandler = () => setZenMode(prev => !prev);
      const termHandler = () => setShowTerminal(prev => !prev);
      const buildHandler = () => handleSend("Build the project");
      const bugHandler = () => handleSend("Find the bug in the current file");

      window.addEventListener('toggle-zen', zenHandler);
      window.addEventListener('toggle-terminal', termHandler);
      window.addEventListener('run-build', buildHandler);
      window.addEventListener('find-bug', bugHandler);

      return () => {
        window.removeEventListener('open-file', handler);
        window.removeEventListener('send-message', msgHandler);
        window.removeEventListener('open-graph', graphHandler);
        window.removeEventListener('open-diff', diffHandler);
        window.removeEventListener('toggle-zen', zenHandler);
        window.removeEventListener('toggle-terminal', termHandler);
        window.removeEventListener('run-build', buildHandler);
        window.removeEventListener('find-bug', bugHandler);
      };
    }
  }, [openFiles]); // Re-bind when openFiles changes to ensure closure is fresh? Or use functional state update in handleFileSelect.

  // Actually handleFileSelect uses function state update for setOpenFiles, so it's safe?
  // But checking !openFiles.includes(path) depends on closure `openFiles`.
  // Yes, need dependency.

  const handleSaveFile = async (path: string, content: string) => {
    try {
      await fetch("http://localhost:8000/file/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filepath: path, content })
      });
    } catch (e) {
      console.error("Save failed", e);
      alert("Failed to save file");
    }
  };

  return (
    <div className="h-screen w-screen bg-obsidian text-titanium overflow-hidden relative">
      <AnimatePresence mode="wait">
        {!isBooted ? (
          <BootSequence key="boot" onComplete={() => setIsBooted(true)} />
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="h-full w-full relative"
          >
            {/* Reactive Background Grid */}
            <HardwareGrid gpuLoad={stats.gpu_load_percent} />

            <div className={clsx(
              "absolute inset-0 z-10 grid grid-cols-1 pointer-events-none transition-all duration-500",
              zenMode ? "lg:grid-cols-1" : "lg:grid-cols-[auto_1fr_auto]"
            )}>
              {/* ... (Existing grid children) ... */}
              {/* Helper div to restore pointer events for children */}

              {/* Mobile Header */}
              <div className="lg:hidden flex items-center justify-between p-4 border-b border-glass-border glass-panel z-50 pointer-events-auto bg-obsidian/80 backdrop-blur-md">
                <span className="font-mono text-gradient-titanium font-bold text-xl">OPENCLAW AI</span>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-titanium">
                  {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
              </div>

              {/* Sidebar */}
              <AnimatePresence>
                {!zenMode && (
                  <motion.div
                    initial={{ x: -300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -300, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={clsx(
                      "fixed inset-0 z-40 lg:relative lg:inset-auto transition-transform duration-300 transform lg:transform-none pointer-events-auto",
                      isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                  >
                    <Sidebar
                      className="h-full w-[260px] lg:w-auto"
                      stats={stats}
                      isConnected={isConnected}
                      onFileSelect={handleFileSelect}
                      onSwitchToChat={() => setViewMode("chat")}
                      onOpenSettings={() => setShowSettings(true)}
                      onOpenGraph={() => setShowGraph(true)}
                      activeFile={activeFile}
                      onOpenSecurityReport={(findings) => {
                        setSecurityFindings(findings);
                        setShowSecurityReport(true);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Content Area */}
              <main className={clsx(
                "flex-1 flex flex-col relative z-0 min-w-0 pointer-events-auto transition-all duration-500",
                zenMode ? "max-w-5xl mx-auto w-full px-8 py-12" : ""
              )}>
                {viewMode === "chat" ? (
                  <ChatInterface
                    onShowSummary={handleShowSummary}
                    activeCode={editorContent}
                    activeFile={activeFile}
                    terminalLastErrors={terminalErrors}
                    pendingMessage={pendingMessage}
                    onMessageHandled={() => setPendingMessage(null)}
                  />
                ) : (
                  <div className={clsx(
                    "flex-1 flex flex-col h-full overflow-hidden transition-all duration-500",
                    zenMode ? "rounded-2xl border border-white/5 shadow-2xl overflow-hidden" : ""
                  )}>
                    {/* Orchestrator Toggle */}
                    <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-obsidian-soft/40 backdrop-blur-md shrink-0">
                      <div className="flex items-center gap-4 bg-white/5 p-1 rounded-xl border border-white/10 mx-auto">
                        <button
                          onClick={() => setActiveView("editor")}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest ${activeView === "editor" ? "bg-white text-obsidian shadow-lg" : "text-titanium-dim hover:text-white"}`}
                        >
                          Code Editor
                        </button>
                        <button
                          onClick={() => setActiveView("thoughts")}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-widest ${activeView === "thoughts" ? "bg-white text-obsidian shadow-lg" : "text-titanium-dim hover:text-white"}`}
                        >
                          Agent Thoughts
                        </button>
                      </div>
                    </div>

                    <TabBar
                      files={openFiles}
                      activeFile={activeFile}
                      onSelect={handleFileSelect}
                      onClose={handleTabClose}
                    />
                    <div className="flex-1 overflow-hidden relative">
                      {activeView === "editor" ? (
                        <CodeEditor
                          filePath={activeFile}
                          content={editorContent}
                          onChange={setEditorContent}
                          onSave={handleSaveFile}
                        />
                      ) : (
                        <AgentThoughts />
                      )}
                    </div>
                  </div>
                )}

                {/* FAB to Toggle Vitals (Mobile Only) */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute bottom-6 right-6 z-50 p-4 rounded-full bg-neon-cyan text-obsidian shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:shadow-[0_0_30px_rgba(0,243,255,0.6)] transition-shadow lg:hidden"
                  onClick={() => setShowVitals(!showVitals)}
                >
                  <Activity size={24} />
                </motion.button>
              </main>

              {/* Right Panel (Vitals) */}
              <AnimatePresence mode="wait">
                {showVitals && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 320, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="overflow-hidden pointer-events-auto hidden lg:block"
                  >
                    <RightPanel stats={stats} isConnected={isConnected} isOpen={true} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop FAB */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-glass-bg border border-neon-cyan/50 text-neon-cyan shadow-lg backdrop-blur-md pointer-events-auto block lg:hidden"
              onClick={() => setShowVitals(!showVitals)}
              title="Toggle System Vitals"
            >
              <Activity size={20} />
            </motion.button>

            <PerformanceModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

            <Terminal
              isOpen={showTerminal}
              onClose={() => setShowTerminal(false)}
              onLineReceived={handleTerminalOutput}
            />

            <OmniSearch
              isOpen={showOmniSearch}
              onClose={() => setShowOmniSearch(false)}
              onSelectFile={(path, line) => {
                handleFileSelect(path);
              }}
            />

            <SmartCommitModal
              isOpen={showSummary}
              onClose={() => setShowSummary(false)}
              summary={summaryContent}
            />

            <DependencyGraphModal
              isOpen={showGraph}
              onClose={() => setShowGraph(false)}
            />

            <DiffModal
              isOpen={showDiffModal}
              onClose={() => setShowDiffModal(false)}
              fileName={diffData.fileName}
              originalContent={diffData.originalContent}
              newContent={diffData.newContent}
              onAccept={() => {
                diffData.onAccept();
                setShowDiffModal(false);
              }}
            />

            {/* Terminal Toggle FAB (Desktop) */}
            <motion.button
              className="fixed bottom-8 left-8 z-50 p-3 rounded-full bg-black/80 border border-neon-cyan/50 text-neon-cyan shadow-lg backdrop-blur-md hidden lg:block hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-shadow"
              onClick={() => setShowTerminal(!showTerminal)}
              title="Toggle Terminal"
              whileHover={{ scale: 1.1 }}
            >
              <div className="font-mono text-xs font-bold px-2 pointer-events-none">&gt;_</div>
            </motion.button>

            <VoiceWaveform />
            <ContextToast />
            <HeartbeatPulse />
            <InterventionToast />
            <DeadlockAlert />
            <MorningBriefModal />
            <PlanningPanel />
            <InterventionDialogue
              isOpen={intervention.isOpen}
              onClose={() => setIntervention(prev => ({ ...prev, isOpen: false }))}
              onExplain={() => handleSend("Explain the current execution bottleneck")}
              onApplyFix={() => {
                intervention.onApply();
                setIntervention(prev => ({ ...prev, isOpen: false }));
              }}
              message={intervention.message}
            />

            <SecurityReportModal
              isOpen={showSecurityReport}
              onClose={() => setShowSecurityReport(false)}
              findings={securityFindings}
              filepath={activeFile || "Unknown File"}
              onApplyFix={(finding) => {
                handleSend(`Fix security vulnerability: ${finding.title} on line ${finding.line}. ${finding.description}`);
                setShowSecurityReport(false);
              }}
            />

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

}
