
import os
import subprocess
import tempfile
import json
import asyncio
from typing import List, Dict, Any

class LintEngine:
    def __init__(self):
        pass

    async def lint_code(self, code: str, language: str) -> List[Dict[str, Any]]:
        """
        Lints code and returns a list of errors/warnings.
        Format: [{ line: int, column: int, message: str, severity: str, source: str }]
        """
        if language == "python":
            return await self._lint_python(code)
        elif language == "c" or language == "cpp":
            return await self._lint_c(code)
        return []

    async def _lint_python(self, code: str) -> List[Dict[str, Any]]:
        results = []
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as temp:
            temp.write(code)
            temp_path = temp.name

        try:
            # Run pylint with JSON output
            # Ensure pylint is installed in venv
            process = await asyncio.create_subprocess_exec(
                "pylint",
                "--output-format=json",
                "--disable=C0114,C0115,C0116", # Ignore missing module/class/function docstrings for brevity
                temp_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            
            if stdout:
                try:
                    data = json.loads(stdout.decode())
                    for item in data:
                        results.append({
                            "line": item["line"],
                            "column": item["column"] + 1,
                            "message": f"{item['message-id']}: {item['message']}",
                            "severity": "error" if item["type"] in ["error", "fatal"] else "warning",
                            "source": "pylint"
                        })
                except json.JSONDecodeError:
                    pass
        except Exception as e:
            print(f"Lint Error: {e}")
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
        return results

    async def _lint_c(self, code: str) -> List[Dict[str, Any]]:
        results = []
        with tempfile.NamedTemporaryFile(mode="w", suffix=".c", delete=False) as temp:
            temp.write(code)
            temp_path = temp.name
            
        try:
            # Run cppcheck with template output for easy parsing
            # Format: {line},{severity},{message}
            process = await asyncio.create_subprocess_exec(
                "cppcheck",
                "--enable=all",
                "--inconclusive",
                "--template={line},{severity},{message}",
                temp_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            # cppcheck writes to stderr by default
            stdout, stderr = await process.communicate()
            
            output = stderr.decode()
            for line in output.split('\n'):
                if not line.strip(): continue
                parts = line.split(',', 2)
                if len(parts) == 3:
                    try:
                        lineno = int(parts[0])
                        severity = parts[1]
                        message = parts[2]
                        
                        # Map severity
                        monaco_severity = "info"
                        if "error" in severity: monaco_severity = "error"
                        elif "warning" in severity: monaco_severity = "warning"
                        
                        results.append({
                            "line": lineno,
                            "column": 1,
                            "message": message,
                            "severity": monaco_severity,
                            "source": "cppcheck"
                        })
                    except ValueError:
                        pass

        except Exception as e:
            print(f"Lint Error (C): {e}")
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

        return results

lint_engine = LintEngine()
