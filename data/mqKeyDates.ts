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
export type MQProgram = 'general' | 'business-school' | 'college' | 'global-mba';

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
  ...businessSchoolDates,
  ...collegeDates,
  ...globalMBADates,
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
