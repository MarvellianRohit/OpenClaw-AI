import psutil
import os

class ContextManager:
    def __init__(self):
        self.threshold_gb = 100
        self.default_context = 32768
        self.high_capacity_context = 131072
        self.current_context = self.default_context
        self.high_capacity_active = False

    def check_memory_and_scale(self):
        """Checks available RAM and updates the context length."""
        mem = psutil.virtual_memory()
        available_gb = mem.available / (1024**3)
        
        # We also check for an override env var for testing on smaller machines
        is_mock = os.getenv("OPENCLAW_MOCK_HIGH_MEM") == "true"
        
        if available_gb >= self.threshold_gb or is_mock:
            if not self.high_capacity_active:
                print(f"🚀 High RAM Detected ({available_gb:.1f}GB). Scaling to {self.high_capacity_context} tokens.")
                self.current_context = self.high_capacity_context
                self.high_capacity_active = True
                return True, self.current_context
        else:
            if self.high_capacity_active:
                print(f"📉 RAM pressure detected ({available_gb:.1f}GB). Reverting to {self.default_context} tokens.")
                self.current_context = self.default_context
                self.high_capacity_active = False
                return True, self.current_context
                
        return False, self.current_context

    def get_context_params(self):
        """Returns parameters for the LLM request based on current scale."""
        return {
            "n_ctx": self.current_context,
            "high_capacity": self.high_capacity_active
        }

context_manager = ContextManager()
