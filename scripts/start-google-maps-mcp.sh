#!/bin/bash
# Start Google Maps MCP Server
# Run this before starting OpenCode, or add to your shell startup

PORT=3001
API_KEY="AIzaSyBXVS8AvmbXAJUnoop_u-475Ufe-nfKgto"

# Check if already running
if lsof -i :$PORT > /dev/null 2>&1; then
    echo "Google Maps MCP already running on port $PORT"
else
    echo "Starting Google Maps MCP on port $PORT..."
    npx @cablate/mcp-google-map --port $PORT --apikey "$API_KEY"
fi
