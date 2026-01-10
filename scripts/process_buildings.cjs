const fs = require('fs');
const path = require('path');

// --- 1. Helpers ---

// Replicate gridToPixel from buildings.ts to get ground truth pixels
const gridToPixel = (ref) => {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return [2339, 1654];

  const colStr = match[1];
  const row = parseInt(match[2], 10);

  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 64);
  }

  const x = Math.round(((col - 3) / 20) * 4200 + 200);
  const y = Math.round(((row - 5) / 25) * 2800 + 300);

  return [Math.max(100, Math.min(4578, x)), Math.max(100, Math.min(3207, y))];
};

// Calculate centroid of GeoJSON geometry
const getCentroid = (geometry) => {
  if (geometry.type === 'Polygon') {
    // Simple average of first ring
    const ring = geometry.coordinates[0];
    let sumLat = 0,
      sumLng = 0,
      count = 0;
    for (const [lng, lat] of ring) {
      sumLat += lat;
      sumLng += lng;
      count++;
    }
    return { lat: sumLat / count, lng: sumLng / count };
  } else if (geometry.type === 'MultiPolygon') {
    // Average of first ring of first polygon (simplification)
    const ring = geometry.coordinates[0][0];
    let sumLat = 0,
      sumLng = 0,
      count = 0;
    for (const [lng, lat] of ring) {
      sumLat += lat;
      sumLng += lng;
      count++;
    }
    return { lat: sumLat / count, lng: sumLng / count };
  }
  return null;
};

// --- 2. Calibration Points (Lat/Lng -> Pixel) ---
// Extracted from buildings.ts
const points = [
  { id: '18WW', grid: 'N16', lat: -33.774021, lng: 151.11261 },
  { id: 'LIB', grid: 'Q17', lat: -33.775705, lng: 151.113082 },
  { id: '4ER', grid: 'Q22', lat: -33.775808, lng: 151.115985 },
  { id: '6WW', grid: 'M23', lat: -33.774152, lng: 151.116117 },
  { id: '75TAL', grid: 'M28', lat: -33.774163, lng: 151.118636 },
];

// Calculate pixels for control points
const controlPoints = points.map((p) => {
  const [px, py] = gridToPixel(p.grid);
  return { ...p, px, py };
});

// Simple 3-point affine transform solver
// We use 3 points to solve for A,B,C and D,E,F
// x = A*lng + B*lat + C
// y = D*lng + E*lat + F
// We'll use 18WW, LIB, and 6WW as basis
const p1 = controlPoints[0]; // 18WW
const p2 = controlPoints[1]; // LIB
const p3 = controlPoints[3]; // 6WW

function solveAffine(p1, p2, p3) {
  const det = p1.lng * (p2.lat - p3.lat) + p2.lng * (p3.lat - p1.lat) + p3.lng * (p1.lat - p2.lat);

  const A =
    (p1.px * (p2.lat - p3.lat) + p2.px * (p3.lat - p1.lat) + p3.px * (p1.lat - p2.lat)) / det;
  const B =
    (p1.px * (p3.lng - p2.lng) + p2.px * (p1.lng - p3.lng) + p3.px * (p2.lng - p1.lng)) / det;
  const C = p1.px - A * p1.lng - B * p1.lat;

  const D =
    (p1.py * (p2.lat - p3.lat) + p2.py * (p3.lat - p1.lat) + p3.py * (p1.lat - p2.lat)) / det;
  const E =
    (p1.py * (p3.lng - p2.lng) + p2.py * (p1.lng - p3.lng) + p3.py * (p2.lng - p1.lng)) / det;
  const F = p1.py - D * p1.lng - E * p1.lat;

  return { A, B, C, D, E, F };
}

const transform = solveAffine(p1, p2, p3);

const latLngToPixel = (lat, lng) => {
  const x = Math.round(transform.A * lng + transform.B * lat + transform.C);
  const y = Math.round(transform.D * lng + transform.E * lat + transform.F);
  return [Math.max(0, x), Math.max(0, y)];
};

// --- 3. Existing Buildings ---
// IDs of buildings already in buildings.ts
const existingIds = new Set([
  '18WW',
  'LIB',
  'SEC',
  '25BWW',
  '17WW',
  '4ER',
  '75TAL',
  '16UA',
  '9WW',
  '4RPD',
  '12WW',
  '6WW',
  '4WW',
  'LOTUS',
  'MQTH',
  'PRICE',
  'LIGHT',
  'AINS',
  'HOSP',
  'CLINIC',
  'WOOL',
  'SPORT',
  'FIELDS',
  'UBAR',
  'CULT',
  'LACH',
  '8SCO',
  '16WW',
  '12SW',
  '19ER',
  'OBS',
  'INCUB',
  'CHAP',
  'WALU',
  'BANK',
  'GUMNUT',
  'MIAMIA',
  'WARATAH',
  'NEXTSENSE',
  'NEXTSCHOOL',
  'METS',
  'WALLYS',
  'LIBCAFE',
  'DLC',
  'RMC',
  'MQV',
  'GALLERY',
  'BIODISC',
  '11WW',
  '13RPD',
  '6ER',
  '1CC',
  'MERCURE',
  'COCHLEAR',
  '10SCO',
  '14ER',
  '6SR',
  '14FW',
  '14SCO',
  '4WR',
]);

// --- 4. Process GeoJSON ---
const geojsonRaw = fs.readFileSync('./data/MQ_Full.geojson', 'utf8');
const geojson = JSON.parse(geojsonRaw);

const newBuildings = [];
const updates = [];
const newTranslationKeys = {};

// Helper to extract ID from name
const extractId = (name) => {
  if (!name) return null;
  // Try to match pattern "12WW" or "12 Wally's Walk" -> "12WW"
  const match = name.match(/^(\d+[A-Z]+)/);
  if (match) return match[1];

  // Try to match "Building C5C" -> "C5C"
  const match2 = name.match(/Building\s+([A-Z0-9]+)/i);
  if (match2) return match2[1];

  // If simple name "Siemens", return uppercase "SIEMENS"
  if (/^[A-Za-z0-9\s]+$/.test(name)) {
    return name.replace(/\s+/g, '').toUpperCase().slice(0, 10);
  }
  return null;
};

// Helper to determine category
const guessCategory = (props) => {
  const name = props.name || '';
  if (props.building === 'university' || props['department']) return 'academic';
  if (props.amenity === 'parking') return 'other';
  if (props.amenity === 'cafe' || props.amenity === 'restaurant' || props.amenity === 'fast_food')
    return 'food';
  if (name.includes('Research') || name.includes('Lab')) return 'research';
  if (name.includes('Sport') || name.includes('Gym')) return 'sports';
  if (
    props.building === 'residential' ||
    props.building === 'apartments' ||
    props.building === 'college'
  )
    return 'residential';
  return 'academic'; // Default
};

geojson.features.forEach((feature) => {
  const props = feature.properties || {};
  if (!props.name) return;

  const id = extractId(props.name);
  if (!id) return;

  const centroid = getCentroid(feature.geometry);
  if (!centroid) return;

  // Check if exists
  if (existingIds.has(id)) {
    // It's an update
    // We don't need to output updates for this task unless explicitly asked,
    // but let's record them just in case.
    // The task says "add all these location to it ... avoid the duplicates"
    // So we focus on adding NEW ones.
    return;
  }

  // It's new
  const [px, py] = latLngToPixel(centroid.lat, centroid.lng);

  // Filter out far away stuff (simple bbox check for campus map size)
  // Map size approx 4600 x 3300
  if (px < 0 || px > 5000 || py < 0 || py > 3500) return;

  const levels = props['building:levels'] ? parseInt(props['building:levels']) : undefined;
  const wheelchair = props.wheelchair === 'yes';
  const osmId = feature.id ? feature.id.replace(/[^\d]/g, '') : undefined;

  // Address
  const addressParts = [];
  if (props['addr:housenumber']) addressParts.push(props['addr:housenumber']);
  if (props['addr:street']) addressParts.push(props['addr:street']);
  if (props['addr:suburb']) addressParts.push(props['addr:suburb']);
  if (props['addr:state']) addressParts.push(props['addr:state']);
  const address = addressParts.join(' ') || undefined;

  const b = {
    id: id,
    name: props.name,
    position: [px, py],
    description: props.description || `${props.name} building.`,
    tags: [guessCategory(props)],
    translationKey: `building_${id}_name`,
    descriptionKey: `building_${id}_desc`,
    address: address,
    category: guessCategory(props),
    location: {
      lat: Number(centroid.lat.toFixed(6)),
      lng: Number(centroid.lng.toFixed(6)),
      osmId: osmId ? parseInt(osmId) : undefined,
    },
  };

  if (levels) b.levels = levels;
  if (wheelchair) b.wheelchair = true;

  newBuildings.push(b);
  existingIds.add(id); // Prevent duplicates within GeoJSON itself

  // Add translations
  newTranslationKeys[`building_${id}_name`] = props.name;
  newTranslationKeys[`building_${id}_desc`] = b.description;
});

console.log('// --- NEW BUILDINGS TS ---');
console.log(JSON.stringify(newBuildings, null, 2));
console.log('// --- NEW TRANSLATIONS JSON ---');
console.log(JSON.stringify(newTranslationKeys, null, 2));
