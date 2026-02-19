# 🦾 OpenClaw AI

> **An Industrial-Grade AI Coding Assistant** — A fully local, privacy-first IDE companion powered by quantized LLMs with Metal GPU acceleration, built for Mac M-series chips.

![OpenClaw AI](https://img.shields.io/badge/Platform-macOS%20M--Series-silver?logo=apple&style=for-the-badge)
![Python](https://img.shields.io/badge/Backend-Python%203.9-3776AB?logo=python&style=for-the-badge)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black?logo=next.js&style=for-the-badge)
![FastAPI](https://img.shields.io/badge/API-FastAPI-009688?logo=fastapi&style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-cyan?style=for-the-badge)

---

## 🌟 What is OpenClaw AI?

OpenClaw AI is a **fully local, privacy-preserving AI coding assistant** that runs entirely on your machine. It leverages the raw power of Apple Silicon (M1/M2/M3 Max) with **Metal GPU acceleration** to deliver:

- 🧠 **Real-time code intelligence** — autocomplete, explanations, refactoring
- 🔒 **100% local inference** — your code never leaves your machine
- ⚡ **Sub-second completions** — quantized LLMs via `llama.cpp` with Metal
- 🎙️ **Voice-to-Code** — dictate code using local Whisper
- 🤖 **Agentic planning** — autonomous multi-step task execution
- 🕵️ **Shadow History** — Git-like code recovery without needing Git

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     OpenClaw AI                            │
├─────────────────────────┬──────────────────────────────────┤
│   Frontend (Next.js)    │     Backend (FastAPI + Python)   │
│  ┌─────────────────┐    │  ┌──────────────────────────┐   │
│  │ Monaco Editor   │◄───┼──│ gateway.py (FastAPI)      │   │
│  │ Chat Interface  │    │  │  WebSocket + REST API     │   │
│  │ Agent Thoughts  │    │  └──────────┬───────────────┘   │
│  │ EKG Monitor     │    │             │                    │
│  │ Terminal        │    │  ┌──────────▼───────────────┐   │
│  │ File Explorer   │    │  │ inference_server.py       │   │
│  └─────────────────┘    │  │  llama-cpp-python + Metal │   │
│                         │  └──────────────────────────┘   │
└─────────────────────────┴──────────────────────────────────┘
```

### Key Backend Modules

| Module | Purpose |
|--------|---------|
| `gateway.py` | FastAPI server — WebSocket hub, REST endpoints, middleware |
| `inference_server.py` | Local LLM inference via llama-cpp with Metal GPU |
| `version_history.py` | Shadow History — local snapshot diffs (`.claw_history/`) |
| `memory_system.py` | SQLite-backed persistent memory across sessions |
| `episodic_memory.py` | Session context retrieval via ChromaDB |
| `reasoning_engine.py` | Chain-of-Thought planning engine |
| `security_scanner.py` | Static analysis (bandit/cppcheck) + auto-patch |
| `sandbox_agent.py` | Isolated code execution + self-correction loop |
| `quality_agent.py` | Cyclomatic complexity audit (radon/lizard) |
| `heartbeat.py` | 30s background scan — TODOs, health, proactive AI |
| `lore_engine.py` | Vectorized project knowledge (ChromaDB) |
| `graph_engine.py` | AST dependency mapping for Python/C |
| `test_engine.py` | LLM-powered test generation + runner |
| `voice_engine.py` | Local Whisper voice commands |
| `monitor.py` | Real-time hardware telemetry (CPU/RAM/GPU/Thermal) |
| `context_manager.py` | Dynamic context scaling based on available RAM |
| `deadlock_detector.py` | Process lock detection + AI analysis |
| `peripheral_monitor.py` | File system watchdog — live reload on change |

---

## ✨ Features

### 🤖 AI Intelligence
- **Ghost Text** — inline completions as you type (300ms debounce)
- **Reasoning Engine** — Chain-of-Thought for complex tasks
- **Agentic Planning** — autonomous multi-step goal execution
- **Morning Brief** — daily project health summary on launch
- **Proactive Suggestions** — heartbeat-triggered AI nudges

### 🔧 Code Tools
- **Real-Time Linting** — pylint/cppcheck with Monaco decorations
- **Auto-Documentation** — one-click docstring + README generation
- **Deep Static Analysis** — security scanning with auto-remediation
- **Complexity Audit** — tracks cyclomatic complexity, suggests refactors
- **Memory Leak Detection** — macOS `leaks` integration for C programs
- **Autonomous Testing** — generates and runs unit tests on save

### 🕵️ Shadow History (Phase BV)
Never lose code again. OpenClaw automatically snapshots every file save into `.claw_history/`, enabling AI-powered recovery of deleted code:
```bash
# The AI can retrieve any deleted function, even without Git
User: "Restore the function I deleted 10 minutes ago"
OpenClaw: *searches diff history, returns deleted block*
```

### 🎙️ Voice Control
- Wake word detection with local Whisper (no cloud)
- Commands: "Build", "Run Tests", "Zen Mode", "Check Leaks"

### 🖥️ Industrial UI
- **Titanium Dark** design system (Obsidian #0A0A0A + Neon-Cyan)
- **Glassmorphism** panels with blur effects
- **EKG Heartbeat Monitor** — live backend status waveform
- **Hardware Dashboard** — CPU/RAM/GPU radial gauges
- **Monaco Code Editor** — VS Code-grade editing with Ghost Text
- **Cinematic Boot Sequence** — shard-assembly startup animation

---

## 🚀 Getting Started

### Prerequisites
- macOS (Apple Silicon M1/M2/M3 recommended)
- Python 3.9+
- Node.js 18+
- A local GGUF model file (e.g., Llama 3, Mistral, CodeLlama)

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/MarvellianRohit/OpenClaw-AI.git
cd OpenClaw-AI

# Run the automated setup script
chmod +x setup.sh
./setup.sh
```

### Manual Setup

#### Backend
```bash
cd openclaw-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start the gateway
python3 gateway.py
```

#### Frontend
```bash
cd openclaw-frontend
npm install
npm run dev
```

Then open **http://localhost:3000**

### CLI Tool
```bash
# Install the global CLI
chmod +x setup_cli.sh && ./setup_cli.sh

# Usage
claw --summary          # Show vitals + project status
claw --fix <file>       # AI analysis + apply fix
```

---

## 📁 Project Structure

```
OpenClaw-AI/
├── openclaw-backend/          # Python FastAPI backend
│   ├── gateway.py             # Main API server (WebSocket + REST)
│   ├── inference_server.py    # Local LLM inference (Metal GPU)
│   ├── version_history.py     # Shadow History snapshots
│   ├── memory_system.py       # Persistent session memory (SQLite)
│   ├── reasoning_engine.py    # Chain-of-Thought planner
│   ├── security_scanner.py    # Static analysis engine
│   ├── sandbox_agent.py       # Isolated execution + self-correction
│   ├── quality_agent.py       # Code complexity auditor
│   ├── heartbeat.py           # Background AI pulse
│   ├── lore_engine.py         # Project knowledge vectorstore
│   ├── graph_engine.py        # AST dependency graph
│   ├── test_engine.py         # Test generation + runner
│   ├── voice_engine.py        # Whisper voice commands
│   ├── monitor.py             # Hardware telemetry
│   ├── .claw_history/         # Shadow history snapshots
│   └── venv/                  # Python virtual environment
│
├── openclaw-frontend/         # Next.js 14 frontend
│   ├── app/                   # App Router (page.tsx, layout.tsx)
│   ├── components/            # UI components
│   │   ├── ChatInterface.tsx  # Main AI chat
│   │   ├── CodeEditor.tsx     # Monaco editor
│   │   ├── EKGMonitor.tsx     # Heartbeat waveform
│   │   ├── AgentThoughts.tsx  # Reasoning visualizer
│   │   ├── PlanningRoadmap.tsx# Agentic plan stepper
│   │   ├── SystemVitals.tsx   # Hardware dashboard
│   │   └── ...                # 40+ components
│   └── hooks/                 # Custom React hooks
│
├── claw.py                    # CLI tool
├── setup.sh                   # One-click setup
└── setup_cli.sh               # CLI installer
```

---

## 🔌 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/ws/chat` | WebSocket | Primary AI chat stream |
| `/ws/vitals` | WebSocket | Hardware telemetry stream |
| `/ws/terminal` | WebSocket | Interactive terminal |
| `/file/save` | POST | Save file + snapshot |
| `/file/read` | POST | Read file securely |
| `/tools/fix` | POST | AI-powered code fix |
| `/tools/retrieve_deleted` | POST | Recover deleted code |
| `/tools/lint` | POST | Run linter |
| `/tools/docs` | POST | Generate documentation |
| `/tools/autodoc` | POST | Full README generation |
| `/tools/patch` | POST | Auto-remediate vulnerability |
| `/agent/plan` | POST | Multi-step goal planning |
| `/agent/execute` | POST | Execute agentic plan |
| `/tools/morning-brief` | GET | Daily project summary |
| `/graph/dependencies` | GET | Dependency graph JSON |
| `/history/list` | GET | List file snapshots |

---

## 🧠 AI Models

OpenClaw AI works with any **GGUF-format model**. Recommended:

| Model | Size | Best For |
|-------|------|---------|
| `Llama-3-8B-Q4_K_M` | ~4.7GB | General coding |
| `CodeLlama-13B-Q4_K_M` | ~7.3GB | C/Python specialization |
| `Mistral-7B-Q5_K_M` | ~4.7GB | Fast completions |
| `DeepSeek-Coder-6.7B` | ~4GB | Code generation |

---

## 🛡️ Privacy & Security

- **Zero telemetry** — all inference runs locally
- **Sandbox execution** — code runs in isolated environments
- **Path safety** — `sandbox.is_safe_path()` guards all file operations
- **Permission gates** — dangerous commands require explicit approval
- **Security scanning** — bandit (Python) + cppcheck (C) on every save

---

## 🗺️ Roadmap

- [ ] **Phase BW**: Multi-Model Routing (route queries to best local model)
- [ ] **Phase BX**: Plugin System (community-built tool extensions)
- [ ] **Phase BY**: Remote GPU Support (offload to a Mac Mini server)
- [ ] **Phase BZ**: Collaborative Mode (shared workspace, multiple users)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👨‍💻 Author

**Rohit Chandra** — [@MarvellianRohit](https://github.com/MarvellianRohit)

> *"The best coding assistant is one that knows your codebase as well as you do."*

---

<div align="center">
  <strong>Built with ❤️ for Apple Silicon</strong><br>
  <em>OpenClaw AI — Code at the speed of thought</em>
</div>
