
# Dummy sounddevice module for headless verification
def query_devices(kind=None):
    return {"default_samplerate": 44100}

class InputStream:
    def __init__(self, *args, **kwargs):
        pass
    def start(self):
        pass
    def stop(self):
        pass
    def close(self):
        pass
    def __enter__(self):
        return self
    def __exit__(self, *args):
        pass
