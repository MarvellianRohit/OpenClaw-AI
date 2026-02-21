# Titanium Pulse Protocol

The Titanium Pulse Protocol is the underlying synchronization engine for OpenClaw's Neural Flow UI. It relies on a high-frequency WebSocket connection over port 8000, streaming system metrics at 50ms intervals. 

## Memory Management
To prevent memory leaks, Titanium Pulse uses weak references for DOM nodes and automatically garbage collects dropped rendering frames.

## Security
All Titanium Pulse payloads are encrypted via AES-256 before transmission from the `gateway.py` endpoint.
