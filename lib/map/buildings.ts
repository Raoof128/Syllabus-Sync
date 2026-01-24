import type { TranslationKey } from '@/lib/i18n/translations';

// Geographic coordinates from OpenStreetMap
export type GeoLocation = {
  lat: number;
  lng: number;
  osmId?: number; // OpenStreetMap ID for attribution
};

export type Building = {
  id: string;
  name: string;
  position: [number, number]; // [x, y] pixel coordinates for map placement
  description?: string;
  tags?: string[];
  translationKey: TranslationKey;
  descriptionKey: TranslationKey;
  gridRef?: string; // Campus map grid reference (e.g., 'N16', 'O22')
  address?: string; // Physical address on campus
  category?: BuildingCategory;
  location?: GeoLocation; // Real-world GPS coordinates from OSM
  levels?: number; // Number of floors
  wheelchair?: boolean; // Wheelchair accessible
};

export type BuildingCategory =
  | 'academic'
  | 'services'
  | 'health'
  | 'food'
  | 'sports'
  | 'venue'
  | 'research'
  | 'residential'
  | 'other';

// Map dimensions and coordinate system configuration
// These MUST match the values in CampusMap.tsx
//
// === COORDINATE SYSTEM: L.CRS.Simple (v0.14.22+) ===
// The campus map uses L.CRS.Simple (pixel-based) instead of GPS coordinates.
// This eliminates edge drift by treating the map as a pure 2D pixel grid.
//
// COORDINATE SYSTEMS:
// 1. Image pixels: building.position = [x, y] where:
//    - x = horizontal pixel from LEFT edge (0 to 4678)
//    - y = vertical pixel from TOP edge (0 to 3307)
//
// 2. CRS.Simple (Leaflet): [lat, lng] where:
//    - lat = MAP_HEIGHT - y (Y-axis inverted, 0 at bottom)
//    - lng = x (same as image X)
//
// 3. Real GPS: building.location = { lat, lng } (OSM coordinates)
//    - Used ONLY for external navigation (Apple/Google Maps, ORS routing)
//    - NOT used for marker placement on the map
//
// USAGE:
// - Marker placement: Use pixelToCrsSimple() or getBuildingCrsCoords()
// - External navigation: Use getBuildingGps()
// - User geolocation: Convert GPS to approximate pixels via gpsToPixel()
//
export const MAP_CONFIG = {
  width: 4678,
  height: 3307,
  // GPS bounds kept for approximate geolocation conversion only
  // NOT used for marker placement (CRS.Simple uses pixels directly)
  // Updated 2026-01-20: Optimized bounds from GCP calibration
  bounds: {
    north: -33.769571,
    south: -33.778124,
    east: 151.122172,
    west: 151.103934,
  },
} as const;

// =============================================================================
// CRS.Simple Coordinate Conversion Functions
// =============================================================================

/**
 * Convert image pixel coordinates to CRS.Simple coordinates for Leaflet.
 * This is the PRIMARY function for marker placement on the map.
 *
 * @param x - Horizontal pixel from left edge (0 to 4678)
 * @param y - Vertical pixel from top edge (0 to 3307)
 * @returns CRS.Simple coordinates { lat, lng } where lat = height - y, lng = x
 */
export function pixelToCrsSimple(x: number, y: number): { lat: number; lng: number } {
  return {
    lat: MAP_CONFIG.height - y, // Invert Y axis (CRS.Simple has Y=0 at bottom)
    lng: x,
  };
}

/**
 * Convert CRS.Simple coordinates back to image pixel coordinates.
 *
 * @param lat - CRS.Simple latitude (inverted Y)
 * @param lng - CRS.Simple longitude (same as X)
 * @returns Image pixel coordinates [x, y]
 */
export function crsSimpleToPixel(lat: number, lng: number): [number, number] {
  return [lng, MAP_CONFIG.height - lat];
}

// =============================================================================
// GPS Conversion Functions (for geolocation and external navigation)
// =============================================================================

/**
 * Convert GPS coordinates to approximate pixel position.
 * Used for displaying user's real-world location on the map.
 * NOTE: This is approximate since the map is not georeferenced.
 *
 * @param lat - GPS latitude
 * @param lng - GPS longitude
 * @returns Approximate pixel coordinates [x, y]
 */
export function gpsToPixel(lat: number, lng: number): [number, number] {
  const { width, height, bounds } = MAP_CONFIG;
  const { south, north, west, east } = bounds;

  // Calculate normalized position (0-1)
  const xNorm = (lng - west) / (east - west);
  const yNorm = (north - lat) / (north - south);

  // Convert to pixel coordinates
  const x = Math.round(xNorm * width);
  const y = Math.round(yNorm * height);

  return [x, y];
}

/**
 * Convert pixel position to approximate GPS coordinates.
 * Used as fallback for buildings without OSM GPS data.
 * NOTE: Result is approximate, not real-world GPS.
 *
 * @deprecated Use getBuildingGps() instead which prefers OSM GPS coordinates.
 * @param x - Horizontal pixel from left edge
 * @param y - Vertical pixel from top edge
 * @returns Approximate GPS coordinates { lat, lng }
 */
export function pixelToGps(x: number, y: number): { lat: number; lng: number } {
  const { width, height, bounds } = MAP_CONFIG;
  const { south, north, west, east } = bounds;

  const xNorm = x / width;
  const yNorm = y / height;

  const lng = west + xNorm * (east - west);
  const lat = north - yNorm * (north - south);

  return { lat, lng };
}

// =============================================================================
// Building Position Helper Functions
// =============================================================================

/**
 * Get the image pixel position for a building.
 * This is the stored position calibrated to the map image.
 *
 * @param building - The building object
 * @returns Pixel coordinates [x, y] on the map image
 */
export function getBuildingPosition(building: Building): [number, number] {
  return building.position;
}

/**
 * Get CRS.Simple coordinates for a building (for Leaflet marker placement).
 * This is the PRIMARY function for placing building markers on the map.
 *
 * @param building - The building object
 * @returns CRS.Simple coordinates { lat, lng }
 */
export function getBuildingCrsCoords(building: Building): { lat: number; lng: number } {
  return pixelToCrsSimple(building.position[0], building.position[1]);
}

/**
 * Get real GPS coordinates for a building (for external navigation).
 * PREFERS the stored GPS coordinates (verified from Google Maps) for accuracy.
 * Falls back to calculated GPS from pixel position only when location is unavailable.
 *
 * The stored building.location coordinates are from Google Maps geocoding and
 * provide accurate navigation destinations in Apple Maps and Google Maps.
 *
 * @param building - The building object
 * @returns GPS coordinates { lat, lng }
 */
export function getBuildingGps(building: Building): { lat: number; lng: number } {
  // Prefer stored GPS coordinates (verified from Google Maps) for accurate navigation
  if (building.location) {
    return { lat: building.location.lat, lng: building.location.lng };
  }
  // Fallback: calculate approximate GPS from pixel position
  // Note: This is less accurate (~50-140m off) due to linear interpolation
  return pixelToGps(building.position[0], building.position[1]);
}

export const buildings: Building[] = [
  // KEY SERVICE LOCATIONS
  {
    id: '18WW',
    name: "18 Wally's Walk (Central Hub)",
    position: [2282, 1881], // Calculated from GPS -33.77551, 151.11259
    description:
      'Main student services building housing Service Connect, IT, HR, Financial Services, and administration offices.',
    tags: ['services', 'administration', 'study'],
    translationKey: 'building_18WW_name',
    descriptionKey: 'building_18WW_desc',
    gridRef: 'N16',
    address: "18 Wally's Walk",
    category: 'services',
    location: { lat: -33.7734389, lng: 151.1134919 }, // Google Maps MCP verified 2026-01-24
    levels: 4,
  },
  {
    id: 'LIB',
    name: 'Waranara Library',
    position: [2345, 2388], // Calculated from GPS -33.77842, 151.11277 (GCP anchor)
    description:
      'Main campus library with extensive collections, study spaces, Library Cafe, and the Lachlan Macquarie Room.',
    tags: ['academic', 'study', 'resources'],
    translationKey: 'building_LIB_name',
    descriptionKey: 'building_LIB_desc',
    gridRef: 'Q17',
    address: '16 Macquarie Walk',
    category: 'academic',
    location: { lat: -33.7756994, lng: 151.1131306, osmId: 141281549 }, // Google Maps MCP verified 2026-01-24
    levels: 8,
  },
  {
    id: 'SEC',
    name: 'Security & Emergency',
    position: [315, 2220], // Calibrated: north end of campus near Link Road
    description: 'Campus security headquarters and emergency first aid services. Available 24/7.',
    tags: ['services', 'safety', 'emergency'],
    translationKey: 'building_SEC_name',
    descriptionKey: 'building_SEC_desc',
    gridRef: 'P2',
    address: '4 Link Road',
    category: 'services',
    location: { lat: -33.775252, lng: 151.1061672 }, // Google Maps geocoded 2026-01-10
  },

  // FACULTY OF ARTS
  {
    id: '25BWW',
    name: "25B Wally's Walk (Arts Faculty)",
    position: [1762, 2039], // Calibrated: GPS-derived + offset, near 25WW
    description:
      'Faculty of Arts administration, Education, Social Sciences, Indigenous Studies, History, and the Gale History Museum.',
    tags: ['academic', 'arts', 'teaching'],
    translationKey: 'building_25BWW_name',
    descriptionKey: 'building_25BWW_desc',
    gridRef: 'O13',
    address: "25B Wally's Walk",
    category: 'academic',
    location: { lat: -33.7745332, lng: 151.1112771 }, // Google Maps verified 2026-01-20
  },
  {
    id: '17WW',
    name: "17 Wally's Walk (Law & Media)",
    position: [2511, 1916], // Calibrated: GPS-derived + offset, near 18WW
    description: 'Macquarie Law School, Media & Communication, Michael Kirby Law Building.',
    tags: ['academic', 'law', 'media'],
    translationKey: 'building_17WW_name',
    descriptionKey: 'building_17WW_desc',
    gridRef: 'O19',
    address: "17 Wally's Walk, Macquarie Park, NSW",
    category: 'academic',
    location: { lat: -33.7748805, lng: 151.1133652, osmId: 205588360 }, // Google Maps verified 2026-01-24
    levels: 3,
  },

  // MACQUARIE BUSINESS SCHOOL
  {
    id: '4ER',
    name: '4 Eastern Road (Business School)',
    position: [3066, 2352], // Calculated from GPS using calibrated bounds (2026-01-10)
    description:
      'Macquarie Business School - Accounting, Finance, Management, Marketing, Actuarial Studies.',
    tags: ['academic', 'business', 'teaching'],
    translationKey: 'building_4ER_name',
    descriptionKey: 'building_4ER_desc',
    gridRef: 'Q22',
    address: '4 Eastern Road',
    category: 'academic',
    location: { lat: -33.775787, lng: 151.1160258 }, // Google Maps geocoded 2026-01-10
    levels: 8,
  },

  // FACULTY OF MEDICINE, HEALTH & HUMAN SCIENCES
  {
    id: '75TAL',
    name: '75 Talavera Road (Health Sciences)',
    position: [4078, 1604], // Calibrated: GPS-derived + offset, far east
    description:
      'Faculty of Medicine, Health Sciences, Medical School, Australian Institute of Health Innovation, Chiropractic.',
    tags: ['academic', 'health', 'research'],
    translationKey: 'building_75TAL_name',
    descriptionKey: 'building_75TAL_desc',
    gridRef: 'M28',
    address: '75 Talavera Road, Macquarie Park, NSW',
    category: 'academic',
    location: { lat: -33.7741652, lng: 151.1186167 }, // Google Maps geocoded 2026-01-10
  },
  {
    id: '16UA',
    name: '16 University Avenue (Psychology)',
    position: [1803, 2695], // Calibrated: GPS-derived + offset, south of 21WW
    description:
      'Psychology, Linguistics, Speech & Hearing Clinic, Reading Clinic, Centre for Emotional Health.',
    tags: ['academic', 'psychology', 'health'],
    translationKey: 'building_16UA_name',
    descriptionKey: 'building_16UA_desc',
    gridRef: 'T14',
    address: '16 University Avenue',
    category: 'academic',
    location: { lat: -33.7765829, lng: 151.111851 }, // Google Maps geocoded 2026-01-10
  },

  // FACULTY OF SCIENCE & ENGINEERING
  {
    id: '9WW',
    name: "9 Wally's Walk (Engineering)",
    position: [3162, 1894], // Calibrated: near 12WW
    description: 'School of Engineering, Australian Astronomical Optics.',
    tags: ['academic', 'engineering', 'labs'],
    translationKey: 'building_9WW_name',
    descriptionKey: 'building_9WW_desc',
    gridRef: 'O22',
    address: "9 Wally's Walk",
    category: 'academic',
    location: { lat: -33.7744275, lng: 151.1155757 }, // Google Maps geocoded 2026-01-10
  },
  {
    id: '4RPD',
    name: '4 Research Park Drive (Computing)',
    position: [3685, 1985], // Calibrated: GPS-derived + offset, east of campus
    description: 'School of Computing, Esc Cafe.',
    tags: ['academic', 'technology', 'labs'],
    translationKey: 'building_4RPD_name',
    descriptionKey: 'building_4RPD_desc',
    gridRef: 'O26',
    address: '4 Research Park Drive',
    category: 'academic',
    location: { lat: -33.7747745, lng: 151.1177871 }, // Google Maps geocoded 2026-01-10
  },
  {
    id: '12WW',
    name: "12 Wally's Walk (Maths & Physics)",
    position: [2882, 1884], // Calibrated: GPS-derived + offset, near 12MW
    description: 'School of Mathematical & Physical Sciences.',
    tags: ['academic', 'science', 'research'],
    translationKey: 'building_12WW_name',
    descriptionKey: 'building_12WW_desc',
    gridRef: 'N20',
    address: "12 Wally's Walk",
    category: 'academic',
    location: { lat: -33.7742542, lng: 151.1146649 }, // Google Maps geocoded 2026-01-10
  },
  {
    id: '6WW',
    name: "6 Wally's Walk (Natural Sciences)",
    position: [3158, 1829], // Calibrated: GPS-derived + offset
    description: 'School of Natural Sciences, Biological Sciences, Herbarium.',
    tags: ['academic', 'science', 'research'],
    translationKey: 'building_6WW_name',
    descriptionKey: 'building_6WW_desc',
    gridRef: 'M23',
    address: "6 Wally's Walk",
    category: 'academic',
    location: { lat: -33.773867, lng: 151.1158118 }, // Google Maps geocoded 2026-01-10
    levels: 3,
  },
  {
    id: '4WW',
    name: "4 Wally's Walk (Proteome)",
    position: [3482, 1854], // Calibrated: GPS-derived + offset
    description: 'Australian Proteome Analysis Facility.',
    tags: ['academic', 'research', 'labs'],
    translationKey: 'building_4WW_name',
    descriptionKey: 'building_4WW_desc',
    gridRef: 'M24',
    address: "4 Wally's Walk",
    category: 'research',
    location: { lat: -33.7741298, lng: 151.1167778 }, // Google Maps geocoded 2026-01-10
  },

  // VENUES & THEATRES
  {
    id: 'LOTUS',
    name: 'Lotus Theatre',
    position: [1677, 1994], // Calculated from GPS using calibrated bounds (2026-01-10)
    description: 'Major teaching and entertainment venue.',
    tags: ['venue', 'teaching', 'events'],
    translationKey: 'building_LOTUS_name',
    descriptionKey: 'building_LOTUS_desc',
    gridRef: 'O11',
    address: "27 Wally's Walk",
    category: 'venue',
    location: { lat: -33.7746065, lng: 151.1106244 }, // Google Maps geocoded 2026-01-10
  },
  {
    id: 'MQTH',
    name: 'Macquarie Theatre',
    position: [2124, 1969], // Calibrated: GPS-derived + offset, same row as 21WW
    description: 'Large lecture theatre and entertainment venue.',
    tags: ['venue', 'teaching', 'events'],
    translationKey: 'building_MQTH_name',
    descriptionKey: 'building_MQTH_desc',
    gridRef: 'O15',
    address: "21 Wally's Walk",
    category: 'venue',
    location: { lat: -33.7746334, lng: 151.1122714 }, // Google Maps geocoded 2026-01-10
  },
  {
    id: 'PRICE',
    name: 'Price Theatre',
    position: [1964, 2011], // Calibrated: GPS-derived + offset, between LOTUS and MQTH
    description: 'Teaching theatre.',
    tags: ['venue', 'teaching'],
    translationKey: 'building_PRICE_name',
    descriptionKey: 'building_PRICE_desc',
    gridRef: 'O14',
    address: "23 Wally's Walk",
    category: 'venue',
    location: { lat: -33.7748869, lng: 151.1117559 }, // Google Maps geocoded 2026-01-10
  },
  {
    id: 'LIGHT',
    name: 'Lighthouse Theatre',
    position: [2002, 1157], // Calibrated: GPS-derived + offset, north of theatres
    description: 'Performance venue.',
    tags: ['venue', 'performance', 'arts'],
    translationKey: 'building_LIGHT_name',
    descriptionKey: 'building_LIGHT_desc',
    gridRef: 'H14',
    address: '11 Gymnasium Road',
    category: 'venue',
    location: { lat: -33.7718686, lng: 151.1114894 }, // Google Maps geocoded 2026-01-10
  },
  {
    id: 'AINS',
    name: 'Ainsworth Building',
    position: [3779, 1885], // Calibrated: GPS-derived + offset, near hospital area
    description: 'Teaching facility.',
    tags: ['academic', 'teaching'],
    translationKey: 'building_AINS_name',
    descriptionKey: 'building_AINS_desc',
    gridRef: 'N27',
    address: "1 Wally's Walk",
    category: 'academic',
    location: { lat: -33.7743803, lng: 151.1174832, osmId: 1303624871 }, // Google Maps verified 2026-01-20
  },

  // MQ HEALTH
  {
    id: 'HOSP',
    name: 'MQ University Hospital',
    position: [3799, 1568], // Calculated from GPS using calibrated bounds (2026-01-10)
    description: 'Teaching hospital with specialist clinics, medical imaging, and pharmacy.',
    tags: ['health', 'medical', 'services'],
    translationKey: 'building_HOSP_name',
    descriptionKey: 'building_HOSP_desc',
    gridRef: 'L27',
    address: '3 Technology Place',
    category: 'health',
    location: { lat: -33.7735912, lng: 151.1179502, osmId: 459015460 }, // Google Maps verified
    wheelchair: true,
  },
  {
    id: 'CLINIC',
    name: 'GP & Physio Clinics',
    position: [3776, 1471], // Calibrated: GPS-derived + offset, near hospital
    description: 'General practice and physiotherapy clinics, specialist consultations.',
    tags: ['health', 'medical', 'services'],
    translationKey: 'building_CLINIC_name',
    descriptionKey: 'building_CLINIC_desc',
    gridRef: 'K26',
    address: '2 Technology Place',
    category: 'health',
    location: { lat: -33.7730453, lng: 151.1176713 }, // Google Maps verified 2026-01-20
    wheelchair: true,
  },
  {
    id: 'WOOL',
    name: 'Woolcock Institute',
    position: [4279, 2129], // Calibrated: far east, south of hospital area
    description: 'Woolcock Institute of Medical Research.',
    tags: ['health', 'research'],
    translationKey: 'building_WOOL_name',
    descriptionKey: 'building_WOOL_desc',
    gridRef: 'O30',
    address: '2 Innovation Road',
    category: 'research',
    location: { lat: -33.7748879, lng: 151.1197583 }, // Google Maps geocoded 2026-01-10
  },

  // SPORTS & RECREATION
  {
    id: 'SPORT',
    name: 'Sport & Aquatic Centre',
    position: [1671, 1162], // Calculated from GPS using calibrated bounds (2026-01-10)
    description:
      'Gym, swimming pool, sports facilities, Crunch Cafe, Sporting Hall of Fame Museum.',
    tags: ['sports', 'recreation', 'fitness'],
    translationKey: 'building_Sports_name',
    descriptionKey: 'building_Sports_desc',
    gridRef: 'J12',
    address: '10 Gymnasium Road',
    category: 'sports',
    location: { lat: -33.7726489, lng: 151.1105693, osmId: 205588367 }, // Google Maps verified
    wheelchair: true,
  },
  {
    id: 'FIELDS',
    name: 'Sports Fields & Tennis',
    position: [2140, 1752], // Calibrated: south of Sport & Aquatic Centre
    description: 'Outdoor sports fields and tennis centre.',
    tags: ['sports', 'recreation', 'outdoor'],
    translationKey: 'building_FIELDS_name',
    descriptionKey: 'building_FIELDS_desc',
    gridRef: 'K16',
    address: '15-17 Gymnasium Road',
    category: 'sports',
    location: { lat: -33.7734239, lng: 151.1127799 }, // Google Maps verified
  },

  // FOOD & RETAIL
  {
    id: 'UBAR',
    name: 'UBar & Central Courtyard',
    position: [2551, 1617], // Calculated from GPS -33.774, 151.11365
    description: 'Campus bar, social venue, graduation ceremonies area.',
    tags: ['food', 'social', 'events'],
    translationKey: 'building_UBAR_name',
    descriptionKey: 'building_UBAR_desc',
    gridRef: 'K18',
    address: '1 Central Courtyard',
    category: 'food',
    location: { lat: -33.7733531, lng: 151.1133796, osmId: 914350786 }, // Google Maps verified (Ubar)
  },
  {
    id: 'CULT',
    name: 'Cult Eatery',
    position: [2462, 1803], // Calibrated: same as 25BWW (in Arts precinct)
    description: 'Campus eatery in Arts precinct.',
    tags: ['food', 'cafe'],
    translationKey: 'building_CULT_name',
    descriptionKey: 'building_CULT_desc',
    gridRef: 'O13',
    address: "25B Wally's Walk",
    category: 'food',
    location: { lat: -33.7745332, lng: 151.1112771 }, // Same as 25BWW - Google Maps verified 2026-01-20
  },
  {
    id: 'LACH',
    name: "Lachlan's Restaurant",
    position: [3173, 735], // Calibrated: GPS-derived + offset, north-east area
    description: 'Fine dining restaurant.',
    tags: ['food', 'restaurant'],
    translationKey: 'building_LACH_name',
    descriptionKey: 'building_LACH_desc',
    gridRef: 'E23',
    address: '1 Executive Road',
    category: 'food',
    location: { lat: -33.7713301, lng: 151.1158846, osmId: 148387967 }, // Google Maps verified
  },

  // OTHER SERVICES
  {
    id: '8SCO',
    name: '8 Sir Christopher Ondaatje Ave',
    position: [2823, 2260], // Calibrated: GPS-derived + offset, near 12MW
    description:
      'Future Students, MQ College, MQ Academy, Prayer Room, IELTS/PTE Test Centre, Access & Widening Participation.',
    tags: ['services', 'student', 'administration'],
    translationKey: 'building_8SCO_name',
    descriptionKey: 'building_8SCO_desc',
    gridRef: 'P20',
    address: '8 Sir Christopher Ondaatje Ave, Macquarie Park, NSW',
    category: 'services',
    location: { lat: -33.77578, lng: 151.11473, osmId: 23716703 }, // User verified 2026-01-24
    levels: 4,
  },
  {
    id: '16WW',
    name: "16 Wally's Walk (Research)",
    position: [2465, 1881], // Calibrated: GPS-derived + offset, near 18WW
    description: 'Graduate Research Academy, Research Services, Commercialisation & Innovation.',
    tags: ['research', 'services'],
    translationKey: 'building_16WW_name',
    descriptionKey: 'building_16WW_desc',
    gridRef: 'N18',
    address: "16 Wally's Walk",
    category: 'research',
    location: { lat: -33.774231, lng: 151.113649, osmId: 205588359 },
  },
  {
    id: '12SW',
    name: '12 Second Way (Student Services)',
    position: [2177, 2120], // Calibrated: GPS-derived + offset, near 14SW
    description: 'Student Wellbeing, Student Engagement, Graduation Unit.',
    tags: ['services', 'student', 'wellbeing'],
    translationKey: 'building_12SW_name',
    descriptionKey: 'building_12SW_desc',
    gridRef: 'P16',
    address: '12 Second Way',
    category: 'services',
    location: { lat: -33.775059, lng: 151.113014, osmId: 458998306 },
  },
  {
    id: '19ER',
    name: '19 Eastern Road (Chancellery)',
    position: [2942, 1203], // Calibrated: GPS-derived + offset, north of central
    description: 'Chancellery, Archives & Records, Art Gallery.',
    tags: ['administration', 'gallery', 'arts'],
    translationKey: 'building_19ER_name',
    descriptionKey: 'building_19ER_desc',
    gridRef: 'H20',
    address: '19 Eastern Road',
    category: 'services',
    location: { lat: -33.7724696, lng: 151.1148539, osmId: 205588364 }, // Google Maps verified 2026-01-24
  },
  {
    id: 'OBS',
    name: 'Observatory',
    position: [1755, 492], // Calculated from GPS using calibrated bounds (2026-01-10)
    description: 'Astronomy observatory.',
    tags: ['research', 'science', 'astronomy'],
    translationKey: 'building_OBS_name',
    descriptionKey: 'building_OBS_desc',
    gridRef: 'C12',
    address: '5 Gymnasium Road',
    category: 'research',
    location: { lat: -33.7703261, lng: 151.1111248, osmId: 1192242193 }, // Google Maps verified
  },
  {
    id: 'INCUB',
    name: 'MQ Incubator',
    position: [1185, 2537], // Calibrated: GPS-derived + offset, south-west
    description: 'Macquarie University Incubator for startups.',
    tags: ['services', 'business', 'innovation'],
    translationKey: 'building_INCUB_name',
    descriptionKey: 'building_INCUB_desc',
    gridRef: 'S8',
    address: '8 Hadenfeld Avenue',
    category: 'services',
    location: { lat: -33.7763444, lng: 151.1090529, osmId: 1107882877 }, // Google Maps verified 2026-01-24
  },
  {
    id: 'CHAP',
    name: 'Chaplaincy',
    position: [975, 2580], // Calibrated: GPS-derived + offset, west of campus
    description: 'Multi-faith chaplaincy services.',
    tags: ['services', 'spiritual'],
    translationKey: 'building_CHAP_name',
    descriptionKey: 'building_CHAP_desc',
    gridRef: 'R6',
    address: '10 Hadenfeld Avenue',
    category: 'services',
    location: { lat: -33.7760151, lng: 151.1080508, osmId: 100955278 }, // Google Maps verified 2026-01-20
    levels: 3,
  },
  {
    id: 'WALU',
    name: 'Walanga Muru',
    position: [1551, 1879], // Calibrated: GPS-derived + offset, near 29WW
    description: 'Indigenous student support and cultural services.',
    tags: ['services', 'indigenous', 'culture'],
    translationKey: 'building_WALU_name',
    descriptionKey: 'building_WALU_desc',
    gridRef: 'N11',
    address: "29 Wally's Walk",
    category: 'services',
    location: { lat: -33.7742704, lng: 151.1105191, osmId: 455246541 }, // Google Maps verified (Mia Mia)
  },

  // CHILDCARE
  {
    id: 'BANK',
    name: 'Banksia Cottage (Childcare)',
    position: [1195, 2175], // Calibrated: GPS-derived + offset, west area
    description: 'Campus childcare facility.',
    tags: ['services', 'childcare'],
    translationKey: 'building_BANK_name',
    descriptionKey: 'building_BANK_desc',
    gridRef: 'P8',
    address: '8 Link Road, Macquarie Park, NSW',
    category: 'services',
    location: { lat: -33.7752254, lng: 151.1090476, osmId: 148389594 }, // Google Maps verified (Banksia)
  },
  {
    id: 'GUMNUT',
    name: 'Gumnut Cottage (Childcare)',
    position: [2130, 3078], // Calibrated: east, near 16UA
    description: 'Campus childcare facility.',
    tags: ['services', 'childcare'],
    translationKey: 'building_GUMNUT_name',
    descriptionKey: 'building_GUMNUT_desc',
    gridRef: 'V15',
    address: '17 University Avenue',
    category: 'services',
    location: { lat: -33.7776699, lng: 151.1122559 }, // Google Maps geocoded 2026-01-10
  },
  {
    id: 'MIAMIA',
    name: 'Mia Mia (Childcare)',
    position: [1553, 1893], // Calibrated: same as WALU (near 29WW)
    description: 'Campus childcare facility near Walanga Muru.',
    tags: ['services', 'childcare'],
    translationKey: 'building_MIAMIA_name',
    descriptionKey: 'building_MIAMIA_desc',
    gridRef: 'N11',
    address: "29 Wally's Walk",
    category: 'services',
    location: { lat: -33.7742704, lng: 151.1105191 }, // Same as WALU - Google Maps geocoded 2026-01-10
  },
  {
    id: 'WARATAH',
    name: 'Waratah (Childcare)',
    position: [2420, 3144], // Calibrated: far east, near university avenue
    description: 'Campus childcare facility.',
    tags: ['services', 'childcare'],
    translationKey: 'building_WARATAH_name',
    descriptionKey: 'building_WARATAH_desc',
    gridRef: 'W17',
    address: '11 University Avenue',
    category: 'services',
    location: { lat: -33.77713, lng: 151.11174, osmId: 23716716 }, // Google Maps verified 2026-01-20
  },

  // NEXTSENSE & SPECIALIST SERVICES
  {
    id: 'NEXTSENSE',
    name: 'NextSense Centre of Excellence',
    position: [1320, 944], // Calibrated: north-west campus
    description: 'NextSense Centre of Excellence for hearing, vision, and sensory research.',
    tags: ['services', 'health', 'research'],
    translationKey: 'building_NEXTSENSE_name',
    descriptionKey: 'building_NEXTSENSE_desc',
    gridRef: 'F9',
    address: '2 Gymnasium Road',
    category: 'research',
    location: { lat: -33.7719732, lng: 151.1106033 }, // Google Maps geocoded 2026-01-10
  },
  {
    id: 'NEXTSCHOOL',
    name: 'NextSense School',
    position: [969, 992], // Calibrated: north-west, near MQ Village
    description: 'NextSense School for deaf and vision impaired students.',
    tags: ['services', 'education', 'accessibility'],
    translationKey: 'building_NEXTSCHOOL_name',
    descriptionKey: 'building_NEXTSCHOOL_desc',
    gridRef: 'G7',
    address: '131 Culloden Road',
    category: 'academic',
    location: { lat: -33.7720602, lng: 151.1090071 }, // Google Maps geocoded 2026-01-10
  },
  {
    id: 'METS',
    name: 'METS (Engineering Services)',
    position: [3411, 1484], // Calibrated: GPS-derived + offset
    description: 'Macquarie Engineering Technical Services - workshop and technical support.',
    tags: ['services', 'engineering', 'workshop'],
    translationKey: 'building_METS_name',
    descriptionKey: 'building_METS_desc',
    gridRef: 'K24',
    address: '3 Science Road',
    category: 'services',
    location: { lat: -33.7733742, lng: 151.1167229, osmId: 23716725 }, // Google Maps verified 2026-01-20
  },

  // ADDITIONAL CAFES
  {
    id: 'WALLYS',
    name: "Wally's Coffee and Toasties",
    position: [2261, 1879], // Calculated from GPS -33.77551, 151.11259 (same as 18WW)
    description: 'Campus cafe in the Central Hub building.',
    tags: ['food', 'cafe', 'coffee'],
    translationKey: 'building_WALLYS_name',
    descriptionKey: 'building_WALLYS_desc',
    gridRef: 'N15',
    address: "18 Wally's Walk",
    category: 'food',
    location: { lat: -33.7741501, lng: 151.1127909 }, // Same as 18WW - Google Maps geocoded 2026-01-10
  },
  {
    id: 'LIBCAFE',
    name: 'Library Cafe',
    position: [2450, 2394], // Calculated from GPS -33.77842, 151.11277 (inside Library)
    description: 'Cafe located in Waranara Library.',
    tags: ['food', 'cafe', 'coffee'],
    translationKey: 'building_LIBCAFE_name',
    descriptionKey: 'building_LIBCAFE_desc',
    gridRef: 'Q17',
    address: '16 Macquarie Walk',
    category: 'food',
    location: { lat: -33.7756994, lng: 151.1131306 }, // Same as Library - Google Maps geocoded 2026-01-10
  },

  // RESIDENTIAL
  {
    id: 'DLC',
    name: 'Dunmore Lang College',
    position: [3159, 3041], // Calculated from GPS using calibrated bounds (2026-01-10)
    description: 'Student residential college.',
    tags: ['residential', 'accommodation'],
    translationKey: 'building_DLC_name',
    descriptionKey: 'building_DLC_desc',
    gridRef: 'W25',
    address: '130 Herring Road',
    category: 'residential',
    location: { lat: -33.7782967, lng: 151.1165648, osmId: 488128858 }, // Google Maps MCP verified 2026-01-24
  },
  {
    id: 'RMC',
    name: 'Robert Menzies College',
    position: [3359, 3044], // Calibrated: south of DLC
    description: 'Student residential college.',
    tags: ['residential', 'accommodation'],
    translationKey: 'building_RMC_name',
    descriptionKey: 'building_RMC_desc',
    gridRef: 'V26',
    address: '136 Herring Road',
    category: 'residential',
    location: { lat: -33.77729, lng: 151.1168364 }, // Google Maps verified 2026-01-20
  },
  {
    id: 'MQV',
    name: 'MQ Village',
    position: [1022, 779], // Calibrated: north-west corner of campus
    description: 'Student accommodation village.',
    tags: ['residential', 'accommodation'],
    translationKey: 'building_MQV_name',
    descriptionKey: 'building_MQV_desc',
    gridRef: 'F7',
    address: '122 Culloden Road',
    category: 'residential',
    location: { lat: -33.7710178, lng: 151.1079173 }, // Google Maps geocoded 2026-01-10
  },

  // MUSEUMS & GALLERIES
  {
    id: 'GALLERY',
    name: 'Art Gallery',
    position: [2981, 2060], // Calibrated: same as 19ER (inside Chancellery)
    description: 'University art gallery and exhibitions.',
    tags: ['arts', 'gallery', 'culture'],
    translationKey: 'building_GALLERY_name',
    descriptionKey: 'building_GALLERY_desc',
    gridRef: 'H20',
    address: '19 Eastern Road',
    category: 'venue',
    location: { lat: -33.7723959, lng: 151.1148585 }, // Same as 19ER - Google Maps geocoded 2026-01-10
  },
  {
    id: 'BIODISC',
    name: 'Biology Discovery Centre',
    position: [3175, 1597], // Calibrated: near 6WW and METS
    description: 'Biology museum and discovery centre.',
    tags: ['science', 'museum', 'education'],
    translationKey: 'building_BIODISC_name',
    descriptionKey: 'building_BIODISC_desc',
    gridRef: 'L23',
    address: '6 Science Road',
    category: 'venue',
    location: { lat: -33.7736165, lng: 151.1159258 }, // Google Maps geocoded 2026-01-10
  },

  // ADDITIONAL BUILDINGS FROM OSM DATA
  {
    id: '11WW',
    name: "11 Wally's Walk",
    position: [2938, 1897], // Calibrated: GPS-derived + offset
    description: 'Academic building on Wallys Walk.',
    tags: ['academic', 'teaching'],
    translationKey: 'building_11WW_name',
    descriptionKey: 'building_11WW_desc',
    gridRef: 'N22',
    address: "11 Wally's Walk",
    category: 'academic',
    location: { lat: -33.7746267, lng: 151.1151193, osmId: 23716716 }, // Google Maps verified 2026-01-20
    levels: 4,
  },
  {
    id: '13RPD',
    name: '13 Research Park Drive',
    position: [3620, 1418], // Calibrated: GPS-derived + offset
    description: 'Research facility on Research Park Drive.',
    tags: ['research', 'academic'],
    translationKey: 'building_13RPD_name',
    descriptionKey: 'building_13RPD_desc',
    gridRef: 'M26',
    address: '13 Research Park Drive, Macquarie Park, NSW',
    category: 'research',
    location: { lat: -33.7732317, lng: 151.1171794, osmId: 23716723 }, // Google Maps verified 2026-01-20
  },
  {
    id: '6ER',
    name: '6 Eastern Road',
    position: [3056, 2281], // Calibrated: GPS-derived + offset
    description: 'Academic building on Eastern Road.',
    tags: ['academic', 'teaching'],
    translationKey: 'building_6ER_name',
    descriptionKey: 'building_6ER_desc',
    gridRef: 'Q21',
    address: '6 Eastern Road, Macquarie Park, NSW',
    category: 'academic',
    location: { lat: -33.775576, lng: 151.115895, osmId: 51673951 },
    levels: 4,
  },
  {
    id: '1CC',
    name: '1 Central Courtyard',
    position: [2528, 1618], // Calculated from GPS -33.774, 151.11365 (same as UBAR)
    description: 'Central Courtyard building and student hub.',
    tags: ['services', 'student'],
    translationKey: 'building_1CC_name',
    descriptionKey: 'building_1CC_desc',
    gridRef: 'K19',
    address: '1 Central Courtyard',
    category: 'services',
    location: { lat: -33.7738842, lng: 151.1135164, osmId: 914350786 }, // Google Maps verified (Central Courtyard)
  },

  {
    id: '13ARPD',
    name: '13A Research Park Drive',
    position: [3456, 1388], // Calibrated: GPS-derived + offset, near 13RPD
    description: 'Research facility on Research Park Drive.',
    tags: ['research', 'academic'],
    translationKey: 'building_13ARPD_name',
    descriptionKey: 'building_13ARPD_desc',
    gridRef: 'M26',
    address: '13 Research Park Drive',
    category: 'research',
    location: { lat: -33.773151, lng: 151.116676, osmId: 1303624873 },
  },
  {
    id: 'COCHLEAR',
    name: 'Cochlear Limited',
    position: [2591, 2855], // Calculated from GPS using calibrated bounds (2026-01-10)
    description: 'Cochlear headquarters and research facility.',
    tags: ['research', 'commercial', 'health'],
    translationKey: 'building_COCHLEAR_name',
    descriptionKey: 'building_COCHLEAR_desc',
    gridRef: 'U16',
    address: 'University Avenue',
    category: 'research',
    location: { lat: -33.7773091, lng: 151.1134198 }, // Google Maps verified (Cochlear)
  },
  {
    id: '10SCO',
    name: '10 Sir Christopher Ondaatje Ave',
    position: [2816, 2008], // Calibrated: GPS-derived + offset
    description: 'Academic building.',
    tags: ['academic', 'teaching'],
    translationKey: 'building_10SCO_name',
    descriptionKey: 'building_10SCO_desc',
    gridRef: 'P21',
    address: '10 Sir Christopher Ondaatje Ave',
    category: 'academic',
    location: { lat: -33.774901, lng: 151.114706, osmId: 458998307 },
  },
  {
    id: '14ER',
    name: '14 Eastern Road',
    position: [3058, 1743], // Calibrated: GPS-derived + offset
    description: 'Academic building on Eastern Road. Faculty of Science.',
    tags: ['academic', 'teaching'],
    translationKey: 'building_14ER_name',
    descriptionKey: 'building_14ER_desc',
    gridRef: 'P22',
    address: '14 Eastern Road',
    category: 'academic',
    location: { lat: -33.77386, lng: 151.115721, osmId: 157975715 },
  },
  {
    id: '6SR',
    name: '6 Science Road',
    position: [3229, 1582], // Calibrated: GPS-derived + offset
    description: 'Science building on Science Road.',
    tags: ['academic', 'science', 'labs'],
    translationKey: 'building_6SR_name',
    descriptionKey: 'building_6SR_desc',
    gridRef: 'M23',
    address: '6 Science Road, Macquarie Park, NSW',
    category: 'academic',
    location: { lat: -33.7736165, lng: 151.1159258, osmId: 157975717 },
  },
  // Additional buildings from MQ Location Guide
  {
    id: '14FW',
    name: '14 First Walk (MUSEC)',
    position: [1423, 2130], // Calibrated: GPS-derived + offset
    description: 'Macquarie University Special Education Centre - education programs for children.',
    tags: ['academic', 'education', 'services'],
    translationKey: 'building_14FW_name',
    descriptionKey: 'building_14FW_desc',
    gridRef: 'O10',
    address: '14 First Walk, Macquarie Park, NSW',
    category: 'academic',
    location: { lat: -33.774814, lng: 151.109691, osmId: 148389592 },
  },
  {
    id: '14SCO',
    name: '14 Sir Christopher Ondaatje Ave',
    position: [2767, 1800], // Calibrated: GPS-derived + offset
    description: 'Academic building with teaching spaces and exam halls. Faculty of Sciences.',
    tags: ['academic', 'teaching', 'exams'],
    translationKey: 'building_14SCO_name',
    descriptionKey: 'building_14SCO_desc',
    gridRef: 'N20',
    address: '14 Sir Christopher Ondaatje Ave',
    category: 'academic',
    location: { lat: -33.773899, lng: 151.114706, osmId: 157975716 },
    levels: 7,
  },
  {
    id: '4WR',
    name: '4 Western Road',
    position: [1894, 2103], // Calibrated: near theatres area
    description: 'Academic building with teaching and examination rooms.',
    tags: ['academic', 'teaching', 'exams'],
    translationKey: 'building_4WR_name',
    descriptionKey: 'building_4WR_desc',
    gridRef: 'P14',
    address: '4 Western Road',
    category: 'academic',
    location: { lat: -33.775351, lng: 151.1114772 }, // Google Maps geocoded 2026-01-10
  },
  // --- NEW BUILDINGS (Imported from OSM) ---
  {
    id: 'EAST3',
    name: 'East 3 Car Park',
    position: [3526, 2249],
    description: 'Multi-storey car park.',
    tags: ['other', 'parking'],
    translationKey: 'building_EAST3_name',
    descriptionKey: 'building_EAST3_desc',

    category: 'other',
    location: { lat: -33.775629, lng: 151.116761, osmId: 14744550 },
  },
  {
    id: 'EAST2',
    name: 'East 2 Car Park',
    position: [3518, 2035],
    description: 'Multi-storey car park.',
    tags: ['other', 'parking'],
    translationKey: 'building_EAST2_name',
    descriptionKey: 'building_EAST2_desc',

    category: 'other',
    location: { lat: -33.774796, lng: 151.116951, osmId: 14744551 },
  },
  {
    id: '75TR',
    name: '75 Talavera Road',
    position: [4065, 1617],
    description: 'Commercial building in the Macquarie Park precinct.',
    tags: ['commercial', 'office'],
    translationKey: 'building_75TR_name',
    descriptionKey: 'building_75TR_desc',
    address: '75 Talavera Road Macquarie Park NSW',
    category: 'other',
    location: { lat: -33.774162, lng: 151.118597, osmId: 23716719 },
  },
  {
    id: '3SR',
    name: '3 Science Road',
    position: [3411, 1538],
    description: 'Academic building.',
    tags: ['academic'],
    translationKey: 'building_3SR_name',
    descriptionKey: 'building_3SR_desc',
    address: '3 Science Road Macquarie Park NSW',
    category: 'academic',
    location: { lat: -33.7733742, lng: 151.1167229, osmId: 23716725 },
  },
  {
    id: '6FW',
    name: '6 First Walk',
    position: [2148, 2260],
    description: 'Academic building.',
    tags: ['academic'],
    translationKey: 'building_6FW_name',
    descriptionKey: 'building_6FW_desc',
    address: '6 First Walk',
    category: 'academic',
    location: { lat: -33.775402, lng: 151.112022, osmId: 62060227 },
    levels: 3,
  },
  {
    id: '17MW',
    name: '17 Macquarie Walk',
    position: [2402, 2503],
    description: 'Academic building.',
    tags: ['academic'],
    translationKey: 'building_17MW_name',
    descriptionKey: 'building_17MW_desc',
    address: '17 Macquarie Walk',
    category: 'academic',
    location: { lat: -33.776217, lng: 151.113178, osmId: 141281548 },
  },
  {
    id: '1MD',
    name: '1 Management Drive',
    position: [3177, 940],
    description: 'Academic building.',
    tags: ['academic'],
    translationKey: 'building_1MD_name',
    descriptionKey: 'building_1MD_desc',
    address: '1 Management Drive Macquarie Park NSW',
    category: 'academic',
    location: { lat: -33.771631, lng: 151.116079, osmId: 148387966 },
  },
  {
    id: '3MD',
    name: '3 Management Drive',
    position: [3111, 983],
    description: 'Academic building.',
    tags: ['academic'],
    translationKey: 'building_3MD_name',
    descriptionKey: 'building_3MD_desc',
    address: '3 Management Drive Macquarie Park NSW',
    category: 'academic',
    location: { lat: -33.771921, lng: 151.1157, osmId: 148387968 },
  },
  {
    id: '5MD',
    name: '5 Management Drive',
    position: [3349, 1057],
    description: 'Academic building.',
    tags: ['academic'],
    translationKey: 'building_5MD_name',
    descriptionKey: 'building_5MD_desc',
    address: '5 Management Drive',
    category: 'academic',
    location: { lat: -33.7720139, lng: 151.1157984, osmId: 148387969 },
  },
  {
    id: '1EXR',
    name: '1 Executive Road',
    position: [3190, 772],
    description: 'Academic building.',
    tags: ['academic'],
    translationKey: 'building_1EXR_name',
    descriptionKey: 'building_1EXR_desc',
    address: '1 Executive Road Macquarie Park NSW',
    category: 'academic',
    location: { lat: -33.771097, lng: 151.115913, osmId: 148387970 },
  },
  {
    id: '2FW',
    name: '2 First Walk',
    position: [2411, 2222],
    description: 'Academic building.',
    tags: ['academic'],
    translationKey: 'building_2FW_name',
    descriptionKey: 'building_2FW_desc',
    address: '2 First Walk Macquarie Park NSW',
    category: 'academic',
    location: { lat: -33.775327, lng: 151.113379, osmId: 148389591 },
    levels: 3,
  },
  {
    id: '4FW',
    name: '4 First Walk',
    position: [2227, 2264],
    description: 'Academic building.',
    tags: ['academic'],
    translationKey: 'building_4FW_name',
    descriptionKey: 'building_4FW_desc',
    address: '4 First Walk',
    category: 'academic',
    location: { lat: -33.77537, lng: 151.112847, osmId: 148389593 },
    levels: 4,
  },
  {
    id: '2LR',
    name: '2 Link Road',
    position: [241, 2064],
    description: 'Academic building.',
    tags: ['academic'],
    translationKey: 'building_2LR_name',
    descriptionKey: 'building_2LR_desc',
    address: '2 Link Road',
    category: 'academic',
    location: { lat: -33.7748578, lng: 151.1058082, osmId: 148390207 },
  },
  {
    id: '6LR',
    name: '6 Link Road',
    position: [377, 2131],
    description: 'Academic building.',
    tags: ['academic'],
    translationKey: 'building_6LR_name',
    descriptionKey: 'building_6LR_desc',
    address: '6 Link Road',
    category: 'academic',
    location: { lat: -33.7746607, lng: 151.1066688, osmId: 148390210 },
  },
  {
    id: '4LR',
    name: '4 Link Road',
    position: [333, 2201],
    description: 'Academic building.',
    tags: ['academic'],
    translationKey: 'building_4LR_name',
    descriptionKey: 'building_4LR_desc',
    address: '4 Link Road',
    category: 'academic',
    location: { lat: -33.775259, lng: 151.106101, osmId: 148390211 },
  },
  {
    id: 'DESTINATIO',
    name: 'Destination Orana',
    position: [4406, 1703],
    description: 'Student accommodation.',
    tags: ['residential'],
    translationKey: 'building_DESTINATIO_name',
    descriptionKey: 'building_DESTINATIO_desc',
    address: '112-118 Talavera Road Macquarie Park',
    category: 'residential',
    location: { lat: -33.7738573, lng: 151.120262, osmId: 286832282 },
    levels: 28,
  },
  {
    id: '3IR',
    name: '3 Innovation Road',
    position: [4137, 2106],
    description: 'Academic building.',
    tags: ['academic'],
    translationKey: 'building_3IR_name',
    descriptionKey: 'building_3IR_desc',
    address: '3 Innovation Road Macquarie Park NSW',
    category: 'academic',
    location: { lat: -33.775235, lng: 151.118627, osmId: 324612872 },
  },
  {
    id: '1IR',
    name: '1 Innovation Road',
    position: [4240, 2182],
    description: 'Academic building.',
    tags: ['academic'],
    translationKey: 'building_1IR_name',
    descriptionKey: 'building_1IR_desc',
    address: '1 Innovation Road Macquarie Park NSW',
    category: 'academic',
    location: { lat: -33.775569, lng: 151.119137, osmId: 324612876 },
  },
  {
    id: '15RPD',
    name: '15 Research Park Drive',
    position: [3569, 1343],
    description: 'Academic building.',
    tags: ['academic'],
    translationKey: 'building_15RPD_name',
    descriptionKey: 'building_15RPD_desc',
    address: '15 Research Park Drive Macquarie Park NSW',
    category: 'academic',
    location: { lat: -33.772875, lng: 151.116836, osmId: 459015425 },
  },
  {
    id: 'RONREILLYP',
    name: 'Ron Reilly Pavilion',
    position: [1687, 76],
    description: 'Sports pavilion.',
    tags: ['sports'],
    translationKey: 'building_RONREILLYP_name',
    descriptionKey: 'building_RONREILLYP_desc',

    category: 'sports',
    location: { lat: -33.766262, lng: 151.114914, osmId: 791253931 },
  },

  {
    id: 'VILLAS',
    name: 'The Villas',
    position: [2358, 3280], // Calibrated: south-east corner (Herring Rd)
    description: 'Residential villas.',
    tags: ['residential'],
    translationKey: 'building_VILLAS_name',
    descriptionKey: 'building_VILLAS_desc',
    address: '116-118 Herring Road Macquarie Park NSW',
    category: 'residential',
    location: { lat: -33.7793912, lng: 151.1132109, osmId: 967533744 }, // Google Maps verified
  },

  {
    id: '6MD',
    name: '6 Management Drive',
    position: [3238, 1083],
    description: 'Academic building.',
    tags: ['academic'],
    translationKey: 'building_6MD_name',
    descriptionKey: 'building_6MD_desc',
    address: '6 Management Drive Macquarie Park NSW',
    category: 'academic',
    location: { lat: -33.772124, lng: 151.116066, osmId: 1192234862 },
  },
  {
    id: '7MD',
    name: '7 Management Drive',
    position: [3128, 1083],
    description: 'Academic building.',
    tags: ['academic'],
    translationKey: 'building_7MD_name',
    descriptionKey: 'building_7MD_desc',
    address: '7 Management Drive Macquarie Park NSW',
    category: 'academic',
    location: { lat: -33.772257, lng: 151.115679, osmId: 1192234863 },
  },
  {
    id: '12MW',
    name: '12 Macquarie Walk',
    position: [2681, 2424],
    description: 'Academic building.',
    tags: ['academic'],
    translationKey: 'building_12MW_name',
    descriptionKey: 'building_12MW_desc',
    address: '12 Macquarie Walk Macquarie Park NSW',
    category: 'academic',
    location: { lat: -33.7759467, lng: 151.1151423, osmId: 1192234871 },
  },
  {
    id: '18ER',
    name: '18 Eastern Road',
    position: [3080, 1345],
    description: 'Academic building.',
    tags: ['academic'],
    translationKey: 'building_18ER_name',
    descriptionKey: 'building_18ER_desc',
    address: '18 Eastern Road Macquarie Park NSW',
    category: 'academic',
    location: { lat: -33.772871, lng: 151.115713, osmId: 1192257351 },
  },
  {
    id: '2WW',
    name: "2 Wally's Walk",
    position: [3582, 1847],
    description: 'Academic building.',
    tags: ['academic'],
    translationKey: 'building_2WW_name',
    descriptionKey: 'building_2WW_desc',
    address: "2 Wally's Walk Macquarie Park NSW",
    category: 'academic',
    location: { lat: -33.774145, lng: 151.117209, osmId: 1303624872 },
  },
  // --- ADDITIONAL BUILDINGS (Full Scan) ---
  {
    id: '23WW',
    name: '23WW',
    position: [1993, 1881],
    description: '23WW building.',
    tags: ['academic'],
    translationKey: 'building_23WW_name',
    descriptionKey: 'building_23WW_desc',
    category: 'academic',
    location: { lat: -33.775064, lng: 151.111811, osmId: 6784791 },
    levels: 1,
  },
  {
    id: 'SIEMENS',
    name: 'Siemens',
    position: [4303, 2013],
    description: 'Siemens building.',
    tags: ['commercial', 'office'],
    translationKey: 'building_SIEMENS_name',
    descriptionKey: 'building_SIEMENS_desc',
    category: 'other',
    location: { lat: -33.774873, lng: 151.119825, osmId: 6784971 }, // Google Maps verified (Siemens)
    levels: 1,
  },

  {
    id: '10HA',
    name: '10 Hadenfeld Avenue (Chaplaincy)',
    position: [963, 2565],
    description: 'Multi-faith chaplaincy and spiritual services building.',
    tags: ['services', 'spiritual', 'chaplaincy'],
    translationKey: 'building_10HA_name',
    descriptionKey: 'building_10HA_desc',
    category: 'services',
    location: { lat: -33.7764943, lng: 151.1118029 }, // Google Maps verified (Hearing Australia)
    levels: 1,
  },
  {
    id: '16MW',
    name: '16 Macquarie Walk (Waranara Library)',
    position: [2397, 2389], // Calculated from GPS -33.77842, 151.11277 (same as LIB)
    description: 'Main campus library with study spaces, Library Cafe, and extensive collections.',
    tags: ['academic', 'study', 'library', 'resources'],
    translationKey: 'building_16MW_name',
    descriptionKey: 'building_16MW_desc',
    category: 'academic',
    location: { lat: -33.775621, lng: 151.113441, osmId: 141281549 }, // User verified 2026-01-20
    levels: 8,
  },
  {
    id: 'LAKESIDEHO',
    name: 'Lakeside Hotel & Conference Centre',
    position: [3199, 719],
    description: 'Lakeside Hotel & Conference Centre.',
    tags: ['accommodation', 'hotel', 'venue'],
    translationKey: 'building_LAKESIDEHO_name',
    descriptionKey: 'building_LAKESIDEHO_desc',
    category: 'other',
    location: { lat: -33.7713301, lng: 151.1158846, osmId: 148387967 }, // Google Maps verified
    levels: 1,
  },
  {
    id: '8LR',
    name: '8LR (Banksia Cottage)',
    position: [1261, 2193],
    description: 'Banksia Cottage campus childcare facility.',
    tags: ['services', 'childcare'],
    translationKey: 'building_8LR_name',
    descriptionKey: 'building_8LR_desc',
    category: 'services',
    location: { lat: -33.7751467, lng: 151.1090168 }, // Google Maps verified 2026-01-20
    levels: 1,
  },
  {
    id: 'MACQUARIEC',
    name: 'Macquarie Centre',
    position: [4204, 2607],
    description: 'Macquarie Centre shopping mall with food court, retail stores, and cinema.',
    tags: ['food', 'retail', 'shopping'],
    translationKey: 'building_MACQUARIEC_name',
    descriptionKey: 'building_MACQUARIEC_desc',
    category: 'other',
    location: { lat: -33.7772506, lng: 151.1211352, osmId: 201725087 }, // Google Maps verified (Macquarie Centre)
    levels: 1,
  },
  {
    id: '11GR',
    name: '11GR (Lighthouse Theatre)',
    position: [2026, 1149],
    description: 'Performance venue and theatre.',
    tags: ['venue', 'performance', 'arts'],
    translationKey: 'building_11GR_name',
    descriptionKey: 'building_11GR_desc',
    category: 'venue',
    location: { lat: -33.7718686, lng: 151.1114894 }, // Google Maps verified 2026-01-20
    levels: 1,
  },
  {
    id: '10GR',
    name: '10GR (Macquarie University Sport and Aquatic Centre)',
    position: [1697, 1188],
    description: '10GR building.',
    tags: ['sports'],
    translationKey: 'building_10GR_name',
    descriptionKey: 'building_10GR_desc',
    category: 'sports',
    location: { lat: -33.7726489, lng: 151.1105693, osmId: 205588367 }, // Google Maps verified
    levels: 1,
  },
  {
    id: 'DUNMORELAN',
    name: 'Dunmore Lang College - Postgraduate Apartments',
    position: [3395, 3045],
    description: 'Dunmore Lang College apartments.',
    tags: ['residential'],
    translationKey: 'building_DUNMORELAN_name',
    descriptionKey: 'building_DUNMORELAN_desc',
    category: 'residential',
    location: { lat: -33.7783819, lng: 151.1165762, osmId: 205588642 }, // Google Maps verified (Dunmore Lang)
    levels: 1,
  },

  {
    id: '29WW',
    name: '29WW',
    position: [1576, 1880],
    description: '29WW building.',
    tags: ['academic'],
    translationKey: 'building_29WW_name',
    descriptionKey: 'building_29WW_desc',
    category: 'academic',
    location: { lat: -33.7742704, lng: 151.1105191, osmId: 455246541 }, // Google Maps verified
    levels: 1,
  },
  {
    id: '27WW',
    name: '27WW (Lotus Theatre)',
    position: [1638, 1921],
    description: 'Major teaching and entertainment venue.',
    tags: ['venue', 'teaching', 'events'],
    translationKey: 'building_27WW_name',
    descriptionKey: 'building_27WW_desc',
    category: 'venue',
    location: { lat: -33.7746627, lng: 151.1106308, osmId: 455246542 }, // Google Maps verified
    levels: 1,
  },
  {
    id: '25WW',
    name: '25WW',
    position: [1802, 1881],
    description: '25WW building.',
    tags: ['academic'],
    translationKey: 'building_25WW_name',
    descriptionKey: 'building_25WW_desc',
    category: 'academic',
    location: { lat: -33.7751678, lng: 151.1110393 }, // Google Maps verified (Gale Museum)
    levels: 1,
  },
  {
    id: '21WW',
    name: '21WW (Macquarie Theatre)',
    position: [2078, 1950],
    description: 'Large lecture theatre and entertainment venue.',
    tags: ['venue', 'teaching', 'events'],
    translationKey: 'building_21WW_name',
    descriptionKey: 'building_21WW_desc',
    category: 'venue',
    location: { lat: -33.7746449, lng: 151.1122661, osmId: 458998304 }, // Google Maps verified
    levels: 1,
  },
  {
    id: '14SW',
    name: '14SW',
    position: [2212, 2069],
    description: '14SW building.',
    tags: ['academic'],
    translationKey: 'building_14SW_name',
    descriptionKey: 'building_14SW_desc',
    category: 'academic',
    location: { lat: -33.774892, lng: 151.112682, osmId: 458998305 },
    levels: 1,
  },

  {
    id: '2TP',
    name: '2 Technology Place',
    position: [3776, 1505],
    description: '2 Technology Place - health and medical facilities.',
    tags: ['health', 'medical'],
    translationKey: 'building_2TP_name',
    descriptionKey: 'building_2TP_desc',
    category: 'health',
    location: { lat: -33.773134, lng: 151.117803, osmId: 459015453 }, // Google Maps verified (GP Clinic)
    levels: 1,
  },
  {
    id: 'MACQUARIEU',
    name: 'Macquarie University Hospital',
    position: [3832, 1669],
    description: 'Macquarie University Hospital.',
    tags: ['health', 'medical', 'hospital'],
    translationKey: 'building_MACQUARIEU_name',
    descriptionKey: 'building_MACQUARIEU_desc',
    category: 'health',
    location: { lat: -33.773738, lng: 151.118041, osmId: 459015460 }, // Google Maps verified
    levels: 1,
  },
  {
    id: 'STUDENTACC',
    name: 'Student Accommodation',
    position: [2274, 1585],
    description: 'Student Accommodation.',
    tags: ['residential', 'accommodation'],
    translationKey: 'building_STUDENTACC_name',
    descriptionKey: 'building_STUDENTACC_desc',
    category: 'residential',
    location: { lat: -33.7732885, lng: 151.1127885, osmId: 914350787 }, // Google Maps verified (Student Accommodation)
    levels: 1,
  },

  {
    id: '205A',
    name: '205A Culloden Road',
    position: [1879, 746], // Calibrated: north-west (Culloden Rd)
    description: '205A Culloden Road residential building.',
    tags: ['residential'],
    translationKey: 'building_205A_name',
    descriptionKey: 'building_205A_desc',
    category: 'residential',
    location: { lat: -33.769159, lng: 151.111826, osmId: 1065030401 }, // Google Maps verified
    levels: 1,
  },
  {
    id: '205B',
    name: '205B Culloden Road',
    position: [1821, 836], // Calibrated: north-west (Culloden Rd)
    description: '205B Culloden Road residential building.',
    tags: ['residential'],
    translationKey: 'building_205B_name',
    descriptionKey: 'building_205B_desc',
    category: 'residential',
    location: { lat: -33.769541, lng: 151.111623, osmId: 1065030402 }, // Google Maps verified
    levels: 1,
  },
  {
    id: '8HA',
    name: '8HA (Incubator)',
    position: [1169, 2556],
    description: 'Macquarie University Incubator for startups and innovation.',
    tags: ['services', 'business', 'innovation'],
    translationKey: 'building_8HA_name',
    descriptionKey: 'building_8HA_desc',
    category: 'services',
    location: { lat: -33.7763444, lng: 151.1090529, osmId: 1107882877 }, // Google Maps verified
    levels: 1,
  },
  {
    id: '5GR',
    name: '5GR (Macquarie Observatory)',
    position: [1731, 492],
    description: 'Astronomy observatory for research and education.',
    tags: ['research', 'science', 'astronomy'],
    translationKey: 'building_5GR_name',
    descriptionKey: 'building_5GR_desc',
    category: 'research',
    location: { lat: -33.7703261, lng: 151.1111248, osmId: 1192242193 }, // Google Maps verified
    levels: 1,
  },
  {
    id: '1WW',
    name: '1WW (Ainsworth Building)',
    position: [3780, 1869],
    description: '1WW (Ainsworth Building).',
    tags: ['academic'],
    translationKey: 'building_1WW_name',
    descriptionKey: 'building_1WW_desc',
    category: 'academic',
    location: { lat: -33.774195, lng: 151.118145, osmId: 1303624871 },
    levels: 1,
  },

  // --- FINAL SCAN ADDITIONS ---
  {
    id: '17WWMICHAE',
    name: '17WW (Michael Kirby Building)',
    position: [2523, 1935],
    description: '17WW (Michael Kirby Building).',
    tags: ['academic'],
    translationKey: 'building_17WWMICHAE_name',
    descriptionKey: 'building_17WWMICHAE_desc',
    category: 'academic',
    location: { lat: -33.774771, lng: 151.113278, osmId: 7867502 },
    levels: 1,
  },

  {
    id: '18WWSERVIC',
    name: '18WW (Service Connect)',
    position: [2201, 1833],
    description: 'Service Connect - main student services hub with IT, HR, and Financial Services.',
    tags: ['services', 'administration', 'student'],
    translationKey: 'building_18WWSERVIC_name',
    descriptionKey: 'building_18WWSERVIC_desc',
    category: 'services',
    location: { lat: -33.774029, lng: 151.112563, osmId: 205588336 },
    levels: 1,
  },

  {
    id: '16WWLINCOL',
    name: '16WW (Lincoln Building)',
    position: [2486, 1880],
    description: '16WW (Lincoln Building).',
    tags: ['academic'],
    translationKey: 'building_16WWLINCOL_name',
    descriptionKey: 'building_16WWLINCOL_desc',
    category: 'academic',
    location: { lat: -33.774239, lng: 151.11357, osmId: 205588359 },
    levels: 1,
  },

  {
    id: '19ERTHECHA',
    name: '19ER (The Chancellery)',
    position: [2914, 1202],
    description: 'The Chancellery - University administration headquarters.',
    tags: ['services', 'administration'],
    translationKey: 'building_19ERTHECHA_name',
    descriptionKey: 'building_19ERTHECHA_desc',
    category: 'services',
    location: { lat: -33.772391, lng: 151.114933, osmId: 205588364 },
    levels: 1,
  },

  {
    id: '16UAAUSTRA',
    name: '16UA (Australian Hearing Hub)',
    position: [1822, 2706],
    description: 'Australian Hearing Hub - hearing research and clinical services.',
    tags: ['health', 'research', 'clinic'],
    translationKey: 'building_16UAAUSTRA_name',
    descriptionKey: 'building_16UAAUSTRA_desc',
    category: 'health',
    location: { lat: -33.7764943, lng: 151.1118029, osmId: 455246543 }, // Google Maps verified 2026-01-24
    levels: 1,
  },
  // --- NEW BUILDINGS FROM MQ_Full.geojson (2026-01-09) ---
  {
    id: 'DLCNEW',
    name: 'Dunmore Lang College - New Wing',
    position: [3127, 3003],
    description: 'Dunmore Lang College New Wing residential building.',
    tags: ['residential'],
    translationKey: 'building_DLCNEW_name',
    descriptionKey: 'building_DLCNEW_desc',
    address: '130 Herring Road, Macquarie Park NSW',
    category: 'residential',
    location: { lat: -33.777772, lng: 151.116569, osmId: 488128859 },
    levels: 3,
  },
  {
    id: 'DLCOFFICE',
    name: 'Dunmore Lang College - Office',
    position: [3174, 3069],
    description: 'Dunmore Lang College administration office.',
    tags: ['residential', 'services'],
    translationKey: 'building_DLCOFFICE_name',
    descriptionKey: 'building_DLCOFFICE_desc',
    address: '130 Herring Road, Macquarie Park NSW',
    category: 'residential',
    location: { lat: -33.7776104, lng: 151.1166667 }, // Google Maps verified (Robert Menzies)
    levels: 2,
  },
  {
    id: 'VILLAS2',
    name: 'Villas (Building 2)',
    position: [2363, 3300], // Calibrated: south-east corner (Herring Rd)
    description: 'Residential villas - second building.',
    tags: ['residential'],
    translationKey: 'building_VILLAS2_name',
    descriptionKey: 'building_VILLAS2_desc',
    address: '116-118 Herring Road, Macquarie Park NSW',
    category: 'residential',
    location: { lat: -33.78005, lng: 151.11359, osmId: 967533745 }, // Google Maps verified
  },

  // --- BUILDINGS FROM MQ LOCATION GUIDE CSV (2026-01-10) ---
  {
    id: '25CWW',
    name: "25C Wally's Walk (Gale History Museum)",
    position: [1780, 2050], // Near 25B Wally's Walk
    description: 'The Gale History Museum - historical exhibits and collections.',
    tags: ['venue', 'museum', 'arts', 'history'],
    translationKey: 'building_25CWW_name',
    descriptionKey: 'building_25CWW_desc',
    gridRef: 'O13',
    address: "25C Wally's Walk",
    category: 'venue',
    location: { lat: -33.7751672, lng: 151.1109258 }, // Google Maps geocoded 2026-01-10
  },
];

export const getBuildingById = (id: string): Building | undefined => {
  const normalizedId = id.toUpperCase();
  return buildings.find((building) => building.id.toUpperCase() === normalizedId);
};

export const searchBuildings = (query: string): Building[] => {
  const lowerQuery = query.toLowerCase();
  return buildings.filter(
    (building) =>
      building.name.toLowerCase().includes(lowerQuery) ||
      building.id.toLowerCase().includes(lowerQuery) ||
      building.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      building.description?.toLowerCase().includes(lowerQuery) ||
      building.gridRef?.toLowerCase().includes(lowerQuery) ||
      building.address?.toLowerCase().includes(lowerQuery),
  );
};

export const getBuildingsByCategory = (category: BuildingCategory): Building[] => {
  return buildings.filter((building) => building.category === category);
};

export const getBuildingsByTag = (tag: string): Building[] => {
  return buildings.filter((building) => building.tags?.includes(tag));
};

// Building category labels for display
export const BUILDING_CATEGORY_LABELS: Record<BuildingCategory, string> = {
  academic: 'Academic',
  services: 'Student Services',
  health: 'Health & Medical',
  food: 'Food & Retail',
  sports: 'Sports & Recreation',
  venue: 'Venues & Theatres',
  research: 'Research',
  residential: 'Accommodation',
  other: 'Other',
};
