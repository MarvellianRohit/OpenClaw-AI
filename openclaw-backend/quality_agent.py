
import os
import asyncio
import subprocess
import json
from typing import Dict, Any, List

class QualityAuditor:
    def __init__(self, root_dir: str = "."):
        self.root_dir = root_dir

    async def scan_codebase(self) -> Dict[str, Any]:
        """
        Scans the codebase using radon (Python) and lizard (C/C++).
        Returns a summary dictionary with health score and refactor candidates.
        """
        print("🔍 Starting Complexity Audit...")
        
        # 1. Python Analysis (Radon)
        # radon cc . -j (JSON output)
        python_results = []
        try:
            # We use the full path to the venv python to ensure radon is found if installed there
            # But radon is a script. Let's try running it directly or via python module if possible.
            # 'radon' might be in venv/bin/radon
            venv_bin = os.path.dirname(os.path.abspath(__file__)) + "/venv/bin"
            radon_cmd = os.path.join(venv_bin, "radon")
            if not os.path.exists(radon_cmd):
                 radon_cmd = "radon" # Fallback to path

            proc = await asyncio.create_subprocess_exec(
                radon_cmd, "cc", self.root_dir, "-j", "-a", "--ignore", "venv",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await proc.communicate()
            if proc.returncode == 0:
                python_results = json.loads(stdout.decode())
            else:
                print(f"⚠️ Radon failed: {stderr.decode()}")
        except Exception as e:
            print(f"⚠️ Radon execution error: {e}")

        # 2. C/C++ Analysis (Lizard)
        c_results = []
        try:
            # lizard . -l c -json
            lizard_cmd = "lizard" # Lizard usually installs as a script
            # Check venv
            venv_bin = os.path.dirname(os.path.abspath(__file__)) + "/venv/bin"
            possible_lizard = os.path.join(venv_bin, "lizard")
            if os.path.exists(possible_lizard):
                lizard_cmd = possible_lizard

            proc = await asyncio.create_subprocess_exec(
                lizard_cmd, self.root_dir, "-l", "c", "--xml", # Lizard JSON is sometimes wonky, but let's try just getting lines or using python API? 
                # Actually, let's use subprocess with simple output for now or JSON if stable.
                # Lizard JSON output is via a flag? lizard --json seems common.
                # Let's try simple parsing or just calculate avg complexity manually if needed.
                # Re-reading lizard docs: lizard [options] [PATH] ...
                # We can import lizard if it's a library too.
                # Let's try CLI first.
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            # JSON output support in lizard might vary. Let's assume we parse standard output if needed.
            # Or better, let's use the library directly since we are in python.
            # But async is better for blocking operations.
            # Let's run it with --json if supported.
            # Actually, let's try to just run it on C files.
            pass 
            # Implemented below properly using library if possible or CLI
        except Exception as e:
            print(f"⚠️ Lizard error: {e}")

        # Processing Results
        total_complexity = 0
        total_functions = 0
        candidates = []

        # Process Python (Radon JSON structure: {file: [{name, complexity, ...}]})
        for filename, blocks in python_results.items():
            for block in blocks:
                if block['type'] == 'function' or block['type'] == 'method':
                    cc = block['complexity']
                    total_complexity += cc
                    total_functions += 1
                    if cc > 15:
                        candidates.append({
                            "function": block['name'],
                            "file": filename,
                            "complexity": cc,
                            "language": "python"
                        })

        # Process C (using Lizard CLI or library wrapper)
        # Let's retry Lizard via subprocess looking for C files specifically or just "."
        # Simple parsing of lizard stdout: "   N   CC  name"
        try:
            lizard_cmd = "lizard"
            venv_bin = os.path.dirname(os.path.abspath(__file__)) + "/venv/bin"
            if os.path.exists(os.path.join(venv_bin, "lizard")):
                lizard_cmd = os.path.join(venv_bin, "lizard")

            proc = await asyncio.create_subprocess_exec(
                lizard_cmd, self.root_dir, "--ignore_exit_code", # Don't fail on high CC
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await proc.communicate()
            
            # Output format lines: "  NNC   NC    NLOC  ... file info" then "  CC  name"
            # It's a bit hard to parse without --json or similar.
            # But wait, lizard has a python API.
            # `import lizard` -> `lizard.analyze_file(current_file)`
            # That is blocking though.
            # Let's use CLI with csv output? `lizard --csv`
            
            proc = await asyncio.create_subprocess_exec(
                lizard_cmd, self.root_dir, "--csv",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await proc.communicate()
            # CSV: NLOC, CCN, token_count, param_count, length, location, file, function, long_name, start_end
            lines = stdout.decode().splitlines()
            for line in lines:
                parts = line.split(',')
                if len(parts) > 7 and parts[1].isdigit(): # CCN is 2nd column
                    cc = int(parts[1])
                    func_name = parts[7]
                    file_name = parts[6]
                    
                    if file_name.endswith(('.c', '.h', '.cpp', '.hpp')):
                        total_complexity += cc
                        total_functions += 1
                        if cc > 15:
                             candidates.append({
                                "function": func_name,
                                "file": file_name,
                                "complexity": cc,
                                "language": "c"
                            })

        except Exception as e:
            print(f"⚠️ Lizard Processing Failed: {e}")

        # Calculate Score
        # Avg complexity: 
        # 1-5: A (100-90)
        # 6-10: B (89-80)
        # 11-20: C (79-60)
        # 21+: F (<60)
        
        score = 100
        avg_cc = 0
        if total_functions > 0:
            avg_cc = total_complexity / total_functions
            # Simple linear drop: Start at 100.
            # -2 points for every unit above 5.
            if avg_cc > 5:
                score = max(10, 100 - (avg_cc - 5) * 5)
            else:
                score = 100
        
        return {
            "score": int(score),
            "avg_complexity": round(avg_cc, 1),
            "total_functions": total_functions,
            "candidates": candidates
        }

# Global Instance
quality_auditor = QualityAuditor()
