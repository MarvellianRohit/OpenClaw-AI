import time
import os
import re
from typing import Callable, List
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class PeripheralMonitor(FileSystemEventHandler):
    def __init__(self, root_dir: str, callback: Callable[[str, bool, str], None]):
        self.root_dir = root_dir
        self.callback = callback
        self.observer = Observer()
        self.last_events = {} # Debounce path -> timestamp

    def start(self):
        print(f"👀 Peripheral Monitor watching: {self.root_dir}")
        self.observer.schedule(self, self.root_dir, recursive=True)
        self.observer.start()

    def stop(self):
        self.observer.stop()
        self.observer.join()

    def on_modified(self, event):
        if event.is_directory:
            return
        
        # Debounce: Ignore if same file modified within 1 second
        current_time = time.time()
        if event.src_path in self.last_events:
            if current_time - self.last_events[event.src_path] < 1.0:
                return
        self.last_events[event.src_path] = current_time

        # Check for interesting files (logs, text)
        if event.src_path.endswith((".log", ".txt", ".out", ".err")):
            self._analyze_file(event.src_path)
        else:
            # Just notify of update without error check for code files?
            # For now, let's just focus on logs/errors as per requirement.
            pass

    def _analyze_file(self, filepath: str):
        try:
            # Read last 50 lines
            with open(filepath, 'r', errors='ignore') as f:
                lines = f.readlines()
                last_lines = lines[-50:]
                content = "".join(last_lines)
            
            # Simple error detection
            has_error = False
            message = ""
            
            error_patterns = [
                r"Error:", r"Exception:", r"Fail:", r"Critical:", r"Panic:"
            ]
            
            for pattern in error_patterns:
                if re.search(pattern, content, re.IGNORECASE):
                    has_error = True
                    # Extract the line with the error
                    for line in last_lines:
                        if re.search(pattern, line, re.IGNORECASE):
                            message = line.strip()[:100] # Truncate
                            break
                    break
            
            if has_error:
                print(f"🚨 Peripheral Monitor Detected Error in {filepath}: {message}")
                # Trigger callback (which will send WebSocket message)
                self.callback(filepath, True, message)

        except Exception as e:
            print(f"Monitor Analysis Error: {e}")

# Usage Example:
# def on_change(path, has_error, msg):
#     print(f"Update: {path} Error? {has_error} Msg: {msg}")
# mon = PeripheralMonitor(".", on_change)
# mon.start()
