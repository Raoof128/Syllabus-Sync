#!/bin/bash
# ============================================================================
# Subresource Integrity (SRI) Hash Generator
# ============================================================================
# This script generates SRI hashes for external resources.
# Usage: ./scripts/generate-sri.sh <url>
# Example: ./scripts/generate-sri.sh https://example.com/script.js
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if URL is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No URL provided${NC}"
    echo "Usage: $0 <url>"
    echo "Example: $0 https://cdn.example.com/library.js"
    exit 1
fi

URL="$1"

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is not installed${NC}"
    exit 1
fi

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}Error: openssl is not installed${NC}"
    exit 1
fi

echo -e "${YELLOW}Generating SRI hash for:${NC} $URL"
echo "Fetching resource..."

# Fetch the resource and generate hash
# Using sha384 as recommended by Mozilla (good balance of security and length)
HASH=$(curl -s "$URL" | openssl dgst -sha384 -binary | openssl base64 -A)

if [ -z "$HASH" ]; then
    echo -e "${RED}Error: Failed to generate hash${NC}"
    exit 1
fi

SRI_HASH="sha384-$HASH"

echo ""
echo -e "${GREEN}✓ SRI Hash generated successfully:${NC}"
echo ""
echo "  $SRI_HASH"
echo ""
echo "Add this to your HTML:"
echo "  <script src=\"$URL\" integrity=\"$SRI_HASH\" crossorigin=\"anonymous\"></script>"
echo ""
echo "Or to lib/security/sri.ts EXTERNAL_RESOURCES:"
echo "  '$URL': {"
echo "    url: '$URL',"
echo "    hash: '$SRI_HASH',"
echo "  },"
