#!/usr/bin/env python3
"""
MQ Maps PDF Download Script
Downloads all PDFs discovered by mq_maps_discover.py with caching and polite behavior.
Only downloads new or updated PDFs (skip existing files).

Usage:
    python scripts/mq_maps_download.py
"""

import json
import sys
import time
from pathlib import Path

try:
    import requests
except ImportError:
    print("Error: Missing dependencies. Install with:", file=sys.stderr)
    print("  python -m pip install requests", file=sys.stderr)
    sys.exit(1)

INDEX_PATH = Path("data/mq-exports/mq_pdfs_index.json")
OUT_DIR = Path("data/mq-pdfs")

HEADERS = {"User-Agent": "SyllabusSync-AcademicProject/1.0 (contact: raouf@mq.edu.au)"}

# Polite delay between requests (seconds)
REQUEST_DELAY = 1.2


def filename_from_url(url: str) -> str:
    """Extract filename from URL, dropping query params."""
    return url.split("/")[-1].split("?")[0]


def main():
    # Ensure output directory exists
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Load index
    if not INDEX_PATH.exists():
        print(f"Error: Index file not found at {INDEX_PATH}", file=sys.stderr)
        print("Run mq_maps_discover.py first to generate the index.", file=sys.stderr)
        sys.exit(1)

    try:
        index = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in index file: {e}", file=sys.stderr)
        sys.exit(1)

    pdfs = index.get("pdfs", [])
    if not pdfs:
        print("No PDFs found in index.", file=sys.stderr)
        sys.exit(0)

    print(f"Found {len(pdfs)} PDFs in index")
    print(f"Output directory: {OUT_DIR.resolve()}")
    print("-" * 50)

    downloaded = 0
    skipped = 0
    failed = 0

    for pdf in pdfs:
        url = pdf.get("url", "")
        title = pdf.get("title", "Untitled")
        fname = pdf.get("filename", filename_from_url(url))

        if not url:
            continue

        out_path = OUT_DIR / fname

        # Skip if already downloaded
        if out_path.exists() and out_path.stat().st_size > 0:
            print(f"[SKIP] {fname} (already exists)")
            skipped += 1
            continue

        print(f"[FETCH] {fname}")
        print(f"        Title: {title}")

        try:
            r = requests.get(url, headers=HEADERS, timeout=60)
            r.raise_for_status()
            out_path.write_bytes(r.content)
            downloaded += 1
            print(f"        Size: {len(r.content):,} bytes")
        except requests.RequestException as e:
            print(f"        ERROR: {e}", file=sys.stderr)
            failed += 1
            continue

        # Be polite - wait between requests
        time.sleep(REQUEST_DELAY)

    print("-" * 50)
    print(f"Summary:")
    print(f"  Downloaded: {downloaded}")
    print(f"  Skipped:    {skipped}")
    print(f"  Failed:     {failed}")
    print(f"\nPDFs saved to: {OUT_DIR.resolve()}")


if __name__ == "__main__":
    main()
