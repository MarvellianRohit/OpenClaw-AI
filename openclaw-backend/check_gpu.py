
import torch
import sys

def check_gpu():
    print("🔍 Checking M3 Max GPU Acceleration...")
    
    # 1. Check PyTorch MPS (Metal Performance Shaders)
    try:
        if torch.backends.mps.is_available():
            print("✅ PyTorch Metal (MPS) is AVAILABLE.")
            device = torch.device("mps")
            # fast tensor creating to warm up
            x = torch.ones(1, device=device)
            print("   -> Tensor created on Metal GPU successfully.")
        else:
            print("❌ PyTorch Metal (MPS) is NOT available. Using CPU.")
            # sys.exit(1) # Don't fail hard, just warn
    except ImportError:
        print("❌ PyTorch not installed.")
    except Exception as e:
        print(f"❌ Error checking MPS: {e}")

    # 2. Llama-cpp-python check (harder to check without loading model, but we can check import)
    try:
        from llama_cpp import Llama
        print("✅ llama-cpp-python is installed.")
        # Ideally we'd check if it was compiled with LLAMA_METAL=1, 
        # but that often requires inspecting logs or loading a model.
        # We'll assume the setup script did its job.
    except ImportError:
        print("❌ llama-cpp-python is NOT installed.")

if __name__ == "__main__":
    check_gpu()
