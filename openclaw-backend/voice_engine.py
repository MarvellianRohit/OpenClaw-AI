import os
import asyncio
import numpy as np
import sounddevice as sd
from faster_whisper import WhisperModel
import json

class VoiceEngine:
    def __init__(self, model_size="tiny", device="cpu", compute_type="int8"):
        print(f"🎙️ Initializing Local Whisper ({model_size})...")
        self.model = WhisperModel(model_size, device=device, compute_type=compute_type)
        self.is_listening = False
        self.samplerate = 16000
        self.channels = 1
        self.buffer = []
        self.wake_word = "claw"
        
    async def listen_loop(self, broadcast_fn, execute_command_fn):
        """Main loop for listening and processing voice commands."""
        self.is_listening = True
        print("🎙️ Claw is listening for your command...")
        
        while self.is_listening:
            try:
                # Record a small chunk
                duration = 3  # seconds
                recording = sd.rec(int(duration * self.samplerate), samplerate=self.samplerate, channels=self.channels)
                sd.wait()
                
                # Notify UI we are processing
                await broadcast_fn({"type": "voice_state", "state": "processing"})
                
                # Transcribe
                segments, info = self.model.transcribe(recording.flatten(), beam_size=5)
                text = " ".join([s.text for s in segments]).strip().lower()
                
                if text:
                    print(f"👂 Recognized: {text}")
                    if self.wake_word in text:
                        cleaned_cmd = text.replace(self.wake_word, "").strip().strip(",")
                        print(f"🚀 Executing Voice Command: {cleaned_cmd}")
                        await broadcast_fn({"type": "voice_state", "state": "command_detected", "text": cleaned_cmd})
                        await execute_command_fn(cleaned_cmd)
                
                # Back to listening state
                await broadcast_fn({"type": "voice_state", "state": "listening"})
                await asyncio.sleep(0.1)
                
            except Exception as e:
                print(f"Voice Engine Error: {e}")
                await asyncio.sleep(2)

    def stop(self):
        self.is_listening = False

voice_engine = VoiceEngine()

async def handle_voice_command(command: str, gateway_actions_fn):
    """Maps transcribed text to specific OpenClaw actions."""
    cmd = command.lower()
    
    if "zen mode" in cmd:
        await gateway_actions_fn({"type": "toggle_zen"})
    elif "build" in cmd or "run" in cmd:
        await gateway_actions_fn({"type": "run_command", "command": "make build"}) # Example
    elif "terminal" in cmd:
        await gateway_actions_fn({"type": "toggle_terminal"})
    elif "find" in cmd and "bug" in cmd:
        await gateway_actions_fn({"type": "chat_command", "message": "Find the bug in the current file."})
    else:
        # Default to chat
        await gateway_actions_fn({"type": "chat_command", "message": command})
