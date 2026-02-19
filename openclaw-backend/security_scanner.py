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

        findings = []

        # Step 1: Real Static Analysis (cppcheck / bandit)
        try:
            if filepath.endswith(".c"):
                # Run cppcheck
                result = subprocess.run(
                    ["cppcheck", "--enable=all", "--inconclusive", "--xml", filepath],
                    capture_output=True, text=True
                )
                xml_output = result.stderr # cppcheck writes XML to stderr
                if "<error " in xml_output:
                    # Simple XML parsing (avoid lxml dep for now)
                    import re
                    errors = re.findall(r'<error id="([^"]+)" severity="([^"]+)" msg="([^"]+)"', xml_output)
                    for err in errors:
                        findings.append({
                            "type": "security",
                            "severity": err[1], # error, warning, style
                            "title": err[0], # id
                            "description": err[2], # msg
                            "line": 0 # TODO: Parse line number from location tag if needed, complex regex
                        })
                        # Try to find line number
                        line_match = re.search(r'<location file=".*" line="(\d+)"', xml_output)
                        if line_match:
                            findings[-1]['line'] = int(line_match.group(1))

            elif filepath.endswith(".py"):
                # Run bandit
                result = subprocess.run(
                    ["bandit", "-f", "json", filepath],
                    capture_output=True, text=True
                )
                if result.stdout.strip():
                    try:
                        bandit_data = json.loads(result.stdout)
                        for result in bandit_data.get('results', []):
                            findings.append({
                                "type": "security",
                                "severity": result['issue_severity'].lower(),
                                "title": result['test_id'] + ": " + result['test_name'],
                                "description": result['issue_text'],
                                "line": result['line_number']
                            })
                    except:
                        pass
        except Exception as tool_err:
            print(f"Tool execution failed: {tool_err}")

        # Step 2: LLM-Assisted Audit (Strategic Fallback or Enrichment)
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
