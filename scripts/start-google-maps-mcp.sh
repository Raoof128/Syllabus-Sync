#!/bin/bash
# Start Google Maps MCP Server
# Run this before starting OpenCode, or add to your shell startup
#
# SECURITY: API key must be provided via environment variable
# Set GOOGLE_MAPS_API_KEY in your shell or .env.local before running

PORT=3001

# Check for API key
if [ -z "$GOOGLE_MAPS_API_KEY" ]; then
    echo "ERROR: GOOGLE_MAPS_API_KEY environment variable is not set"
    echo "Please set it in your environment or .env.local file:"
    echo "  export GOOGLE_MAPS_API_KEY=your_api_key_here"
    exit 1
fi

# Check if already running
if lsof -i :$PORT > /dev/null 2>&1; then
    echo "Google Maps MCP already running on port $PORT"
else
    echo "Starting Google Maps MCP on port $PORT..."
    npx @cablate/mcp-google-map --port $PORT --apikey "$GOOGLE_MAPS_API_KEY"
fi
