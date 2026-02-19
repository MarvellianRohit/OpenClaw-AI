import asyncio
import websockets
import json
import requests
import time
import os

GATEWAY_URL = "http://127.0.0.1:8002"
WS_URL = "ws://127.0.0.1:8002/ws/chat"
FILE_PATH = "/Users/rohitchandra/Documents/OpenClaw AI/openclaw-backend/buffer_verify.c"

VULNERABLE_CODE = """
#include <stdio.h>

void vulnerable_function() {
    char buffer[10];
    printf("Enter sensitive data: ");
    gets(buffer); // Buffer overflow vulnerability
    printf("You entered: %s\\n", buffer);
}

int main() {
    vulnerable_function();
    return 0;
}
"""

async def run_verification():
    print(f"Connecting to {WS_URL}...")
    try:
        async with websockets.connect(WS_URL) as websocket:
            print("🔌 Connected to WebSocket")
            
            # 1. Save vulnerable file
            print(f"\n💾 Saving vulnerable file to {FILE_PATH}...")
            save_res = requests.post(f"{GATEWAY_URL}/file/save", json={
                "filepath": FILE_PATH,
                "content": VULNERABLE_CODE
            })
            print(f"Save Response: {save_res.text}")
            
            # 2. Add slight delay for scan to complete and trigger (async)
            # await asyncio.sleep(2) 

            # 3. Wait for Security Report via WebSocket
            print("Waiting for Security Report...")
            try:
                # Loop to consume messages until we find security_report
                for _ in range(5):
                    message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    data = json.loads(message)
                    print(f"Received WS Message type: {data.get('type')}")
                    
                    if data.get("type") == "security_report":
                        print("\n🚨 Security Report Received!")
                        report = data["report"]
                        findings = report.get("findings", [])
                        print(json.dumps(findings, indent=2))
                        
                        if findings:
                            finding = findings[0]
                            print(f"\n🛠️ Triggering Patch for: {finding['title']}")
                            
                            patch_payload = {
                                "finding": finding,
                                "filepath": FILE_PATH
                            }
                            
                            patch_res = requests.post(f"{GATEWAY_URL}/tools/patch", json=patch_payload)
                            print(f"Patch Response Code: {patch_res.status_code}")
                            print(f"Patch Response Body: {patch_res.text}")
                            
                            if patch_res.status_code == 200:
                                print("\n✅ Patch API call successful.")
                                # Check file content
                                with open(FILE_PATH, 'r') as f:
                                    content = f.read()
                                    if "gets(" not in content and ("fgets(" in content or "scanf" in content):
                                        print("\n✅ VERIFICATION SUCCESS: 'gets' replaced with safer alternative!")
                                        print(content)
                                    else:
                                        print("\n❌ VERIFICATION FAILED: 'gets' still present or patch ineffective.")
                                        print(content)
                            else:
                                print("\n❌ Patch API call failed.")
                        else:
                            print("\n⚠️ No findings in report.")
                        return

            except asyncio.TimeoutError:
                print("Timed out waiting for security report.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(run_verification())
