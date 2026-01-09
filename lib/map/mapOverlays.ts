// lib/map/mapOverlays.ts
// Map Overlay Layers Configuration

export type MapOverlayId = 'parking' | 'water' | 'accessibility' | 'permits' | 'exam';

export interface MapOverlay {
  id: MapOverlayId;
  name: string;
  description: string;
  imagePath: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  category: 'transport' | 'facilities' | 'accessibility' | 'academic' | 'recreation';
  enabled: boolean; // Default enabled state
  // Metadata for hover tooltips
  source: string; // Data source attribution
  lastUpdated: string; // When the data was last updated
  legend?: string[]; // What the overlay shows (icons/colors meaning)
}

export const mapOverlays: MapOverlay[] = [
  {
    id: 'parking',
    name: 'Parking',
    description: 'Parking zones, EV charging, ticket machines, accessible bays, metro stop',
    imagePath: '/maps/overlays/Campus-Map_parking.png',
    icon: 'Car',
    color: 'text-blue-500',
    category: 'transport',
    enabled: false,
    source: 'MQ Property Division',
    lastUpdated: 'August 2024',
    legend: [
      'Blue zones: Staff parking',
      'Green zones: Student parking',
      'Yellow: EV charging stations',
      'Purple: Accessible bays',
    ],
  },
  {
    id: 'water',
    name: 'Drinking Water',
    description: 'Water fountain locations across campus',
    imagePath: '/maps/overlays/Drinking-water.png',
    icon: 'Droplets',
    color: 'text-cyan-500',
    category: 'facilities',
    enabled: false,
    source: 'MQ Sustainability Office',
    lastUpdated: 'June 2024',
    legend: ['Blue drops: Water fountains', 'Refill stations marked'],
  },
  {
    id: 'accessibility',
    name: 'Accessibility',
    description: 'Accessible pathways, toilets, lifts, and stairs',
    imagePath: '/maps/overlays/map_accessibility.png',
    icon: 'Accessibility',
    color: 'text-purple-500',
    category: 'accessibility',
    enabled: false,
    source: 'MQ Campus Services',
    lastUpdated: 'July 2024',
    legend: [
      'Purple lines: Accessible paths',
      'Wheelchair icons: Accessible toilets',
      'Lift icons: Elevator locations',
    ],
  },
  {
    id: 'permits',
    name: 'Special Permits',
    description: 'Service vehicle parking and special permit zones',
    imagePath: '/maps/overlays/map_special_permits_service_vehicles.png',
    icon: 'BadgeCheck',
    color: 'text-orange-500',
    category: 'transport',
    enabled: false,
    source: 'MQ Security & Transport',
    lastUpdated: 'August 2024',
    legend: ['Orange zones: Service vehicles only', 'Special permit areas marked'],
  },
  {
    id: 'exam',
    name: 'Exam Locations',
    description: 'Exam buildings and room locations (S2 2024)',
    imagePath: '/maps/overlays/Exam-Map-S22024.png',
    icon: 'GraduationCap',
    color: 'text-red-500',
    category: 'academic',
    enabled: false,
    source: 'MQ Examinations Office',
    lastUpdated: 'Semester 2, 2024',
    legend: ['Red markers: Exam venues', 'Numbers: Building codes', 'Check iLearn for your venue'],
  },
];

// Helper functions
export const getOverlayById = (id: MapOverlayId): MapOverlay | undefined => {
  return mapOverlays.find((overlay) => overlay.id === id);
};

export const getOverlaysByCategory = (category: MapOverlay['category']): MapOverlay[] => {
  return mapOverlays.filter((overlay) => overlay.category === category);
};

export const OVERLAY_CATEGORY_LABELS: Record<MapOverlay['category'], string> = {
  transport: 'Transport',
  facilities: 'Facilities',
  accessibility: 'Accessibility',
  academic: 'Academic',
  recreation: 'Recreation',
};

// For storing user preferences
export type MapOverlayPreferences = Record<MapOverlayId, boolean>;

export const DEFAULT_OVERLAY_PREFERENCES: MapOverlayPreferences = {
  parking: false,
  water: false,
  accessibility: false,
  permits: false,
  exam: false,
};
