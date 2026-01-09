import type { TranslationKey } from '@/lib/i18n/translations';

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

// Grid reference to approximate pixel position mapping
// The campus map uses a grid system (columns A-X, rows 1-30 approx)
// Map dimensions: 4678 x 3307 pixels
// These are approximate conversions based on the campus layout
const gridToPixel = (ref: string): [number, number] => {
  // Extract column letter(s) and row number
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return [2339, 1654]; // Center fallback

  const colStr = match[1];
  const row = parseInt(match[2], 10);

  // Column mapping (A=1, B=2, ... X=24)
  // Campus spans roughly columns C to W (3 to 23)
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 64);
  }

  // Map grid to pixels
  // Approximate: columns span ~200px each, rows span ~110px each
  // Grid starts around column C (3) at x~200 and goes to W (23) at x~4400
  // Grid starts around row 5 at y~300 and goes to row 30 at y~3100

  const x = Math.round(((col - 3) / 20) * 4200 + 200);
  const y = Math.round(((row - 5) / 25) * 2800 + 300);

  // Clamp to map bounds
  return [Math.max(100, Math.min(4578, x)), Math.max(100, Math.min(3207, y))];
};

export const buildings: Building[] = [
  // KEY SERVICE LOCATIONS
  {
    id: '18WW',
    name: "18 Wally's Walk (Central Hub)",
    position: gridToPixel('N16'),
    description:
      'Main student services building housing Service Connect, IT, HR, Financial Services, and administration offices.',
    tags: ['services', 'administration', 'study'],
    translationKey: 'building_18WW_name',
    descriptionKey: 'building_18WW_desc',
    gridRef: 'N16',
    address: "18 Wally's Walk",
    category: 'services',
  },
  {
    id: 'LIB',
    name: 'Waranara Library',
    position: gridToPixel('Q17'),
    description:
      'Main campus library with extensive collections, study spaces, Library Cafe, and the Lachlan Macquarie Room.',
    tags: ['academic', 'study', 'resources'],
    translationKey: 'building_LIB_name',
    descriptionKey: 'building_LIB_desc',
    gridRef: 'Q17',
    address: '16 Macquarie Walk',
    category: 'academic',
  },
  {
    id: 'SEC',
    name: 'Security & Emergency',
    position: gridToPixel('P2'),
    description: 'Campus security headquarters and emergency first aid services. Available 24/7.',
    tags: ['services', 'safety', 'emergency'],
    translationKey: 'building_SEC_name',
    descriptionKey: 'building_SEC_desc',
    gridRef: 'P2',
    address: '4 Link Road',
    category: 'services',
  },

  // FACULTY OF ARTS
  {
    id: '25BWW',
    name: "25B Wally's Walk (Arts Faculty)",
    position: gridToPixel('O13'),
    description:
      'Faculty of Arts administration, Education, Social Sciences, Indigenous Studies, History, and the Gale History Museum.',
    tags: ['academic', 'arts', 'teaching'],
    translationKey: 'building_25BWW_name',
    descriptionKey: 'building_25BWW_desc',
    gridRef: 'O13',
    address: "25B Wally's Walk",
    category: 'academic',
  },
  {
    id: '17WW',
    name: "17 Wally's Walk (Law & Media)",
    position: gridToPixel('O19'),
    description: 'Macquarie Law School, Media & Communication, Michael Kirby Law Building.',
    tags: ['academic', 'law', 'media'],
    translationKey: 'building_17WW_name',
    descriptionKey: 'building_17WW_desc',
    gridRef: 'O19',
    address: "17 Wally's Walk",
    category: 'academic',
  },

  // MACQUARIE BUSINESS SCHOOL
  {
    id: '4ER',
    name: '4 Eastern Road (Business School)',
    position: gridToPixel('Q22'),
    description:
      'Macquarie Business School - Accounting, Finance, Management, Marketing, Actuarial Studies.',
    tags: ['academic', 'business', 'teaching'],
    translationKey: 'building_4ER_name',
    descriptionKey: 'building_4ER_desc',
    gridRef: 'Q22',
    address: '4 Eastern Road',
    category: 'academic',
  },

  // FACULTY OF MEDICINE, HEALTH & HUMAN SCIENCES
  {
    id: '75TAL',
    name: '75 Talavera Road (Health Sciences)',
    position: gridToPixel('M28'),
    description:
      'Faculty of Medicine, Health Sciences, Medical School, Australian Institute of Health Innovation, Chiropractic.',
    tags: ['academic', 'health', 'research'],
    translationKey: 'building_75TAL_name',
    descriptionKey: 'building_75TAL_desc',
    gridRef: 'M28',
    address: '75 Talavera Road',
    category: 'academic',
  },
  {
    id: '16UA',
    name: '16 University Avenue (Psychology)',
    position: gridToPixel('T14'),
    description:
      'Psychology, Linguistics, Speech & Hearing Clinic, Reading Clinic, Centre for Emotional Health.',
    tags: ['academic', 'psychology', 'health'],
    translationKey: 'building_16UA_name',
    descriptionKey: 'building_16UA_desc',
    gridRef: 'T14',
    address: '16 University Avenue',
    category: 'academic',
  },

  // FACULTY OF SCIENCE & ENGINEERING
  {
    id: '9WW',
    name: "9 Wally's Walk (Engineering)",
    position: gridToPixel('O22'),
    description: 'School of Engineering, Australian Astronomical Optics.',
    tags: ['academic', 'engineering', 'labs'],
    translationKey: 'building_9WW_name',
    descriptionKey: 'building_9WW_desc',
    gridRef: 'O22',
    address: "9 Wally's Walk",
    category: 'academic',
  },
  {
    id: '4RPD',
    name: '4 Research Park Drive (Computing)',
    position: gridToPixel('O26'),
    description: 'School of Computing, Esc Cafe.',
    tags: ['academic', 'technology', 'labs'],
    translationKey: 'building_4RPD_name',
    descriptionKey: 'building_4RPD_desc',
    gridRef: 'O26',
    address: '4 Research Park Drive',
    category: 'academic',
  },
  {
    id: '12WW',
    name: "12 Wally's Walk (Maths & Physics)",
    position: gridToPixel('N20'),
    description: 'School of Mathematical & Physical Sciences.',
    tags: ['academic', 'science', 'research'],
    translationKey: 'building_12WW_name',
    descriptionKey: 'building_12WW_desc',
    gridRef: 'N20',
    address: "12 Wally's Walk",
    category: 'academic',
  },
  {
    id: '6WW',
    name: "6 Wally's Walk (Natural Sciences)",
    position: gridToPixel('M23'),
    description: 'School of Natural Sciences, Herbarium.',
    tags: ['academic', 'science', 'research'],
    translationKey: 'building_6WW_name',
    descriptionKey: 'building_6WW_desc',
    gridRef: 'M23',
    address: "6 Wally's Walk",
    category: 'academic',
  },
  {
    id: '4WW',
    name: "4 Wally's Walk (Proteome)",
    position: gridToPixel('M24'),
    description: 'Australian Proteome Analysis Facility.',
    tags: ['academic', 'research', 'labs'],
    translationKey: 'building_4WW_name',
    descriptionKey: 'building_4WW_desc',
    gridRef: 'M24',
    address: "4 Wally's Walk",
    category: 'research',
  },

  // VENUES & THEATRES
  {
    id: 'LOTUS',
    name: 'Lotus Theatre',
    position: gridToPixel('O11'),
    description: 'Major teaching and entertainment venue.',
    tags: ['venue', 'teaching', 'events'],
    translationKey: 'building_LOTUS_name',
    descriptionKey: 'building_LOTUS_desc',
    gridRef: 'O11',
    address: "27 Wally's Walk",
    category: 'venue',
  },
  {
    id: 'MQTH',
    name: 'Macquarie Theatre',
    position: gridToPixel('O15'),
    description: 'Large lecture theatre and entertainment venue.',
    tags: ['venue', 'teaching', 'events'],
    translationKey: 'building_MQTH_name',
    descriptionKey: 'building_MQTH_desc',
    gridRef: 'O15',
    address: "21 Wally's Walk",
    category: 'venue',
  },
  {
    id: 'PRICE',
    name: 'Price Theatre',
    position: gridToPixel('O14'),
    description: 'Teaching theatre.',
    tags: ['venue', 'teaching'],
    translationKey: 'building_PRICE_name',
    descriptionKey: 'building_PRICE_desc',
    gridRef: 'O14',
    address: "23 Wally's Walk",
    category: 'venue',
  },
  {
    id: 'LIGHT',
    name: 'Lighthouse Theatre',
    position: gridToPixel('H14'),
    description: 'Performance venue.',
    tags: ['venue', 'performance', 'arts'],
    translationKey: 'building_LIGHT_name',
    descriptionKey: 'building_LIGHT_desc',
    gridRef: 'H14',
    address: '11 Gymnasium Road',
    category: 'venue',
  },
  {
    id: 'AINS',
    name: 'Ainsworth Building',
    position: gridToPixel('N27'),
    description: 'Teaching facility.',
    tags: ['academic', 'teaching'],
    translationKey: 'building_AINS_name',
    descriptionKey: 'building_AINS_desc',
    gridRef: 'N27',
    address: "1 Wally's Walk",
    category: 'academic',
  },

  // MQ HEALTH
  {
    id: 'HOSP',
    name: 'MQ University Hospital',
    position: gridToPixel('L27'),
    description: 'Teaching hospital with specialist clinics, medical imaging, and pharmacy.',
    tags: ['health', 'medical', 'services'],
    translationKey: 'building_HOSP_name',
    descriptionKey: 'building_HOSP_desc',
    gridRef: 'L27',
    address: '3 Technology Place',
    category: 'health',
  },
  {
    id: 'CLINIC',
    name: 'GP & Physio Clinics',
    position: gridToPixel('K26'),
    description: 'General practice and physiotherapy clinics, specialist consultations.',
    tags: ['health', 'medical', 'services'],
    translationKey: 'building_CLINIC_name',
    descriptionKey: 'building_CLINIC_desc',
    gridRef: 'K26',
    address: '2 Technology Place',
    category: 'health',
  },
  {
    id: 'WOOL',
    name: 'Woolcock Institute',
    position: gridToPixel('O30'),
    description: 'Woolcock Institute of Medical Research.',
    tags: ['health', 'research'],
    translationKey: 'building_WOOL_name',
    descriptionKey: 'building_WOOL_desc',
    gridRef: 'O30',
    address: '2 Innovation Road',
    category: 'research',
  },

  // SPORTS & RECREATION
  {
    id: 'SPORT',
    name: 'Sport & Aquatic Centre',
    position: gridToPixel('J12'),
    description:
      'Gym, swimming pool, sports facilities, Crunch Cafe, Sporting Hall of Fame Museum.',
    tags: ['sports', 'recreation', 'fitness'],
    translationKey: 'building_Sports_name',
    descriptionKey: 'building_Sports_desc',
    gridRef: 'J12',
    address: '10 Gymnasium Road',
    category: 'sports',
  },
  {
    id: 'FIELDS',
    name: 'Sports Fields & Tennis',
    position: gridToPixel('K16'),
    description: 'Outdoor sports fields and tennis centre.',
    tags: ['sports', 'recreation', 'outdoor'],
    translationKey: 'building_FIELDS_name',
    descriptionKey: 'building_FIELDS_desc',
    gridRef: 'K16',
    address: '15-17 Gymnasium Road',
    category: 'sports',
  },

  // FOOD & RETAIL
  {
    id: 'UBAR',
    name: 'UBar & Central Courtyard',
    position: gridToPixel('K18'),
    description: 'Campus bar, social venue, graduation ceremonies area.',
    tags: ['food', 'social', 'events'],
    translationKey: 'building_UBAR_name',
    descriptionKey: 'building_UBAR_desc',
    gridRef: 'K18',
    address: '1 Central Courtyard',
    category: 'food',
  },
  {
    id: 'CULT',
    name: 'Cult Eatery',
    position: gridToPixel('O13'),
    description: 'Campus eatery in Arts precinct.',
    tags: ['food', 'cafe'],
    translationKey: 'building_CULT_name',
    descriptionKey: 'building_CULT_desc',
    gridRef: 'O13',
    address: "25B Wally's Walk",
    category: 'food',
  },
  {
    id: 'LACH',
    name: "Lachlan's Restaurant",
    position: gridToPixel('E23'),
    description: 'Fine dining restaurant.',
    tags: ['food', 'restaurant'],
    translationKey: 'building_LACH_name',
    descriptionKey: 'building_LACH_desc',
    gridRef: 'E23',
    address: '1 Executive Road',
    category: 'food',
  },

  // OTHER SERVICES
  {
    id: '8SCO',
    name: '8 Sir Christopher Ondaatje Ave',
    position: gridToPixel('P20'),
    description:
      'Future Students, MQ College, MQ Academy, Prayer Room, IELTS/PTE Test Centre, Access & Widening Participation.',
    tags: ['services', 'student', 'administration'],
    translationKey: 'building_8SCO_name',
    descriptionKey: 'building_8SCO_desc',
    gridRef: 'P20',
    address: '8 Sir Christopher Ondaatje Ave',
    category: 'services',
  },
  {
    id: '16WW',
    name: "16 Wally's Walk (Research)",
    position: gridToPixel('N18'),
    description: 'Graduate Research Academy, Research Services, Commercialisation & Innovation.',
    tags: ['research', 'services'],
    translationKey: 'building_16WW_name',
    descriptionKey: 'building_16WW_desc',
    gridRef: 'N18',
    address: "16 Wally's Walk",
    category: 'research',
  },
  {
    id: '12SW',
    name: '12 Second Way (Student Services)',
    position: gridToPixel('P16'),
    description: 'Student Wellbeing, Student Engagement, Graduation Unit.',
    tags: ['services', 'student', 'wellbeing'],
    translationKey: 'building_12SW_name',
    descriptionKey: 'building_12SW_desc',
    gridRef: 'P16',
    address: '12 Second Way',
    category: 'services',
  },
  {
    id: '19ER',
    name: '19 Eastern Road (Chancellery)',
    position: gridToPixel('H20'),
    description: 'Chancellery, Archives & Records, Art Gallery.',
    tags: ['administration', 'gallery', 'arts'],
    translationKey: 'building_19ER_name',
    descriptionKey: 'building_19ER_desc',
    gridRef: 'H20',
    address: '19 Eastern Road',
    category: 'services',
  },
  {
    id: 'OBS',
    name: 'Observatory',
    position: gridToPixel('C12'),
    description: 'Astronomy observatory.',
    tags: ['research', 'science', 'astronomy'],
    translationKey: 'building_OBS_name',
    descriptionKey: 'building_OBS_desc',
    gridRef: 'C12',
    address: '5 Gymnasium Road',
    category: 'research',
  },
  {
    id: 'INCUB',
    name: 'MQ Incubator',
    position: gridToPixel('S8'),
    description: 'Macquarie University Incubator for startups.',
    tags: ['services', 'business', 'innovation'],
    translationKey: 'building_INCUB_name',
    descriptionKey: 'building_INCUB_desc',
    gridRef: 'S8',
    address: '8 Hadenfeld Avenue',
    category: 'services',
  },
  {
    id: 'CHAP',
    name: 'Chaplaincy',
    position: gridToPixel('R6'),
    description: 'Multi-faith chaplaincy services.',
    tags: ['services', 'spiritual'],
    translationKey: 'building_CHAP_name',
    descriptionKey: 'building_CHAP_desc',
    gridRef: 'R6',
    address: '10 Hadenfeld Avenue',
    category: 'services',
  },
  {
    id: 'WALU',
    name: 'Walanga Muru',
    position: gridToPixel('N11'),
    description: 'Indigenous student support and cultural services.',
    tags: ['services', 'indigenous', 'culture'],
    translationKey: 'building_WALU_name',
    descriptionKey: 'building_WALU_desc',
    gridRef: 'N11',
    address: "29 Wally's Walk",
    category: 'services',
  },

  // CHILDCARE
  {
    id: 'BANK',
    name: 'Banksia Cottage (Childcare)',
    position: gridToPixel('P8'),
    description: 'Campus childcare facility.',
    tags: ['services', 'childcare'],
    translationKey: 'building_BANK_name',
    descriptionKey: 'building_BANK_desc',
    gridRef: 'P8',
    address: '8 Link Road',
    category: 'services',
  },

  // RESIDENTIAL
  {
    id: 'DLC',
    name: 'Dunmore Lang College',
    position: gridToPixel('W25'),
    description: 'Student residential college.',
    tags: ['residential', 'accommodation'],
    translationKey: 'building_DLC_name',
    descriptionKey: 'building_DLC_desc',
    gridRef: 'W25',
    address: '130 Herring Road',
    category: 'residential',
  },
  {
    id: 'RMC',
    name: 'Robert Menzies College',
    position: gridToPixel('V26'),
    description: 'Student residential college.',
    tags: ['residential', 'accommodation'],
    translationKey: 'building_RMC_name',
    descriptionKey: 'building_RMC_desc',
    gridRef: 'V26',
    address: '136 Herring Road',
    category: 'residential',
  },
  {
    id: 'MQV',
    name: 'MQ Village',
    position: gridToPixel('F7'),
    description: 'Student accommodation village.',
    tags: ['residential', 'accommodation'],
    translationKey: 'building_MQV_name',
    descriptionKey: 'building_MQV_desc',
    gridRef: 'F7',
    address: '122 Culloden Road',
    category: 'residential',
  },

  // MUSEUMS & GALLERIES
  {
    id: 'GALLERY',
    name: 'Art Gallery',
    position: gridToPixel('H20'),
    description: 'University art gallery and exhibitions.',
    tags: ['arts', 'gallery', 'culture'],
    translationKey: 'building_GALLERY_name',
    descriptionKey: 'building_GALLERY_desc',
    gridRef: 'H20',
    address: '19 Eastern Road',
    category: 'venue',
  },
  {
    id: 'BIODISC',
    name: 'Biology Discovery Centre',
    position: gridToPixel('L23'),
    description: 'Biology museum and discovery centre.',
    tags: ['science', 'museum', 'education'],
    translationKey: 'building_BIODISC_name',
    descriptionKey: 'building_BIODISC_desc',
    gridRef: 'L23',
    address: '6 Science Road',
    category: 'venue',
  },
];

export const getBuildingById = (id: string): Building | undefined => {
  return buildings.find((building) => building.id === id);
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
