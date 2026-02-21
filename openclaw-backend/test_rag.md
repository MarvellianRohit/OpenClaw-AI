# OpenClaw Architecture Manual

## Chapter 1: The Titanium Pulse Protocol
The Titanium Pulse Protocol is the primary mechanism OpenClaw uses to regulate backend heartbeats. It runs exactly every 550ms and streams a signal containing memory profiling, current execution trace IDs, and overall agent mood to the React frontend.

## Chapter 2: Quantum Code Ingestion
When code is ingested, the AST parser extracts function definitions and caches them into the 'Lapis-Lazuli' memory sector. This sector is heavily optimized for zero-copy deserialization using FlatBuffers.

## Security Constraints
Never allow the user to delete the `core_engine.c` file without a signed biometric hash bypass.
