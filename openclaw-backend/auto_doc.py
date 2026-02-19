import os
import json
import asyncio
from pathlib import Path
import aiofiles

IGNORE_DIRS = {".git", "__pycache__", "node_modules", ".next", ".gemini", "venv", "env", "dist", "build", "snapshots"}
IGNORE_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".ico", ".pdf", ".zip", ".tar", ".gz", ".pyc", ".o", ".a"}

async def scan_codebase(root_path: str):
    """Scans the codebase for high-level structure and entry points."""
    code_summary = []
    entry_points = []
    
    for root, dirs, files in os.walk(root_path):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            file_path = Path(root) / file
            if file_path.suffix in IGNORE_EXTS:
                continue
                
            rel_path = os.path.relpath(file_path, root_path)
            
            # Identify potential entry points
            if file in {"main.c", "app.py", "gateway.py", "index.tsx", "page.tsx", "server.js"}:
                entry_points.append(rel_path)
            
            # Read first few lines for context
            try:
                async with aiofiles.open(file_path, mode='r', errors='ignore') as f:
                    content = await f.read(500)
                    code_summary.append(f"File: {rel_path}\nSnippet: {content[:300]}...")
            except:
                continue
                
    return entry_points, code_summary

async def generate_readme(root_path: str, llm_callback):
    """Orchestrates the README generation process."""
    entry_points, code_summary = await scan_codebase(root_path)
    
    prompt = f"""
I need you to write a professional, high-impact README.md for an AI-powered project called 'OpenClaw AI'.
The project is optimized for Apple Silicon M3 Max using Metal acceleration.

Entry Points identified: {', '.join(entry_points)}

Codebase Snippets:
{' --- '.join(code_summary[:20])}

Requirements for the README:
1. Professional Title and Tagline.
2. Installation Steps (include venv/npm setup).
3. Technical Architecture Overview.
4. Hardware Requirements (Emphasize M3 Max optimization and Metal GPU support).
5. Development status (Internal high-performance tool).

Write the full README.md content below in Markdown format:
"""

    return await llm_callback(prompt)
