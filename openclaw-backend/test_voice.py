import asyncio
import websockets
import json

async def test_voice():
    uri = "ws://localhost:8002/ws/voice"
    async with websockets.connect(uri) as websocket:
        print("Connected to Voice WS")
        
        # Send 1 second of silence/noise (16kHz, 16-bit mono = 32000 bytes)
        # Just send null bytes (silence)
        pcm_data = bytearray(32000)
        
        # Send binary bytes
        await websocket.send(pcm_data)
        
        # Send process command
        await websocket.send(json.dumps({"command": "process"}))
        
        # Wait for response
        res = await websocket.recv()
        print(f"Backend Response: {res}")

if __name__ == "__main__":
    asyncio.run(test_voice())
