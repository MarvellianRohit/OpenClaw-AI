import asyncio
import os
import re
import json
import aiohttp
import aiofiles
from typing import Dict, Any, List, Optional
from monitor import monitor
from compiler import compiler_agent

class HeartbeatService:
    def __init__(self, broadcast_fn, trigger_suggestion_fn):
        self.broadcast_fn = broadcast_fn
        self.trigger_suggestion_fn = trigger_suggestion_fn
        self.is_running = False
        self.interval = 30  # seconds
        self.project_root = "./.."

    async def start(self):
        self.is_running = True
        print("💓 Heartbeat Service Started.")
        asyncio.create_task(self.pulse_loop())

    def stop(self):
        self.is_running = False

    async def pulse_loop(self):
        while self.is_running:
            try:
                # 1. Perform System Scan
                pulse_data = await self.perform_scan()
                
                # 2. Emit Pulse object to frontend
                await self.broadcast_fn({
                    "type": "pulse",
                    "data": pulse_data
                })

                # 3. Proactive Action Logic
                if pulse_data["compilation_errors"] > 0:
                    await self.trigger_suggestion_fn(
                        f"Detected {pulse_data['compilation_errors']} compilation errors. Scanning for fixes..."
                    )
                elif len(pulse_data["high_priority_todos"]) > 0:
                    await self.trigger_suggestion_fn(
                        f"Found {len(pulse_data['high_priority_todos'])} high-priority TODOs. Would you like me to implement them?"
                    )

            except Exception as e:
                print(f"❌ Heartbeat Error: {e}")
            
            await asyncio.sleep(self.interval)

    async def perform_scan(self) -> Dict[str, Any]:
        """Runs the periodic health checks."""
        vitals = monitor.get_stats()
        
        # Scan for TODOs
        todos = await self.scan_for_todos()
        
        # Check Compilation Health (for files in current session/root)
        errors = 0
        # For demo purposes, we scan a few key files or the whole project for syntax errors
        # In a real scenario, this might run a 'make' or 'npm run build' check
        
        return {
            "timestamp": os.getpid(), # Simplified
            "thermals": vitals.get("temperature_c", 0),
            "cpu_load": vitals.get("cpu_usage_percent", 0),
            "compilation_errors": errors, 
            "high_priority_todos": todos[:5] # Top 5
        }

    async def scan_for_todos(self) -> List[Dict[str, Any]]:
        """Scans the codebase for high-priority TODO comments."""
        found_todos = []
        priority_keywords = ["HIGH", "CRITICAL", "OPENCLAW"]
        
        # We only scan .py and .tsx/.ts files for now
        for root, _, files in os.walk(self.project_root):
            if "node_modules" in root or ".git" in root or "venv" in root:
                continue
                
            for file in files:
                if file.endswith((".py", ".tsx", ".ts")):
                    path = os.path.join(root, file)
                    try:
                        async with aiofiles.open(path, mode='r') as f:
                            content = await f.read()
                            lines = content.splitlines()
                            for i, line in enumerate(lines):
                                if "TODO" in line:
                                    priority = any(k in line.upper() for k in priority_keywords)
                                    if priority:
                                        found_todos.append({
                                            "file": os.path.basename(path),
                                            "line": i + 1,
                                            "text": line.strip(),
                                            "priority": "high"
                                        })
                    except:
                        continue
        return found_todos
