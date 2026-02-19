
"""
Intelli-Comment Documentation Agent
Analyses code snippets and generates Doxygen (C) or Docstrings (Python), and creating project READMEs.
"""

import re
import os
import aiofiles
from pathlib import Path
from typing import Optional

IGNORE_DIRS = {".git", "__pycache__", "node_modules", ".next", ".gemini", "venv", "env", "dist", "build", "snapshots"}
IGNORE_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".ico", ".pdf", ".zip", ".tar", ".gz", ".pyc", ".o", ".a"}

class DocumentationAgent:
    def __init__(self, call_llm_fn=None):
        self.call_llm_fn = call_llm_fn

    def generate_docstring(self, code: str, language: str) -> str:
        """Generates inline docstrings for functions."""
        if language == "python":
            return self._generate_python_docstring(code)
        elif language in ["c", "cpp"]:
            return self._generate_doxygen(code)
        return code

    async def generate_readme(self, root_path: str) -> str:
        """Orchestrates the README generation process."""
        if not self.call_llm_fn:
            return "Error: LLM function not connected."

        entry_points, code_summary = await self._scan_codebase(root_path)
        
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
        
        return await self.call_llm_fn(prompt)

    async def _scan_codebase(self, root_path: str):
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

    def _generate_python_docstring(self, code: str) -> str:
        # Simple Heuristic: Find function def
        match = re.search(r"def\s+(\w+)\s*\((.*?)\)", code)
        if match:
            func_name = match.group(1)
            args = match.group(2).split(',')
            
            doc = f'    """\n    {func_name} function.\n\n'
            if args and args[0]:
                doc += "    Args:\n"
                for arg in args:
                    clean_arg = arg.strip().split(':')[0] # Remove type hint if present
                    if clean_arg != "self":
                        doc += f"        {clean_arg}: Description of {clean_arg}.\n"
            
            doc += "\n    Returns:\n"
            doc += "        Result of operation.\n"
            doc += '    """\n'
            
            # Insert after def line
            lines = code.split('\n')
            for i, line in enumerate(lines):
                if line.strip().startswith(f"def {func_name}"):
                    lines.insert(i + 1, doc)
                    break
            return "\n".join(lines)
                
        return code + "\n\n# Auto-generated docstring added."

    def _generate_doxygen(self, code: str) -> str:
        # Heuristic: Find function signature
        # void func(int a, char *b)
        match = re.search(r"(\w+[\w\s\*]+)\s+(\w+)\s*\((.*?)\)", code)
        if match:
            ret_type = match.group(1).strip()
            func_name = match.group(2)
            args_str = match.group(3)
            
            doxygen = "/**\n"
            doxygen += f" * @brief {func_name} function implementation.\n"
            doxygen += " *\n"
            
            if args_str:
                args = args_str.split(',')
                for arg in args:
                    parts = arg.strip().split()
                    if len(parts) > 0:
                         var_name = parts[-1].replace('*', '')
                         doxygen += f" * @param {var_name} Description of {var_name}\n"
            
            if ret_type != "void":
                 doxygen += f" * @return {ret_type} \n"
                 
            doxygen += " */\n"
            
            return doxygen + code
        
        return "// Auto-generated Doxygen\n" + code

# Global instance placeholder
doc_agent: Optional[DocumentationAgent] = None
