import asyncio
from reasoning_engine import ReasoningEngine

async def mock_call_llm(prompt, temperature, max_tokens):
    print("====== PROMPT SENT TO LLM ======")
    print(prompt)
    print("================================")
    return "{\"thought_process\": \"Checking\", \"steps\": [\"Verify\"]}"

async def run():
    engine = ReasoningEngine(mock_call_llm)
    await engine.generate_plan("What is the Titanium Pulse Protocol and what does it do?", context="Base context.")

if __name__ == "__main__":
    asyncio.run(run())
