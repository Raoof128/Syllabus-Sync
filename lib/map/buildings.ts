export type Building = {
  id: string;
  name: string;
  position: [number, number]; // [y, x] in CRS.Simple pixel space
  description?: string;
  tags?: string[];
};

export const buildings: Building[] = [
  {
    id: 'C5C',
    name: 'Computer Science Building',
    position: [1600, 2300],
    description: 'Home to computer science and IT programs. Features modern labs, lecture theaters, and study spaces.',
    tags: ['academic', 'technology', 'labs'],
  },
  {
    id: 'C3C',
    name: 'Library',
    position: [1400, 2100],
    description: 'Central library with extensive collections, study areas, and academic support services.',
    tags: ['academic', 'study', 'resources'],
  },
  {
    id: 'C7A',
    name: 'Campus Hub',
    position: [1650, 2350],
    description: 'Student services center with administration, student support, and recreational facilities.',
    tags: ['services', 'administration', 'social'],
  },
  {
    id: 'W6A',
    name: 'Wallumattagal Building',
    position: [1200, 1800],
    description: 'Teaching and learning facility with classrooms, lecture theaters, and student spaces.',
    tags: ['academic', 'teaching', 'classrooms'],
  },
  {
    id: 'E7A',
    name: 'Engineering Building',
    position: [2000, 2500],
    description: 'Engineering and design studios with specialized labs and workshops.',
    tags: ['academic', 'engineering', 'labs'],
  },
  {
    id: 'E7B',
    name: 'Engineering Building B',
    position: [2050, 2550],
    description: 'Additional engineering facilities with advanced research labs and equipment.',
    tags: ['academic', 'engineering', 'research'],
  },
  {
    id: 'W3A',
    name: 'Careers & Employment',
    position: [1800, 2200],
    description: 'Career services center offering job search assistance, resume workshops, and employer connections.',
    tags: ['services', 'careers', 'workshops'],
  },
  {
    id: '12WW',
    name: '12 Wally\'s Walk',
    position: [1500, 2000],
    description: 'Academic building with classrooms and faculty offices.',
    tags: ['academic', 'teaching'],
  },
  {
    id: '4WW',
    name: '4 Wally\'s Walk',
    position: [1550, 2050],
    description: 'Lecture and tutorial spaces for various disciplines.',
    tags: ['academic', 'teaching'],
  },
  {
    id: 'LIB',
    name: 'Library',
    position: [1400, 2100],
    description: 'Central library with extensive collections, study areas, and academic support services.',
    tags: ['academic', 'study', 'resources'],
  },
  {
    id: 'Sports',
    name: 'Sports Precinct',
    position: [2500, 3000],
    description: 'Sports facilities including gym, courts, and recreational areas.',
    tags: ['sports', 'recreation', 'fitness'],
  },
];

export const getBuildingById = (id: string): Building | undefined => {
  return buildings.find(building => building.id === id);
};

export const searchBuildings = (query: string): Building[] => {
  const lowerQuery = query.toLowerCase();
  return buildings.filter(building =>
    building.name.toLowerCase().includes(lowerQuery) ||
    building.id.toLowerCase().includes(lowerQuery) ||
    building.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    building.description?.toLowerCase().includes(lowerQuery)
  );
};