from fastapi import FastAPI, WebSocket, Request, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import json
import os
import shutil
from typing import List, Dict, Any
import aiofiles  # Optimized I/O
import aiohttp


from memory import Memory
from monitor import monitor
from compiler import compiler_agent
from doc_engine import generate_docs
from sandbox import sandbox  # Security Check
from lint_engine import lint_engine
from graph_engine import project_graph
from version_history import save_snapshot, list_snapshots, get_snapshot_content
from memory_profiler import mock_memory_trace, trace_memory
from auto_doc import generate_readme
from test_engine import auto_test_cycle
from voice_engine import voice_engine, handle_voice_command
from context_manager import context_manager
from heartbeat import HeartbeatService
from observer import Observer, observer
import observer as observer_module
from deadlock_detector import DeadlockDetector
import deadlock_detector as deadlock_module

app = FastAPI()

GLOBAL_PROJECT_CONTEXT = ""

# Build Graph on Startup (Async)
@app.on_event("startup")
async def startup_event():
    global GLOBAL_PROJECT_CONTEXT
    print("🕸️ Building Knowledge Graph...")
    project_graph.build_graph()
    print(f"🕸️ Graph Built: {len(project_graph.graph['functions'])} functions indexed.")
    
    # Phase AG: KV Cache Warmup
    print("🔥 Warming up KV Cache with Project Map...")
    GLOBAL_PROJECT_CONTEXT = project_graph.get_project_map()
    
    # Send dry-run request to Inference Server to populate KV Cache
    # We send the Context as a System Message. The Server should cache this prefix.
    try:
        base_system_msg = (
            "You are OpenClaw. Always Keep this Project Context in mind:\n"
            f"{GLOBAL_PROJECT_CONTEXT}\n\n"
            "You are a high-performance AI assistant optimized for M3 Max.\n"
            "If writing code, ensure it is correct, efficient, and fits the Titanium/Industrial design.\n"
        )
        
        async with aiohttp.ClientSession() as session:
            payload = {
                "messages": [
                    {"role": "system", "content": base_system_msg}
                ],
                "max_tokens": 1  # Minimal generation, just processing prompt
            }
            async with session.post(INFERENCE_URL, json=payload) as response:
                if response.status == 200:
                    print("✅ KV Cache Warmed Up (Project Map loaded into VRAM)")
                else:
                    print(f"⚠️ Warmup Warning: {response.status}")
    except Exception as e:
        print(f"❌ Warmup Failed: {e}. Is inference_server running?")
    
    # Phase AT: Start Voice Engine in Background
    try:
        asyncio.create_task(voice_engine.listen_loop(broadcast_voice_state, execute_voice_command_actions))
    except Exception as e:
        print(f"🎙️ Voice Engine Failed to start: {e}")

    # Phase AU: Dynamic Context Scaling Monitor
    async def memory_monitor():
        while True:
            changed, new_ctx = context_manager.check_memory_and_scale()
            if changed:
                # We reuse the vitals websocket or general status broadcast
                await broadcast_system_event({
                    "type": "context_scale",
                    "high_capacity": context_manager.high_capacity_active,
                    "tokens": new_ctx
                })
            await asyncio.sleep(5)  # Check every 5 seconds

    asyncio.create_task(memory_monitor())

    # Phase AX: Heartbeat Service
    async def trigger_proactive_suggestion(suggestion_msg: str):
        """Generates an AI suggestion based on heartbeat trigger and broadcasts it."""
        try:
            # We fetch a quick AI fix or strategy for the detected issue
            async with aiohttp.ClientSession() as session:
                payload = {
                    "messages": [
                        {"role": "system", "content": "You are OpenClaw Proactive AI. Provide a concise 1-sentence fix for the issue."},
                        {"role": "user", "content": suggestion_msg}
                    ],
                    "max_tokens": 100
                }
                async with session.post(INFERENCE_URL, json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        ai_suggestion = data['choices'][0]['message']['content'].strip()
                        await broadcast_system_event({
                            "type": "proactive_suggestion",
                            "severity": "info",
                            "text": ai_suggestion
                        })
        except Exception as e:
            print(f"⚠️ Proactive Suggestion Failed: {e}")

    heartbeat = HeartbeatService(broadcast_system_event, trigger_proactive_suggestion)
    await heartbeat.start()

    # Phase AZ: Observer Module
    observer_module.observer = Observer(broadcast_system_event)
    print("👁️ Observer Module Activated.")

    # Phase BA: Deadlock Detector
    deadlock_module.detector = DeadlockDetector(broadcast_system_event, call_llm)
    await deadlock_module.detector.start()

# ... existing ...

@app.get("/tools/graph")
async def query_graph(type: str, target: str):
    return project_graph.query(type, target)

@app.get("/graph/dependencies")
async def get_dependency_graph():
    return project_graph.get_dependency_graph()

class LintRequest(BaseModel):
    code: str
    language: str

@app.post("/tools/lint")
async def lint_code(request: LintRequest):
    return await lint_engine.lint_code(request.code, request.language)

@app.get("/status")
async def get_system_status():
    """Returns a consolidated summary of vitals and project state for the CLI."""
    stats = monitor.get_stats()
    return {
        "vitals": stats,
        "project": {
            "functions_indexed": len(project_graph.graph['functions']),
            "active_files": len(project_graph.graph.get('files', [])),
            "high_capacity_mode": context_manager.high_capacity_active,
            "context_tokens": context_manager.current_context
        }
    }

class FixRequest(BaseModel):
    filepath: str

@app.post("/tools/fix")
async def fix_file_cli(request: FixRequest):
    """Analyzes a file and applies a fix automatically for the CLI."""
    try:
        if not os.path.exists(request.filepath):
            raise HTTPException(status_code=404, detail="File not found")
            
        async with aiofiles.open(request.filepath, mode='r') as f:
            content = await f.read()
            
        # Simplified prompt for CLI fix
        prompt = f"Analyze and fix any bugs in this file. Return ONLY the corrected code.\n\nFile: {request.filepath}\nContent:\n{content}"
        
        async with aiohttp.ClientSession() as session:
            payload = {
                "messages": [
                    {"role": "system", "content": "You are OpenClaw AI. Fix the provided code. Return ONLY code."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2
            }
            async with session.post(INFERENCE_URL, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    # Expecting data['choices'][0]['message']['content'] from a typical OpenAI-like API
                    fixed_code = data['choices'][0]['message']['content'].strip()
                    
                    # Remove markdown code blocks if AI included them
                    if fixed_code.startswith("```"):
                        fixed_code = "\n".join(fixed_code.split("\n")[1:-1])
                    
                    async with aiofiles.open(request.filepath, mode='w') as f:
                        await f.write(fixed_code)
                        
                    return {"status": "success", "file": request.filepath}
                else:
                    raise HTTPException(status_code=response.status, detail="AI Inference failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class StructureRequest(BaseModel):
    code: str
    filepath: str
    line: int

@app.post("/tools/structure")
async def get_structure(request: StructureRequest):
    return project_graph.identify_symbol(request.code, request.line, request.filepath)

class DescRequest(BaseModel):
    code: str
    language: str

@app.post("/tools/docs")
async def create_docs(request: DescRequest):
    try:
        documented_code = generate_docs(request.code, request.language)
        return {"code": documented_code}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Version History Endpoints ---
@app.get("/history/list")
async def get_history(path: str):
    return list_snapshots(path)

@app.get("/history/read")
async def read_history(path: str, timestamp: int):
    content = get_snapshot_content(path, timestamp)
    return {"content": content}

# File System Helpers
IGNORE_DIRS = {".git", "__pycache__", "node_modules", ".next", ".gemini", "venv", "env", "dist", "build"}

def get_file_tree(path: str) -> List[Dict[str, Any]]:
    tree = []
    try:
        with os.scandir(path) as it:
            entries = sorted(list(it), key=lambda e: (not e.is_dir(), e.name))
            for entry in entries:
                if entry.name in IGNORE_DIRS or entry.name.startswith("."):
                    continue
                
                node = {
                    "name": entry.name,
                    "path": entry.path,
                    "type": "directory" if entry.is_dir() else "file"
                }
                
                if entry.is_dir():
                    node["children"] = get_file_tree(entry.path)
                
                tree.append(node)
    except PermissionError:
        pass
    return tree

@app.get("/fs/tree")
async def read_file_tree(path: str = "."):
    """Returns the file structure of the current directory."""
    # Ensure we scan the project root, not just backend folder if running from there
    # Assuming backend is getting run from project root or inside openclaw-backend
    base_path = os.path.abspath(path) 
    return get_file_tree(base_path)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Indexer
indexer = CodebaseIndexer("./..") # Root of workspace
# indexer.build_index() # Async or pre-built. Assuming it works.

INFERENCE_URL = "http://localhost:8081/v1/chat/completions" # Local Inference

# --- Hardware Vitals ---
from monitor import monitor

@app.websocket("/ws/vitals")
async def vitals_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            stats = monitor.get_stats()
            # Ensure JSON serializable
            await websocket.send_text(json.dumps(stats))
            await asyncio.sleep(1.5)
    except Exception:
        pass

# --- Local Whisper (Phase AT) ---
connected_voice_clients = set()

@app.websocket("/ws/voice")
async def voice_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_voice_clients.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        pass
    finally:
        connected_voice_clients.remove(websocket)

async def broadcast_voice_state(data: Dict[str, Any]):
    message = json.dumps(data)
    for client in connected_voice_clients:
        try:
            await client.send_text(message)
        except:
            pass

async def execute_voice_command_actions(command: str):
    """Executes actions based on voice command."""
    # We can broadcast to chat or trigger internal events
    # For demo, let's just broadcast to a general action channel or chat
    # We will implement handle_voice_command logic here or call it
    await handle_voice_command(command, broadcast_voice_state)

# --- System Events (Phase AU) ---
# We can reuse the vitals or terminal socket, but let's have a dedicated system broadcast
async def broadcast_system_event(data: Dict[str, Any]):
    """Broadcasts a system event (like context scaling) to all active terminal and chat clients."""
    # For simplicity, we broadcast this to the voice clients or terminal clients
    # In a full design, there might be a dedicated 'system' websocket
    # Let's broadcast to voice clients for now as they are listening for state
    await broadcast_voice_state(data)

# --- Autonomous Testing (Phase AQ) ---
connected_test_clients = set()

@app.websocket("/ws/tests")
async def tests_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_test_clients.add(websocket)
    try:
        while True:
            await websocket.receive_text() # Hold open
    except Exception:
        pass
    finally:
        connected_test_clients.remove(websocket)

async def broadcast_test_result(file_path: str, result: Dict[str, Any]):
    """Broadcasts test results to all connected test clients."""
    message = json.dumps({
        "type": "test_result",
        "file_path": file_path,
        "result": result
    })
    for client in connected_test_clients:
        try:
            await client.send_text(message)
        except:
            pass

@app.websocket("/ws/run")
async def run_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            request = json.loads(data)
            command = request.get("command")
            
            if command:
                # Stream output from compiler agent
                for chunk in compiler_agent.stream_command(command):
                    await websocket.send_text(json.dumps(chunk))
                    await asyncio.sleep(0.01) # Small yielding
                    
    except Exception as e:
        print(f"Run WS Error: {e}")

@app.post("/tools/apply_fix")
async def apply_fix(request: FileFixRequest):
    # Security check: Ensure path is within workspace (basic)
    if not os.path.abspath(request.filepath).startswith(os.getcwd()) and "/Users/rohitchandra/Documents" not in request.filepath:
         # Loose check for demo
         pass
         
    try:
        with open(request.filepath, "w") as f:
            f.write(request.content)
        return {"status": "success", "message": f"Updated {request.filepath}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Tools: Transcription ---
WHISPER_MODEL = None

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    global WHISPER_MODEL
    try:
        # Save temp file
        temp_filename = f"temp_{file.filename}"
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Lazy Load Whisper
        if not WHISPER_MODEL:
            import whisper
            print("🎙️ Loading Whisper Model (base)...")
            # Use 'mps' for M3 Max if available, else 'cpu'
            device = "mps" if torch.backends.mps.is_available() else "cpu"
            WHISPER_MODEL = whisper.load_model("base", device=device)
        
        result = WHISPER_MODEL.transcribe(temp_filename)
        text = result["text"]
        
        os.remove(temp_filename)
        return {"text": text}
    except Exception as e:
        print(f"Transcription Error: {e}")
        return {"error": str(e)}

# --- Secure File API (Phase R) ---
@app.post("/file/read")
async def read_file_post(request: FileFixRequest):
    if not sandbox.is_safe_path(request.filepath):
        raise HTTPException(status_code=403, detail="Access Denied: Unsafe path")
    
    try:
        async with aiofiles.open(request.filepath, mode='r') as f:
            content = await f.read()
        return {"content": content}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/file/save")
async def save_file_post(request: FileFixRequest):
    if not sandbox.is_safe_path(request.filepath):
        raise HTTPException(status_code=403, detail="Access Denied: Unsafe path")
        
    try:
        # Atomic write pattern could be better, but simple write for now
        async with aiofiles.open(request.filepath, mode='w') as f:
            await f.write(request.content)
            
        # Trigger Autonomous Testing (Phase AQ)
        if request.filepath.endswith((".py", ".c")):
            asyncio.create_task(auto_test_cycle(
                request.filepath, 
                request.content, 
                call_llm, 
                broadcast_test_result
            ))

        # Trigger Observer (Phase AZ)
        from observer import observer
        if observer:
            await observer.track_save(request.filepath)

        return {"status": "success", "message": f"Saved {os.path.basename(request.filepath)}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Legacy GET for tools (keep for compatibility or redirect logic)
@app.get("/tools/read_file")
async def read_file(path: str):
    if not os.path.isabs(path):
        # Allow relative paths from cwd for convenience? 
        # For security, better to require absolute or resolve relative to CWD.
        path = os.path.abspath(path)
        
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
        
    try:
        with open(path, "r", encoding="utf-8") as f:
            return {"content": f.read()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Performance Config (Phase V) ---
class ConfigRequest(BaseModel):
    aggressive_caching: bool
    gpu_threads: int

@app.post("/config/update")
async def update_config(config: ConfigRequest):
    try:
        # Update global config or inference server
        # For now, just print and maybe update a mock state
        print(f"⚙️ Updating Config: Caching={config.aggressive_caching}, GPU Threads={config.gpu_threads}")
        
        # If we had a real inference server instance with mutable config:
        # inference_server.update_config(config.aggressive_caching, config.gpu_threads)
        
        return {"status": "success", "config": config.dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Chat Endpoint ---
# --- Omni-Search (Phase Y) ---
@app.get("/search")
async def search_files(q: str):
    results = []
    root_dir = ".." # Assume backend is in subdirectory, search root?
    # Or current dir "."? User workspace is typically ".." from backend folder if backend is in "openclaw-backend"
    # User's files seem to be in "Documents/OpenClaw AI". 
    # Current py file is in "Documents/OpenClaw AI/openclaw-backend".
    # So root is "..".
    
    try:
        search_root = os.path.abspath(os.path.join(os.getcwd(), ".."))
        
        # Limit search to certain extensions
        VALID_EXTS = {'.py', '.tsx', '.ts', '.js', '.json', '.bg', '.md', '.c', '.h', '.css'}
        
        for dirpath, dirnames, filenames in os.walk(search_root):
             # Skip hidden or common exclude dirs
            if 'node_modules' in dirnames: dirnames.remove('node_modules')
            if '.git' in dirnames: dirnames.remove('.git')
            if '__pycache__' in dirnames: dirnames.remove('__pycache__')
            
            for f in filenames:
                ext = os.path.splitext(f)[1]
                if ext not in VALID_EXTS: continue
                
                path = os.path.join(dirpath, f)
                try:
                    async with aiofiles.open(path, mode='r', encoding='utf-8', errors='ignore') as af:
                        content = await af.read()
                        if q.lower() in content.lower():
                            # Find line number and snippet
                            lines = content.split('\n')
                            for i, line in enumerate(lines):
                                if q.lower() in line.lower():
                                    rel_path = os.path.relpath(path, search_root)
                                    results.append({
                                        "file": rel_path,
                                        "line": i + 1,
                                        "snippet": line.strip()[:100] # Limit snippet length
                                    })
                                    if len(results) > 50: break # Limit total results
                except:
                    continue
            if len(results) > 50: break

        return {"results": results}
    except Exception as e:
        return {"error": str(e), "results": []}

async def call_llm(prompt: str, max_tokens: int = 2048):
    """Internal helper to call the local LLM."""
    try:
        async with aiohttp.ClientSession() as session:
            payload = {
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens
            }
            async with session.post(INFERENCE_URL, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    return data['choices'][0]['message']['content']
                else:
                    return f"Error: LLM returned {response.status}"
    except Exception as e:
        return f"Error connecting to LLM: {str(e)}"

@app.post("/tools/autodoc")
async def autodoc():
    """Generates a professional README.md for the current workspace."""
    root_path = os.getcwd() # Workspace root
    try:
        readme_content = await generate_readme(root_path, call_llm)
        
        # Save the README
        readme_path = os.path.join(root_path, "README.md")
        async with aiofiles.open(readme_path, mode='w') as f:
            await f.write(readme_content)
            
        return {"status": "success", "path": readme_path, "content": readme_content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tools/morning-brief")
async def get_morning_brief():
    """Generates a personalized session summary for the day's first launch."""
    try:
        # 1. Get Recent Git Activity
        import subprocess
        git_log = "No recent git activity."
        try:
            git_log = subprocess.check_output(
                ["git", "log", "-n", "3", "--pretty=format:%h: %s"], 
                stderr=subprocess.STDOUT
            ).decode()
        except:
            pass

        # 2. Get Task Status
        task_status = "No task.md found."
        task_path = os.path.join(os.getcwd(), "..", ".gemini", "antigravity", "brain", "7fc12b23-5d14-4d41-90fd-2b8b3bb7d0a8", "task.md")
        if os.path.exists(task_path):
            async with aiofiles.open(task_path, mode='r') as f:
                content = await f.read()
                # Just grab the last few completed items or the current active plan
                lines = content.splitlines()
                recent_tasks = [l for l in lines if "[x]" in l][-5:]
                pending_tasks = [l for l in lines if "[ ]" in l or "[/]" in l][:3]
                task_status = f"Recently Completed:\n" + "\n".join(recent_tasks) + "\n\nPending:\n" + "\n".join(pending_tasks)

        # 3. Generate Briefing with LLM
        prompt = (
            "You are OpenClaw. Generate a concise, friendly 'Morning Briefing' for a senior engineer. "
            "Use the following context to summarize yesterday's wins and today's starting focus.\n\n"
            f"Recent Git Commits:\n{git_log}\n\n"
            f"Task Status:\n{task_status}\n\n"
            "Style: Human-like, empathetic, professional yet warm. Keep it under 150 words. "
            "Start with 'Good morning.' or 'Welcome back.'"
        )
        
        briefing = await call_llm(prompt, max_tokens=512)
        return {"briefing": briefing}

    except Exception as e:
        return {"briefing": f"Could not generate briefing: {str(e)}"}

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🔌 Client connected to WebSocket")
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Handle Actions (like Apply Fix from Diff Modal)
            if message_data.get("type") == "apply_fix":
                # ... existing ...
                continue

            # --- Smart-Commit Summary (Phase AA) ---
            if message_data.get("type") == "summarize_session":
                # For demo, comparing "current session" usage or just asking for a summary of recent file changes
                # Since we don't strictly track all diffs in memory yet, 
                # we can ask the LLM to summarize the *recent actions* stored in conversation context?
                # Or if we have a list of modified files (we don't persist this list yet).
                
                # BETTER: Just infer from the conversation context we already have!
                # + any known dirty state if we tracked it.
                
                prompt = (
                    "Based on our recent interaction and any code changes discussed, "
                    "generate a professional, bulleted 'Smart-Commit' summary. "
                    "Format it as a clean list suitable for a commit message or dev log. "
                    "Style: Titanium/Cyberpunk professional."
                )
                
                conversation_messages = [
                     {"role": "system", "content": "You are a senior dev lead. Create a concise commit summary."},
                     {"role": "user", "content": prompt}
                ]
                
                # Add recent history if available (simplified here)
                # In a real app, we'd append the last N messages of context.
                
                async with aiohttp.ClientSession() as session:
                    async with session.post(INFERENCE_URL, json={
                        "messages": conversation_messages,
                        "max_tokens": 512
                    }) as response:
                        if response.status == 200:
                            data = await response.json()
                            summary = data['choices'][0]['message']['content']
                            await websocket.send_text(json.dumps({"type": "summary", "content": summary}))
                        else:
                            await websocket.send_text(json.dumps({"error": "Failed to generate summary"}))
                continue

            user_message = message_data.get("message") or message_data.get("content") or ""
            active_file = message_data.get("active_file")

            if not user_message:
                continue

            # --- Slash Command Handling (Phase AO) ---
            if user_message.startswith("/"):
                command = user_message.split(" ")[0].lower()
                
                if command == "/explain" and active_file:
                    try:
                        async with aiofiles.open(active_file, mode='r') as f:
                            content = await f.read()
                        user_message = f"Summarize and explain the current file ({os.path.basename(active_file)}):\n\n```\n{content}\n```"
                    except:
                        user_message = "Summarize the open file. (Error reading file context)"
                
                elif command == "/test" and active_file:
                    # Try to get the function at the top of the file or current context
                    # In a real app, we'd use the user's actual cursor line if sent.
                    # For now, let's grab the file content and ask for tests.
                    try:
                        async with aiofiles.open(active_file, mode='r') as f:
                            content = await f.read()
                        user_message = f"Generate comprehensive unit tests for the functions in this file ({os.path.basename(active_file)}):\n\n```\n{content}\n```"
                    except:
                        user_message = "Generate unit tests for the current file."

                elif command == "/optimize":
                    user_message = (
                        "Suggest M3 Max-specific performance tweaks and optimizations for this project. "
                        "Focus on Metal acceleration, vectorization (SIMD), and memory management."
                    )
                
            # Context Injection
            context_str = ""
            try:
                # 1. Codebase Search
                relevant_chunks = indexer.search(user_message, top_k=2)
                if relevant_chunks:
                    context_blocks = []
                    for res, score in relevant_chunks:
                        if score > 0.3:
                            context_blocks.append(f"File: {res.get('path', 'unknown')}\nContent:\n{res.get('content', '')}")
                    if context_blocks:
                        context_str += "\n\nRelevant Local Code Context:\n" + "\n---\n".join(context_blocks)
                
                # 2. Memory Search
                if memory_db:
                    memory_hits = memory_db.search(user_message, n_results=1)
                    if memory_hits:
                        context_str += "\n\nRecall from Previous Successes (Memory):\n"
                        for hit in memory_hits:
                             context_str += f"```\n{hit['code']}\n```\n"

            except Exception as e:
                print(f"Context error: {e}")

            system_prompt_base = (
                "You are OpenClaw, a high-performance AI assistant.\n"
                "You have access to the user's M3 Max hardware specs.\n"
                "If writing code, ensure it is correct and efficient.\n"
            )
            
            # Phase AG: Use Cached Context
            # We assume the inference server caches the prefix if we send the exact same system message start?
            # Actually, llama.cpp caching works by hashing the prompt prefix.
            # So we must ensure the `system` message is identical to the warmup message.
            
            # Reconstruct the exact string used in warmup
            base_system_msg = (
                "You are OpenClaw. Always Keep this Project Context in mind:\n"
                f"{GLOBAL_PROJECT_CONTEXT}\n\n"
                "You are a high-performance AI assistant optimized for M3 Max.\n"
                "If writing code, ensure it is correct, efficient, and fits the Titanium/Industrial design.\n"
            )
            
            system_message_content = base_system_msg
            if context_str:
                 # Append dynamic context AFTER the fixed cached prefix
                 system_message_content += f"\n\nDynamic Context:\n{context_str}"
            
            # Compiler Self-Correction Loop
            MAX_RETRIES = 2
            import re
            
            conversation_messages = [
                {"role": "system", "content": system_message_content},
                {"role": "user", "content": user_message}
            ]
            
            final_response_content = ""

            async with aiohttp.ClientSession() as session:
                for attempt in range(MAX_RETRIES + 1):
                    # Notify Status
                    if attempt > 0:
                        await websocket.send_text(json.dumps({"status": f"Compiler Error Detected. Self-Correcting (Attempt {attempt}/{MAX_RETRIES})..."}))
                    else:
                        await websocket.send_text(json.dumps({"status": "Thinking & Verifying..."}))

                    payload = {
                        "messages": conversation_messages,
                        "stream": False, 
                        "max_tokens": 1024
                    }
                    
                    try:
                        async with session.post(INFERENCE_URL, json=payload) as response:
                            if response.status != 200:
                                await websocket.send_text(json.dumps({"error": f"Inference error: {response.status}"}))
                                break 
                            
                            resp_json = await response.json()
                            if not resp_json or not resp_json.get('choices'):
                                await websocket.send_text(json.dumps({"error": "Invalid response"}))
                                break
                            
                            content = resp_json['choices'][0]['message']['content']
                            conversation_messages.append({"role": "assistant", "content": content})

                            # Code Verification
                            code_blocks = re.findall(r"```(c|python)\n(.*?)```", content, re.DOTALL)
                            compile_error = None
                            
                            if code_blocks:
                                all_passed = True
                                for lang, code in code_blocks:
                                    success, error = compiler_agent.check_code(code, lang)
                                    if not success:
                                        compile_error = error
                                        all_passed = False
                                        break
                                
                                if all_passed and memory_db:
                                    for lang, code in code_blocks:
                                        memory_db.add(code, lang, tags=["compiled_success"])
                                        # Phase AK: Save Snapshot on successful build
                                        # We need to know which file this code belongs to.
                                        # Compiler loop often has this in the prompt or context.
                                        # For now, if we detect a // file: marker, use it.
                                        file_match = re.search(r"//\s*file:\s*(.+)", code)
                                        if file_match:
                                            target_path = file_match.group(1).strip()
                                            save_snapshot(target_path, code)
                            
                            if compile_error and attempt < MAX_RETRIES:
                                print(f"Verification Failed: {compile_error}")
                                conversation_messages.append({"role": "system", "content": f"The code you provided failed to compile/lint with error:\n{compile_error}\nPlease fix it."})
                                continue 
                            
                            final_response_content = content
                            break 

                    except Exception as e:
                        print(f"Loop Error: {e}")
                        await websocket.send_text(json.dumps({"error": str(e)}))
                        break
                
                # Stream Final Response
                if final_response_content:
                    chunk_size = 20
                    for i in range(0, len(final_response_content), chunk_size):
                        await websocket.send_text(json.dumps({"chunk": final_response_content[i:i+chunk_size]}))
                        await asyncio.sleep(0.005)
                    
                    await websocket.send_text(json.dumps({"done": True}))
                else:
                    if not compile_error: 
                         pass # Error already sent

    except Exception as e:
        print(f"WebSocket Error: {e}")

# --- Terminal Endpoint (Phase W) ---
import re

async def run_safe_command(command: str, websocket: WebSocket):
    # strict regex filter
    # prevent sensitive commands
    DANGEROUS_PATTERNS = [
        r"rm\s+.*", r"mv\s+.*", r"sudo\s+.*", r"dd\s+.*", r":\(\)\s*\{", 
        r"mkfs", r"shutdown", r"reboot", r"wget\s+.*", r"curl\s+.*" 
    ]
    
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, command):
            await websocket.send_text(f"Error: Command '{command}' is not allowed for security reasons.")
            return

    try:
        # Phase AR: Wrap C binary execution with leaks on macOS
        original_command = command
        if command.startswith("./"):
            binary_name = command.split()[0]
            if os.path.isfile(binary_name) and os.access(binary_name, os.X_OK):
                # We wrap it with MallocStackLogging to get line numbers
                command = f"MallocStackLogging=1 leaks --atExit --quiet -- {command}"

        # Use simple shell execution
        process = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        # Phase BA: Register process with Deadlock Detector
        from deadlock_detector import detector
        if detector:
            detector.register_process(process.pid, command)

        async def stream_output(stream, label):
            from compiler import compiler_agent
            while True:
                line = await stream.readline()
                if not line:
                    break
                try:
                    text = line.decode('utf-8')
                except:
                    text = line.decode('latin-1')
                
                # Detect Leak
                leak_info = compiler_agent.parse_leak(text)
                if leak_info:
                    # Send special JSON message for the UI Modal
                    await websocket.send_text(json.dumps({
                        "type": "memory_leak",
                        "data": leak_info
                    }))
                
                await websocket.send_text(text)

        await asyncio.gather(
            stream_output(process.stdout, "stdout"),
            stream_output(process.stderr, "stderr")
        )
        
        await process.wait()
        
        # Phase AZ: Track execution result for Observer
        from observer import observer
        if observer:
             # We assume if it's a compile/run, the command contains the file name or is relative
             # This is a heuristic for detecting if the SAME code run keeps failing
             observer.track_execution(command, "Exit Code: " + str(process.returncode))

        # Phase BA: Unregister from Deadlock Detector
        from deadlock_detector import detector
        if detector:
            detector.unregister_process(process.pid)

        await websocket.send_text(f"\nProcess finished with exit code {process.returncode}")

    except Exception as e:
        await websocket.send_text(f"Execution Error: {str(e)}")


@app.websocket("/ws/terminal")
async def terminal_socket(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text("Titanium Terminal Online. v1.0.0\n")
    
    try:
        while True:
            data = await websocket.receive_text()
            if data:
                await run_safe_command(data, websocket)
    except Exception as e:
        print(f"Terminal Socket Closed: {e}")

@app.websocket("/ws/memory")
async def websocket_memory(websocket: WebSocket):
    await websocket.accept()
    print("🧠 Memory Visualizer Connected")
    
    async def send_event(data):
        try:
            await websocket.send_json(data)
        except:
            pass

    # For now, we use the mock tracer to demonstrate the UI grid
    # In a real scenario, this would be triggered by a specific binary run command
    trace_task = asyncio.create_task(mock_memory_trace(send_event))
    
    try:
        while True:
            await websocket.receive_text() # Keep connection alive
    except WebSocketDisconnect:
        trace_task.cancel()
        print("🧠 Memory Visualizer Disconnected")

if __name__ == "__main__":
    uvicorn.run("gateway:app", host="0.0.0.0", port=8000, reload=True)
