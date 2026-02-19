import os
import subprocess
import asyncio
import aiofiles
import re
from typing import Dict, Any

# We'll expect the caller to provide the call_llm function or we can use the same INFERENCE_URL logic
INFERENCE_URL = "http://localhost:11434/api/chat" # Standard for Local Ollama or our Titanium gateway

async def generate_test_content(file_path: str, code: str, call_llm_fn) -> str:
    """Uses LLM to generate a test file based on the source code."""
    filename = os.path.basename(file_path)
    extension = filename.split('.')[-1]
    
    prompt = f"""
    Generate a professional unit test suite for the following {extension} code.
    File: {filename}
    
    Rules:
    1. If Python, use 'pytest' style.
    2. If C, generate a standalone 'tests.c' that can be compiled with gcc and includes a main() function.
    3. Include edge cases.
    4. Only return the code content, no conversational text.
    5. Ensure the tests are compatible with a headless background runner.
    
    Code:
    ```
    {code}
    ```
    """
    
    try:
        test_code = await call_llm_fn(prompt)
        # Clean up Markdown artifacts if any
        test_code = re.sub(r"```[a-zA-Z]*\n", "", test_code)
        test_code = test_code.replace("```", "").strip()
        return test_code
    except Exception as e:
        print(f"Test Generation Error: {e}")
        return ""

async def run_tests(file_path: str) -> Dict[str, Any]:
    """Runs tests for a given source file and returns the status."""
    filename = os.path.basename(file_path)
    directory = os.path.dirname(file_path)
    extension = filename.split('.')[-1]
    
    test_file_path = ""
    if extension == "py":
        test_file_path = os.path.join(directory, f"test_{filename}")
        cmd = ["pytest", test_file_path, "-v"]
    elif extension == "c":
        test_file_path = os.path.join(directory, "tests.c")
        # Compile and run
        output_bin = os.path.join(directory, "test_runner")
        compile_cmd = ["gcc", test_file_path, "-o", output_bin]
        try:
            subprocess.run(compile_cmd, check=True, capture_output=True)
            cmd = [output_bin]
        except subprocess.CalledProcessError as e:
            return {"status": "fail", "error": f"Compilation failed: {e.stderr.decode()}"}
    else:
        return {"status": "ignored"}

    if not os.path.exists(test_file_path):
        return {"status": "no_tests"}

    try:
        # Run the test command
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=directory
        )
        stdout, stderr = await process.communicate()
        
        success = (process.returncode == 0)
        return {
            "status": "pass" if success else "fail",
            "output": stdout.decode() if success else stderr.decode() or stdout.decode()
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

async def auto_test_cycle(file_path: str, code: str, call_llm_fn, broadcast_fn):
    """Orchestrates the generate-then-run cycle."""
    # 1. Generate Tests
    test_content = await generate_test_content(file_path, code, call_llm_fn)
    if not test_content:
        return
    
    # 2. Save Tests
    ext = file_path.split('.')[-1]
    test_path = ""
    if ext == "py":
        test_path = os.path.join(os.path.dirname(file_path), f"test_{os.path.basename(file_path)}")
    elif ext == "c":
        test_path = os.path.join(os.path.dirname(file_path), "tests.c")
    
    if test_path:
        async with aiofiles.open(test_path, mode='w') as f:
            await f.write(test_content)
        
        # 3. Run Tests
        result = await run_tests(file_path)
        
        # 4. Broadcast
        await broadcast_fn(file_path, result)
