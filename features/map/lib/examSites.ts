// lib/map/examSites.ts
// MQ Exam Sites - Session 2, 2024

export interface ExamSite {
  id: string;
  group: string;
  address: string;
  ref: string;
  rooms: string[];
  session: string;
}

export const examSites: ExamSite[] = [
  {
    id: 'exam-central-courtyard',
    group: 'EXAM BUILDINGS',
    address: '1 Central Courtyard',
    ref: 'L18',
    rooms: [
      'Room 203',
      'Room 204',
      'Room 205',
      'Room 207',
      'Room 208',
      'Room 214',
      'Room 215',
      'Room 216',
      'Room 217',
    ],
    session: 'Session 2, 2024',
  },
  {
    id: 'exam-library-q1',
    group: 'Library Quiet Rooms (Q Rooms)',
    address: '16 Macquarie Walk',
    ref: 'R17',
    rooms: [
      'Room Q1.01',
      'Room Q1.02',
      'Room Q1.03',
      'Room Q1.04',
      'Room Q1.05',
      'Room Q1.06',
      'Room Q1.07',
      'Room Q1.08',
      'Room Q1.09',
      'Room Q2.07',
      'Room Q2.08',
      'Room Q2.09',
    ],
    session: 'Session 2, 2024',
  },
  {
    id: 'exam-research-park',
    group: 'Library Quiet Rooms (Q Rooms)',
    address: '4 Research Park Drive',
    ref: 'O26',
    rooms: [
      'Room 111 PC Lab',
      'Room 112 PC Lab',
      'Room 113 PC Lab',
      'Room 114 PC Lab',
      'Room 115 PC Lab',
      'Room G11 PC Lab',
      'Room G13 PC Lab',
      'Room G14 PC Lab',
      'Room G15 PC Lab',
    ],
    session: 'Session 2, 2024',
  },
  {
    id: 'exam-ondaatje',
    group: 'Library Quiet Rooms (Q Rooms)',
    address: '14 Sir Christopher Ondaatje Ave',
    ref: 'N20',
    rooms: ['Room 200', 'Room 263', 'Room 264', 'Hall, Ground Floor'],
    session: 'Session 2, 2024',
  },
  {
    id: 'exam-11ww',
    group: 'Library Quiet Rooms (Q Rooms)',
    address: "11 Wally's Walk",
    ref: 'N21',
    rooms: [
      'Room 110/120',
      'Room 130',
      'Room 140',
      'Room 142',
      'Room 144',
      'Room 146',
      'Room 150/160',
      'Room 152',
      'Room 154',
      'Room 156',
      'Room 170/180',
    ],
    session: 'Session 2, 2024',
  },
  {
    id: 'exam-6er',
    group: 'Library Quiet Rooms (Q Rooms)',
    address: '6 Eastern Road',
    ref: 'Q22',
    rooms: [
      'Room 104 PC Lab',
      'Room 118 PC Lab',
      'Room 119 PC Lab',
      'Room 206 PC Lab',
      'Room 208 PC Lab',
      'Room 214 PC Lab',
      'Room 215 PC Lab',
      'Room 306 PC Lab',
      'Room 308',
      'Room 314',
      'Room 316',
    ],
    session: 'Session 2, 2024',
  },
  {
    id: 'exam-12sw',
    group: 'Library Quiet Rooms (Q Rooms)',
    address: '12 Second Way',
    ref: 'P16',
    rooms: [
      'Room 201',
      'Room 204',
      'Room 225',
      'Room 226/229',
      'Room 232',
      'Room 301',
      'Room 304',
      'Room 307',
      'Room 310',
      'Room 401',
      'Room 404',
      'Room 407',
      'Room 430',
      'Room 435',
    ],
    session: 'Session 2, 2024',
  },
  {
    id: 'exam-23ww',
    group: 'Library Quiet Rooms (Q Rooms)',
    address: "23 Wally's Walk",
    ref: 'O14',
    rooms: ['Room 101', 'Room 103', 'Room 105', 'Room 201', 'Room 203', 'Room 205'],
    session: 'Session 2, 2024',
  },
  {
    id: 'exam-25ww',
    group: 'Library Quiet Rooms (Q Rooms)',
    address: "25 Wally's Walk",
    ref: 'O13',
    rooms: [
      'Room A105',
      'Room A106',
      'Room A109',
      'Room A110',
      'Room A111',
      'Room A112',
      'Room A113',
      'Room A114',
      'Room A204',
      'Room A207',
      'Room A208',
      'Room A209',
      'Room A210',
      'Room A211',
      'Room GA05',
      'Room GA06',
      'Room GA08',
      'Room GA09',
      'Room GB30',
      'Room GB31',
    ],
    session: 'Session 2, 2024',
  },
  {
    id: 'exam-lotus',
    group: 'Library Quiet Rooms (Q Rooms)',
    address: "27 Wally's Walk",
    ref: 'O12',
    rooms: ['Lotus Theatre'],
    session: 'Session 2, 2024',
  },
  {
    id: 'exam-4wr',
    group: 'Library Quiet Rooms (Q Rooms)',
    address: '4 Western Road',
    ref: 'P14',
    rooms: [
      'Room 211',
      'Room 213',
      'Room 220',
      'Room 232',
      'Room 302',
      'Room 303',
      'Room 309',
      'Room 310',
      'Room 311',
      'Room 312',
      'Room 320',
      'Room 332',
      'Room 333',
      'Room 334',
      'Room 335',
    ],
    session: 'Session 2, 2024',
  },
];

// Helper functions
export const getExamSiteById = (id: string): ExamSite | undefined => {
  return examSites.find((site) => site.id === id);
};

export const getExamSiteByRef = (ref: string): ExamSite | undefined => {
  return examSites.find((site) => site.ref === ref);
};

export const searchExamSites = (query: string): ExamSite[] => {
  const lowerQuery = query.toLowerCase();
  return examSites.filter(
    (site) =>
      site.address.toLowerCase().includes(lowerQuery) ||
      site.ref.toLowerCase().includes(lowerQuery) ||
      site.rooms.some((room) => room.toLowerCase().includes(lowerQuery)),
  );
};

export const getAllExamRooms = (): { site: ExamSite; room: string }[] => {
  const allRooms: { site: ExamSite; room: string }[] = [];
  for (const site of examSites) {
    for (const room of site.rooms) {
      allRooms.push({ site, room });
    }
  }
  return allRooms;
};
