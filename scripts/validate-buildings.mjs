import fs from 'fs';
import path from 'path';

// Read the buildings file
const buildingsFilePath = path.join(process.cwd(), 'lib/map/buildings.ts');
const fileContent = fs.readFileSync(buildingsFilePath, 'utf8');

// Read the translations file
const translationsFilePath = path.join(process.cwd(), 'locales/en/translations.json');
let translationKeys = new Set();
try {
  const translationsContent = fs.readFileSync(translationsFilePath, 'utf8');
  const translations = JSON.parse(translationsContent);
  translationKeys = new Set(Object.keys(translations));
} catch (e) {
  console.error('Failed to read or parse translations.json:', e);
  // Continue without translation validation if file missing (but report error)
  console.log('⚠️ Skipping translation key validation due to missing file.');
}

// Extract the buildings array string
// We look for 'export const buildings: Building[] = [' and the end of the array
const startMarker = 'export const buildings: Building[] = [';
const startIndex = fileContent.indexOf(startMarker);

if (startIndex === -1) {
  console.error('Could not find buildings array start.');
  process.exit(1);
}

const arrayStart = startIndex + startMarker.length - 1; // Include the opening '['
let arrayEnd = -1;
let openBrackets = 0;

// Simple bracket counting to find the end of the array
for (let i = arrayStart; i < fileContent.length; i++) {
  if (fileContent[i] === '[') openBrackets++;
  if (fileContent[i] === ']') openBrackets--;

  if (openBrackets === 0) {
    arrayEnd = i + 1;
    break;
  }
}

if (arrayEnd === -1) {
  console.error('Could not find buildings array end.');
  process.exit(1);
}

const buildingsString = fileContent.substring(arrayStart, arrayEnd);

// Prepare the string for evaluation
let buildings;
try {
  // Use Function to eval the array string
  const evalString = `return ${buildingsString};`;
  buildings = new Function(evalString)();
} catch (e) {
  console.error('Failed to parse buildings array:', e);
  console.log('Snippet:', buildingsString.substring(0, 200) + '...');
  process.exit(1);
}

// Validation Logic
console.log(`Analyzing ${buildings.length} buildings...\n`);

const errors = [];
const warnings = [];

// 1. Duplicate IDs
const ids = new Set();
const duplicateIds = new Set();

buildings.forEach((b) => {
  if (ids.has(b.id)) {
    duplicateIds.add(b.id);
  }
  ids.add(b.id);
});

if (duplicateIds.size > 0) {
  errors.push(`Duplicate IDs found: ${Array.from(duplicateIds).join(', ')}`);
}

// Sydney Bounds (Approximate)
const SYDNEY_BOUNDS = {
  north: -33.5,
  south: -34.1,
  west: 150.5,
  east: 151.4,
};

// Map Dimensions
const MAP_DIMS = { width: 4678, height: 3307 };

buildings.forEach((b, index) => {
  const context = `Building [${index}] (ID: ${b.id || 'MISSING'})`;

  // 2. Missing Critical Fields
  if (!b.id) errors.push(`${context}: Missing 'id'`);
  if (!b.name) errors.push(`${context}: Missing 'name'`);
  if (!b.category) errors.push(`${context}: Missing 'category'`);

  if (!b.location) {
    if (['academic', 'services', 'health', 'food'].includes(b.category)) {
      warnings.push(`${context}: Missing 'location' (GPS) - Recommended for ${b.category}`);
    }
  }

  // 3. Invalid Coordinates
  if (!b.position || !Array.isArray(b.position) || b.position.length !== 2) {
    errors.push(`${context}: Invalid 'position' format. Expected [x, y]`);
  } else {
    const [x, y] = b.position;
    if (x < 0 || x > MAP_DIMS.width || y < 0 || y > MAP_DIMS.height) {
      errors.push(
        `${context}: Position [${x}, ${y}] out of map bounds (${MAP_DIMS.width}x${MAP_DIMS.height})`,
      );
    }
  }

  if (b.location) {
    const { lat, lng } = b.location;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      errors.push(`${context}: Invalid 'location' format. lat/lng must be numbers`);
    } else {
      if (
        lat > SYDNEY_BOUNDS.north ||
        lat < SYDNEY_BOUNDS.south ||
        lng < SYDNEY_BOUNDS.west ||
        lng > SYDNEY_BOUNDS.east
      ) {
        errors.push(
          `${context}: GPS location {lat: ${lat}, lng: ${lng}} seems outside Sydney area`,
        );
      }
    }
  }

  // 4. Malformed tags or missing translation keys
  if (b.translationKey) {
    if (!b.translationKey.startsWith('building_')) {
      warnings.push(
        `${context}: translationKey '${b.translationKey}' should likely start with 'building_'`,
      );
    }
    if (b.translationKey.includes(' ')) {
      errors.push(`${context}: translationKey contains spaces: '${b.translationKey}'`);
    }
    if (translationKeys.size > 0 && !translationKeys.has(b.translationKey)) {
      errors.push(
        `${context}: translationKey '${b.translationKey}' not found in translations.json`,
      );
    }
  } else {
    // Check if mandatory? The type def says it is mandatory in the file I read earlier
    // "translationKey: TranslationKey;" (no question mark)
    errors.push(`${context}: Missing 'translationKey'`);
  }

  if (b.descriptionKey) {
    if (translationKeys.size > 0 && !translationKeys.has(b.descriptionKey)) {
      errors.push(
        `${context}: descriptionKey '${b.descriptionKey}' not found in translations.json`,
      );
    }
  } else {
    // "descriptionKey: TranslationKey;" (no question mark in earlier read)
    errors.push(`${context}: Missing 'descriptionKey'`);
  }

  if (b.tags && !Array.isArray(b.tags)) {
    errors.push(`${context}: 'tags' must be an array of strings`);
  }
});

// Report Results
if (errors.length > 0) {
  console.log('❌ ERRORS FOUND:');
  errors.forEach((e) => console.log(`  - ${e}`));
} else {
  console.log('✅ No critical errors found.');
}

if (warnings.length > 0) {
  console.log('\n⚠️ WARNINGS:');
  warnings.forEach((w) => console.log(`  - ${w}`));
}
