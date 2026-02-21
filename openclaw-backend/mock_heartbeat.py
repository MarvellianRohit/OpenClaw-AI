import asyncio
import websockets
import json
import random
import time

async def emit_heartbeat():
    uri = "ws://localhost:8002/ws/heartbeat"
    async with websockets.connect(uri) as websocket:
        print("Connected to Voice WS as Mock Emitter")
        
        while True:
            # Simulate a fluctuating M3 Max CPU load between 10% and 80%
            mock_cpu = random.uniform(10.0, 80.0)
            mock_thermals = int(random.uniform(40, 75))
            
            data = {
                "type": "pulse",
                "data": {
                    "cpu_percent": mock_cpu,
                    "thermals": mock_thermals,
                    "compilation_errors": 0
                }
            }
            
            await websocket.send(json.dumps(data))
            print(f"Emitted Heartbeat (Load: {mock_cpu:.2f}%)")
            
            # Pulse every 1 second
            await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(emit_heartbeat())
