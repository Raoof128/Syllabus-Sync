#!/usr/bin/env bash
# scripts/build-overlays.sh
# Converts source PDFs in maps/source/ into transparent PNG overlays in public/maps/overlays/.
#
# Requirements: ImageMagick 7+ (`magick`) and Poppler (`pdftoppm`)
#
# Usage:
#   npm run build:overlays
#   # or directly:
#   bash scripts/build-overlays.sh
#
# This script is idempotent — safe to re-run.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_DIR="$REPO_ROOT/maps/source"
OUTPUT_DIR="$REPO_ROOT/public/maps/overlays"
TMP_DIR="$(mktemp -d)"

DPI=300

# Ensure tools are available
for cmd in magick pdftoppm; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "❌ Required tool '$cmd' not found. Install ImageMagick 7 and Poppler." >&2
    exit 1
  fi
done

mkdir -p "$OUTPUT_DIR"

convert_overlay() {
  local pdf_name="$1"
  local out_name="$2"
  local pdf_path="$SOURCE_DIR/$pdf_name"
  local out_path="$OUTPUT_DIR/$out_name"
  local tmp_ppm="$TMP_DIR/overlay_render"

  if [[ ! -f "$pdf_path" ]]; then
    echo "⚠  Source PDF not found: $pdf_path — skipping"
    return
  fi

  echo "🔄 Converting $pdf_name → $out_name (${DPI} DPI)..."

  # Step 1: Render PDF to high-res PNG via Poppler (best quality rasteriser)
  pdftoppm -png -r "$DPI" -singlefile "$pdf_path" "$tmp_ppm"

  local rendered="$tmp_ppm.png"
  if [[ ! -f "$rendered" ]]; then
    echo "❌ pdftoppm failed for $pdf_name" >&2
    return 1
  fi

  # Step 2: Remove the paper/background (make white/near-white → transparent)
  # -fuzz 12% catches off-white from PDF rendering artefacts
  magick "$rendered" \
    -fuzz 12% -transparent white \
    -strip \
    "$out_path"

  rm -f "$rendered"

  local size
  size=$(du -h "$out_path" | cut -f1)
  echo "✅ $out_name ($size)"
}

echo "═══════════════════════════════════════════"
echo "  Building Map Overlay PNGs (${DPI} DPI)"
echo "═══════════════════════════════════════════"
echo ""

convert_overlay "Campus-Map_parking.pdf" "parking_overlay.png"
convert_overlay "Drinking-water.pdf" "drinking_water_overlay.png"
convert_overlay "map_accessibility.pdf" "accessibility_overlay.png"
convert_overlay "map_special_permits_service_vehicles.pdf" "special_permits_overlay.png"

# Cleanup
rm -rf "$TMP_DIR"

echo ""
echo "✅ Done. Overlay PNGs are in: $OUTPUT_DIR"
