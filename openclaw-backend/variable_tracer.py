"""
variable_tracer.py

Provides the LiveTracer class which executes code and uses sys.settrace 
to yield real-time updates of local variables and their memory relationships.
"""
import sys
import time
import json
import asyncio
from typing import Dict, Any, List

class LiveTracer:
    def __init__(self, code: str, delay: float = 0.3):
        self.code = code
        self.delay = delay
        self.history: List[Dict[str, Any]] = []
        self.current_line = 0
        self.is_running = False

    def trace_lines(self, frame, event, arg):
        if event != 'line':
            return self.trace_lines

        # Capture file name to only trace our executed code, not internal Python libs
        filename = frame.f_code.co_filename
        if filename != "<string>":
             return self.trace_lines

        self.current_line = frame.f_lineno
        
        # Extract local variables
        locals_dict = frame.f_locals
        
        # Ignore standard built-ins injected by exec()
        ignored_keys = {'__builtins__', '__name__', '__doc__', '__package__'}
        
        variables = []
        for name, value in locals_dict.items():
            if name in ignored_keys:
                continue
            
            var_type = type(value).__name__
            var_id = id(value)
            
            # Create a safe string representation
            try:
                if isinstance(value, (list, dict, set)):
                    val_str = repr(value)
                else:
                    val_str = str(value)
                
                # Truncate extremely long strings
                if len(val_str) > 100:
                    val_str = val_str[:97] + "..."
            except Exception:
                val_str = "<unprintable>"
                
            variables.append({
                "name": name,
                "type": var_type,
                "value": val_str,
                "id": str(var_id)  # Stringify for JSON compatibility
            })

        step_data = {
            "line": self.current_line,
            "variables": variables
        }
        
        self.history.append(step_data)
        
        # Artificial delay to allow frontend animation
        time.sleep(self.delay)
        
        return self.trace_lines

    def execute(self):
        """Standard synchronous execution."""
        self.history = []
        self.is_running = True
        
        # Define a clean environment
        global_env = {}
        local_env = {}
        
        # Setup trace
        sys.settrace(self.trace_lines)
        try:
            # Execute the code string
            exec(self.code, global_env, local_env)
        except Exception as e:
            self.history.append({
                "line": self.current_line,
                "error": str(e),
                "variables": []
            })
        finally:
            # Remove trace
            sys.settrace(None)
            self.is_running = False
            
        return self.history

    async def execute_async_generator(self):
        """Async generator yielding steps as they happen for WebSockets."""
        self.history = []
        self.is_running = True
        
        global_env = {}
        local_env = {}
        
        _queue = asyncio.Queue()
        
        def async_trace_lines(frame, event, arg):
            if event != 'line':
                return async_trace_lines

            filename = frame.f_code.co_filename
            if filename != "<string>":
                 return async_trace_lines

            self.current_line = frame.f_lineno
            locals_dict = frame.f_locals
            ignored_keys = {'__builtins__', '__name__', '__doc__', '__package__', '_queue', 'async_trace_lines'}
            
            variables = []
            for name, value in locals_dict.items():
                if name in ignored_keys:
                    continue
                
                try:
                    val_str = repr(value) if isinstance(value, (list, dict, set)) else str(value)
                    if len(val_str) > 100: val_str = val_str[:97] + "..."
                except:
                    val_str = "<unprintable>"
                    
                variables.append({
                    "name": name,
                    "type": type(value).__name__,
                    "value": val_str,
                    "id": str(id(value))
                })

            step_data = {
                "line": self.current_line,
                "variables": variables
            }
            
            # Push to async queue (safely from sync trace callback using loop.call_soon_threadsafe if needed, 
            # but since trace is in same thread running loop, non-blocking put_nowait works)
            _queue.put_nowait(step_data)
            
            # Sleep here blocks the execution thread to slow it down
            time.sleep(self.delay)
            
            return async_trace_lines

        # Run the execution in a separate thread so it doesn't block the ASGI loop,
        # but for simplicity and guaranteeing trace works, we'll run it in a threadpool
        loop = asyncio.get_event_loop()
        
        def run_exec():
            sys.settrace(async_trace_lines)
            try:
                exec(self.code, global_env, local_env)
            except Exception as e:
                _queue.put_nowait({"line": self.current_line, "error": str(e), "variables": []})
            finally:
                sys.settrace(None)
                _queue.put_nowait({"status": "done"})

        # Start execution thread
        task = loop.run_in_executor(None, run_exec)
        
        # Yield from queue as items arrive
        while True:
            item = await _queue.get()
            if item.get("status") == "done":
                break
            yield json.dumps(item)
            
        await task
        self.is_running = False

# Simple test runner
if __name__ == "__main__":
    test_code = """
a = 10
b = 20
c = a + b
l1 = [1, 2]
l2 = l1
l1.append(3)
"""
    tracer = LiveTracer(test_code, delay=0.1)
    results = tracer.execute()
    for step in results:
        print(f"Line {step['line']}: {step['variables']}")
