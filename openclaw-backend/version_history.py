import os
import shutil
import time
from typing import List, Dict, Any

SNAPSHOT_DIR = os.path.join(os.getcwd(), "snapshots")

def save_snapshot(filepath: str, content: str):
    """Saves a timestamped snapshot of the given file content."""
    if not os.path.exists(SNAPSHOT_DIR):
        os.makedirs(SNAPSHOT_DIR)
    
    # Create a safe directory name for the file
    # Replace slashes and dots to avoid path issues
    safe_name = filepath.replace("/", "_").replace(".", "_").replace(" ", "_")
    file_snapshot_dir = os.path.join(SNAPSHOT_DIR, safe_name)
    
    if not os.path.exists(file_snapshot_dir):
        os.makedirs(file_snapshot_dir)
    
    timestamp = int(time.time())
    snapshot_path = os.path.join(file_snapshot_dir, f"{timestamp}.bak")
    
    with open(snapshot_path, "w") as f:
        f.write(content)
    
    print(f"📸 Snapshot saved: {snapshot_path}")
    return timestamp

def list_snapshots(filepath: str) -> List[Dict[str, Any]]:
    """Lists metadata for all snapshots of a specific file."""
    safe_name = filepath.replace("/", "_").replace(".", "_").replace(" ", "_")
    file_snapshot_dir = os.path.join(SNAPSHOT_DIR, safe_name)
    
    if not os.path.exists(file_snapshot_dir):
        return []
    
    snapshots = []
    for f in os.listdir(file_snapshot_dir):
        if f.endswith(".bak"):
            timestamp = f.replace(".bak", "")
            path = os.path.join(file_snapshot_dir, f)
            stats = os.stat(path)
            snapshots.append({
                "timestamp": int(timestamp),
                "size": stats.st_size,
                "filepath": filepath
            })
    
    # Sort by timestamp descending (newest first)
    return sorted(snapshots, key=lambda x: x["timestamp"], reverse=True)

def get_snapshot_content(filepath: str, timestamp: int) -> str:
    """Retrieves the content of a specific snapshot."""
    safe_name = filepath.replace("/", "_").replace(".", "_").replace(" ", "_")
    snapshot_path = os.path.join(SNAPSHOT_DIR, safe_name, f"{timestamp}.bak")
    
    if not os.path.exists(snapshot_path):
        return ""
    
    with open(snapshot_path, "r") as f:
        return f.read()
