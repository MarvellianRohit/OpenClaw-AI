import json
import os
import asyncio
from typing import List, Dict, Any, Optional
from rag_system import rag_system

class ReasoningEngine:
    def __init__(self, call_llm_fn):
        self.call_llm_fn = call_llm_fn
        self.latest_trace = None

    async def generate_plan(self, user_query: str, context: str) -> Dict[str, Any]:
        """Generates a Chain-of-Thought plan for a complex query."""
        
        # Phase BZ: Local RAG Retrieval
        try:
            rag_results = rag_system.search(user_query, n_results=3)
            if rag_results:
                rag_context = "\n\n[RAG Document Context]:\n"
                for i, hit in enumerate(rag_results):
                    filename = hit['metadata'].get('filename', 'Unknown')
                    rag_context += f"--- Excerpt from {filename} ---\n{hit['content']}\n"
                context += rag_context
        except Exception as e:
            print(f"RAG Search Error: {e}")
        
        prompt = (
            f"You are the Reasoning Engine for OpenClaw (M3 Max optimized).\n"
            f"Context: {context}\n\n"
            f"User Query: {user_query}\n\n"
            "Generate a step-by-step 'Hidden Plan' to solve this.\n"
            "Format as JSON: { \"thought_process\": \"...\", \"steps\": [\"Step 1\", \"Step 2\"], \"feasibility_check\": \"...\" }\n"
            "Consider file existence and hardware constraints (M3 Max)."
        )

        try:
            # High temp for creative planning
            response = await self.call_llm_fn(prompt, temperature=0.7, max_tokens=1024)
            
            # Extract JSON
            import re
            json_match = re.search(r"\{.*\}", response, re.DOTALL)
            if json_match:
                plan_data = json.loads(json_match.group(0))
                
                # Validation Logic
                validation_results = self.validate_plan(plan_data.get("steps", []))
                
                self.latest_trace = {
                    "query": user_query,
                    "plan": plan_data,
                    "validation": validation_results,
                    "timestamp": asyncio.get_event_loop().time()
                }
                return self.latest_trace
            
            return {"error": "Failed to parse plan"}

        except Exception as e:
            print(f"Reasoning Error: {e}")
            return {"error": str(e)}

    def validate_plan(self, steps: List[str]) -> List[Dict[str, Any]]:
        """Checks plan steps against system reality."""
        results = []
        for step in steps:
            valid = True
            reason = "Feasible"
            
            # Simple heuristic checks
            if "create file" in step.lower():
                # Check permissions or path? (Mock for now)
                pass
            if "delete" in step.lower():
                valid = False # Safety
                reason = "Deletion requires explicit approval"
                
            results.append({
                "step": step,
                "valid": valid,
                "reason": reason
            })
        return results

    def get_latest_trace(self):
        return self.latest_trace

# Global instance managed by gateway.py
reasoning_engine: Optional[ReasoningEngine] = None
