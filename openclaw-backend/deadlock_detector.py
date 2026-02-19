import asyncio
import psutil
import time
import json
import aiohttp
from typing import Dict, Any, Optional, List

class DeadlockDetector:
    def __init__(self, broadcast_fn, call_llm_fn):
        self.broadcast_fn = broadcast_fn
        self.call_llm_fn = call_llm_fn
        self.monitored_processes: Dict[int, Dict[str, Any]] = {} 
        self.is_running = False
        self.check_interval = 2 # seconds
        self.stall_threshold = 10 # seconds

    async def start(self):
        self.is_running = True
        print("🛡️ Deadlock Detector Active.")
        asyncio.create_task(self.monitor_loop())

    def register_process(self, pid: int, command: str, file_context: Optional[str] = None):
        """Adds a process to the watch list."""
        self.monitored_processes[pid] = {
            "command": command,
            "file_context": file_context,
            "start_time": time.time(),
            "last_cpu_activity": time.time(),
            "detected": False
        }

    def unregister_process(self, pid: int):
        if pid in self.monitored_processes:
            del self.monitored_processes[pid]

    async def monitor_loop(self):
        while self.is_running:
            try:
                pids_to_remove = []
                for pid, info in list(self.monitored_processes.items()):
                    if info["detected"]:
                        continue

                    try:
                        p = psutil.Process(pid)
                        if not p.is_running():
                            pids_to_remove.append(pid)
                            continue

                        cpu_percent = p.cpu_percent(interval=0.1)
                        is_stalled = cpu_percent < 0.1
                        
                        now = time.time()
                        if not is_stalled:
                            info["last_cpu_activity"] = now
                        else:
                            stall_duration = now - info["last_cpu_activity"]
                            if stall_duration > self.stall_threshold:
                                # Check for locks (e.g., open files)
                                locks = p.open_files()
                                if locks:
                                    await self.handle_deadlock(pid, info)
                                    info["detected"] = True

                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pids_to_remove.append(pid)

                for pid in pids_to_remove:
                    self.unregister_process(pid)

            except Exception as e:
                print(f"⚠️ Deadlock Detector Error: {e}")
            
            await asyncio.sleep(self.check_interval)

    async def handle_deadlock(self, pid: int, info: Dict[str, Any]):
        """Triggers AI analysis and notifies the frontend."""
        command = info["command"]
        file_context = info["file_context"]
        
        print(f"🚨 Potential Deadlock Detected in PID {pid} ({command})")
        
        analysis_prompt = (
            f"A potential deadlock has been detected in the live execution of: `{command}`.\n"
            f"The process is consuming 0% CPU for >10s while holding resources.\n"
        )
        
        if file_context:
            analysis_prompt += f"Relevant Source Context:\n```\n{file_context}\n```\n"
            
        analysis_prompt += (
            "Analyze these specific lines for circular waits, missing lock releases (mutex/semaphores), "
            "or shared resource contention and prepare a concise diagnosis and fix."
        )

        diagnosis = await self.call_llm_fn(analysis_prompt)
        
        await self.broadcast_fn({
            "type": "intervention_required",
            "subtype": "deadlock",
            "pid": pid,
            "command": command,
            "diagnosis": diagnosis,
            "severity": "critical"
        })

# Global instance to be managed by gateway.py
detector: Optional[DeadlockDetector] = None
