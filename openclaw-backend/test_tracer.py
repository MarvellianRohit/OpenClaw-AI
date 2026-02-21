import asyncio
import websockets
import json

async def test_tracer():
    uri = "ws://localhost:8002/ws/variable_map"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected! Sending code...")
            req = {
                "code": "a = [1, 2]\nb = a\na.append(3)\nprint(b)"
            }
            await websocket.send(json.dumps(req))
            
            print("Listening for trace events...")
            while True:
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                    data = json.loads(message)
                    print(f"Received Line {data.get('line')}: {len(data.get('variables', []))} vars")
                except asyncio.TimeoutError:
                    print("Trace completed or timeout.")
                    break
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_tracer())
