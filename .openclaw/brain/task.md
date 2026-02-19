# OpenClaw AI - Development Tasks

- [x] **Project Setup & Design System** <!-- id: 0 -->
    - [x] Initialize Next.js project structure <!-- id: 1 -->
    - [x] Configure Tailwind for Industrial Minimalist aesthetic (Obsidian #0A0A0A, Titanium, Neon-Cyan) <!-- id: 2 -->
    - [x] Implement global typography (Monospace, Sans-Serif) and glassmorphism utilities <!-- id: 3 -->
- [x] **Frontend Implementation** <!-- id: 4 -->
    - [x] Build Main Layout: Collapsible Sidebar, Central Chat, Right Panel (Hardware Monitor) <!-- id: 5 -->
    - [x] Create `OpenClawChat` component: Typewriter effect, Haptic Copy Code button <!-- id: 6 -->
    - [x] Implement `useOpenClawStream` hook: WebSockets, Markdown rendering, Auto-scroll <!-- id: 7 -->
- [x] **Backend Architecture** <!-- id: 8 -->
    - [x] Create `inference_server.py`: llama-cpp-python with Metal GPU acceleration & Large Pages <!-- id: 9 -->
    - [x] Develop `gateway.py`: FastAPI middleware for WebSocket handling and request routing <!-- id: 10 -->
    - [x] Integrate Frontend with Gateway via WebSockets <!-- id: 11 -->
- [x] **Vector Indexing & Context Injection** <!-- id: 15 -->
    - [x] Create `indexer.py`: Scan .c/.py files, generate embeddings using sentence-transformers <!-- id: 16 -->
    - [x] Implement `context_injection`: Update gateway to retrieve and inject relevant code <!-- id: 17 -->
    - [x] Test Indexing & Retrieval: Verify embeddings are created and queries return correct snippets <!-- id: 18 -->
- [x] **Robust WebSocket Integration** <!-- id: 19 -->
    - [x] Update `useOpenClawStream` hook with state management (connecting/open/closed) and reconnection logic <!-- id: 20 -->
    - [x] Verify `gateway.py` async loop and error handling <!-- id: 21 -->
- [x] **Visual Refinements** <!-- id: 22 -->
    - [x] Update `globals.css`: Add new glassmorphism class and Titanium Gray (#8E8E93) <!-- id: 23 -->
    - [x] Create `TypewriterEffect.tsx`: Custom component for smooth text rendering (30ms/char) <!-- id: 24 -->
    - [x] Update `Sidebar.tsx` & `page.tsx`: Implement responsive CSS Grid and Hamburger menu (<1024px) <!-- id: 25 -->
    - [x] Apply new Glassmorphism visuals to Chat Interface and Sidebar <!-- id: 26 -->
- [x] **Hardware Monitor (Dashboard)** <!-- id: 27 -->
    - [x] Backend: Add `/stats` endpoint (CPU/RAM via psutil, Mock GPU/NPU or simple calc, Inference Speed) <!-- id: 28 -->
    - [x] Frontend: Create `SystemVitals.tsx` component and add to RightPanel/Sidebar <!-- id: 29 -->
- [x] **Real-time Hardware Monitoring (WebSocket)** <!-- id: 35 -->
    - [x] Backend: create `monitor.py` with `HardwareMonitor` class (Thread-safe, psutil, subprocess) <!-- id: 36 -->
    - [x] Backend: Add `/ws/vitals` endpoint to `gateway.py` pushing JSON every 1.5s <!-- id: 37 -->
    - [x] Frontend: Update `SystemVitals.tsx` to consume WebSocket stream instead of polling <!-- id: 38 -->
- [x] **Voice-to-Code (Whisper)** <!-- id: 39 -->
    - [x] Backend: Install `openai-whisper` (or equivalent) and create `/transcribe` endpoint <!-- id: 40 -->
    - [x] Frontend: Create `AudioRecorder` component and integrate into input area <!-- id: 41 -->
- [x] **S25 Ultra Mobile Sync (PWA)** <!-- id: 42 -->
    - [x] Frontend: Create `manifest.json` (Titanium theme) & icons <!-- id: 43 -->
    - [x] Frontend: Implement Service Worker skeleton for Firebase FCM <!-- id: 44 -->
- [x] **Compiler Agent (Self-Correction)** <!-- id: 45 -->
    - [x] Backend: Create `compiler.py` (GCC/Python linting) <!-- id: 46 -->
    - [x] Backend: Update Gateway logic to buffer code responses, validate, and retry if failed <!-- id: 47 -->
- [x] **Dynamic Hardware Reactive Theme** <!-- id: 50 -->
    - [x] Frontend: Create `useSystemVitals` hook to lift state <!-- id: 51 -->
    - [x] Frontend: Create `HardwareGrid` background component (glows with GPU load) <!-- id: 52 -->
    - [x] Frontend: Add Floating Action Button (FAB) to toggle Vitals panel <!-- id: 53 -->
    - [x] Frontend: Implement Gradient Typography (Silver -> Titanium Blue) <!-- id: 54 -->
- [x] **Action Tool (File System Integration)** <!-- id: 30 -->
    - [x] Backend: Add `/tools/apply_fix` endpoint to overwrite files <!-- id: 31 -->
    - [x] Frontend: Detect file paths in code blocks and add "Run Fix" button <!-- id: 32 -->

- [x] **Local Vector DB (ChromaDB)** <!-- id: 60 -->
    - [x] Backend: Install `chromadb` & `sentence-transformers` <!-- id: 61 -->
    - [x] Backend: Create `memory.py` for embedding/retrieval <!-- id: 62 -->
    - [x] Backend: Integrate into Compiler Loop (Embed on success) <!-- id: 63 -->
    - [x] Backend: Update Context Injection to query Memory <!-- id: 64 -->

- [x] **Phase H: Diff Modal** <!-- id: 70 -->
    - [x] Frontend: Create `DiffModal.tsx` (Side-by-Side view) <!-- id: 71 -->
    - [x] Frontend: Add WebSocket signal for "Accept" <!-- id: 72 -->
    - [x] Backend: Handle file overwrite (fileinput or full write) <!-- id: 73 -->

- [x] **Phase I: Security Sandbox (Middleware)** <!-- id: 80 -->
    - [x] Backend: Implement `SafetyMiddleware` class (`sandbox.py`) <!-- id: 81 -->
    - [x] Backend: Intercept commands/writes & emit "Permission Required" <!-- id: 82 -->
    - [x] Backend: Execute only on user approval (WebSocket) <!-- id: 84 -->

- [x] **Phase J: Performance Stress Test**
    - [x] Implement `PerformanceMonitor` (FPS Counter).
    - [x] Add `/stress` command to simulate 50 chunks/sec.
    - [x] Verify 120Hz fluidity.

- [x] **Phase K: Titanium Vitals**
    - [x] Redesign `SystemVitals.tsx` with Radial Gauges.
    - [x] Implement Tooltips & Animations.
    - [x] Style with Titanium Dark theme.

- [x] **Phase L: File Explorer (Prompt J)**
    - [x] Backend: Add `/fs/tree` endpoint (os.listdir, recursive or flat).
    - [x] Frontend: Create `FileExplorer.tsx` Sidebar component.
    - [x] Frontend: "Click to Open" -> Updates Chat Context or Editor (if present).
    - [x] Visuals: Icons for .py, .c, .json.

- [x] **Phase M: Model Orchestrator (Prompt K)**
    - [x] Backend: Add `/models` endpoint to list available/active models.
    - [x] Backend: `inference_server.py` already supports hot-swap via reload (needs specific signal handler).
    - [x] Frontend: Add `ModelSelector.tsx` in Header/Sidebar.
    - [x] Visuals: "Turbo", "Vision", "Ultra" badges.

- [x] **Phase N: Intelli-Comment (Prompt L)**
    - [x] Backend: Create `doc_engine.py` (uses LLM to generate comments).
    - [x] Backend: Add `/tools/docs` endpoint.
    - [ ] Frontend: Add "Magic Wand" button to CodeBlocks.

- [x] **Phase O: Haptic Visuals**
    - [x] Pulse: Border pulse during inference (`isProcessing`).
    - [x] Success: Shimmer effect on Nav Bar.
    - [x] Sound: Web Audio API clicks/beeps.

- [x] **Phase P: Deep-C Debugger (Prompt M)**
    - [x] Frontend: Create `TerminalWindow.tsx` component (xterm.js or custom).
    - [x] Backend: Update `compiler.py` to stream stdout/stderr via WebSocket.
    - [x] Intelligence: Parse "SegFault" or "Error: line X" and highlight in Editor.

- [x] **Phase Q: Project Knowledge Graph (Prompt N)**
    - [x] Backend: Create `graph_engine.py` (AST parsing for Py/C).
    - [x] Logic: Map `Function -> Calls` and `Variable -> Modified`.
    - [ ] Frontend: Visual Graph or Context Answer ("X is modified in ...").

- [x] **Phase R: Secure File API (Prompt P)**
    - [x] Backend: Update `gateway.py` with `/file/read` and `/file/save` POST endpoints.
    - [x] Optimization: Switch to `aiofiles` for non-blocking I/O.
    - [x] Security: Enforce `sandbox.is_safe_path`.

- [x] **Phase S: Titanium Code Editor (Prompt Q)**
    - [x] Frontend: Install `@monaco-editor/react`.
    - [x] Frontend: Create `CodeEditor.tsx` with Obsidian theme.
    - [x] Integration: Sync with `Sidebar.tsx` file selection.
    - [x] UX: "Glowing Save Button" on dirty state.

- [x] **Phase T: Context Pre-Scan (Prompt R)**
    - [x] Backend: Update `graph_engine.py` to generate `get_context_summary()`.
    - [x] Backend: Inject summary into `gateway.py` /chat prompts.
    - [x] Optimization: Cache the summary and only rebuild on file change.

- [x] **Phase U: Advanced Chat Rendering**
    - [x] Visuals: Glassmorphism bubbles (0.7 opacity), 1px border, inner shadow.
    - [x] Logic: Auto-link inline file paths to open in Editor.
    - [x] Polish: Ensure CodeBlocks have Copy button and Language badge.

- [x] **Phase V: Performance Controls**
    - [x] Frontend: Create `PerformanceModal.tsx` (Toggle Caching, GPU Slider).
    - [x] Backend: Add `/config/update` endpoint.
    - [x] Logic: Update `inference_server.py` settings dynamically.

- [x] **Phase W: Internal Terminal Engine**
    - [x] Backend: `/ws/terminal` endpoint with `asyncio.subprocess`.
    - [x] Safety: Regex filter for dangerous commands (`rm`, `sudo`, `mv` outside workspace).
    - [x] Streaming: Real-time stdout/stderr capture.

- [x] **Phase X: Titanium Terminal UI**
    - [x] Frontend: `Terminal.tsx` with Matrix styling.
    - [x] Integration: Toggle button and state in `page.tsx`.
    - [x] Features: Auto-scroll, Clear button, Blinking cursor.

- [x] **Phase Y: Omni-Search**
    - [x] Frontend: `OmniSearch.tsx` modal (Cmd+K).
    - [x] Backend: `/search` endpoint (grep/walk).
    - [x] UI: Frosted glass, centered, file snippets.

- [x] **Phase Z: Dependency Mapper**
    - [x] Backend: Script to parse `#include` (C) and `import` (Python).
    - [x] Output: JSON graph (nodes/edges).
    - [x] Endpoint: `/graph/dependencies`.

- [x] **Phase AA: Smart-Commit Documentation**
    - [x] Backend: `/git/diff` endpoint (or `summarize_session` logic).
    - [x] Frontend: `SmartCommitModal.tsx` (Titanium theme).
    - [x] Logic: Send context to LLM for bulleted summary.

- [x] **Context-Aware Refinement** <!-- id: 33 -->
    - [x] Verify `indexer.py` meets "context-summary" needs (already implemented, double check logic) <!-- id: 34 -->
- [x] **Verification** <!-- id: 12 -->
    - [x] Fixed port mismatch (8081 -> 8000) for Terminal, Search, and File Operations.
    - [x] Implemented missing `DependencyGraphModal.tsx` and backend logic for Phase Z.

- [x] **Phase AB: Real-Time Linting**
    - [x] Backend: `lint_engine.py` (pylint/cppcheck wrapper).
    - [x] Backend: `/tools/lint` endpoint.
    - [x] Frontend: Debounce logic (1.5s) in `CodeEditor.tsx`.
    - [x] Frontend: Visual markers (Monaco decorations) for errors/warnings.

- [x] **Phase AC: Structure Map (Code-to-Architecture)**
    - [x] Backend: Update `graph_engine.py` or new `structure.py` to identify current function from line number.
    - [x] Endpoint: `/tools/structure` (POST code + cursor -> breadcrumbs).
    - [x] Frontend: `StructureMap.tsx` breadcrumb component.
    - [x] Visuals: Titanium lines, glassmorphic hover.

    - [x] Backend: Ensure `gateway.py` handles/logs this context (implicitly handled by LLM prompt).

- [x] **Phase AE: Refactor Overlay (Quick-Action Toolbar)**
    - [x] Frontend: `RefactorToolbar.tsx` component (Slide-Up animation, 1px cyan glow).
    - [x] Logic: Capture text selection in `CodeEditor`.
    - [x] Actions: "Explain", "Optimize", "Fix Bugs", "Add Comments" -> Sends to Chat.

- [x] **Phase AF: Multi-Tab "Glass" Workspace**
    - [x] Frontend: Update `page.tsx` state to track `openFiles` list.
    - [x] UI: Tab bar above Editor (Brushed Titanium underline for active).
    - [x] Persistence: `localStorage` to save/restore open tabs.

- [x] **Phase AG: KV Caching / Performance Optimization**
    - [x] Backend: Increase `n_ctx` in `inference_server.py` to 32k.
    - [x] Logic: Generate `Project Map` string in `graph_engine.py`.
    - [x] Gateway: Pre-warm KV cache on startup with "Project Map" system prompt.
    - [x] Gateway: Reuse persistent prefix for all chat requests.

- [x] **Phase AH: One-Click Setup Script**
    - [x] Script: `setup.sh` (venv, pip install, npm install).
    - [x] Verification: `check_gpu.py` (Metal accessible?).
    - [x] Styling: Titanium success message.

- [x] **Phase AI: Intelli-Comment (Magic Wand)**
    - [x] Frontend: Add "Magic Wand" icon to code blocks in `ChatInterface`.
    - [x] Logic: Call `/tools/docs` on click and update message state.

- [x] **Phase AJ: Visual Knowledge Graph (Interaction Upgrade)**
    - [x] UI: Add "Architecture" toggle to Chat Input.
    - [x] Logic: Click node to open file, hover to see functions.

- [x] **Phase AK: Version History Sidebar**
    - [x] Backend: Create `version_history.py` and manage file snapshots.
    - [x] Backend: Integrate snapshot trigger into successful build/save cycles.
    - [x] Backend: Add `/history/list` and `/history/read` endpoints.
    - [x] Frontend: Create `VersionHistory.tsx` timeline component.
    - [x] Frontend: Add "History" tab to `Sidebar.tsx`.
    - [x] Frontend: Update `DiffModal.tsx` with Titanium-Green/Obsidian-Red theme.

- [x] **Phase AL: Memory Visualizer Panel**
    - [x] Backend: Create `memory_profiler.py` using `lldb` to track allocations.
    - [x] Backend: Add `/ws/memory` endpoint to stream events.
    - [x] Frontend: Create `MemoryVisualizer.tsx` Grid component.
    - [x] Frontend: Implement Cyan-Glow to Dark-Grey transition logic.
    - [x] Frontend: Integrate with Sidebar or Floating Modal.

