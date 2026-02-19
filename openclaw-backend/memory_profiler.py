import subprocess
import os
import json
import asyncio
import re

async def trace_memory(binary_path: str, event_callback):
    """
    Spawns a process and uses lldb to trace malloc and free calls.
    Note: Requires lldb to be installed and permissions to trace.
    """
    if not os.path.exists(binary_path):
        await event_callback({"error": f"Binary not found: {binary_path}"})
        return

    # Create a script for lldb
    # This is a simplified version; for a real production environment, 
    # we'd use the LLDB Python API directly for more robustness.
    lldb_script = [
        f"file {binary_path}",
        "b malloc",
        "breakpoint command add 1",
        "script print(json.dumps({'type': 'malloc', 'size': lldb.frame.FindVariable('__size').GetValueAsUnsigned(), 'addr': lldb.frame.registers[0].value}))",
        "continue",
        "DONE",
        "b free",
        "breakpoint command add 2",
        "script print(json.dumps({'type': 'free', 'addr': lldb.frame.FindVariable('__ptr').GetValueAsUnsigned()}))",
        "continue",
        "DONE",
        "run"
    ]
    
    script_path = "/tmp/mem_trace.lldb"
    with open(script_path, "w") as f:
        f.write("\n".join(lldb_script))

    process = await asyncio.create_subprocess_exec(
        "lldb", "-s", script_path, "--batch",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    while True:
        line = await process.stdout.readline()
        if not line:
            break
        
        decoded_line = line.decode().strip()
        try:
            # Look for JSON output from our script
            if decoded_line.startswith('{"type":'):
                data = json.loads(decoded_line)
                await event_callback(data)
        except Exception:
            continue

    await process.wait()
    await event_callback({"status": "finished"})

# For demonstration/mock purposes if lldb is not feasible in certain environments
async def mock_memory_trace(event_callback):
    """Simulates memory events for testing the UI."""
    import random
    import time
    
    addresses = []
    for _ in range(50):
        if random.random() > 0.3 or not addresses:
            # Malloc
            addr = random.randint(0x100000000, 0x10000FFFF)
            size = random.randint(16, 4096)
            addresses.append(addr)
            await event_callback({"type": "malloc", "addr": addr, "size": size})
        else:
            # Free
            addr = addresses.pop(random.randint(0, len(addresses)-1))
            await event_callback({"type": "free", "addr": addr})
        
        await asyncio.sleep(0.1 + random.random() * 0.4)
