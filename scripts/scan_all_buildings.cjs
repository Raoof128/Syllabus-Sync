const fs = require('fs');
const path = require('path');

// --- 1. Current IDs (Updated from grep output) ---
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
  // Newly added
  'EAST3',
  'EAST2',
  '75TR',
  '3SR',
  '6FW',
  '17MW',
  '1MD',
  '3MD',
  '5MD',
  '1EXR',
  '2FW',
  '4FW',
  '2LR',
  '6LR',
  '4LR',
  'DESTINATIO',
  '3IR',
  '1IR',
  '15RPD',
  'RONREILLYP',
  'M2OPERATIO',
  'ADELAIDE',
  'DARWIN',
  'PERTH',
  'BLOCKA',
  'BLOCKB',
  'BLOCKC',
  'BLOCKD',
  'BLOCKE',
  'BLOCKF',
  'VILLAS',
  'HOLIDAYINN',
  'MACRESIDEN',
  '6MD',
  '7MD',
  '12MW',
  '18ER',
  '2WW',
  'REDDYEXPRE',
]);

// --- 2. Coordinate Transforms ---
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

const points = [
  { id: '18WW', grid: 'N16', lat: -33.774021, lng: 151.11261 },
  { id: 'LIB', grid: 'Q17', lat: -33.775705, lng: 151.113082 },
  { id: '4ER', grid: 'Q22', lat: -33.775808, lng: 151.115985 },
  { id: '6WW', grid: 'M23', lat: -33.774152, lng: 151.116117 },
  { id: '75TAL', grid: 'M28', lat: -33.774163, lng: 151.118636 },
];

const controlPoints = points.map((p) => {
  const [px, py] = gridToPixel(p.grid);
  return { ...p, px, py };
});

const p1 = controlPoints[0];
const p2 = controlPoints[1];
const p3 = controlPoints[3];

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
  return [Math.max(1, x), Math.max(1, y)]; // Ensure > 0 for tests
};

// --- 3. Geo Process ---
const getCentroid = (geometry) => {
  if (!geometry) return null;
  if (geometry.type === 'Polygon') {
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
  } else if (geometry.type === 'Point') {
    return { lat: geometry.coordinates[1], lng: geometry.coordinates[0] };
  }
  return null;
};

// --- 4. Main Scan ---
const geojsonRaw = fs.readFileSync('./data/MQ_Full.geojson', 'utf8');
const geojson = JSON.parse(geojsonRaw);

const candidates = [];

// Helper to make ID
const generateId = (name, props) => {
  // 1. Try "12WW" pattern
  let match = name.match(/^(\d+[A-Z]+)/);
  if (match) return match[1];

  // 2. Try "Building C5C"
  match = name.match(/Building\s+([A-Z0-9]+)/i);
  if (match) return match[1];

  // 3. Fallback: Uppercase alphanumeric, max 10 chars
  // "Macquarie University Library" -> "MACQUARIEU"
  // "The Ranch" -> "THERANCH"
  const clean = name.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return clean.slice(0, 10);
};

const guessCategory = (props) => {
  const name = props.name || '';
  if (props.building === 'university' || props['department']) return 'academic';
  if (props.amenity === 'parking') return 'other';
  if (
    props.amenity === 'cafe' ||
    props.amenity === 'restaurant' ||
    props.amenity === 'fast_food' ||
    props.shop
  )
    return 'food';
  if (name.includes('Research') || name.includes('Lab')) return 'research';
  if (name.includes('Sport') || name.includes('Gym') || props.leisure) return 'sports';
  if (
    props.building === 'residential' ||
    props.building === 'apartments' ||
    props.building === 'college'
  )
    return 'residential';
  if (props.amenity === 'toilets') return 'services';
  return 'academic'; // Default
};

geojson.features.forEach((feature) => {
  const props = feature.properties || {};
  let name = props.name;

  // If no name, check for address to make a descriptive name
  if (!name && props['addr:housenumber'] && props['addr:street']) {
    name = `${props['addr:housenumber']} ${props['addr:street']}`;
  }

  if (!name) return; // Skip completely unnamed things for now

  const id = generateId(name, props);
  if (!id) return;

  // Skip if already exists
  if (existingIds.has(id)) return;

  const centroid = getCentroid(feature.geometry);
  if (!centroid) return;

  const [px, py] = latLngToPixel(centroid.lat, centroid.lng);

  // Loose bounds check just to avoid things in another city
  // Campus map is roughly 0,0 to 5000,3500
  // Let's accept anything in a wider 10k buffer just to see
  if (px < -2000 || px > 7000 || py < -2000 || py > 5000) return;

  const candidate = {
    id,
    name,
    position: [px, py],
    category: guessCategory(props),
    osm_props: {
      building: props.building,
      amenity: props.amenity,
      shop: props.shop,
      leisure: props.leisure,
    },
    location: {
      lat: Number(centroid.lat.toFixed(6)),
      lng: Number(centroid.lng.toFixed(6)),
      osmId: feature.id ? feature.id.replace(/[^\d]/g, '') : undefined,
    },
  };

  candidates.push(candidate);
  existingIds.add(id); // Avoid dupes in this run
});

console.log(JSON.stringify(candidates, null, 2));
