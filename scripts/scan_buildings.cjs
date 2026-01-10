const fs = require('fs');

// Load both files
const geojson = JSON.parse(fs.readFileSync('data/MQ_Full.geojson', 'utf-8'));
const buildingsContent = fs.readFileSync('lib/map/buildings.ts', 'utf-8');

// Extract all OSM IDs from buildings.ts
const osmIdMatches = buildingsContent.match(/osmId:\s*(\d+)/g) || [];
const existingOsmIds = new Set(osmIdMatches.map((m) => parseInt(m.replace('osmId: ', ''))));

// Get named features from GeoJSON
const namedFeatures = geojson.features.filter((f) => f.properties && f.properties.name);

// Find missing buildings
const missing = namedFeatures.filter((f) => {
  const osmId = parseInt(f.id.split('/')[1]);
  return !existingOsmIds.has(osmId);
});

console.log('=== BUILDING SCAN REPORT ===');
console.log('GeoJSON named features:', namedFeatures.length);
console.log('Existing OSM IDs in buildings.ts:', existingOsmIds.size);
console.log('Missing buildings:', missing.length);
console.log('');

if (missing.length > 0) {
  console.log('=== MISSING BUILDINGS ===');
  missing.forEach((f) => {
    const osmId = f.id.split('/')[1];
    const coords =
      f.geometry.type === 'Polygon'
        ? f.geometry.coordinates[0][0]
        : f.geometry.type === 'MultiPolygon'
          ? f.geometry.coordinates[0][0][0]
          : null;
    console.log(
      JSON.stringify({
        name: f.properties.name,
        osmId: osmId,
        lat: coords ? coords[1] : null,
        lng: coords ? coords[0] : null,
        levels: f.properties['building:levels'],
        addr: f.properties['addr:street'],
      }),
    );
  });
} else {
  console.log('✅ ALL BUILDINGS FROM GEOJSON ARE NOW IN BUILDINGS.TS');
}

// Also check for translation keys
const translationsContent = fs.readFileSync('locales/en/translations.json', 'utf-8');
const translations = JSON.parse(translationsContent);

// Extract building IDs from buildings.ts
const buildingIdMatches = buildingsContent.match(/id:\s*'([^']+)'/g) || [];
const buildingIds = buildingIdMatches.map((m) => m.replace("id: '", '').replace("'", ''));

console.log('\n=== TRANSLATION KEY CHECK ===');
console.log('Total buildings in buildings.ts:', buildingIds.length);

const missingTranslations = [];
buildingIds.forEach((id) => {
  const nameKey = `building_${id}_name`;
  const descKey = `building_${id}_desc`;
  if (!translations[nameKey]) {
    missingTranslations.push(nameKey);
  }
  if (!translations[descKey]) {
    missingTranslations.push(descKey);
  }
});

if (missingTranslations.length > 0) {
  console.log('Missing translation keys:', missingTranslations.length);
  missingTranslations.forEach((k) => console.log('  - ' + k));
} else {
  console.log('✅ ALL TRANSLATION KEYS PRESENT');
}
