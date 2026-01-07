import type { TranslationKey } from '@/lib/i18n/translations';

export type Building = {
  id: string;
  name: string;
  position: [number, number]; // [x, y] pixel coordinates for map placement
  description?: string;
  tags?: string[];
  translationKey: TranslationKey;
  descriptionKey: TranslationKey;
};

export const buildings: Building[] = [
  {
    id: 'C5C',
    name: 'Computer Science Building',
    position: [1600, 2300],
    description:
      'Home to computer science and IT programs. Features modern labs, lecture theaters, and study spaces.',
    tags: ['academic', 'technology', 'labs'],
    translationKey: 'building_C5C_name',
    descriptionKey: 'building_C5C_desc',
  },
  {
    id: 'C3C',
    name: 'Library',
    position: [1400, 2100],
    description:
      'Central library with extensive collections, study areas, and academic support services.',
    tags: ['academic', 'study', 'resources'],
    translationKey: 'building_C3C_name',
    descriptionKey: 'building_C3C_desc',
  },
  {
    id: 'C7A',
    name: 'Campus Hub',
    position: [1650, 2350],
    description:
      'Student services center with administration, student support, and recreational facilities.',
    tags: ['services', 'administration', 'social'],
    translationKey: 'building_C7A_name',
    descriptionKey: 'building_C7A_desc',
  },
  {
    id: 'W6A',
    name: 'Wallumattagal Building',
    position: [1200, 1800],
    description:
      'Teaching and learning facility with classrooms, lecture theaters, and student spaces.',
    tags: ['academic', 'teaching', 'classrooms'],
    translationKey: 'building_W6A_name',
    descriptionKey: 'building_W6A_desc',
  },
  {
    id: 'E7A',
    name: 'Engineering Building',
    position: [2000, 2500],
    description: 'Engineering and design studios with specialized labs and workshops.',
    tags: ['academic', 'engineering', 'labs'],
    translationKey: 'building_E7A_name',
    descriptionKey: 'building_E7A_desc',
  },
  {
    id: 'E7B',
    name: 'Engineering Building B',
    position: [2050, 2550],
    description: 'Additional engineering facilities with advanced research labs and equipment.',
    tags: ['academic', 'engineering', 'research'],
    translationKey: 'building_E7B_name',
    descriptionKey: 'building_E7B_desc',
  },
  {
    id: 'W3A',
    name: 'Careers & Employment',
    position: [1800, 2200],
    description:
      'Career services center offering job search assistance, resume workshops, and employer connections.',
    tags: ['services', 'careers', 'workshops'],
    translationKey: 'building_W3A_name',
    descriptionKey: 'building_W3A_desc',
  },
  {
    id: '12WW',
    name: "12 Wally's Walk",
    position: [1500, 2000],
    description: 'Academic building with classrooms and faculty offices.',
    tags: ['academic', 'teaching'],
    translationKey: 'building_12WW_name',
    descriptionKey: 'building_12WW_desc',
  },
  {
    id: '4WW',
    name: "4 Wally's Walk",
    position: [1550, 2050],
    description: 'Lecture and tutorial spaces for various disciplines.',
    tags: ['academic', 'teaching'],
    translationKey: 'building_4WW_name',
    descriptionKey: 'building_4WW_desc',
  },
  {
    id: 'Sports',
    name: 'Sports Precinct',
    position: [2500, 3000],
    description: 'Sports facilities including gym, courts, and recreational areas.',
    tags: ['sports', 'recreation', 'fitness'],
    translationKey: 'building_Sports_name',
    descriptionKey: 'building_Sports_desc',
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
      building.description?.toLowerCase().includes(lowerQuery),
  );
};
