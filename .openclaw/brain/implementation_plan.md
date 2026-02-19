# OpenClaw AI Implementation Plan

## Goal Description
Build a high-performance local AI assistant interface ("OpenClaw AI") utilizing:
- **Frontend**: Next.js with PWA support.
- **Backend**: FastAPI Gateway with Whisper and Compass Compiler Agent.
- **Hardware**: M3 Max optimized.

## Proposed Changes

### Voice-to-Code (Prompt F)
- **Backend**:
    - [NEW] `/transcribe` endpoint using `openai-whisper` (or `faster-whisper`).
    - Uses M3 Max (`mps` device or `coreml` if available).
- **Frontend**:
    - [NEW] `AudioRecorder` component: Records blob, POSTs to backend, inserts text to input.

### PWA & Mobile Sync (Prompt E)
- **Frontend**:
    - [NEW] `public/manifest.json`: Titanium theme colors.
    - [NEW] `public/firebase-messaging-sw.js`: Placeholder for FCM.
    - [MODIFY] `layout.tsx`: Link manifest.

### Compiler Agent (Prompt D)
- **Backend**:
    - [NEW] `compiler.py`: Functions to parse code blocks, save to temp, run `gcc`/`python -m py_compile`, return errors.
    - [MODIFY] `gateway.py`: 
        - Intercept AI response. 
        - If code block specific markers start, buffer content.
        - Run compiler.
        - If error -> Send "System: Error X, fix it" back to AI loop.
        - If success -> Stream to user.
        - *Simpler MVP*: Run compilation *async* and just append a "Compilation Status: ✅/❌" message to the stream, rather than hiding the generation (which feels slow). The prompt says "Only show final". Okay, we must buffer. This implies a "Thinking..." state for the user.

## Verification Plan
### Manual Verification
- **Voice**: Speak "Hello World", verify text appears.
- **Mobile**: Check Chrome DevTools "Application" tab for Manifest.
- **Compiler**: Ask for "Broken C code", see if it auto-fixes (logs) and returns working code.

## Local Vector DB (Prompt G)
- **Goal**: Long-term memory for code snippets and patterns.
- **Implementation**:
    - `memory.py`: Wraps `chromadb.PersistentClient`.
    - `gateway.py`: 
        - Initialize `Memory` on startup.
        - On `CompilerAgent` success: `memory.add(code, metadata={...})`.
        - On Chat: `memory.search(query)` and append to Context.

## Diff Modal (Prompt H)
- **Goal**: Safe code application with visual verification.
- **Implementation**:
    - Frontend: `DiffModal.tsx` Side-by-Side view.
    - Backend: Reuse `/tools/apply_fix` or new WebSocket signal `apply_patch`.
    - UI: Dark-mode, Titanium-grey backdrop (0.8 opacity).

## Security Sandbox (Prompt I)
- **Goal**: Prevent unsafe execution.
- **Implementation**:
    - Backend: `SecurityMiddleware` class to intercept `run_command`.
    - Protocol: 
        1. AI requests command.
        2. Backend pauses, sends `{ type: "approval_request", command: "rm -rf /" }`.
        3. Frontend shows Toast/Modal.
        4. User accepts/denies via WebSocket `{ type: "approval_grant" }`.
        5. Backend proceeds or raises error.
    - Security: Block `rm -rf` and `curl/wget` unless explicitly allowed.

## Real-Time Linting (Phase AB)
- **Goal**: Immediate feedback on code quality without manual compilation.
- **Trigger**: 1.5s of inactivity in `CodeEditor`.
- **Implementation**:
    - **Backend**:
        - [NEW] `lint_engine.py`: 
            - Writes code to temp file.
            - Runs `pylint --output-format=json` (Python) or `cppcheck --xml` (C).
            - Parses output into standard JSON: `[{ line, message, severity }]`.
        - [MODIFY] `gateway.py`: Add `/tools/lint` POST endpoint.
    - **Frontend**:
        - [MODIFY] `CodeEditor.tsx`:
            - Add `useEffect` with `setTimeout` for debounce.
            - Call `/tools/lint` on pause.
            - Use `monaco.editor.setModelMarkers` to show red/yellow squiggles.

## Structure Map (Phase AC)
- **Goal**: Visual breadcrumb navigation (Project > File > Function).
- **Implementation**:
    - **Backend**:
        - [UPDATE] `graph_engine.py`: Add method `identify_symbol(code, line_number)` using AST/regex.
        - [NEW] `/tools/structure` endpoint.
    - **Frontend**:
        - [NEW] `StructureMap.tsx`:
            - Placed above CodeEditor.
            - Fetches structure on debounce (reuse linting debounce or separate).
            - Visuals: `lucide-react` icons, titanium colors.

## Deep-Context Injection (Phase AD)
- **Goal**: "Situational Awareness" for the AI.
- **Implementation**:
    - **Frontend**:
        - [UPDATE] `ChatInterface.tsx` / `useOpenClawStream.ts`:
            - On `sendMessage`:
                - Read `CodeEditor` content (slice last 50 lines).
                - Read `Terminal` history (filter for errors).
                - Construct XML-like tag:
                  ```xml
                  <system_context>
                    <file name="x.py">...last 50 lines...</file>
                    <errors>...last 3 errors...</errors>
                  </system_context>
                  ```
                - Append to user message (hidden from UI if possible, or just appended).

## Refactor Overlay (Phase AE)
- **Goal**: Contextual Quick-Actions on selection.
- **Implementation**:
    - **Frontend**:
        - [NEW] `RefactorToolbar.tsx`:
            - Absolute positioned div.
            - Framer Motion `initial={{params.y: 10, opacity: 0}} animate={{params.y: 0, opacity: 1}}`.
            - Buttons: Explain, Optimize, Fix, Comment.
        - [UPDATE] `CodeEditor.tsx`:
            - `editor.onDidChangeCursorSelection`: Capture selection range.
            - If range > empty, show toolbar at coords.
            - Calculate absolute tokens from Monaco coords `editor.getScrolledVisiblePosition`.

- [x] **Phase AF: Multi-Tab "Glass" Workspace**
    - [x] Frontend: Update `page.tsx` state to track `openFiles` list.
    - [x] UI: Tab bar above Editor (Brushed Titanium underline for active).
    - [x] Persistence: `localStorage` to save/restore open tabs.

## KV Caching (Phase AG)
- **Goal**: < 200ms TTFT by reusing context.
- **Implementation**:
    - **Backend**:
        - `inference_server.py`: `n_ctx=32768`, ensure `cache=True`.
        - `graph_engine.py`: `get_project_map()` -> Textual representation of file tree + symbols.
        - `gateway.py`:
            - `GLOBAL_PROJECT_CONTEXT` variable.
            - Startup: Build context -> Send to LLM (dry run) to populate KV cache.
            - Chat Loop: Prepend `GLOBAL_PROJECT_CONTEXT` to system prompt.

## One-Click Setup (Phase AH)
- **Goal**: Automate environment creation and verification.
- **Implementation**:
    - **`setup.sh`**:
        - Checks/Creates `openclaw-env`.
        - Installs `requirements.txt` (needs to be created/ensured).
        - cd `openclaw-frontend` -> `npm install`.
        - Python check for `llama_cpp` GPU offload.
    - **Visuals**: ANSI escape codes for Titanium Grey/Cyan text.

### Phase AI: Intelli-Comment (Magic Wand)
Implement a one-click documentation helper for code blocks.
- [NEW] Backend Logic: `/tools/docs` endpoint using the compiler agent to inject senior-level comments.
- [MODIFY] Chat UI: Add a "Magic Wand" icon to code block headers with a purple glow animation.

---

### Phase AK: Version History Sidebar
Implement a timeline-based version tracking system with high-contrast diffing.

#### [NEW] version_history.py (Backend Utility)
- Manages a hidden `snapshots/` directory.
- `save_snapshot(filepath, content)`: Stores a copy of the file with a timestamp.
- `list_snapshots(filepath)`: Returns metadata (time, size) for all snapshots of a specific file.
- `get_snapshot(filepath, timestamp)`: Retrieves the content of a specific snapshot.

#### [MODIFY] gateway.py (API Integration)
- Add `/history/list` and `/history/read` endpoints.
- Trigger `save_snapshot` in the compiler self-correction loop when `all_passed` is true.

#### [NEW] VersionHistory.tsx (Frontend Component)
- A vertical timeline displayed in the Sidebar's new "HISTORY" tab.
- Displays snapshots for the currently active file.
- Interaction: Clicking a snapshot opens the `DiffModal`.

### Phase AL: Memory Visualizer Panel
Real-time C memory allocation tracking and visualization.

#### [NEW] memory_profiler.py (Backend)
- Uses `lldb` python scripts to intercept `malloc(size_t)` and `free(void*)`.
- Captures: `timestamp`, `type` (alloc/free), `address`, `size`.
- Streams events via WebSocket to the frontend.

#### [MODIFY] gateway.py
- Add `/ws/memory` endpoint.
- Provide a trigger to start profiling a specific C binary.

#### [NEW] MemoryVisualizer.tsx (Frontend)
- **Grid Layout**: Represents a high-level view of the heap.
- **Visuals**:
  - `Cyan Glow`: Active allocation.
  - `Pulse`: Triggered on new `malloc`.
  - `Fade to Dark Grey`: Triggered on `free`.
- **Aesthetic**: Industrial dark theme, high contrast.
