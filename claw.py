#!/usr/bin/env python3
import argparse
import requests
import sys
import os
import json
from datetime import datetime

GATEWAY_URL = "http://localhost:8000"

# Titanium Console Aesthetics
CYAN = "\033[38;5;51m"
BLUE = "\033[38;5;33m"
GRAY = "\033[38;5;244m"
RESET = "\033[0m"
BOLD = "\033[1m"

def print_header(title):
    print(f"\n{BOLD}{CYAN}═══ OpenClaw AI: {title} ═══{RESET}\n")

def get_summary():
    try:
        response = requests.get(f"{GATEWAY_URL}/status")
        if response.status_code == 200:
            data = response.json()
            v = data['vitals']
            p = data['project']
            
            print_header("Hardware Vitals")
            print(f" {BOLD}M3 Max CPU:{RESET} {v['cpu_usage_percent']}%")
            print(f" {BOLD}Unified Memory:{RESET} {v['memory_usage_gb']:.1f}GB / {v['memory_total_gb']:.1f}GB")
            print(f" {BOLD}GPU Load:{RESET} {v['gpu_load_percent']}%")
            print(f" {BOLD}Temp:{RESET} {v['temperature_c']}°C")
            
            print_header("Project Status")
            print(f" {BOLD}Functions Indexed:{RESET} {p['functions_indexed']}")
            print(f" {BOLD}Active Files:{RESET} {p['active_files']}")
            print(f" {BOLD}Scale Mode:{RESET} {'High-Capacity (128k)' if p['high_capacity_mode'] else 'Standard (32k)'}")
            print(f" {BOLD}Context Window:{RESET} {p['context_tokens']} tokens")
            print("")
        else:
            print(f"❌ Error: Gateway returned {response.status_code}")
    except Exception as e:
        print(f"❌ Error: Could not connect to OpenClaw Gateway at {GATEWAY_URL}")
        print(f"Details: {e}")

def apply_fix(filepath):
    abs_path = os.path.abspath(filepath)
    print(f"{BOLD}{BLUE}🔍 Analyzing {os.path.basename(filepath)}...{RESET}")
    
    try:
        response = requests.post(f"{GATEWAY_URL}/tools/fix", json={"filepath": abs_path})
        if response.status_code == 200:
            print(f"{BOLD}{CYAN}✅ Fix Applied Successfully!{RESET}")
            print(f"{GRAY}Modified: {abs_path}{RESET}")
        else:
            print(f"❌ Error: {response.json().get('detail', 'Unknown error')}")
    except Exception as e:
        print(f"❌ Error: Could not reach gateway. Ensure OpenClaw is running.")

def main():
    parser = argparse.ArgumentParser(description="OpenClaw AI Terminal Interface")
    parser.add_argument("--summary", action="store_true", help="Display hardware and project summary")
    parser.add_argument("--fix", type=str, metavar="FILE", help="Apply AI-powered fixes to a file")
    
    if len(sys.argv) == 1:
        parser.print_help()
        sys.exit(0)
        
    args = parser.parse_args()
    
    if args.summary:
        get_summary()
    elif args.fix:
        apply_fix(args.fix)

if __name__ == "__main__":
    main()
