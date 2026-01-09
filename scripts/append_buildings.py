import json
import os
import re

# New data from previous scan
new_buildings = [
  {
    "name": "17WW (Michael Kirby Building)",
    "id": "17WWMICHAE",
    "category": "academic",
    "lat": -33.774771,
    "lng": 151.113278,
    "osmId": "7867502",
    "description": "17WW (Michael Kirby Building)."
  },
  {
    "name": "18WW (Service Connect)",
    "id": "18WWSERVIC",
    "category": "academic",
    "lat": -33.774029,
    "lng": 151.112563,
    "osmId": "205588336",
    "description": "18WW (Service Connect)."
  },
  {
    "name": "16WW (Lincoln Building)",
    "id": "16WWLINCOL",
    "category": "academic",
    "lat": -33.774239,
    "lng": 151.113570,
    "osmId": "205588359",
    "description": "16WW (Lincoln Building)."
  },
  {
    "name": "19ER (The Chancellery)",
    "id": "19ERTHECHA",
    "category": "academic",
    "lat": -33.772391,
    "lng": 151.114933,
    "osmId": "205588364",
    "description": "19ER (The Chancellery)."
  },
  {
    "name": "16UA (Australian Hearing Hub)",
    "id": "16UAAUSTRA",
    "category": "academic",
    "lat": -33.776584,
    "lng": 151.111717,
    "osmId": "271661421",
    "description": "16UA (Australian Hearing Hub)."
  }
]

# Coordinate Transform Helpers
def solve_affine(p1, p2, p3):
    det = p1['lng'] * (p2['lat'] - p3['lat']) + p2['lng'] * (p3['lat'] - p1['lat']) + p3['lng'] * (p1['lat'] - p2['lat'])
    A = ((p1['px'] * (p2['lat'] - p3['lat'])) + (p2['px'] * (p3['lat'] - p1['lat'])) + (p3['px'] * (p1['lat'] - p2['lat']))) / det
    B = ((p1['px'] * (p3['lng'] - p2['lng'])) + (p2['px'] * (p1['lng'] - p3['lng'])) + (p3['px'] * (p2['lng'] - p1['lng']))) / det
    C = p1['px'] - A * p1['lng'] - B * p1['lat']
    D = ((p1['py'] * (p2['lat'] - p3['lat'])) + (p2['py'] * (p3['lat'] - p1['lat'])) + (p3['py'] * (p1['lat'] - p2['lat']))) / det
    E = ((p1['py'] * (p3['lng'] - p2['lng'])) + (p2['py'] * (p1['lng'] - p3['lng'])) + (p3['py'] * (p2['lng'] - p1['lng']))) / det
    F = p1['py'] - D * p1['lng'] - E * p1['lat']
    return {'A': A, 'B': B, 'C': C, 'D': D, 'E': E, 'F': F}

def grid_to_pixel(col_idx, row_idx):
    x = round(((col_idx - 3) / 20) * 4200 + 200)
    y = round(((row_idx - 5) / 25) * 2800 + 300)
    return max(100, min(4578, x)), max(100, min(3207, y))

# Calibration points
px1, py1 = grid_to_pixel(14, 16)
p1 = {'lat': -33.774021, 'lng': 151.11261, 'px': px1, 'py': py1}

px2, py2 = grid_to_pixel(17, 17)
p2 = {'lat': -33.775705, 'lng': 151.113082, 'px': px2, 'py': py2}

px3, py3 = grid_to_pixel(13, 23)
p3 = {'lat': -33.774152, 'lng': 151.116117, 'px': px3, 'py': py3}

transform = solve_affine(p1, p2, p3)

def latlng_to_pixel(lat, lng):
    x = round(transform['A'] * lng + transform['B'] * lat + transform['C'])
    y = round(transform['D'] * lng + transform['E'] * lat + transform['F'])
    return max(1, x), max(1, y)

# 1. Read TS file
ts_path = 'lib/map/buildings.ts'
with open(ts_path, 'r') as f:
    ts_content = f.read()

# 2. Generate TS entries
entries = []
for b in new_buildings:
    px, py = latlng_to_pixel(b['lat'], b['lng'])
    # Using double curly braces to escape them in f-string
    entry = f"""
  {{
    id: '{b['id']}',
    name: \"{b['name']}\",
    position: [{px}, {py}],
    description: \"{b['description']}\",
    tags: [\"{b['category']}\"],
    translationKey: 'building_{b['id']}_name',
    descriptionKey: 'building_{b['id']}_desc',
    category: '{b['category']}',
    location: {{ lat: {b['lat']}, lng: {b['lng']}, osmId: {b['osmId']} }},
    levels: 1
  }}"""
    entries.append(entry)

insert_marker = '];'
last_idx = ts_content.rfind(insert_marker)

if last_idx != -1:
    new_ts_content = ts_content[:last_idx] + ",\n  // --- FINAL SCAN ADDITIONS ---" + ",\n".join(entries) + "\n" + ts_content[last_idx:]
    with open(ts_path, 'w') as f:
        f.write(new_ts_content)
    print(f"Updated {ts_path}")

# 3. Update Translations
json_path = 'locales/en/translations.json'
with open(json_path, 'r') as f:
    translations = json.load(f)

for b in new_buildings:
    translations[f"building_{b['id']}_name"] = b['name']
    translations[f"building_{b['id']}_desc"] = b['description']

with open(json_path, 'w') as f:
    json.dump(translations, f, indent=2)
    print(f"Updated {json_path}")