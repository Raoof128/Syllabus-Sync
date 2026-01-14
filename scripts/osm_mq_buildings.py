#!/usr/bin/env python3
"""
OSM Building Data Pipeline for Macquarie University Campus
Fetches building data from OpenStreetMap Overpass API.

Usage:
    python scripts/osm_mq_buildings.py

Output:
    data/mq-exports/osm_buildings.json - Full building data with coordinates
    data/mq-exports/osm_buildings.csv - CSV format for import
"""

import requests
import json
import csv
import os
from datetime import datetime

# MQ Campus center coordinates
MQ_LAT = -33.775
MQ_LNG = 151.113
SEARCH_RADIUS = 1500  # meters


def fetch_osm_buildings():
    """Fetch buildings from OpenStreetMap Overpass API."""
    overpass_url = "https://overpass-api.de/api/interpreter"

    # Query for buildings around MQ campus
    query = f"""
    [out:json][timeout:60];
    (
      way["building"](around:{SEARCH_RADIUS}, {MQ_LAT}, {MQ_LNG});
      relation["building"](around:{SEARCH_RADIUS}, {MQ_LAT}, {MQ_LNG});
    );
    out body;
    >;
    out skel qt;
    """

    print(f"Fetching buildings within {SEARCH_RADIUS}m of MQ campus...")
    resp = requests.get(overpass_url, params={"data": query}, timeout=120)
    resp.raise_for_status()
    return resp.json()


def fetch_osm_buildings_with_center():
    """Fetch buildings with center coordinates."""
    overpass_url = "https://overpass-api.de/api/interpreter"

    # Query for buildings with center point
    query = f"""
    [out:json][timeout:60];
    (
      way["building"](around:{SEARCH_RADIUS}, {MQ_LAT}, {MQ_LNG});
      relation["building"](around:{SEARCH_RADIUS}, {MQ_LAT}, {MQ_LNG});
    );
    out center;
    """

    print(f"Fetching buildings with center coordinates...")
    resp = requests.get(overpass_url, params={"data": query}, timeout=120)
    resp.raise_for_status()
    return resp.json()


def process_buildings(data):
    """Process OSM data into clean building records."""
    buildings = []

    for elem in data.get("elements", []):
        tags = elem.get("tags", {})

        # Get name - skip if no name
        name = tags.get("name", "")

        # Get coordinates from center
        lat = elem.get("center", {}).get("lat")
        lng = elem.get("center", {}).get("lon")

        if not lat or not lng:
            continue

        building = {
            "osm_id": elem.get("id"),
            "osm_type": elem.get("type"),
            "name": name,
            "building_type": tags.get("building", "yes"),
            "lat": round(lat, 6),
            "lng": round(lng, 6),
            "amenity": tags.get("amenity", ""),
            "operator": tags.get("operator", ""),
            "addr_street": tags.get("addr:street", ""),
            "addr_housenumber": tags.get("addr:housenumber", ""),
            "levels": tags.get("building:levels", ""),
            "wheelchair": tags.get("wheelchair", ""),
            "opening_hours": tags.get("opening_hours", ""),
        }

        buildings.append(building)

    return buildings


def save_json(buildings, filepath):
    """Save buildings to JSON file."""
    output = {
        "timestamp": datetime.now().isoformat(),
        "source": "OpenStreetMap Overpass API",
        "center": {"lat": MQ_LAT, "lng": MQ_LNG},
        "radius_meters": SEARCH_RADIUS,
        "total_buildings": len(buildings),
        "named_buildings": len([b for b in buildings if b["name"]]),
        "buildings": buildings,
    }

    with open(filepath, "w") as f:
        json.dump(output, f, indent=2)

    print(f"Saved {len(buildings)} buildings to {filepath}")


def save_csv(buildings, filepath):
    """Save buildings to CSV file."""
    # Only save named buildings to CSV
    named = [b for b in buildings if b["name"]]

    fieldnames = [
        "name",
        "building_type",
        "lat",
        "lng",
        "amenity",
        "addr_street",
        "osm_id",
    ]

    with open(filepath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(named)

    print(f"Saved {len(named)} named buildings to {filepath}")


def main():
    # Ensure output directory exists
    output_dir = "data/mq-exports"
    os.makedirs(output_dir, exist_ok=True)

    # Fetch data
    data = fetch_osm_buildings_with_center()

    # Process buildings
    buildings = process_buildings(data)

    # Stats
    total = len(buildings)
    named = len([b for b in buildings if b["name"]])
    print(f"\n📊 Results:")
    print(f"   Total buildings: {total}")
    print(f"   Named buildings: {named}")

    # Save outputs
    json_path = os.path.join(output_dir, "osm_buildings.json")
    csv_path = os.path.join(output_dir, "osm_buildings.csv")

    save_json(buildings, json_path)
    save_csv(buildings, csv_path)

    # Print sample
    print(f"\n📍 Sample named buildings:")
    for b in [b for b in buildings if b["name"]][:15]:
        print(f"   {b['name']} ({b['building_type']}) @ {b['lat']}, {b['lng']}")


if __name__ == "__main__":
    main()
