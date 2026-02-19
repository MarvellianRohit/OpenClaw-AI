import time
from collections import deque
from typing import Dict, List, Optional
import os

class Observer:
    def __init__(self, broadcast_fn):
        self.broadcast_fn = broadcast_fn
        # file_path -> deque of timestamps
        self.save_history: Dict[str, deque] = {}
        # file_path -> last execution output hash/summary
        self.execution_history: Dict[str, str] = {}
        
        self.time_window = 120  # 2 minutes
        self.save_threshold = 3

    async def track_save(self, filepath: str):
        """Tracks a file save event and checks for frustration threshold."""
        now = time.time()
        if filepath not in self.save_history:
            self.save_history[filepath] = deque()
        
        history = self.save_history[filepath]
        history.append(now)
        
        # Clean old entries
        while history and history[0] < now - self.time_window:
            history.popleft()
            
        if len(history) >= self.save_threshold:
            # Check if execution output has stalled (no change)
            await self.check_for_struggle(filepath)

    def track_execution(self, filepath: str, output: str):
        """Tracks the output of an execution for a specific file."""
        # Simple normalization to avoid noise (whitespace, etc)
        normalized_output = "".join(output.split())
        self.execution_history[filepath] = normalized_output

    async def check_for_struggle(self, filepath: str):
        """Logic to determine if the user is struggling and emit intervention."""
        # In a real scenario, we'd compare the current output with previous
        # For this phase, if we hit the save count, we proactively suggest
        
        function_name = self.get_likely_function(filepath)
        
        await self.broadcast_fn({
            "type": "intervention",
            "file": os.path.basename(filepath),
            "function": function_name,
            "message": f"OpenClaw noticed you've been struggling with {function_name} in {os.path.basename(filepath)}."
        })

    def get_likely_function(self, filepath: str) -> str:
        """Heuristic to find the current function being edited."""
        # Mocking for now, in a real impl we'd use tree-sitter or project_graph
        # with cursor position if available.
        return "the current logic block"

# To be initialized in gateway.py
observer: Optional[Observer] = None
