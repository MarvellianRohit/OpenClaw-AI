#!/bin/bash
# start_gateway.sh — properly daemonizes the OpenClaw gateway
# Usage: bash start_gateway.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG="$SCRIPT_DIR/gateway_run.log"
VENV_PY="$SCRIPT_DIR/../openclaw-env-39/bin/python3"

# Kill any existing gateway
pkill -f "gateway.py" 2>/dev/null
sleep 1

# Start as true daemon (double-fork)
(
  cd "$SCRIPT_DIR"
  nohup "$VENV_PY" gateway.py >> "$LOG" 2>&1 &
  disown $!
  echo "Gateway started with PID: $!"
)
