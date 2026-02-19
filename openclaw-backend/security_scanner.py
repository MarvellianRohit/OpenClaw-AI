import os
import subprocess
import json
from typing import List, Dict, Any, Optional

class SecurityScanner:
    def __init__(self, call_llm_fn):
        self.call_llm_fn = call_llm_fn

    async def scan_file(self, filepath: str) -> Dict[str, Any]:
        """Performs a background scan of a file for vulnerabilities."""
        if not os.path.exists(filepath):
            return {"status": "error", "error": "File not found"}

        with open(filepath, 'r') as f:
            content = f.read()

        # Step 1: Basic Static Analysis (Placeholder for cppcheck/bandit)
        findings = []
        if filepath.endswith(".c"):
            if "gets(" in content:
                findings.append({
                    "type": "security",
                    "severity": "high",
                    "title": "Buffer Overflow (gets)",
                    "description": "The 'gets()' function is dangerous as it does not check buffer limits. Use 'fgets()' instead.",
                    "line": content.count("\n", 0, content.find("gets(")) + 1
                })
            if "scanf(\"%s\"" in content:
                findings.append({
                    "type": "security",
                    "severity": "medium",
                    "title": "Unbounded Input",
                    "description": "Using scanf with %s without length limits can lead to memory corruption.",
                    "line": content.count("\n", 0, content.find("scanf(\"%s\"")) + 1
                })

        # Step 2: LLM-Assisted Audit (Strategic)
        prompt = (
            f"Audit the following code for security vulnerabilities and logical errors.\n"
            f"File: {filepath}\n"
            f"Code:\n```\n{content}\n```\n\n"
            "Identify the single most critical issue. If no critical issues are found, respond with 'SAFE'.\n"
            "If issues are found, respond with a JSON object: "
            "{\"type\": \"security\", \"severity\": \"high|medium\", \"title\": \"...\", \"description\": \"...\", \"line\": 0}.\n"
            "Adopt a helpful, peer-like tone in the description. Only return the JSON object or 'SAFE'."
        )

        try:
            response = await self.call_llm_fn(prompt, max_tokens=256)
            if "SAFE" not in response:
                import re
                json_match = re.search(r"\{.*\}", response, re.DOTALL)
                if json_match:
                    ai_finding = json.loads(json_match.group(0))
                    findings.append(ai_finding)
        except Exception as e:
            print(f"Security AI error: {e}")

        return {
            "status": "success",
            "findings": findings,
            "filepath": filepath,
            "timestamp": os.path.getmtime(filepath)
        }

# Global instance managed by gateway.py
security_scanner: Optional[SecurityScanner] = None
