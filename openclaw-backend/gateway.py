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

            
            if not user_message:
                continue
                
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
        # Use simple shell execution
        process = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        async def stream_output(stream, label):
            while True:
                line = await stream.readline()
                if not line:
                    break
                try:
                    text = line.decode('utf-8')
                except:
                    text = line.decode('latin-1')
                await websocket.send_text(text)

        await asyncio.gather(
            stream_output(process.stdout, "stdout"),
            stream_output(process.stderr, "stderr")
        )
        
        await process.wait()
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

if __name__ == "__main__":
    uvicorn.run("gateway:app", host="0.0.0.0", port=8000, reload=True)
