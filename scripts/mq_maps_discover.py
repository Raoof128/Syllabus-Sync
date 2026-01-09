#!/usr/bin/env python3
"""
MQ Maps PDF Discovery Script
Discovers all PDF links from the official MQ Maps page.
Run weekly to check for new or updated map PDFs.

Usage:
    python scripts/mq_maps_discover.py > data/mq-exports/mq_pdfs_index.json
"""

import json
import sys
from datetime import datetime, timezone

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Error: Missing dependencies. Install with:", file=sys.stderr)
    print("  python -m pip install requests beautifulsoup4", file=sys.stderr)
    sys.exit(1)

from urllib.parse import urljoin

BASE = "https://www.mq.edu.au"
URL = "https://www.mq.edu.au/about/locations/maps"

HEADERS = {"User-Agent": "SyllabusSync-AcademicProject/1.0 (contact: raouf@mq.edu.au)"}


def main():
    try:
        r = requests.get(URL, headers=HEADERS, timeout=30)
        r.raise_for_status()
    except requests.RequestException as e:
        print(f"Error fetching {URL}: {e}", file=sys.stderr)
        sys.exit(1)

    soup = BeautifulSoup(r.text, "html.parser")

    pdf_links = []
    for a in soup.select("a[href]"):
        href = a.get("href")
        if href is None:
            continue
        href_str = str(href)
        if ".pdf" in href_str.lower():
            full_url = urljoin(BASE, href_str)
            link_text = a.get_text(strip=True) or "Untitled"
            pdf_links.append(
                {
                    "url": full_url,
                    "title": link_text,
                    "filename": href_str.split("/")[-1].split("?")[0],
                }
            )

    # Deduplicate by URL
    seen: set[str] = set()
    unique_pdfs = []
    for pdf in pdf_links:
        if pdf["url"] not in seen:
            seen.add(pdf["url"])
            unique_pdfs.append(pdf)

    # Sort by filename
    unique_pdfs = sorted(unique_pdfs, key=lambda x: x["filename"].lower())

    out = {
        "source_page": URL,
        "scraped_at": datetime.now(timezone.utc).isoformat(),
        "count": len(unique_pdfs),
        "pdfs": unique_pdfs,
    }

    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
