
import os
import uvicorn
from llama_cpp.server.app import create_app
from llama_cpp.server.settings import ServerSettings, ModelSettings

# Configuration for M3 Max Optimization
MODEL_PATH = os.environ.get("MODEL_PATH", "models/llama-3-70b-instruct.Q4_K_M.gguf") # Default placeholder
HOST = "0.0.0.0"
PORT = 8081

def start_inference_server():
    print(f"🚀 Starting OpenClaw Inference Engine on {HOST}:{PORT}")
    print(f"🔥 Metal GPU Acceleration: ENABLED (n_gpu_layers=-1)")
    print(f"🧠 Memory Optimization: Large Pages / mlock enabled")

    model_settings = ModelSettings(
        model=MODEL_PATH,
        n_gpu_layers=-1, # Offload ALL layers to GPU
        n_ctx=32768,     # 32k context window for KV Cache
        n_batch=512,     # Batch size
        n_threads=8,     # CPU threads (M3 Max has many, but 8 is usually sweet spot for hybrid)
        f16_kv=True,     # Use half-precision for KV cache
        use_mlock=True,  # Lock model in RAM (prevent swapping)
        verbose=True
    )
    
    server_settings = ServerSettings(
        host=HOST,
        port=PORT
    )

    # Create the OpenAI-compatible app
    app = create_app(
        server_settings=server_settings,
        model_settings=model_settings
    )
    
    uvicorn.run(app, host=HOST, port=PORT)

if __name__ == "__main__":
    # Ensure model directory exists
    if not os.path.exists("models"):
        os.makedirs("models")
        print("⚠️ 'models' directory created. Please place your .gguf model file there.")
    
    try:
        start_inference_server()
    except Exception as e:
        print(f"❌ Failed to start inference server: {e}")
