import os
import shutil
import time
from typing import List, Dict, Any

SNAPSHOT_DIR = os.path.join(os.getcwd(), ".claw_history")

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

import difflib

def find_deleted_code(filepath: str, query: str = "") -> List[Dict[str, Any]]:
    """
    Analyzes snapshots to find code blocks that were deleted.
    Returns a list of deletion events matching the query.
    """
    snapshots = list_snapshots(filepath)
    print(f"DEBUG: Found {len(snapshots)} snapshots for {filepath}", flush=True)
    if len(snapshots) < 2:
        return []

    # Sort: Oldest to Newest for diffing
    snapshots.sort(key=lambda x: x["timestamp"])
    
    deleted_blocks = []
    
    for i in range(len(snapshots) - 1):
        prev = snapshots[i]
        curr = snapshots[i+1]
        
        prev_content = get_snapshot_content(filepath, prev["timestamp"]).splitlines()
        curr_content = get_snapshot_content(filepath, curr["timestamp"]).splitlines()
        
        print(f"DEBUG: Diffing {prev['timestamp']} vs {curr['timestamp']}", flush=True)
        diff = difflib.ndiff(prev_content, curr_content)
        
        current_block = []
        in_deletion = False
        
        for line in diff:
            # print(f"DEBUG LINE: {line.strip()}")
            if line.startswith("- "):
                clean_line = line[2:]
                current_block.append(clean_line)
                in_deletion = True
            elif line.startswith("  ") or line.startswith("+ "):
                if in_deletion:
                    # Block finished
                    block_text = "\n".join(current_block)
                    print(f"DEBUG: Found deleted block: {block_text}", flush=True)
                    if query.lower() in block_text.lower():
                        print(f"DEBUG: MATCHED query '{query}'", flush=True)
                        deleted_blocks.append({
                            "timestamp": curr["timestamp"], # When it was removed (roughly)
                            "content": block_text,
                            "lines": len(current_block)
                        })
                    current_block = []
                    in_deletion = False
                    
        # Catch end of file deletion
        if in_deletion:
             block_text = "\n".join(current_block)
             if query.lower() in block_text.lower():
                deleted_blocks.append({
                    "timestamp": curr["timestamp"],
                    "content": block_text,
                    "lines": len(current_block)
                })

    # Return most recent deletions first
    return sorted(deleted_blocks, key=lambda x: x["timestamp"], reverse=True)
