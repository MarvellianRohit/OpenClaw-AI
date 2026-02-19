
# Dummy faster_whisper module for headless verification
class Segment:
    def __init__(self, text):
        self.text = text

class WhisperModel:
    def __init__(self, *args, **kwargs):
        pass
    
    def transcribe(self, audio, beam_size=5):
        # Return empty segments and info
        return [], None
