import json
from typing import List, Dict, Any, Optional

class AgentEngine:
    def __init__(self, call_llm_fn):
        self.call_llm_fn = call_llm_fn
        self.tools = [
            {
                "name": "read_file",
                "description": "Reads the content of a file.",
                "parameters": {"path": "string"}
            },
            {
                "name": "write_file",
                "description": "Writes content to a file.",
                "parameters": {"path": "string", "content": "string"}
            },
            {
                "name": "list_directory",
                "description": "Lists files in a directory.",
                "parameters": {"path": "string"}
            },
            {
                "name": "execute_shell",
                "description": "Executes a shell command.",
                "parameters": {"command": "string"}
            }
        ]

    async def generate_plan(self, goal: str) -> List[Dict[str, Any]]:
        """Decomposes a high-level goal into a sequence of tool-based steps."""
        prompt = (
            f"You are the OpenClaw Agent. Your goal is: '{goal}'\n\n"
            "Break this down into a sequence of actionable steps using these tools:\n"
            f"{json.dumps(self.tools, indent=2)}\n\n"
            "Format your response as a JSON list of steps. Each step MUST have: "
            "'id' (int), 'description' (string), 'tool' (string), and 'parameters' (dict).\n"
            "Only return the JSON list."
        )
        
        response = await self.call_llm_fn(prompt, max_tokens=1024)
        
        try:
            # Attempt to extract JSON if LLM wraps it in markdown
            import re
            json_match = re.search(r"\[.*\]", response, re.DOTALL)
            if json_match:
                plan = json.loads(json_match.group(0))
                return plan
            return []
        except Exception as e:
            print(f"Planning Error: {e}")
            return []

# Initialization helper
def get_agent_engine(call_llm_fn):
    return AgentEngine(call_llm_fn)
