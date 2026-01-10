// data/mqKeyDates.ts
// Macquarie University Key Academic Dates 2025

export interface MQKeyDate {
  id: string;
  date: Date;
  event: string;
  term: string;
  category: 'classes' | 'exams' | 'admin' | 'results' | 'payment' | 'enrollment' | 'recess';
}

// Helper to create date with AEST timezone
const createDate = (year: number, month: number, day: number) => new Date(year, month - 1, day);

export const mqKeyDates: MQKeyDate[] = [
  // January 2025
  { id: 'mq-1', date: createDate(2025, 1, 1), event: 'Recess End', term: 'Session 3', category: 'recess' },
  { id: 'mq-2', date: createDate(2025, 1, 2), event: 'Session classes resume', term: 'Session 3', category: 'classes' },
  { id: 'mq-3', date: createDate(2025, 1, 19), event: 'Last Day of Classes', term: 'Session 3', category: 'classes' },
  { id: 'mq-4', date: createDate(2025, 1, 20), event: 'Exams Start', term: 'Session 3', category: 'exams' },
  { id: 'mq-5', date: createDate(2025, 1, 24), event: 'Study Period End', term: 'Session 3', category: 'admin' },
  { id: 'mq-6', date: createDate(2025, 1, 24), event: 'Exams End', term: 'Session 3', category: 'exams' },

  // February 2025
  { id: 'mq-7', date: createDate(2025, 2, 6), event: 'Result Publication Date', term: 'Session 3', category: 'results' },
  { id: 'mq-8', date: createDate(2025, 2, 10), event: 'Supplementary Exams start', term: 'Session 3', category: 'exams' },
  { id: 'mq-9', date: createDate(2025, 2, 13), event: 'Supplementary Exams end', term: 'Session 3', category: 'exams' },
  { id: 'mq-10', date: createDate(2025, 2, 21), event: 'Payment Due Date', term: 'Session 1', category: 'payment' },
  { id: 'mq-11', date: createDate(2025, 2, 21), event: 'Payment Due Date', term: 'Full Year', category: 'payment' },
  { id: 'mq-12', date: createDate(2025, 2, 24), event: 'Study Period Start', term: 'Session 1', category: 'admin' },
  { id: 'mq-13', date: createDate(2025, 2, 24), event: 'Study Period Start', term: 'Full Year', category: 'admin' },

  // March 2025
  { id: 'mq-14', date: createDate(2025, 3, 9), event: 'Last Enrol Date via eStudent', term: 'Session 1', category: 'enrollment' },
  { id: 'mq-15', date: createDate(2025, 3, 9), event: 'Last Enrol Date via eStudent', term: 'Full Year', category: 'enrollment' },
  { id: 'mq-16', date: createDate(2025, 3, 21), event: 'Teaching Census', term: 'Session 1', category: 'admin' },

  // April 2025
  { id: 'mq-17', date: createDate(2025, 4, 14), event: 'Recess Start', term: 'Session 1', category: 'recess' },
  { id: 'mq-18', date: createDate(2025, 4, 21), event: 'Teaching Census', term: 'Full Year', category: 'admin' },
  { id: 'mq-19', date: createDate(2025, 4, 25), event: 'Recess End', term: 'Session 1', category: 'recess' },
  { id: 'mq-20', date: createDate(2025, 4, 28), event: 'Last Withdrawal', term: 'Session 1', category: 'enrollment' },
  { id: 'mq-21', date: createDate(2025, 4, 28), event: 'Session classes resume', term: 'Session 1', category: 'classes' },

  // May 2025
  { id: 'mq-22', date: createDate(2025, 5, 28), event: 'Last Withdrawal', term: 'Full Year', category: 'enrollment' },
  { id: 'mq-23', date: createDate(2025, 5, 30), event: 'Last Day of Classes', term: 'Full Year 2', category: 'classes' },

  // June 2025
  { id: 'mq-24', date: createDate(2025, 6, 2), event: 'Exams Start', term: 'Full Year 2', category: 'exams' },
  { id: 'mq-25', date: createDate(2025, 6, 8), event: 'Last Day of Classes', term: 'Session 1', category: 'classes' },
  { id: 'mq-26', date: createDate(2025, 6, 10), event: 'Exams Start', term: 'Session 1', category: 'exams' },
  { id: 'mq-27', date: createDate(2025, 6, 20), event: 'Study Period End', term: 'Full Year 2', category: 'admin' },
  { id: 'mq-28', date: createDate(2025, 6, 20), event: 'Exams End', term: 'Full Year 2', category: 'exams' },
  { id: 'mq-29', date: createDate(2025, 6, 23), event: 'Study Period Start', term: 'Winter Vacation', category: 'admin' },
  { id: 'mq-30', date: createDate(2025, 6, 27), event: 'Exams End', term: 'Session 1', category: 'exams' },
  { id: 'mq-31', date: createDate(2025, 6, 27), event: 'Study Period End', term: 'Session 1', category: 'admin' },
  { id: 'mq-32', date: createDate(2025, 6, 30), event: 'Last Enrol Date via eStudent', term: 'Winter Vacation', category: 'enrollment' },
  { id: 'mq-33', date: createDate(2025, 6, 30), event: 'Session break commences', term: 'Session 1', category: 'recess' },

  // July 2025
  { id: 'mq-34', date: createDate(2025, 7, 1), event: 'Teaching Census', term: 'Winter Vacation', category: 'admin' },
  { id: 'mq-35', date: createDate(2025, 7, 3), event: 'Result Publication Date', term: 'Full Year 2', category: 'results' },
  { id: 'mq-36', date: createDate(2025, 7, 8), event: 'Last Withdrawal', term: 'Winter Vacation', category: 'enrollment' },
  { id: 'mq-37', date: createDate(2025, 7, 10), event: 'Result Publication Date', term: 'Session 1', category: 'results' },
  { id: 'mq-38', date: createDate(2025, 7, 10), event: 'Supplementary Exams Start', term: 'Session 1', category: 'exams' },
  { id: 'mq-39', date: createDate(2025, 7, 22), event: 'Supplementary Exams End', term: 'Session 1', category: 'exams' },
  { id: 'mq-40', date: createDate(2025, 7, 25), event: 'Payment Due Date', term: 'Session 2', category: 'payment' },
  { id: 'mq-41', date: createDate(2025, 7, 25), event: 'Payment Due Date', term: 'Full Year 2', category: 'payment' },
  { id: 'mq-42', date: createDate(2025, 7, 28), event: 'Study Period Start', term: 'Session 2', category: 'admin' },
  { id: 'mq-43', date: createDate(2025, 7, 28), event: 'Study Period Start', term: 'Full Year 2', category: 'admin' },
  { id: 'mq-44', date: createDate(2025, 7, 30), event: 'Study Period End', term: 'Winter Vacation', category: 'admin' },

  // August 2025
  { id: 'mq-45', date: createDate(2025, 8, 6), event: 'Result Publication Date', term: 'Winter Vacation', category: 'results' },
  { id: 'mq-46', date: createDate(2025, 8, 10), event: 'Last Enrol Date via eStudent', term: 'Session 2', category: 'enrollment' },
  { id: 'mq-47', date: createDate(2025, 8, 10), event: 'Last Enrol Date via eStudent', term: 'Full Year 2', category: 'enrollment' },
  { id: 'mq-48', date: createDate(2025, 8, 22), event: 'Teaching Census', term: 'Session 2', category: 'admin' },

  // September 2025
  { id: 'mq-49', date: createDate(2025, 9, 22), event: 'Recess Start', term: 'Session 2', category: 'recess' },
  { id: 'mq-50', date: createDate(2025, 9, 28), event: 'Last Withdrawal', term: 'Session 2', category: 'enrollment' },

  // October 2025
  { id: 'mq-51', date: createDate(2025, 10, 3), event: 'Teaching Census', term: 'Full Year 2', category: 'admin' },
  { id: 'mq-52', date: createDate(2025, 10, 6), event: 'Recess End', term: 'Session 2', category: 'recess' },
  { id: 'mq-53', date: createDate(2025, 10, 7), event: 'Session classes resume', term: 'Session 2', category: 'classes' },

  // November 2025
  { id: 'mq-54', date: createDate(2025, 11, 9), event: 'Last Day of Classes', term: 'Session 2', category: 'classes' },
  { id: 'mq-55', date: createDate(2025, 11, 9), event: 'Last Day of Classes', term: 'Full Year', category: 'classes' },
  { id: 'mq-56', date: createDate(2025, 11, 10), event: 'Exams Start', term: 'Session 2', category: 'exams' },
  { id: 'mq-57', date: createDate(2025, 11, 10), event: 'Exams Start', term: 'Full Year', category: 'exams' },
  { id: 'mq-58', date: createDate(2025, 11, 28), event: 'Exams End', term: 'Session 2', category: 'exams' },
  { id: 'mq-59', date: createDate(2025, 11, 28), event: 'Study Period End', term: 'Session 2', category: 'admin' },
  { id: 'mq-60', date: createDate(2025, 11, 28), event: 'Last Withdrawal', term: 'Full Year 2', category: 'enrollment' },
  { id: 'mq-61', date: createDate(2025, 11, 28), event: 'Exams End', term: 'Full Year', category: 'exams' },
  { id: 'mq-62', date: createDate(2025, 11, 28), event: 'Study Period End', term: 'Full Year', category: 'admin' },

  // December 2025
  { id: 'mq-63', date: createDate(2025, 12, 1), event: 'Session break commences', term: 'Session 2', category: 'recess' },
  { id: 'mq-64', date: createDate(2025, 12, 11), event: 'Result Publication Date', term: 'Session 2', category: 'results' },
  { id: 'mq-65', date: createDate(2025, 12, 11), event: 'Supplementary Exams Start', term: 'Session 2', category: 'exams' },
  { id: 'mq-66', date: createDate(2025, 12, 11), event: 'Result Publication Date', term: 'Full Year', category: 'results' },
  { id: 'mq-67', date: createDate(2025, 12, 12), event: 'Payment Due Date', term: 'Session 3', category: 'payment' },
  { id: 'mq-68', date: createDate(2025, 12, 15), event: 'Study Period Start', term: 'Session 3', category: 'admin' },
  { id: 'mq-69', date: createDate(2025, 12, 21), event: 'Last Enrol Date via eStudent', term: 'Session 3', category: 'enrollment' },
  { id: 'mq-70', date: createDate(2025, 12, 23), event: 'Supplementary Exams End', term: 'Session 2', category: 'exams' },
  { id: 'mq-71', date: createDate(2025, 12, 25), event: 'Recess Start', term: 'Session 3', category: 'recess' },
  { id: 'mq-72', date: createDate(2025, 12, 29), event: 'Teaching Census', term: 'Session 3', category: 'admin' },
];

// Color mapping for MQ key date categories
export const MQ_DATE_COLORS: Record<MQKeyDate['category'], { bg: string; border: string; text: string }> = {
  classes: { bg: 'bg-cyan-500', border: 'border-cyan-600', text: 'text-white' },
  exams: { bg: 'bg-rose-500', border: 'border-rose-600', text: 'text-white' },
  admin: { bg: 'bg-slate-500', border: 'border-slate-600', text: 'text-white' },
  results: { bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-white' },
  payment: { bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-white' },
  enrollment: { bg: 'bg-indigo-500', border: 'border-indigo-600', text: 'text-white' },
  recess: { bg: 'bg-teal-500', border: 'border-teal-600', text: 'text-white' },
};

// Get MQ key dates for a specific date
export function getMQKeyDatesForDay(date: Date): MQKeyDate[] {
  return mqKeyDates.filter((keyDate) => {
    const kd = new Date(keyDate.date);
    return (
      kd.getFullYear() === date.getFullYear() &&
      kd.getMonth() === date.getMonth() &&
      kd.getDate() === date.getDate()
    );
  });
}

