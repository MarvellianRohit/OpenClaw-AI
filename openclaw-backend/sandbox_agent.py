
import os
import subprocess
import uuid
import asyncio
import aiofiles
import shutil
import json
from typing import Optional, Tuple, Dict, Any

class SandboxAgent:
    def __init__(self, call_llm_fn=None):
        self.call_llm_fn = call_llm_fn
        self.temp_dir_base = "/tmp/openclaw_sandbox"
        if not os.path.exists(self.temp_dir_base):
            os.makedirs(self.temp_dir_base)

    async def run_in_sandbox(self, code: str, language: str, test_code: Optional[str] = None) -> Dict[str, Any]:
        """
        Runs code in an isolated environment. 
        Prefers Docker, falls back to local isolated process if Docker fails or is unavailable.
        """
        run_id = str(uuid.uuid4())[:8]
        sandbox_dir = os.path.join(self.temp_dir_base, run_id)
        os.makedirs(sandbox_dir, exist_ok=True)

        try:
            # 1. Write Code Files
            filename = "main.py" if language == "python" else "main.c"
            filepath = os.path.join(sandbox_dir, filename)
            
            async with aiofiles.open(filepath, mode='w') as f:
                await f.write(code)

            # 1b. Write Test Files (if provided)
            # If no test code is provided, we just check compilation/syntax
            if test_code:
                test_filename = "tests.py" if language == "python" else "tests.c"
                test_filepath = os.path.join(sandbox_dir, test_filename)
                async with aiofiles.open(test_filepath, mode='w') as f:
                    await f.write(test_code)

            # 2. Select Runner
            # Check if Docker is available
            has_docker = await self._check_docker()
            
            if has_docker:
                return await self._run_docker(sandbox_dir, language, run_id, has_tests=bool(test_code))
            else:
                return await self._run_local(sandbox_dir, language, has_tests=bool(test_code))

        except Exception as e:
            return {"status": "error", "error": str(e)}
        finally:
            # Cleanup
            if os.path.exists(sandbox_dir):
                shutil.rmtree(sandbox_dir)

    async def smart_fix(self, code: str, language: str, test_code: Optional[str] = None, max_retries=3, broadcast_fn=None) -> Dict[str, Any]:
        """
        The Auto-Correction Loop.
        """
        current_code = code
        attempt = 1
        
        while attempt <= max_retries:
            print(f"🔄 Sandbox Attempt {attempt}/{max_retries}...")
            if broadcast_fn:
                await broadcast_fn("roadmap_step", {
                    "step": f"Simulating Fix (Attempt {attempt})",
                    "status": "active",
                    "logs": f"Preparing sandbox environment for attempt {attempt}..."
                })

            result = await self.run_in_sandbox(current_code, language, test_code)
            
            if result["status"] == "success":
                if broadcast_fn:
                    await broadcast_fn("roadmap_step", {
                        "step": "Verification",
                        "status": "complete",
                        "logs": result["output"]
                    })
                return {
                    "status": "success", 
                    "code": current_code, 
                    "logs": result["output"],
                    "attempts": attempt
                }
            
            # If failed, ask LLM to fix
            error_msg = result.get("error") or result.get("output")
            print(f"❌ Attempt {attempt} Failed: {error_msg[:100]}...")
            
            if broadcast_fn:
                 await broadcast_fn("roadmap_step", {
                    "step": f"Analyzing Error (Attempt {attempt})",
                    "status": "error",
                    "logs": f"Execution failed:\n{error_msg}\n\nSelf-correcting..."
                })

            if not self.call_llm_fn:
                return {"status": "error", "error": "LLM not connected for self-correction", "last_code": current_code}

            prompt = f"""
            The following {language} code failed to compile or pass tests in the sandbox.
            
            Code:
            ```
            {current_code}
            ```
            
            Error/Output:
            ```
            {error_msg}
            ```
            
            Fix the code to resolve the error. Return ONLY the fixed code block.
            """
            
            fixed_code = await self.call_llm_fn(prompt)
            # Strip markdown
            if "```" in fixed_code:
                lines = fixed_code.split('\n')
                # Simple strip
                fixed_code = "\n".join([l for l in lines if not l.strip().startswith("```")])
            
            current_code = fixed_code.strip()
            attempt += 1
            
        return {"status": "failure", "error": "Max retries exceeded", "last_code": current_code}

    async def _check_docker(self):
        try:
            proc = await asyncio.create_subprocess_exec("docker", "--version", stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL)
            await proc.wait()
            return proc.returncode == 0
        except:
            return False

    async def _run_docker(self, workdir: str, language: str, run_id: str, has_tests: bool) -> Dict[str, Any]:
        # Create Dockerfile
        image = "python:3.11-slim" if language == "python" else "gcc:latest"
        
        cmd = ""
        if language == "python":
            cmd = "python3 tests.py" if has_tests else "python3 main.py"
        else:
            # C
            if has_tests:
                cmd = "gcc tests.c -o tests && ./tests"
            else:
                cmd = "gcc main.c -o main && ./main"

        dockerfile = f"""
        FROM {image}
        WORKDIR /app
        COPY . .
        CMD {cmd}
        """
        
        async with aiofiles.open(os.path.join(workdir, "Dockerfile"), mode='w') as f:
            await f.write(dockerfile)
            
        # Build
        tag = f"openclaw_box_{run_id}"
        build_proc = await asyncio.create_subprocess_exec(
            "docker", "build", "-t", tag, workdir,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await build_proc.communicate()
        
        if build_proc.returncode != 0:
            return {"status": "build_error", "output": stderr.decode()}
            
        # Run
        run_proc = await asyncio.create_subprocess_exec(
            "docker", "run", "--rm", "--network", "none", "--timeout", "10", tag,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await run_proc.communicate()
        
        # Cleanup Image
        asyncio.create_task(self._cleanup_docker_image(tag))
        
        if run_proc.returncode == 0:
            return {"status": "success", "output": stdout.decode()}
        else:
            return {"status": "run_error", "output": stderr.decode() or stdout.decode()}

    async def _cleanup_docker_image(self, tag):
        proc = await asyncio.create_subprocess_exec("docker", "rmi", tag, stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL)
        await proc.wait()

    async def _run_local(self, workdir: str, language: str, has_tests: bool) -> Dict[str, Any]:
        # Simpler local run
        cmd = []
        if language == "python":
            target = "tests.py" if has_tests else "main.py"
            cmd = ["python3", target]
        else:
            target = "tests.c" if has_tests else "main.c"
            output = os.path.join(workdir, "runner")
            compile_cmd = ["gcc", target, "-o", output]
            
            # Compile
            c_proc = await asyncio.create_subprocess_exec(
                *compile_cmd, cwd=workdir, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )
            _, c_err = await c_proc.communicate()
            if c_proc.returncode != 0:
                return {"status": "compile_error", "output": c_err.decode()}
            
            cmd = [output]

        # Run
        try:
            run_proc = await asyncio.create_subprocess_exec(
                *cmd, cwd=workdir, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await run_proc.communicate()
            
            if run_proc.returncode == 0:
                return {"status": "success", "output": stdout.decode()}
            else:
                return {"status": "run_error", "output": stderr.decode()}
        except Exception as e:
            return {"status": "error", "error": str(e)}

# Global instance
sandbox_agent: Optional[SandboxAgent] = None
