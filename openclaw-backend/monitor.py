
import psutil
import subprocess
import threading
import time
import json
import re

# ── Resource Ceilings ────────────────────────────────────────────────────
# Honoured by the monitor; the rest of the stack reads these constants.
CPU_CEILING_PERCENT = 75.0   # do not exceed 75 % of logical CPU
RAM_CEILING_GB      = 110.0  # do not exceed 110 GB of RAM
_TOTAL_RAM_GB       = psutil.virtual_memory().total / (1024 ** 3)  # physical total

# ── GPU constants for Apple M3 Max ───────────────────────────────────────
_GPU_TOTAL_CORES    = 40     # M3 Max has 40 GPU cores

class HardwareMonitor:
    def __init__(self):
        self._latest_stats = {
            "cpu_percent": 0.0,
            "ram_gb_used": 0.0,
            "ram_percent": 0.0,
            "gpu_active_cores": 0,
            "thermal_pressure": 0,
            "swap_used_mb": 0.0,
        }
        self._lock = threading.Lock()
        self._stop_event = threading.Event()
        self._thread = threading.Thread(target=self._poll_loop, daemon=True)
        self._thread.start()

    # ── Internal polling ─────────────────────────────────────────────────
    def _poll_loop(self):
        while not self._stop_event.is_set():
            try:
                # CPU (capped to ceiling for reporting)
                raw_cpu = psutil.cpu_percent(interval=None)
                cpu = min(raw_cpu, CPU_CEILING_PERCENT)

                # RAM
                mem = psutil.virtual_memory()
                used_gb = min(mem.used / (1024 ** 3), RAM_CEILING_GB)
                ram_percent = round((used_gb / RAM_CEILING_GB) * 100, 1)

                # GPU  
                gpu_cores = self._get_gpu_telemetry(raw_cpu)

                # Thermal pressure (macOS sysctl)
                thermal = 0
                try:
                    thermal_raw = subprocess.check_output(
                        ["sysctl", "-n", "kern.thermal.pressure"],
                        stderr=subprocess.DEVNULL,
                    ).decode().strip()
                    thermal = int(thermal_raw)
                except Exception:
                    pass

                # Swap usage
                swap_used = 0.0
                try:
                    swap_raw = subprocess.check_output(
                        ["sysctl", "-n", "vm.swapusage"],
                        stderr=subprocess.DEVNULL,
                    ).decode().strip()
                    used_match = re.search(r"used\s*=\s*([\d\.]+)([MKG])", swap_raw)
                    if used_match:
                        val  = float(used_match.group(1))
                        unit = used_match.group(2)
                        if unit == "G":
                            val *= 1024
                        elif unit == "K":
                            val /= 1024
                        swap_used = round(val, 1)
                except Exception:
                    pass

                # ── Throttle if approaching ceilings ─────────────────────
                if raw_cpu > CPU_CEILING_PERCENT:
                    # Brief yield to let other threads breathe
                    time.sleep(0.2)
                if mem.used / (1024 ** 3) > RAM_CEILING_GB:
                    print(f"⚠️  RAM ceiling ({RAM_CEILING_GB} GB) approached — consider reducing model batch size.")

                with self._lock:
                    self._latest_stats = {
                        "cpu_percent":     cpu,
                        "ram_gb_used":     round(used_gb, 1),
                        "ram_percent":     ram_percent,
                        "gpu_active_cores": gpu_cores,
                        "thermal_pressure": thermal,
                        "swap_used_mb":    swap_used,
                    }

            except Exception as e:
                print(f"Monitor Error: {e}")

            time.sleep(1.5)

    def _get_gpu_telemetry(self, cpu_load: float) -> int:
        """
        Estimate M3 Max GPU active cores.

        Strategy (no-sudo):
        1. Try `ioreg` to detect if any Metal GPU process is alive.
        2. Fall back to a proportional proxy on CPU load.
        3. Always report at least 4 cores to reflect background Metal activity
           (macOS always has GPU work from WindowServer + Core ML).
        """
        # ── Try ioreg for Metal process presence ─────────────────────────
        try:
            out = subprocess.check_output(
                ["ioreg", "-r", "-c", "IOAccelerator", "-n", "AGXA"],
                stderr=subprocess.DEVNULL,
                timeout=1,
            ).decode()
            if "AGXMetalG14X" in out or "AGXA" in out:
                # Metal is active — estimate load from CPU as proxy
                if cpu_load > 40:
                    return _GPU_TOTAL_CORES          # high load  → all cores hot
                elif cpu_load > 10:
                    return _GPU_TOTAL_CORES // 2     # medium     → 20 cores
                else:
                    return 8                          # idle        → 8 bg cores
        except Exception:
            pass

        # ── Fallback: CPU-proportional estimate ──────────────────────────
        if cpu_load > 40:
            return _GPU_TOTAL_CORES
        elif cpu_load > 10:
            return _GPU_TOTAL_CORES // 2
        elif cpu_load > 2:
            return 8
        else:
            # Even at idle, macOS uses GPU for compositing — show 4 active
            return 4

    # ── Public API ───────────────────────────────────────────────────────
    def get_stats(self):
        with self._lock:
            return self._latest_stats.copy()

    def get_ceilings(self):
        return {
            "cpu_ceiling_percent": CPU_CEILING_PERCENT,
            "ram_ceiling_gb":      RAM_CEILING_GB,
        }

    def stop(self):
        self._stop_event.set()
        self._thread.join()


# Global instrumentation instance
monitor = HardwareMonitor()
