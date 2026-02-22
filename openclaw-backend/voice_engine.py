"""
voice_engine.py — Graceful stub that degrades safely when audio deps are unavailable.
Full voice dictation is handled via the WebSocket /ws/voice endpoint using openai-whisper.
"""
import asyncio

_VOICE_AVAILABLE = False

try:
    import sounddevice as sd
    import numpy as np
    # Verify sd.rec actually works (Python 3.14 sounddevice has no .rec)
    _ = sd.rec
    _VOICE_AVAILABLE = hasattr(sd, "rec")
except Exception:
    pass

try:
    from faster_whisper import WhisperModel as _WhisperModel
    _FW_AVAILABLE = True
except ImportError:
    _FW_AVAILABLE = False


class VoiceEngine:
    def __init__(self, model_size="tiny", device="cpu", compute_type="int8"):
        self.is_listening = False
        self.samplerate   = 16000
        self.channels     = 1
        self.buffer       = []
        self.wake_word    = "claw"
        self.model        = None

        if _VOICE_AVAILABLE and _FW_AVAILABLE:
            try:
                print(f"🎙️ Initializing Local Whisper ({model_size})...")
                self.model = _WhisperModel(model_size, device=device, compute_type=compute_type)
            except Exception as e:
                print(f"🎙️ Whisper init skipped: {e}")
        else:
            print("🎙️ Voice Engine: audio deps unavailable — voice dictation disabled (WS /ws/voice still works via openai-whisper).")

    async def listen_loop(self, broadcast_fn, execute_command_fn):
        """Continuous microphone listen loop — only runs when audio hw is available."""
        if not _VOICE_AVAILABLE or not self.model:
            print("🎙️ Microphone loop skipped (no audio hw / deps).")
            return

        import sounddevice as sd
        self.is_listening = True
        print("🎙️ Claw is listening for your command...")

        while self.is_listening:
            try:
                recording = sd.rec(
                    int(3 * self.samplerate),
                    samplerate=self.samplerate,
                    channels=self.channels,
                )
                sd.wait()

                await broadcast_fn({"type": "voice_state", "state": "processing"})
                segments, _ = self.model.transcribe(recording.flatten(), beam_size=5)
                text = " ".join([s.text for s in segments]).strip().lower()

                if text:
                    print(f"👂 Recognized: {text}")
                    if self.wake_word in text:
                        cleaned = text.replace(self.wake_word, "").strip().strip(",")
                        await broadcast_fn({"type": "voice_state", "state": "command_detected", "text": cleaned})
                        await execute_command_fn(cleaned)

                await broadcast_fn({"type": "voice_state", "state": "listening"})
                await asyncio.sleep(0.1)

            except Exception as e:
                print(f"Voice Engine Error: {e}")
                await asyncio.sleep(5)   # back off longer to avoid log spam

    def stop(self):
        self.is_listening = False


# Module-level singleton — always succeeds (graceful degradation)
voice_engine = VoiceEngine()


async def handle_voice_command(command: str, gateway_actions_fn):
    """Maps transcribed text to specific OpenClaw actions."""
    cmd = command.lower()
    if "zen mode" in cmd:
        await gateway_actions_fn({"type": "toggle_zen"})
    elif "build" in cmd or "run" in cmd:
        await gateway_actions_fn({"type": "run_command", "command": "make build"})
    elif "terminal" in cmd:
        await gateway_actions_fn({"type": "toggle_terminal"})
    elif "find" in cmd and "bug" in cmd:
        await gateway_actions_fn({"type": "chat_command", "message": "Find the bug in the current file."})
    else:
        await gateway_actions_fn({"type": "chat_command", "message": command})
