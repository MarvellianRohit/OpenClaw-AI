#!/bin/bash

# Configuration
PROJECT_DIR="$(pwd)"
CLI_SCRIPT="$PROJECT_DIR/claw.py"
BIN_TARGET="/usr/local/bin/claw"

echo "📡 Setting up OpenClaw CLI..."

# Make script executable
chmod +x "$CLI_SCRIPT"

# Try to create symlink (might require sudo)
if [ -L "$BIN_TARGET" ]; then
    echo "♻️  Updating existing claw symlink..."
    sudo rm "$BIN_TARGET"
fi

echo "🔗 Linking $CLI_SCRIPT to $BIN_TARGET..."
sudo ln -s "$CLI_SCRIPT" "$BIN_TARGET"

if [ $? -eq 0 ]; then
    echo "✅ OpenClaw CLI installation complete!"
    echo "💡 You can now run 'claw --summary' from any terminal."
else
    echo "❌ Failed to create symlink. Try running 'sudo ./setup_cli.sh' manually."
fi
