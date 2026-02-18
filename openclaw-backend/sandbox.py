
import os
import re

class SecuritySandbox:
    def __init__(self, allowed_dirs=None):
        if allowed_dirs is None:
            # Default to current working directory and subdirectories
            self.allowed_dirs = [os.getcwd()]
        else:
            self.allowed_dirs = [os.path.abspath(d) for d in allowed_dirs]

        self.command_blacklist = [
            "rm -rf", "mkfs", "dd", ":(){:|:&};:", "wget", "curl", 
            "nc", "bash -i", "/dev/tcp", "sudo", "su "
        ]
        
        # Regex for dangerous patterns
        self.dangerous_patterns = [
            r"rm\s+-[rR]*f",     # rm -rf
            r">\s*/dev/sd",      # writing to device
            r"\|\s*bash",        # pipe to bash
            r";\s*sudo",         # sudo injection
        ]

    def is_safe_path(self, path: str) -> bool:
        """Check if path is within allowed directories."""
        abs_path = os.path.abspath(path)
        return any(abs_path.startswith(d) for d in self.allowed_dirs)

    def is_safe_command(self, command: str) -> bool:
        """Check if command contains blacklisted patterns."""
        # Check explicit blacklist
        for ban in self.command_blacklist:
            if ban in command:
                return False

        # Check regex
        for pattern in self.dangerous_patterns:
            if re.search(pattern, command):
                return False
                
        return True

    def validate_write(self, path: str) -> bool:
        """Validate if we can write to this path."""
        if not self.is_safe_path(path):
            raise PermissionError(f"Access denied: Path '{path}' is outside allowed directories.")
        if path.endswith(".py") or path.endswith(".c"):
            return True # Allowed code files
        # Maybe block editing system files or hidden files
        if "/." in path:
            print(f"Warning: Attempting to write to hidden file {path}")
            return True # Allow for now (.gitignore etc)
        return True

sandbox = SecuritySandbox()
