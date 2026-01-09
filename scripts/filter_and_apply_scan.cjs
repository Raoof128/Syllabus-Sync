const fs = require('fs');
const path = require('path');

// --- 1. Current Buildings Data (Simplified) ---
const buildingsPath = path.join(process.cwd(), 'lib/map/buildings.ts');
const buildingsContent = fs.readFileSync(buildingsPath, 'utf8');

const existingPositions = [];
// Match: position: [123, 456]
const posRegex = /position:\s*\[(\d+),\s*(\d+)\]/g;
let match;
while ((match = posRegex.exec(buildingsContent)) !== null) {
  existingPositions.push({ x: parseInt(match[1]), y: parseInt(match[2]) });
}

// --- 2. Candidates from Scan ---
const candidates = [
  {
    "id": "23WW",
    "name": "23WW",
    "position": [2982, 1358],
    "category": "academic",
    "description": "23WW building.",
    "location": { "lat": -33.775064, "lng": 151.111811, "osmId": 6784791 }
  },
  {
    "id": "SIEMENS",
    "name": "Siemens",
    "position": [2258, 3173],
    "category": "academic",
    "description": "Siemens building.",
    "location": { "lat": -33.774767, "lng": 151.11994, "osmId": 6784971 }
  },
  {
    "id": "82WATERLOO",
    "name": "82 Waterloo Road",
    "position": [4246, 3222],
    "category": "residential",
    "description": "82 Waterloo Road apartments.",
    "location": { "lat": -33.779827, "lng": 151.120073, "osmId": 23716745 }
  },
  {
    "id": "93WATERLOO",
    "name": "93 Waterloo Road",
    "position": [4001, 3663],
    "category": "academic",
    "description": "93 Waterloo Road office.",
    "location": { "lat": -33.77958, "lng": 151.122053, "osmId": 23716748 }
  },
  {
    "id": "THERANCH",
    "name": "The Ranch",
    "position": [5495, 1550],
    "category": "food",
    "description": "The Ranch restaurant.",
    "location": { "lat": -33.781568, "lng": 151.112559, "osmId": 75739210 }
  },
  {
    "id": "10HA",
    "name": "10HA",
    "position": [3645, 518],
    "category": "academic",
    "description": "10HA building.",
    "location": { "lat": -33.776031, "lng": 151.108038, "osmId": 100955278 }
  },
  {
    "id": "16MW",
    "name": "16MW (Macquarie University Library)",
    "position": [3133, 1670],
    "category": "academic",
    "description": "16MW building.",
    "location": { "lat": -33.77571, "lng": 151.1132, "osmId": 141281549 }
  },
  {
    "id": "LAKESIDEHO",
    "name": "Lakeside Hotel & Conference Centre",
    "position": [1191, 2285],
    "category": "academic",
    "description": "Lakeside Hotel & Conference Centre.",
    "location": { "lat": -33.771329, "lng": 151.116029, "osmId": 148387967 }
  },
  {
    "id": "8LR",
    "name": "8LR (Banksia Cottage)",
    "position": [3237, 732],
    "category": "academic",
    "description": "8LR building.",
    "location": { "lat": -33.77518, "lng": 151.109008, "osmId": 148389594 }
  },
  {
    "id": "MACQUARIEC",
    "name": "Macquarie Centre",
    "position": [3094, 3630],
    "category": "food",
    "description": "Macquarie Centre mall.",
    "location": { "lat": -33.777263, "lng": 151.121943, "osmId": 201725087 }
  },
  {
    "id": "11GR",
    "name": "11GR (Lighthouse Theatre)",
    "position": [1847, 1371],
    "category": "academic",
    "description": "11GR building.",
    "location": { "lat": -33.772213, "lng": 151.111922, "osmId": 205588350 }
  },
  {
    "id": "10GR",
    "name": "10GR (Macquarie University Sport and Aquatic Centre)",
    "position": [2132, 1111],
    "category": "sports",
    "description": "10GR building.",
    "location": { "lat": -33.772712, "lng": 151.11075, "osmId": 205588367 }
  },
  {
    "id": "DUNMORELAN",
    "name": "Dunmore Lang College - Postgraduate Apartments",
    "position": [4447, 2350],
    "category": "residential",
    "description": "Dunmore Lang College apartments.",
    "location": { "lat": -33.779599, "lng": 151.116174, "osmId": 205588642 }
  },
  {
    "id": "FUJITSUAUS",
    "name": "Fujitsu Australia Limited",
    "position": [1707, 2981],
    "category": "academic",
    "description": "Fujitsu Australia Limited office.",
    "location": { "lat": -33.773217, "lng": 151.11911, "osmId": 412583875 }
  },
  {
    "id": "8492TALAVE",
    "name": "84-92 Talavera Road",
    "position": [2360, 3624],
    "category": "academic",
    "description": "84-92 Talavera Road building.",
    "location": { "lat": -33.775407, "lng": 151.12195, "osmId": 420147599 }
  },
  {
    "id": "94110TALAV",
    "name": "94-110 Talavera Road",
    "position": [2293, 3559],
    "category": "academic",
    "description": "94-110 Talavera Road building.",
    "location": { "lat": -33.775182, "lng": 151.121663, "osmId": 420147600 }
  },
  {
    "id": "29WW",
    "name": "29WW",
    "position": [2838, 1027],
    "category": "academic",
    "description": "29WW building.",
    "location": { "lat": -33.774423, "lng": 151.110342, "osmId": 455246541 }
  },
  {
    "id": "27WW",
    "name": "27WW (Lotus Theatre)",
    "position": [2887, 1092],
    "category": "academic",
    "description": "27WW building.",
    "location": { "lat": -33.774601, "lng": 151.110631, "osmId": 455246542 }
  },
  {
    "id": "25WW",
    "name": "25WW",
    "position": [2957, 1184],
    "category": "academic",
    "description": "25WW building.",
    "location": { "lat": -33.774855, "lng": 151.111037, "osmId": 458998300 }
  },
  {
    "id": "21WW",
    "name": "21WW (Macquarie Theatre)",
    "position": [2773, 1474],
    "category": "academic",
    "description": "21WW building.",
    "location": { "lat": -33.774636, "lng": 151.112338, "osmId": 458998304 }
  },
  {
    "id": "14SW",
    "name": "14SW",
    "position": [2849, 1551],
    "category": "academic",
    "description": "14SW building.",
    "location": { "lat": -33.774892, "lng": 151.112682, "osmId": 458998305 }
  },
  {
    "id": "MERCURESYD",
    "name": "Mercure Sydney Macquarie",
    "position": [1572, 2491],
    "category": "academic",
    "description": "Mercure Sydney Macquarie.",
    "location": { "lat": -33.772462, "lng": 151.116932, "osmId": 459015422 }
  },
  {
    "id": "2TP",
    "name": "2TP",
    "position": [1723, 2663],
    "category": "academic",
    "description": "2TP building.",
    "location": { "lat": -33.772989, "lng": 151.117692, "osmId": 459015453 }
  },
  {
    "id": "MACQUARIEU",
    "name": "Macquarie University Hospital",
    "position": [1993, 2744],
    "category": "academic",
    "description": "Macquarie University Hospital.",
    "location": { "lat": -33.773738, "lng": 151.118041, "osmId": 459015460 }
  },
  {
    "id": "STUDENTACC",
    "name": "Student Accommodation",
    "position": [2161, 1552],
    "category": "academic",
    "description": "Student Accommodation.",
    "location": { "lat": -33.773156, "lng": 151.112713, "osmId": 914350787 }
  },
  {
    "id": "HOBART",
    "name": "Hobart",
    "position": [5009, 1733],
    "category": "residential",
    "description": "Hobart apartments.",
    "location": { "lat": -33.780496, "lng": 151.113395, "osmId": 967523410 }
  },
  {
    "id": "MELBOURNE",
    "name": "Melbourne",
    "position": [5088, 1834],
    "category": "residential",
    "description": "Melbourne apartments.",
    "location": { "lat": -33.780779, "lng": 151.113843, "osmId": 967523411 }
  },
  {
    "id": "SYDNEY",
    "name": "Sydney",
    "position": [5177, 1703],
    "category": "residential",
    "description": "Sydney apartments.",
    "location": { "lat": -33.780895, "lng": 151.113255, "osmId": 967523412 }
  },
  {
    "id": "BRISBANE",
    "name": "Brisbane",
    "position": [5070, 1580],
    "category": "residential",
    "description": "Brisbane apartments.",
    "location": { "lat": -33.780522, "lng": 151.112713, "osmId": 967523413 }
  },
  {
    "id": "1SAUNDERSC",
    "name": "1 Saunders Close",
    "position": [4417, 2133],
    "category": "residential",
    "description": "1 Saunders Close apartments.",
    "location": { "lat": -33.779339, "lng": 151.115209, "osmId": 967530681 }
  },
  {
    "id": "2SAUNDERSC",
    "name": "2 Saunders Close",
    "position": [4249, 2263],
    "category": "residential",
    "description": "2 Saunders Close apartments.",
    "location": { "lat": -33.779025, "lng": 151.115796, "osmId": 967530682 }
  },
  {
    "id": "4SAUNDERSC",
    "name": "4 Saunders Close",
    "position": [4191, 2165],
    "category": "residential",
    "description": "4 Saunders Close apartments.",
    "location": { "lat": -33.778795, "lng": 151.11536, "osmId": 967530683 }
  },
  {
    "id": "6SAUNDERSC",
    "name": "6 Saunders Close",
    "position": [4082, 2061],
    "category": "residential",
    "description": "6 Saunders Close apartments.",
    "location": { "lat": -33.778433, "lng": 151.1149, "osmId": 967530684 }
  },
  {
    "id": "8SAUNDERSC",
    "name": "8 Saunders Close",
    "position": [3995, 1959],
    "category": "residential",
    "description": "8 Saunders Close apartments.",
    "location": { "lat": -33.778128, "lng": 151.114451, "osmId": 967530685 }
  },
  {
    "id": "120HERRING",
    "name": "120 Herring Road",
    "position": [4702, 1971],
    "category": "residential",
    "description": "120 Herring Road apartments.",
    "location": { "lat": -33.779922, "lng": 151.11447, "osmId": 968737345 }
  },
  {
    "id": "155HERRING",
    "name": "155 Herring Road",
    "position": [4694, 2235],
    "category": "residential",
    "description": "155 Herring Road apartments.",
    "location": { "lat": -33.780123, "lng": 151.115651, "osmId": 982138146 }
  },
  {
    "id": "1PEACHTREE",
    "name": "1 Peach Tree Road",
    "position": [4894, 2405],
    "category": "residential",
    "description": "1 Peach Tree Road apartments.",
    "location": { "lat": -33.780772, "lng": 151.116402, "osmId": 982138154 }
  },
  {
    "id": "3PEACHTREE",
    "name": "3 Peach Tree Road",
    "position": [4949, 2469],
    "category": "residential",
    "description": "3 Peach Tree Road apartments.",
    "location": { "lat": -33.780964, "lng": 151.116685, "osmId": 982138158 }
  },
  {
    "id": "5PEACHTREE",
    "name": "5 Peach Tree Road",
    "position": [5013, 2537],
    "category": "residential",
    "description": "5 Peach Tree Road apartments.",
    "location": { "lat": -33.781183, "lng": 151.116982, "osmId": 982138159 }
  },
  {
    "id": "7PEACHTREE",
    "name": "7 Peach Tree Road",
    "position": [5079, 2602],
    "category": "residential",
    "description": "7 Peach Tree Road apartments.",
    "location": { "lat": -33.781406, "lng": 151.117272, "osmId": 982138160 }
  },
  {
    "id": "210COTTONW",
    "name": "2-10 Cottonwood Crescent",
    "position": [4435, 2867],
    "category": "residential",
    "description": "2-10 Cottonwood Crescent apartments.",
    "location": { "lat": -33.780003, "lng": 151.11848, "osmId": 982143456 }
  },
  {
    "id": "13LACHLANA",
    "name": "1-3 Lachlan Avenue",
    "position": [4778, 2302],
    "category": "academic",
    "description": "1-3 Lachlan Avenue.",
    "location": { "lat": -33.780393, "lng": 151.115944, "osmId": 982143458 }
  },
  {
    "id": "9PEACHTREE",
    "name": "9 Peach Tree Road",
    "position": [5136, 2692],
    "category": "residential",
    "description": "9 Peach Tree Road apartments.",
    "location": { "lat": -33.781624, "lng": 151.117671, "osmId": 982143459 }
  },
  {
    "id": "157HERRING",
    "name": "157 Herring Road",
    "position": [4572, 2296],
    "category": "residential",
    "description": "157 Herring Road apartments.",
    "location": { "lat": -33.779869, "lng": 151.11593, "osmId": 984576836 }
  },
  {
    "id": "DANMURPHYS",
    "name": "Dan Murphy's",
    "position": [5366, 1385],
    "category": "food",
    "description": "Dan Murphy's liquor store.",
    "location": { "lat": -33.781102, "lng": 151.111828, "osmId": 991365824 }
  },
  {
    "id": "205A",
    "name": "205A CR",
    "position": [667, 1324],
    "category": "academic",
    "description": "205A CR building.",
    "location": { "lat": -33.769196, "lng": 151.111763, "osmId": 1065030401 }
  },
  {
    "id": "205B",
    "name": "205B CR",
    "position": [814, 1294],
    "category": "academic",
    "description": "205B CR building.",
    "location": { "lat": -33.769541, "lng": 151.111623, "osmId": 1065030402 }
  },
  {
    "id": "8HA",
    "name": "8HA (Incubator)",
    "position": [3616, 747],
    "category": "academic",
    "description": "8HA (Incubator).",
    "location": { "lat": -33.776149, "lng": 151.109059, "osmId": 1107882877 }
  },
  {
    "id": "5GR",
    "name": "5GR (Macquarie Observatory)",
    "position": [1173, 1186],
    "category": "academic",
    "description": "5GR (Macquarie Observatory).",
    "location": { "lat": -33.770356, "lng": 151.111124, "osmId": 1192242193 }
  },
  {
    "id": "1WW",
    "name": "1WW (Ainsworth Building)",
    "position": [2166, 2769],
    "category": "academic",
    "description": "1WW (Ainsworth Building).",
    "location": { "lat": -33.774195, "lng": 151.118145, "osmId": 1303624871 }
  },
  {
    "id": "13ARPD",
    "name": "13ARPD",
    "position": [1863, 2437],
    "category": "academic",
    "description": "13ARPD building.",
    "location": { "lat": -33.773151, "lng": 151.116676, "osmId": 1303624873 }
  }
];

// --- 3. Filter Candidates ---
// Threshold: 50 pixels distance
const THRESHOLD = 50;

const validCandidates = candidates.filter(c => {
  // Check if any existing building is too close
  const isDuplicate = existingPositions.some(existing => {
    const dist = Math.sqrt(
      Math.pow(c.position[0] - existing.x, 2) +
      Math.pow(c.position[1] - existing.y, 2)
    );
    return dist < THRESHOLD;
  });
  
  if (isDuplicate) {
    console.log(`Skipping duplicate/close match: ${c.id} (${c.name})`);
    return false;
  }
  
  return true;
});

console.log(`Found ${validCandidates.length} new valid buildings.`);

// --- 4. Append to Buildings TS ---
const closingBracketIndex = buildingsContent.lastIndexOf('];');
if (closingBracketIndex === -1) {
  console.error('Could not find closing bracket of buildings array');
  process.exit(1);
}

const newBuildingsCode = validCandidates.map(b => {
  // Ensure valid translation keys (no dots/spaces)
  const safeId = b.id.replace(/[^A-Za-z0-9]/g, '_');
  const tKey = `building_${safeId}_name`;
  const dKey = `building_${safeId}_desc`;
  
  // Also update the candidate object to match what we write
  b.translationKey = tKey;
  b.descriptionKey = dKey;

  return `  {
    id: '${b.id}',
    name: ${JSON.stringify(b.name)},
    position: [${b.position[0]}, ${b.position[1]}],
    description: ${JSON.stringify(b.description)},
    tags: ["${b.category}"],
    translationKey: '${tKey}',
    descriptionKey: '${dKey}',
    category: '${b.category}',
    location: { lat: ${b.location.lat}, lng: ${b.location.lng}, osmId: ${b.location.osmId} },
    levels: 1
  }`;
}).join(',\n');

if (validCandidates.length > 0) {
  const updatedBuildingsContent = 
    buildingsContent.slice(0, closingBracketIndex) + 
    '  // --- ADDITIONAL BUILDINGS (Full Scan) ---\n' +
    newBuildingsCode + 
    '\n' + 
    buildingsContent.slice(closingBracketIndex);

  fs.writeFileSync(buildingsPath, updatedBuildingsContent);
  console.log('Updated lib/map/buildings.ts');

  // --- 5. Update Translations ---
  const translationsPath = path.join(process.cwd(), 'locales/en/translations.json');
  const translations = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));

  validCandidates.forEach(b => {
    translations[b.translationKey] = b.name;
    translations[b.descriptionKey] = b.description;
  });

  fs.writeFileSync(translationsPath, JSON.stringify(translations, null, 2));
  console.log('Updated locales/en/translations.json');
} else {
  console.log('No new buildings to add.');
}