#!/bin/bash

# Titanium & Neon Palette
TITANIUM='\033[38;5;246m' # Grey
CYAN='\033[38;5;51m'      # Neon Cyan
GREEN='\033[38;5;46m'     # Matrix Green
RED='\033[38;5;196m'      # Error Red
RESET='\033[0m'
BOLD='\033[1m'

echo -e "\n${BOLD}${CYAN}/// OPENCLAW AI SETUP ///${RESET}"
echo -e "${TITANIUM}Initializing M3 Max Optimized Environment...${RESET}\n"

# 1. Backend Setup
echo -e "${CYAN}[1/3] Configuring Backend...${RESET}"

# Check for Python 3.10+
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed.${RESET}"
    exit 1
fi

# Create Virtual Env if not exists
if [ ! -d "openclaw-env" ]; then
    echo -e "${TITANIUM}    -> Creating virtual environment 'openclaw-env'...${RESET}"
    python3 -m venv openclaw-env
else
    echo -e "${TITANIUM}    -> 'openclaw-env' already exists.${RESET}"
fi

# Activate
source openclaw-env/bin/activate

# Install Dependencies
if [ -f "openclaw-backend/requirements.txt" ]; then
    echo -e "${TITANIUM}    -> Installing backend dependencies (Metal Optimized)...${RESET}"
    # Ensure build tools for llama-cpp are set for Metal
    CMAKE_ARGS="-DLLAMA_METAL=on" pip install --upgrade pip
    CMAKE_ARGS="-DLLAMA_METAL=on" pip install -r openclaw-backend/requirements.txt
else
    echo -e "${RED}    -> openclaw-backend/requirements.txt not found!${RESET}"
fi

# GPU Verification
echo -e "${TITANIUM}    -> Verifying Hardware Acceleration...${RESET}"
python3 openclaw-backend/check_gpu.py


# 2. Frontend Setup
echo -e "\n${CYAN}[2/3] Configuring Frontend...${RESET}"
cd openclaw-frontend || exit

if [ ! -d "node_modules" ]; then
    echo -e "${TITANIUM}    -> node_modules not found. Running npm install...${RESET}"
    npm install
else
    echo -e "${TITANIUM}    -> Frontend dependencies already installed.${RESET}"
fi

cd ..


# 3. Launch Info
echo -e "\n${CYAN}[3/3] Setup Complete.${RESET}"
echo -e "${TITANIUM}---------------------------------------------------${RESET}"
echo -e "${GREEN}✅ OpenClaw AI is ready to launch.${RESET}"
echo -e "${TITANIUM}To start the system, run separately:${RESET}"
echo -e "  1. Backend:  ${BOLD}source openclaw-env/bin/activate && cd openclaw-backend && python3 gateway.py${RESET}"
echo -e "  2. Frontend: ${BOLD}cd openclaw-frontend && npm run dev${RESET}"
echo -e "${TITANIUM}---------------------------------------------------${RESET}\n"
