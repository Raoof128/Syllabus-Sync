// data/mqKeyDates.ts
// Macquarie University Key Academic Dates 2025-2027

export type MQDateCategory =
  | 'classes'
  | 'exams'
  | 'admin'
  | 'results'
  | 'payment'
  | 'enrollment'
  | 'recess';
export type MQProgram =
  | 'general'
  | 'business-school'
  | 'college'
  | 'global-mba'
  | 'fmhhs'
  | 'oua'
  | 'exchange'
  | 'online-degree'
  | 'muic'
  | 'elc';

export interface MQKeyDate {
  id: string;
  date: Date;
  endDate?: Date; // For date ranges
  event: string;
  description?: string; // Optional explanation of what this date means
  term: string;
  category: MQDateCategory;
  program: MQProgram;
}

// Helper to create date with AEST timezone
const createDate = (year: number, month: number, day: number) => new Date(year, month - 1, day);

// Common descriptions for key academic dates
const CENSUS_DATE_DESCRIPTION =
  'Last day to withdraw without financial penalty. After this date, fees are locked in and the unit appears on your academic record.';

// General MQ dates for 2025
const generalDates2025: MQKeyDate[] = [
  // January 2025
  {
    id: 'mq-1',
    date: createDate(2025, 1, 1),
    event: 'Recess End',
    term: 'Session 3',
    category: 'recess',
    program: 'general',
  },
  {
    id: 'mq-2',
    date: createDate(2025, 1, 2),
    event: 'Session classes resume',
    term: 'Session 3',
    category: 'classes',
    program: 'general',
  },
  {
    id: 'mq-3',
    date: createDate(2025, 1, 19),
    event: 'Last Day of Classes',
    term: 'Session 3',
    category: 'classes',
    program: 'general',
  },
  {
    id: 'mq-4',
    date: createDate(2025, 1, 20),
    event: 'Exams Start',
    term: 'Session 3',
    category: 'exams',
    program: 'general',
  },
  {
    id: 'mq-5',
    date: createDate(2025, 1, 24),
    event: 'Study Period End',
    term: 'Session 3',
    category: 'admin',
    program: 'general',
  },
  {
    id: 'mq-6',
    date: createDate(2025, 1, 24),
    event: 'Exams End',
    term: 'Session 3',
    category: 'exams',
    program: 'general',
  },
  // February 2025
  {
    id: 'mq-7',
    date: createDate(2025, 2, 6),
    event: 'Result Publication Date',
    term: 'Session 3',
    category: 'results',
    program: 'general',
  },
  {
    id: 'mq-8',
    date: createDate(2025, 2, 10),
    event: 'Supplementary Exams start',
    term: 'Session 3',
    category: 'exams',
    program: 'general',
  },
  {
    id: 'mq-9',
    date: createDate(2025, 2, 13),
    event: 'Supplementary Exams end',
    term: 'Session 3',
    category: 'exams',
    program: 'general',
  },
  {
    id: 'mq-10',
    date: createDate(2025, 2, 21),
    event: 'Payment Due Date',
    term: 'Session 1',
    category: 'payment',
    program: 'general',
  },
  {
    id: 'mq-11',
    date: createDate(2025, 2, 24),
    event: 'Study Period Start',
    term: 'Session 1',
    category: 'admin',
    program: 'general',
  },
  // March 2025
  {
    id: 'mq-14',
    date: createDate(2025, 3, 9),
    event: 'Last Enrol Date',
    term: 'Session 1',
    category: 'enrollment',
    program: 'general',
  },
  {
    id: 'mq-16',
    date: createDate(2025, 3, 21),
    event: 'Teaching Census',
    description:
      'Last day to withdraw without financial penalty. After this date, fees are locked in and the unit appears on your academic record.',
    term: 'Session 1',
    category: 'admin',
    program: 'general',
  },
  // April 2025
  {
    id: 'mq-17',
    date: createDate(2025, 4, 14),
    event: 'Recess Start',
    term: 'Session 1',
    category: 'recess',
    program: 'general',
  },
  {
    id: 'mq-19',
    date: createDate(2025, 4, 25),
    event: 'Recess End',
    term: 'Session 1',
    category: 'recess',
    program: 'general',
  },
  {
    id: 'mq-20',
    date: createDate(2025, 4, 28),
    event: 'Last Withdrawal',
    term: 'Session 1',
    category: 'enrollment',
    program: 'general',
  },
  // June 2025
  {
    id: 'mq-25',
    date: createDate(2025, 6, 8),
    event: 'Last Day of Classes',
    term: 'Session 1',
    category: 'classes',
    program: 'general',
  },
  {
    id: 'mq-26',
    date: createDate(2025, 6, 10),
    event: 'Exams Start',
    term: 'Session 1',
    category: 'exams',
    program: 'general',
  },
  {
    id: 'mq-30',
    date: createDate(2025, 6, 27),
    event: 'Exams End',
    term: 'Session 1',
    category: 'exams',
    program: 'general',
  },
  // July 2025
  {
    id: 'mq-37',
    date: createDate(2025, 7, 10),
    event: 'Result Publication Date',
    term: 'Session 1',
    category: 'results',
    program: 'general',
  },
  {
    id: 'mq-40',
    date: createDate(2025, 7, 25),
    event: 'Payment Due Date',
    term: 'Session 2',
    category: 'payment',
    program: 'general',
  },
  {
    id: 'mq-42',
    date: createDate(2025, 7, 28),
    event: 'Study Period Start',
    term: 'Session 2',
    category: 'admin',
    program: 'general',
  },
  // August 2025
  {
    id: 'mq-46',
    date: createDate(2025, 8, 10),
    event: 'Last Enrol Date',
    term: 'Session 2',
    category: 'enrollment',
    program: 'general',
  },
  {
    id: 'mq-48',
    date: createDate(2025, 8, 22),
    event: 'Teaching Census',
    description:
      'Last day to withdraw without financial penalty. After this date, fees are locked in and the unit appears on your academic record.',
    term: 'Session 2',
    category: 'admin',
    program: 'general',
  },
  // September 2025
  {
    id: 'mq-49',
    date: createDate(2025, 9, 22),
    event: 'Recess Start',
    term: 'Session 2',
    category: 'recess',
    program: 'general',
  },
  {
    id: 'mq-50',
    date: createDate(2025, 9, 28),
    event: 'Last Withdrawal',
    term: 'Session 2',
    category: 'enrollment',
    program: 'general',
  },
  // October 2025
  {
    id: 'mq-52',
    date: createDate(2025, 10, 6),
    event: 'Recess End',
    term: 'Session 2',
    category: 'recess',
    program: 'general',
  },
  // November 2025
  {
    id: 'mq-54',
    date: createDate(2025, 11, 9),
    event: 'Last Day of Classes',
    term: 'Session 2',
    category: 'classes',
    program: 'general',
  },
  {
    id: 'mq-56',
    date: createDate(2025, 11, 10),
    event: 'Exams Start',
    term: 'Session 2',
    category: 'exams',
    program: 'general',
  },
  {
    id: 'mq-58',
    date: createDate(2025, 11, 28),
    event: 'Exams End',
    term: 'Session 2',
    category: 'exams',
    program: 'general',
  },
  // December 2025
  {
    id: 'mq-64',
    date: createDate(2025, 12, 11),
    event: 'Result Publication Date',
    term: 'Session 2',
    category: 'results',
    program: 'general',
  },
  {
    id: 'mq-67',
    date: createDate(2025, 12, 12),
    event: 'Payment Due Date',
    term: 'Session 3',
    category: 'payment',
    program: 'general',
  },
  {
    id: 'mq-68',
    date: createDate(2025, 12, 15),
    event: 'Study Period Start',
    term: 'Session 3',
    category: 'admin',
    program: 'general',
  },
];

// General MQ dates for 2026
const generalDates2026: MQKeyDate[] = [
  // Session 3 (2025-2026) - continues from December 2025
  {
    id: 'mq26-1',
    date: createDate(2026, 1, 1),
    event: 'Recess End',
    term: 'Session 3',
    category: 'recess',
    program: 'general',
  },
  {
    id: 'mq26-2',
    date: createDate(2026, 1, 2),
    event: 'Session classes resume',
    term: 'Session 3',
    category: 'classes',
    program: 'general',
  },
  {
    id: 'mq26-3',
    date: createDate(2026, 1, 18),
    event: 'Last Day of Classes',
    term: 'Session 3',
    category: 'classes',
    program: 'general',
  },
  {
    id: 'mq26-4',
    date: createDate(2026, 1, 19),
    event: 'Exams Start',
    term: 'Session 3',
    category: 'exams',
    program: 'general',
  },
  {
    id: 'mq26-5',
    date: createDate(2026, 1, 23),
    event: 'Exams End',
    term: 'Session 3',
    category: 'exams',
    program: 'general',
  },
  {
    id: 'mq26-6',
    date: createDate(2026, 1, 26),
    event: 'Australia Day (Public Holiday)',
    term: 'General',
    category: 'recess',
    program: 'general',
  },
  // February 2026
  {
    id: 'mq26-7',
    date: createDate(2026, 2, 5),
    event: 'Result Publication Date',
    term: 'Session 3',
    category: 'results',
    program: 'general',
  },
  {
    id: 'mq26-8',
    date: createDate(2026, 2, 9),
    event: 'Supplementary Exams Start',
    term: 'Session 3',
    category: 'exams',
    program: 'general',
  },
  {
    id: 'mq26-9',
    date: createDate(2026, 2, 12),
    event: 'Supplementary Exams End',
    term: 'Session 3',
    category: 'exams',
    program: 'general',
  },
  {
    id: 'mq26-10',
    date: createDate(2026, 2, 20),
    event: 'Payment Due Date',
    term: 'Session 1',
    category: 'payment',
    program: 'general',
  },
  {
    id: 'mq26-11',
    date: createDate(2026, 2, 23),
    event: 'Study Period Start',
    term: 'Session 1',
    category: 'admin',
    program: 'general',
  },
  // March 2026
  {
    id: 'mq26-12',
    date: createDate(2026, 3, 8),
    event: 'Last Enrol Date',
    term: 'Session 1',
    category: 'enrollment',
    program: 'general',
  },
  {
    id: 'mq26-13',
    date: createDate(2026, 3, 20),
    event: 'Teaching Census',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'Session 1',
    category: 'admin',
    program: 'general',
  },
  // April 2026
  {
    id: 'mq26-14',
    date: createDate(2026, 4, 3),
    event: 'Good Friday (Public Holiday)',
    term: 'General',
    category: 'recess',
    program: 'general',
  },
  {
    id: 'mq26-15',
    date: createDate(2026, 4, 6),
    event: 'Easter Monday (Public Holiday)',
    term: 'General',
    category: 'recess',
    program: 'general',
  },
  {
    id: 'mq26-16',
    date: createDate(2026, 4, 13),
    event: 'Recess Start',
    term: 'Session 1',
    category: 'recess',
    program: 'general',
  },
  {
    id: 'mq26-17',
    date: createDate(2026, 4, 24),
    event: 'Recess End',
    term: 'Session 1',
    category: 'recess',
    program: 'general',
  },
  {
    id: 'mq26-18',
    date: createDate(2026, 4, 25),
    event: 'ANZAC Day (Public Holiday)',
    term: 'General',
    category: 'recess',
    program: 'general',
  },
  {
    id: 'mq26-19',
    date: createDate(2026, 4, 27),
    event: 'Last Withdrawal Date',
    term: 'Session 1',
    category: 'enrollment',
    program: 'general',
  },
  // June 2026
  {
    id: 'mq26-20',
    date: createDate(2026, 6, 7),
    event: 'Last Day of Classes',
    term: 'Session 1',
    category: 'classes',
    program: 'general',
  },
  {
    id: 'mq26-21',
    date: createDate(2026, 6, 8),
    event: "Queen's Birthday (Public Holiday)",
    term: 'General',
    category: 'recess',
    program: 'general',
  },
  {
    id: 'mq26-22',
    date: createDate(2026, 6, 9),
    event: 'Exams Start',
    term: 'Session 1',
    category: 'exams',
    program: 'general',
  },
  {
    id: 'mq26-23',
    date: createDate(2026, 6, 26),
    event: 'Exams End',
    term: 'Session 1',
    category: 'exams',
    program: 'general',
  },
  // July 2026
  {
    id: 'mq26-24',
    date: createDate(2026, 7, 9),
    event: 'Result Publication Date',
    term: 'Session 1',
    category: 'results',
    program: 'general',
  },
  {
    id: 'mq26-25',
    date: createDate(2026, 7, 13),
    event: 'Supplementary Exams Start',
    term: 'Session 1',
    category: 'exams',
    program: 'general',
  },
  {
    id: 'mq26-26',
    date: createDate(2026, 7, 16),
    event: 'Supplementary Exams End',
    term: 'Session 1',
    category: 'exams',
    program: 'general',
  },
  {
    id: 'mq26-27',
    date: createDate(2026, 7, 24),
    event: 'Payment Due Date',
    term: 'Session 2',
    category: 'payment',
    program: 'general',
  },
  {
    id: 'mq26-28',
    date: createDate(2026, 7, 27),
    event: 'Study Period Start',
    term: 'Session 2',
    category: 'admin',
    program: 'general',
  },
  // August 2026
  {
    id: 'mq26-29',
    date: createDate(2026, 8, 9),
    event: 'Last Enrol Date',
    term: 'Session 2',
    category: 'enrollment',
    program: 'general',
  },
  {
    id: 'mq26-30',
    date: createDate(2026, 8, 21),
    event: 'Teaching Census',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'Session 2',
    category: 'admin',
    program: 'general',
  },
  // September 2026
  {
    id: 'mq26-31',
    date: createDate(2026, 9, 21),
    event: 'Recess Start',
    term: 'Session 2',
    category: 'recess',
    program: 'general',
  },
  {
    id: 'mq26-32',
    date: createDate(2026, 9, 27),
    event: 'Last Withdrawal Date',
    term: 'Session 2',
    category: 'enrollment',
    program: 'general',
  },
  // October 2026
  {
    id: 'mq26-33',
    date: createDate(2026, 10, 5),
    event: 'Recess End',
    term: 'Session 2',
    category: 'recess',
    program: 'general',
  },
  // November 2026
  {
    id: 'mq26-34',
    date: createDate(2026, 11, 8),
    event: 'Last Day of Classes',
    term: 'Session 2',
    category: 'classes',
    program: 'general',
  },
  {
    id: 'mq26-35',
    date: createDate(2026, 11, 9),
    event: 'Exams Start',
    term: 'Session 2',
    category: 'exams',
    program: 'general',
  },
  {
    id: 'mq26-36',
    date: createDate(2026, 11, 27),
    event: 'Exams End',
    term: 'Session 2',
    category: 'exams',
    program: 'general',
  },
  // December 2026
  {
    id: 'mq26-37',
    date: createDate(2026, 12, 10),
    event: 'Result Publication Date',
    term: 'Session 2',
    category: 'results',
    program: 'general',
  },
  {
    id: 'mq26-38',
    date: createDate(2026, 12, 11),
    event: 'Payment Due Date',
    term: 'Session 3',
    category: 'payment',
    program: 'general',
  },
  {
    id: 'mq26-39',
    date: createDate(2026, 12, 14),
    event: 'Study Period Start',
    term: 'Session 3',
    category: 'admin',
    program: 'general',
  },
  {
    id: 'mq26-40',
    date: createDate(2026, 12, 14),
    event: 'Supplementary Exams Start',
    term: 'Session 2',
    category: 'exams',
    program: 'general',
  },
  {
    id: 'mq26-41',
    date: createDate(2026, 12, 17),
    event: 'Supplementary Exams End',
    term: 'Session 2',
    category: 'exams',
    program: 'general',
  },
  {
    id: 'mq26-42',
    date: createDate(2026, 12, 21),
    endDate: createDate(2027, 1, 1),
    event: 'Christmas Recess',
    term: 'Session 3',
    category: 'recess',
    program: 'general',
  },
  {
    id: 'mq26-43',
    date: createDate(2026, 12, 25),
    event: 'Christmas Day (Public Holiday)',
    term: 'General',
    category: 'recess',
    program: 'general',
  },
  {
    id: 'mq26-44',
    date: createDate(2026, 12, 26),
    event: 'Boxing Day (Public Holiday)',
    term: 'General',
    category: 'recess',
    program: 'general',
  },
];

// FMHHS (Faculty of Medicine, Health and Human Sciences) dates 2026
const fmhhsDates: MQKeyDate[] = [
  // Session 1
  {
    id: 'fmhhs-s1-start',
    date: createDate(2026, 2, 23),
    event: 'Session 1 Start',
    term: 'FMHHS Session 1',
    category: 'classes',
    program: 'fmhhs',
  },
  {
    id: 'fmhhs-s1-census',
    date: createDate(2026, 3, 20),
    event: 'Census Date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'FMHHS Session 1',
    category: 'admin',
    program: 'fmhhs',
  },
  {
    id: 'fmhhs-s1-end',
    date: createDate(2026, 6, 26),
    event: 'Session 1 End',
    term: 'FMHHS Session 1',
    category: 'exams',
    program: 'fmhhs',
  },
  // Session 2
  {
    id: 'fmhhs-s2-start',
    date: createDate(2026, 7, 27),
    event: 'Session 2 Start',
    term: 'FMHHS Session 2',
    category: 'classes',
    program: 'fmhhs',
  },
  {
    id: 'fmhhs-s2-census',
    date: createDate(2026, 8, 21),
    event: 'Census Date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'FMHHS Session 2',
    category: 'admin',
    program: 'fmhhs',
  },
  {
    id: 'fmhhs-s2-end',
    date: createDate(2026, 11, 27),
    event: 'Session 2 End',
    term: 'FMHHS Session 2',
    category: 'exams',
    program: 'fmhhs',
  },
];

// OUA (Open Universities Australia) dates 2026
const ouaDates: MQKeyDate[] = [
  // Study Period 1
  {
    id: 'oua-sp1-start',
    date: createDate(2026, 3, 2),
    event: 'Study Period 1 Start',
    term: 'OUA SP1',
    category: 'classes',
    program: 'oua',
  },
  {
    id: 'oua-sp1-census',
    date: createDate(2026, 3, 20),
    event: 'Census Date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'OUA SP1',
    category: 'admin',
    program: 'oua',
  },
  {
    id: 'oua-sp1-end',
    date: createDate(2026, 5, 31),
    event: 'Study Period 1 End',
    term: 'OUA SP1',
    category: 'exams',
    program: 'oua',
  },
  // Study Period 2
  {
    id: 'oua-sp2-start',
    date: createDate(2026, 6, 1),
    event: 'Study Period 2 Start',
    term: 'OUA SP2',
    category: 'classes',
    program: 'oua',
  },
  {
    id: 'oua-sp2-census',
    date: createDate(2026, 6, 19),
    event: 'Census Date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'OUA SP2',
    category: 'admin',
    program: 'oua',
  },
  {
    id: 'oua-sp2-end',
    date: createDate(2026, 8, 30),
    event: 'Study Period 2 End',
    term: 'OUA SP2',
    category: 'exams',
    program: 'oua',
  },
  // Study Period 3
  {
    id: 'oua-sp3-start',
    date: createDate(2026, 9, 7),
    event: 'Study Period 3 Start',
    term: 'OUA SP3',
    category: 'classes',
    program: 'oua',
  },
  {
    id: 'oua-sp3-census',
    date: createDate(2026, 9, 25),
    event: 'Census Date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'OUA SP3',
    category: 'admin',
    program: 'oua',
  },
  {
    id: 'oua-sp3-end',
    date: createDate(2026, 11, 29),
    event: 'Study Period 3 End',
    term: 'OUA SP3',
    category: 'exams',
    program: 'oua',
  },
  // Study Period 4
  {
    id: 'oua-sp4-start',
    date: createDate(2026, 11, 30),
    event: 'Study Period 4 Start',
    term: 'OUA SP4',
    category: 'classes',
    program: 'oua',
  },
  {
    id: 'oua-sp4-census',
    date: createDate(2026, 12, 18),
    event: 'Census Date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'OUA SP4',
    category: 'admin',
    program: 'oua',
  },
];

// Exchange dates 2026
const exchangeDates: MQKeyDate[] = [
  // Semester 1
  {
    id: 'exchange-s1-start',
    date: createDate(2026, 2, 23),
    event: 'Semester 1 Start',
    term: 'Exchange Semester 1',
    category: 'classes',
    program: 'exchange',
  },
  {
    id: 'exchange-s1-welcome',
    date: createDate(2026, 2, 16),
    endDate: createDate(2026, 2, 20),
    event: 'Welcome Week',
    term: 'Exchange Semester 1',
    category: 'enrollment',
    program: 'exchange',
  },
  {
    id: 'exchange-s1-end',
    date: createDate(2026, 6, 26),
    event: 'Semester 1 End',
    term: 'Exchange Semester 1',
    category: 'exams',
    program: 'exchange',
  },
  // Semester 2
  {
    id: 'exchange-s2-start',
    date: createDate(2026, 7, 27),
    event: 'Semester 2 Start',
    term: 'Exchange Semester 2',
    category: 'classes',
    program: 'exchange',
  },
  {
    id: 'exchange-s2-welcome',
    date: createDate(2026, 7, 20),
    endDate: createDate(2026, 7, 24),
    event: 'Welcome Week',
    term: 'Exchange Semester 2',
    category: 'enrollment',
    program: 'exchange',
  },
  {
    id: 'exchange-s2-end',
    date: createDate(2026, 11, 27),
    event: 'Semester 2 End',
    term: 'Exchange Semester 2',
    category: 'exams',
    program: 'exchange',
  },
];

// Online Degree Programs dates 2026
const onlineDegreeDates: MQKeyDate[] = [
  // Session 1
  {
    id: 'online-s1-start',
    date: createDate(2026, 3, 2),
    event: 'Session 1 Start',
    term: 'Online Session 1',
    category: 'classes',
    program: 'online-degree',
  },
  {
    id: 'online-s1-census',
    date: createDate(2026, 3, 20),
    event: 'Census Date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'Online Session 1',
    category: 'admin',
    program: 'online-degree',
  },
  {
    id: 'online-s1-end',
    date: createDate(2026, 5, 24),
    event: 'Session 1 End',
    term: 'Online Session 1',
    category: 'exams',
    program: 'online-degree',
  },
  // Session 2
  {
    id: 'online-s2-start',
    date: createDate(2026, 6, 1),
    event: 'Session 2 Start',
    term: 'Online Session 2',
    category: 'classes',
    program: 'online-degree',
  },
  {
    id: 'online-s2-census',
    date: createDate(2026, 6, 19),
    event: 'Census Date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'Online Session 2',
    category: 'admin',
    program: 'online-degree',
  },
  {
    id: 'online-s2-end',
    date: createDate(2026, 8, 23),
    event: 'Session 2 End',
    term: 'Online Session 2',
    category: 'exams',
    program: 'online-degree',
  },
  // Session 3
  {
    id: 'online-s3-start',
    date: createDate(2026, 9, 7),
    event: 'Session 3 Start',
    term: 'Online Session 3',
    category: 'classes',
    program: 'online-degree',
  },
  {
    id: 'online-s3-census',
    date: createDate(2026, 9, 25),
    event: 'Census Date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'Online Session 3',
    category: 'admin',
    program: 'online-degree',
  },
  {
    id: 'online-s3-end',
    date: createDate(2026, 11, 22),
    event: 'Session 3 End',
    term: 'Online Session 3',
    category: 'exams',
    program: 'online-degree',
  },
];

// MUIC (MQ University International College) Terms dates 2026
const muicDates: MQKeyDate[] = [
  // Term 1
  {
    id: 'muic-t1-start',
    date: createDate(2026, 2, 23),
    event: 'Term 1 Start',
    term: 'MUIC Term 1',
    category: 'classes',
    program: 'muic',
  },
  {
    id: 'muic-t1-census',
    date: createDate(2026, 3, 13),
    event: 'Census Date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'MUIC Term 1',
    category: 'admin',
    program: 'muic',
  },
  {
    id: 'muic-t1-end',
    date: createDate(2026, 4, 17),
    event: 'Term 1 End',
    term: 'MUIC Term 1',
    category: 'exams',
    program: 'muic',
  },
  // Term 2
  {
    id: 'muic-t2-start',
    date: createDate(2026, 5, 11),
    event: 'Term 2 Start',
    term: 'MUIC Term 2',
    category: 'classes',
    program: 'muic',
  },
  {
    id: 'muic-t2-census',
    date: createDate(2026, 5, 29),
    event: 'Census Date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'MUIC Term 2',
    category: 'admin',
    program: 'muic',
  },
  {
    id: 'muic-t2-end',
    date: createDate(2026, 7, 3),
    event: 'Term 2 End',
    term: 'MUIC Term 2',
    category: 'exams',
    program: 'muic',
  },
  // Term 3
  {
    id: 'muic-t3-start',
    date: createDate(2026, 7, 27),
    event: 'Term 3 Start',
    term: 'MUIC Term 3',
    category: 'classes',
    program: 'muic',
  },
  {
    id: 'muic-t3-census',
    date: createDate(2026, 8, 14),
    event: 'Census Date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'MUIC Term 3',
    category: 'admin',
    program: 'muic',
  },
  {
    id: 'muic-t3-end',
    date: createDate(2026, 9, 18),
    event: 'Term 3 End',
    term: 'MUIC Term 3',
    category: 'exams',
    program: 'muic',
  },
  // Term 4
  {
    id: 'muic-t4-start',
    date: createDate(2026, 10, 6),
    event: 'Term 4 Start',
    term: 'MUIC Term 4',
    category: 'classes',
    program: 'muic',
  },
  {
    id: 'muic-t4-census',
    date: createDate(2026, 10, 23),
    event: 'Census Date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'MUIC Term 4',
    category: 'admin',
    program: 'muic',
  },
  {
    id: 'muic-t4-end',
    date: createDate(2026, 11, 27),
    event: 'Term 4 End',
    term: 'MUIC Term 4',
    category: 'exams',
    program: 'muic',
  },
];

// ELC (English Language Centre) Blocks dates 2026
const elcDates: MQKeyDate[] = [
  // Block 1
  {
    id: 'elc-b1-start',
    date: createDate(2026, 1, 5),
    event: 'Block 1 Start',
    term: 'ELC Block 1',
    category: 'classes',
    program: 'elc',
  },
  {
    id: 'elc-b1-end',
    date: createDate(2026, 2, 13),
    event: 'Block 1 End',
    term: 'ELC Block 1',
    category: 'exams',
    program: 'elc',
  },
  // Block 2
  {
    id: 'elc-b2-start',
    date: createDate(2026, 2, 16),
    event: 'Block 2 Start',
    term: 'ELC Block 2',
    category: 'classes',
    program: 'elc',
  },
  {
    id: 'elc-b2-end',
    date: createDate(2026, 3, 27),
    event: 'Block 2 End',
    term: 'ELC Block 2',
    category: 'exams',
    program: 'elc',
  },
  // Block 3
  {
    id: 'elc-b3-start',
    date: createDate(2026, 3, 30),
    event: 'Block 3 Start',
    term: 'ELC Block 3',
    category: 'classes',
    program: 'elc',
  },
  {
    id: 'elc-b3-end',
    date: createDate(2026, 5, 8),
    event: 'Block 3 End',
    term: 'ELC Block 3',
    category: 'exams',
    program: 'elc',
  },
  // Block 4
  {
    id: 'elc-b4-start',
    date: createDate(2026, 5, 11),
    event: 'Block 4 Start',
    term: 'ELC Block 4',
    category: 'classes',
    program: 'elc',
  },
  {
    id: 'elc-b4-end',
    date: createDate(2026, 6, 19),
    event: 'Block 4 End',
    term: 'ELC Block 4',
    category: 'exams',
    program: 'elc',
  },
  // Block 5
  {
    id: 'elc-b5-start',
    date: createDate(2026, 6, 22),
    event: 'Block 5 Start',
    term: 'ELC Block 5',
    category: 'classes',
    program: 'elc',
  },
  {
    id: 'elc-b5-end',
    date: createDate(2026, 7, 31),
    event: 'Block 5 End',
    term: 'ELC Block 5',
    category: 'exams',
    program: 'elc',
  },
  // Block 6
  {
    id: 'elc-b6-start',
    date: createDate(2026, 8, 3),
    event: 'Block 6 Start',
    term: 'ELC Block 6',
    category: 'classes',
    program: 'elc',
  },
  {
    id: 'elc-b6-end',
    date: createDate(2026, 9, 11),
    event: 'Block 6 End',
    term: 'ELC Block 6',
    category: 'exams',
    program: 'elc',
  },
  // Block 7
  {
    id: 'elc-b7-start',
    date: createDate(2026, 9, 14),
    event: 'Block 7 Start',
    term: 'ELC Block 7',
    category: 'classes',
    program: 'elc',
  },
  {
    id: 'elc-b7-end',
    date: createDate(2026, 10, 23),
    event: 'Block 7 End',
    term: 'ELC Block 7',
    category: 'exams',
    program: 'elc',
  },
  // Block 8
  {
    id: 'elc-b8-start',
    date: createDate(2026, 10, 26),
    event: 'Block 8 Start',
    term: 'ELC Block 8',
    category: 'classes',
    program: 'elc',
  },
  {
    id: 'elc-b8-end',
    date: createDate(2026, 12, 4),
    event: 'Block 8 End',
    term: 'ELC Block 8',
    category: 'exams',
    program: 'elc',
  },
];

// Macquarie Business School dates 2026
const businessSchoolDates: MQKeyDate[] = [
  // Term 1
  {
    id: 'mbs-t1-classes',
    date: createDate(2026, 1, 12),
    endDate: createDate(2026, 3, 20),
    event: 'Classes',
    term: 'MBS Term 1',
    category: 'classes',
    program: 'business-school',
  },
  {
    id: 'mbs-t1-enrol',
    date: createDate(2026, 1, 18),
    event: 'Last date to enrol',
    term: 'MBS Term 1',
    category: 'enrollment',
    program: 'business-school',
  },
  {
    id: 'mbs-t1-census',
    date: createDate(2026, 1, 28),
    event: 'Census date',
    description:
      'Last day to withdraw without financial penalty. After this date, fees are locked in and the unit appears on your academic record.',
    term: 'MBS Term 1',
    category: 'admin',
    program: 'business-school',
  },
  {
    id: 'mbs-t1-withdraw',
    date: createDate(2026, 3, 6),
    event: 'Last date to withdraw without fail',
    term: 'MBS Term 1',
    category: 'enrollment',
    program: 'business-school',
  },
  {
    id: 'mbs-t1-exams',
    date: createDate(2026, 3, 23),
    endDate: createDate(2026, 3, 29),
    event: 'Examinations',
    term: 'MBS Term 1',
    category: 'exams',
    program: 'business-school',
  },
  {
    id: 'mbs-t1-results',
    date: createDate(2026, 4, 2),
    event: 'Results',
    term: 'MBS Term 1',
    category: 'results',
    program: 'business-school',
  },
  // Term 2
  {
    id: 'mbs-t2-classes',
    date: createDate(2026, 4, 7),
    endDate: createDate(2026, 6, 12),
    event: 'Classes',
    term: 'MBS Term 2',
    category: 'classes',
    program: 'business-school',
  },
  {
    id: 'mbs-t2-enrol',
    date: createDate(2026, 4, 12),
    event: 'Last date to enrol',
    term: 'MBS Term 2',
    category: 'enrollment',
    program: 'business-school',
  },
  {
    id: 'mbs-t2-census',
    date: createDate(2026, 4, 22),
    event: 'Census date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'MBS Term 2',
    category: 'admin',
    program: 'business-school',
  },
  {
    id: 'mbs-t2-withdraw',
    date: createDate(2026, 5, 29),
    event: 'Last date to withdraw without fail',
    term: 'MBS Term 2',
    category: 'enrollment',
    program: 'business-school',
  },
  {
    id: 'mbs-t2-exams',
    date: createDate(2026, 6, 15),
    endDate: createDate(2026, 6, 21),
    event: 'Examinations',
    term: 'MBS Term 2',
    category: 'exams',
    program: 'business-school',
  },
  {
    id: 'mbs-t2-results',
    date: createDate(2026, 6, 26),
    event: 'Results',
    term: 'MBS Term 2',
    category: 'results',
    program: 'business-school',
  },
  // Term 3
  {
    id: 'mbs-t3-classes',
    date: createDate(2026, 6, 29),
    endDate: createDate(2026, 9, 4),
    event: 'Classes',
    term: 'MBS Term 3',
    category: 'classes',
    program: 'business-school',
  },
  {
    id: 'mbs-t3-enrol',
    date: createDate(2026, 7, 5),
    event: 'Last date to enrol',
    term: 'MBS Term 3',
    category: 'enrollment',
    program: 'business-school',
  },
  {
    id: 'mbs-t3-census',
    date: createDate(2026, 7, 15),
    event: 'Census date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'MBS Term 3',
    category: 'admin',
    program: 'business-school',
  },
  {
    id: 'mbs-t3-withdraw',
    date: createDate(2026, 8, 21),
    event: 'Last date to withdraw without fail',
    term: 'MBS Term 3',
    category: 'enrollment',
    program: 'business-school',
  },
  {
    id: 'mbs-t3-exams',
    date: createDate(2026, 9, 7),
    endDate: createDate(2026, 9, 13),
    event: 'Examinations',
    term: 'MBS Term 3',
    category: 'exams',
    program: 'business-school',
  },
  {
    id: 'mbs-t3-results',
    date: createDate(2026, 9, 18),
    event: 'Results',
    term: 'MBS Term 3',
    category: 'results',
    program: 'business-school',
  },
  // Term 4
  {
    id: 'mbs-t4-classes',
    date: createDate(2026, 9, 21),
    endDate: createDate(2026, 11, 27),
    event: 'Classes',
    term: 'MBS Term 4',
    category: 'classes',
    program: 'business-school',
  },
  {
    id: 'mbs-t4-enrol',
    date: createDate(2026, 9, 27),
    event: 'Last date to enrol',
    term: 'MBS Term 4',
    category: 'enrollment',
    program: 'business-school',
  },
  {
    id: 'mbs-t4-census',
    date: createDate(2026, 10, 7),
    event: 'Census date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'MBS Term 4',
    category: 'admin',
    program: 'business-school',
  },
  {
    id: 'mbs-t4-withdraw',
    date: createDate(2026, 11, 13),
    event: 'Last date to withdraw without fail',
    term: 'MBS Term 4',
    category: 'enrollment',
    program: 'business-school',
  },
  {
    id: 'mbs-t4-exams',
    date: createDate(2026, 11, 30),
    endDate: createDate(2026, 12, 6),
    event: 'Examinations',
    term: 'MBS Term 4',
    category: 'exams',
    program: 'business-school',
  },
  {
    id: 'mbs-t4-results',
    date: createDate(2026, 12, 11),
    event: 'Results',
    term: 'MBS Term 4',
    category: 'results',
    program: 'business-school',
  },
];

// MQ College dates 2026
const collegeDates: MQKeyDate[] = [
  // Term 1
  {
    id: 'mqc-t1-classes',
    date: createDate(2026, 2, 23),
    endDate: createDate(2026, 4, 10),
    event: 'Classes',
    term: 'College Term 1',
    category: 'classes',
    program: 'college',
  },
  {
    id: 'mqc-t1-enrol',
    date: createDate(2026, 2, 22),
    event: 'Last date to enrol',
    term: 'College Term 1',
    category: 'enrollment',
    program: 'college',
  },
  {
    id: 'mqc-t1-census',
    date: createDate(2026, 3, 13),
    event: 'Census date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'College Term 1',
    category: 'admin',
    program: 'college',
  },
  {
    id: 'mqc-t1-withdraw',
    date: createDate(2026, 3, 27),
    event: 'Last date to withdraw without fail',
    term: 'College Term 1',
    category: 'enrollment',
    program: 'college',
  },
  {
    id: 'mqc-t1-exams',
    date: createDate(2026, 4, 13),
    endDate: createDate(2026, 4, 17),
    event: 'Examinations',
    term: 'College Term 1',
    category: 'exams',
    program: 'college',
  },
  {
    id: 'mqc-t1-results',
    date: createDate(2026, 4, 27),
    event: 'Results',
    term: 'College Term 1',
    category: 'results',
    program: 'college',
  },
  // Term 2
  {
    id: 'mqc-t2-classes',
    date: createDate(2026, 5, 11),
    endDate: createDate(2026, 6, 26),
    event: 'Classes',
    term: 'College Term 2',
    category: 'classes',
    program: 'college',
  },
  {
    id: 'mqc-t2-enrol',
    date: createDate(2026, 5, 10),
    event: 'Last date to enrol',
    term: 'College Term 2',
    category: 'enrollment',
    program: 'college',
  },
  {
    id: 'mqc-t2-census',
    date: createDate(2026, 5, 29),
    event: 'Census date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'College Term 2',
    category: 'admin',
    program: 'college',
  },
  {
    id: 'mqc-t2-withdraw',
    date: createDate(2026, 6, 12),
    event: 'Last date to withdraw without fail',
    term: 'College Term 2',
    category: 'enrollment',
    program: 'college',
  },
  {
    id: 'mqc-t2-exams',
    date: createDate(2026, 6, 29),
    endDate: createDate(2026, 7, 3),
    event: 'Examinations',
    term: 'College Term 2',
    category: 'exams',
    program: 'college',
  },
  {
    id: 'mqc-t2-results',
    date: createDate(2026, 7, 13),
    event: 'Results',
    term: 'College Term 2',
    category: 'results',
    program: 'college',
  },
  // Term 3
  {
    id: 'mqc-t3-classes',
    date: createDate(2026, 7, 27),
    endDate: createDate(2026, 9, 11),
    event: 'Classes',
    term: 'College Term 3',
    category: 'classes',
    program: 'college',
  },
  {
    id: 'mqc-t3-enrol',
    date: createDate(2026, 7, 26),
    event: 'Last date to enrol',
    term: 'College Term 3',
    category: 'enrollment',
    program: 'college',
  },
  {
    id: 'mqc-t3-census',
    date: createDate(2026, 8, 14),
    event: 'Census date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'College Term 3',
    category: 'admin',
    program: 'college',
  },
  {
    id: 'mqc-t3-withdraw',
    date: createDate(2026, 8, 28),
    event: 'Last date to withdraw without fail',
    term: 'College Term 3',
    category: 'enrollment',
    program: 'college',
  },
  {
    id: 'mqc-t3-exams',
    date: createDate(2026, 9, 14),
    endDate: createDate(2026, 9, 18),
    event: 'Examinations',
    term: 'College Term 3',
    category: 'exams',
    program: 'college',
  },
  {
    id: 'mqc-t3-results',
    date: createDate(2026, 9, 28),
    event: 'Results',
    term: 'College Term 3',
    category: 'results',
    program: 'college',
  },
  // Term 4
  {
    id: 'mqc-t4-classes',
    date: createDate(2026, 10, 6),
    endDate: createDate(2026, 11, 27),
    event: 'Classes',
    term: 'College Term 4',
    category: 'classes',
    program: 'college',
  },
  {
    id: 'mqc-t4-enrol',
    date: createDate(2026, 10, 4),
    event: 'Last date to enrol',
    term: 'College Term 4',
    category: 'enrollment',
    program: 'college',
  },
  {
    id: 'mqc-t4-census',
    date: createDate(2026, 10, 23),
    event: 'Census date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'College Term 4',
    category: 'admin',
    program: 'college',
  },
  {
    id: 'mqc-t4-withdraw',
    date: createDate(2026, 11, 6),
    event: 'Last date to withdraw without fail',
    term: 'College Term 4',
    category: 'enrollment',
    program: 'college',
  },
  {
    id: 'mqc-t4-exams',
    date: createDate(2026, 11, 23),
    endDate: createDate(2026, 11, 27),
    event: 'Examinations',
    term: 'College Term 4',
    category: 'exams',
    program: 'college',
  },
  {
    id: 'mqc-t4-results',
    date: createDate(2026, 12, 7),
    event: 'Results',
    term: 'College Term 4',
    category: 'results',
    program: 'college',
  },
  // Term 5
  {
    id: 'mqc-t5-classes',
    date: createDate(2026, 12, 14),
    endDate: createDate(2027, 1, 29),
    event: 'Classes',
    term: 'College Term 5',
    category: 'classes',
    program: 'college',
  },
  {
    id: 'mqc-t5-enrol',
    date: createDate(2026, 12, 13),
    event: 'Last date to enrol',
    term: 'College Term 5',
    category: 'enrollment',
    program: 'college',
  },
  {
    id: 'mqc-t5-census',
    date: createDate(2027, 1, 8),
    event: 'Census date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'College Term 5',
    category: 'admin',
    program: 'college',
  },
  {
    id: 'mqc-t5-withdraw',
    date: createDate(2027, 1, 22),
    event: 'Last date to withdraw without fail',
    term: 'College Term 5',
    category: 'enrollment',
    program: 'college',
  },
  {
    id: 'mqc-t5-exams',
    date: createDate(2027, 2, 1),
    endDate: createDate(2027, 2, 5),
    event: 'Examinations',
    term: 'College Term 5',
    category: 'exams',
    program: 'college',
  },
  {
    id: 'mqc-t5-results',
    date: createDate(2027, 2, 11),
    event: 'Results',
    term: 'College Term 5',
    category: 'results',
    program: 'college',
  },
];

// Global MBA dates 2026
const globalMBADates: MQKeyDate[] = [
  // Online 1
  {
    id: 'gmba-o1-classes',
    date: createDate(2026, 1, 12),
    endDate: createDate(2026, 2, 22),
    event: 'Classes',
    term: 'MBA Online 1',
    category: 'classes',
    program: 'global-mba',
  },
  {
    id: 'gmba-o1-enrol',
    date: createDate(2026, 1, 9),
    event: 'Last date to enrol',
    term: 'MBA Online 1',
    category: 'enrollment',
    program: 'global-mba',
  },
  {
    id: 'gmba-o1-census',
    date: createDate(2026, 1, 21),
    event: 'Census date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'MBA Online 1',
    category: 'admin',
    program: 'global-mba',
  },
  {
    id: 'gmba-o1-withdraw',
    date: createDate(2026, 1, 28),
    event: 'Last date to withdraw without fail',
    term: 'MBA Online 1',
    category: 'enrollment',
    program: 'global-mba',
  },
  {
    id: 'gmba-o1-results',
    date: createDate(2026, 3, 5),
    event: 'Results',
    term: 'MBA Online 1',
    category: 'results',
    program: 'global-mba',
  },
  // Online 2
  {
    id: 'gmba-o2-classes',
    date: createDate(2026, 3, 9),
    endDate: createDate(2026, 4, 19),
    event: 'Classes',
    term: 'MBA Online 2',
    category: 'classes',
    program: 'global-mba',
  },
  {
    id: 'gmba-o2-enrol',
    date: createDate(2026, 3, 6),
    event: 'Last date to enrol',
    term: 'MBA Online 2',
    category: 'enrollment',
    program: 'global-mba',
  },
  {
    id: 'gmba-o2-census',
    date: createDate(2026, 3, 18),
    event: 'Census date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'MBA Online 2',
    category: 'admin',
    program: 'global-mba',
  },
  {
    id: 'gmba-o2-withdraw',
    date: createDate(2026, 3, 25),
    event: 'Last date to withdraw without fail',
    term: 'MBA Online 2',
    category: 'enrollment',
    program: 'global-mba',
  },
  {
    id: 'gmba-o2-results',
    date: createDate(2026, 4, 30),
    event: 'Results',
    term: 'MBA Online 2',
    category: 'results',
    program: 'global-mba',
  },
  // Online 3
  {
    id: 'gmba-o3-classes',
    date: createDate(2026, 5, 4),
    endDate: createDate(2026, 6, 14),
    event: 'Classes',
    term: 'MBA Online 3',
    category: 'classes',
    program: 'global-mba',
  },
  {
    id: 'gmba-o3-enrol',
    date: createDate(2026, 5, 1),
    event: 'Last date to enrol',
    term: 'MBA Online 3',
    category: 'enrollment',
    program: 'global-mba',
  },
  {
    id: 'gmba-o3-census',
    date: createDate(2026, 5, 13),
    event: 'Census date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'MBA Online 3',
    category: 'admin',
    program: 'global-mba',
  },
  {
    id: 'gmba-o3-withdraw',
    date: createDate(2026, 5, 20),
    event: 'Last date to withdraw without fail',
    term: 'MBA Online 3',
    category: 'enrollment',
    program: 'global-mba',
  },
  {
    id: 'gmba-o3-results',
    date: createDate(2026, 6, 25),
    event: 'Results',
    term: 'MBA Online 3',
    category: 'results',
    program: 'global-mba',
  },
  // Online 4
  {
    id: 'gmba-o4-classes',
    date: createDate(2026, 6, 29),
    endDate: createDate(2026, 8, 9),
    event: 'Classes',
    term: 'MBA Online 4',
    category: 'classes',
    program: 'global-mba',
  },
  {
    id: 'gmba-o4-enrol',
    date: createDate(2026, 6, 26),
    event: 'Last date to enrol',
    term: 'MBA Online 4',
    category: 'enrollment',
    program: 'global-mba',
  },
  {
    id: 'gmba-o4-census',
    date: createDate(2026, 7, 8),
    event: 'Census date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'MBA Online 4',
    category: 'admin',
    program: 'global-mba',
  },
  {
    id: 'gmba-o4-withdraw',
    date: createDate(2026, 7, 15),
    event: 'Last date to withdraw without fail',
    term: 'MBA Online 4',
    category: 'enrollment',
    program: 'global-mba',
  },
  {
    id: 'gmba-o4-results',
    date: createDate(2026, 8, 20),
    event: 'Results',
    term: 'MBA Online 4',
    category: 'results',
    program: 'global-mba',
  },
  // Online 5
  {
    id: 'gmba-o5-classes',
    date: createDate(2026, 8, 24),
    endDate: createDate(2026, 10, 4),
    event: 'Classes',
    term: 'MBA Online 5',
    category: 'classes',
    program: 'global-mba',
  },
  {
    id: 'gmba-o5-enrol',
    date: createDate(2026, 8, 21),
    event: 'Last date to enrol',
    term: 'MBA Online 5',
    category: 'enrollment',
    program: 'global-mba',
  },
  {
    id: 'gmba-o5-census',
    date: createDate(2026, 9, 2),
    event: 'Census date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'MBA Online 5',
    category: 'admin',
    program: 'global-mba',
  },
  {
    id: 'gmba-o5-withdraw',
    date: createDate(2026, 9, 9),
    event: 'Last date to withdraw without fail',
    term: 'MBA Online 5',
    category: 'enrollment',
    program: 'global-mba',
  },
  {
    id: 'gmba-o5-results',
    date: createDate(2026, 10, 15),
    event: 'Results',
    term: 'MBA Online 5',
    category: 'results',
    program: 'global-mba',
  },
  // Online 6
  {
    id: 'gmba-o6-classes',
    date: createDate(2026, 10, 19),
    endDate: createDate(2026, 11, 29),
    event: 'Classes',
    term: 'MBA Online 6',
    category: 'classes',
    program: 'global-mba',
  },
  {
    id: 'gmba-o6-enrol',
    date: createDate(2026, 10, 16),
    event: 'Last date to enrol',
    term: 'MBA Online 6',
    category: 'enrollment',
    program: 'global-mba',
  },
  {
    id: 'gmba-o6-census',
    date: createDate(2026, 10, 28),
    event: 'Census date',
    description: CENSUS_DATE_DESCRIPTION,
    term: 'MBA Online 6',
    category: 'admin',
    program: 'global-mba',
  },
  {
    id: 'gmba-o6-withdraw',
    date: createDate(2026, 11, 4),
    event: 'Last date to withdraw without fail',
    term: 'MBA Online 6',
    category: 'enrollment',
    program: 'global-mba',
  },
  {
    id: 'gmba-o6-results',
    date: createDate(2026, 12, 16),
    event: 'Results',
    term: 'MBA Online 6',
    category: 'results',
    program: 'global-mba',
  },
];

// Combine all dates
export const mqKeyDates: MQKeyDate[] = [
  ...generalDates2025,
  ...generalDates2026,
  ...businessSchoolDates,
  ...collegeDates,
  ...globalMBADates,
  ...fmhhsDates,
  ...ouaDates,
  ...exchangeDates,
  ...onlineDegreeDates,
  ...muicDates,
  ...elcDates,
];

// Color mapping for MQ key date categories
export const MQ_DATE_COLORS: Record<
  MQDateCategory,
  { bg: string; border: string; text: string; bgLight: string }
> = {
  classes: {
    bg: 'bg-cyan-500',
    border: 'border-cyan-600',
    text: 'text-white',
    bgLight: 'bg-cyan-200/50',
  },
  exams: {
    bg: 'bg-rose-500',
    border: 'border-rose-600',
    text: 'text-white',
    bgLight: 'bg-rose-200/50',
  },
  admin: {
    bg: 'bg-slate-500',
    border: 'border-slate-600',
    text: 'text-white',
    bgLight: 'bg-slate-200/50',
  },
  results: {
    bg: 'bg-emerald-500',
    border: 'border-emerald-600',
    text: 'text-white',
    bgLight: 'bg-emerald-200/50',
  },
  payment: {
    bg: 'bg-orange-500',
    border: 'border-orange-600',
    text: 'text-white',
    bgLight: 'bg-orange-200/50',
  },
  enrollment: {
    bg: 'bg-indigo-500',
    border: 'border-indigo-600',
    text: 'text-white',
    bgLight: 'bg-indigo-200/50',
  },
  recess: {
    bg: 'bg-teal-500',
    border: 'border-teal-600',
    text: 'text-white',
    bgLight: 'bg-teal-200/50',
  },
};

// Program labels
export const PROGRAM_LABELS: Record<MQProgram, string> = {
  general: 'MQ General',
  'business-school': 'MQ Business School',
  college: 'MQ College',
  'global-mba': 'Global MBA',
  fmhhs: 'Faculty of Medicine & Health',
  oua: 'Open Universities Australia',
  exchange: 'MQ Exchange',
  'online-degree': 'Online Degree Programs',
  muic: 'MQ College Terms',
  elc: 'MQ College Blocks (ELC)',
};

// Program-specific visual styles for legend and All-Day items
// Uses distinct colors, borders, and icon patterns for clear differentiation
export const PROGRAM_STYLES: Record<
  MQProgram,
  {
    bg: string;
    bgLight: string;
    border: string;
    text: string;
    icon: string; // Emoji or text prefix for additional differentiation
    pattern: string; // CSS pattern class for visual distinction
  }
> = {
  general: {
    bg: 'bg-blue-600',
    bgLight: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-600',
    text: 'text-blue-700 dark:text-blue-300',
    icon: '🎓',
    pattern: '', // Solid
  },
  'business-school': {
    bg: 'bg-purple-600',
    bgLight: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-600',
    text: 'text-purple-700 dark:text-purple-300',
    icon: '💼',
    pattern: 'bg-stripes-purple', // Striped pattern
  },
  college: {
    bg: 'bg-amber-600',
    bgLight: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'border-amber-600',
    text: 'text-amber-700 dark:text-amber-300',
    icon: '📚',
    pattern: 'bg-dots-amber', // Dotted pattern
  },
  'global-mba': {
    bg: 'bg-emerald-600',
    bgLight: 'bg-emerald-100 dark:bg-emerald-900/30',
    border: 'border-emerald-600',
    text: 'text-emerald-700 dark:text-emerald-300',
    icon: '🌐',
    pattern: 'border-dashed', // Dashed border
  },
  fmhhs: {
    bg: 'bg-rose-600',
    bgLight: 'bg-rose-100 dark:bg-rose-900/30',
    border: 'border-rose-600',
    text: 'text-rose-700 dark:text-rose-300',
    icon: '🏥',
    pattern: '', // Solid
  },
  oua: {
    bg: 'bg-orange-600',
    bgLight: 'bg-orange-100 dark:bg-orange-900/30',
    border: 'border-orange-600',
    text: 'text-orange-700 dark:text-orange-300',
    icon: '🌏',
    pattern: 'bg-stripes-orange',
  },
  exchange: {
    bg: 'bg-cyan-600',
    bgLight: 'bg-cyan-100 dark:bg-cyan-900/30',
    border: 'border-cyan-600',
    text: 'text-cyan-700 dark:text-cyan-300',
    icon: '✈️',
    pattern: '',
  },
  'online-degree': {
    bg: 'bg-violet-600',
    bgLight: 'bg-violet-100 dark:bg-violet-900/30',
    border: 'border-violet-600',
    text: 'text-violet-700 dark:text-violet-300',
    icon: '💻',
    pattern: 'bg-dots-violet',
  },
  muic: {
    bg: 'bg-teal-600',
    bgLight: 'bg-teal-100 dark:bg-teal-900/30',
    border: 'border-teal-600',
    text: 'text-teal-700 dark:text-teal-300',
    icon: '📖',
    pattern: '',
  },
  elc: {
    bg: 'bg-lime-600',
    bgLight: 'bg-lime-100 dark:bg-lime-900/30',
    border: 'border-lime-600',
    text: 'text-lime-700 dark:text-lime-300',
    icon: '🗣️',
    pattern: 'border-dashed',
  },
};

// Get all unique programs that have key dates
export function getActiveProgramsForDateRange(startDate: Date, endDate: Date): MQProgram[] {
  const programs = new Set<MQProgram>();
  mqKeyDates.forEach((keyDate) => {
    const kd = new Date(keyDate.date);
    kd.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (kd >= start && kd <= end) {
      programs.add(keyDate.program);
    }
    if (keyDate.endDate) {
      const endKd = new Date(keyDate.endDate);
      endKd.setHours(0, 0, 0, 0);
      if (kd <= end && endKd >= start) {
        programs.add(keyDate.program);
      }
    }
  });
  return Array.from(programs);
}

// Get MQ key dates for a specific date (includes date ranges)
export function getMQKeyDatesForDay(date: Date): MQKeyDate[] {
  return mqKeyDates.filter((keyDate) => {
    const kd = new Date(keyDate.date);
    const targetDate = new Date(date);

    // Reset time to compare dates only
    kd.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    // Check if it's a single date match
    if (kd.getTime() === targetDate.getTime()) {
      return true;
    }

    // Check if date falls within a date range
    if (keyDate.endDate) {
      const endDate = new Date(keyDate.endDate);
      endDate.setHours(0, 0, 0, 0);
      return targetDate >= kd && targetDate <= endDate;
    }

    return false;
  });
}
