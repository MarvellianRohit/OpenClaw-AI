
import subprocess
import os
import tempfile
import py_compile

class CompilerAgent:
    def check_code(self, code: str, language: str):
        """
        Check if the code compiles or passes linting.
        Returns: (success: bool, error_message: str)
        """
        if language == "c":
            return self.compile_c(code)
        elif language == "python":
            return self.lint_python(code)
        # Default pass for other languages
        return True, ""

    def stream_command(self, command: str):
        """
        Runs a command and yields output line by line.
        Also checks for errors.
        """
        from sandbox import sandbox
        if not sandbox.is_safe_command(command):
            yield {"type": "error", "content": "Error: Command blocked by Security Sandbox"}
            return

        try:
            process = subprocess.Popen(
                command, 
                shell=True, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1
            )
            
            # Read stdout
            for line in process.stdout:
                yield {"type": "stdout", "content": line}
                
            # Read stderr
            for line in process.stderr:
                # Detect error line
                error_match = self.parse_error(line)
                if error_match:
                     yield {"type": "error_highlight", "line": error_match['line'], "message": error_match['message']}
                
                yield {"type": "stderr", "content": line}

            process.wait()
            yield {"type": "exit", "code": process.returncode}

        except Exception as e:
            yield {"type": "error", "content": str(e)}

    def parse_error(self, line: str):
        import re
        # GCC error format: file.c:10:5: error: ...
        match = re.search(r":(\d+):(\d+): (error|warning): (.*)", line)
        if match:
            return {"line": int(match.group(1)), "col": int(match.group(2)), "message": match.group(4)}
        
        # Python error format: File "...", line 10
        match_py = re.search(r'File ".*", line (\d+)', line)
        if match_py:
            return {"line": int(match_py.group(1)), "message": "Python Error"}
            
        if "Segmentation fault" in line:
             return {"line": 0, "message": "Segmentation Fault (Memory Access Violation)"}
             
        return None

    def run_command(self, command: str):
        from sandbox import sandbox
        if not sandbox.is_safe_command(command):
            return "Error: Command blocked by Security Sandbox", -1
        
        try:
            result = subprocess.run(command, shell=True, capture_output=True, text=True)
            return result.stdout + result.stderr, result.returncode
        except Exception as e:
            return str(e), -1

    def compile_c(self, code: str):
        # Create temp C file
        fd, temp_path = tempfile.mkstemp(suffix=".c")
        with os.fdopen(fd, 'w') as f:
            f.write(code)
        
        try:
            # Check syntax only with GCC
            result = subprocess.run(
                ["gcc", "-fsyntax-only", temp_path],
                capture_output=True,
                text=True
            )
            os.remove(temp_path)
            
            if result.returncode == 0:
                return True, ""
            else:
                return False, result.stderr
        except FileNotFoundError:
             if os.path.exists(temp_path): os.remove(temp_path)
             return True, "GCC not found, skipping check."

    def lint_python(self, code: str):
        fd, temp_path = tempfile.mkstemp(suffix=".py")
        with os.fdopen(fd, 'w') as f:
            f.write(code)

        try:
            py_compile.compile(temp_path, doraise=True)
            os.remove(temp_path)
            return True, ""
        except py_compile.PyCompileError as e:
            if os.path.exists(temp_path): os.remove(temp_path)
            return False, str(e)
        except Exception as e:
            if os.path.exists(temp_path): os.remove(temp_path)
            return False, str(e)

compiler_agent = CompilerAgent()
